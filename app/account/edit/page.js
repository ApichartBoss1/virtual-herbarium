"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   PAGE
========================================================= */

export default function EditAccountPage() {
  const router = useRouter();

  const { language } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState(null);

  const [preview, setPreview] = useState("");

  const [form, setForm] = useState({
    username: "",
    avatar_url: "",
  });

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "ACCOUNT SETTINGS",

      title: "แก้ไขข้อมูลบัญชี",

      subtitle: "ปรับชื่อผู้ใช้และรูปโปรไฟล์ของบัญชีผู้ดูแล",

      profileImage: "รูปโปรไฟล์",

      profileImageDescription: "เลือกรูปที่ใช้แสดงในพื้นที่บัญชีของคุณ",

      chooseImage: "เลือกรูปภาพ",

      changeImage: "เปลี่ยนรูปภาพ",

      imageHint: "รองรับ JPG, PNG และ WEBP",

      accountInformation: "ข้อมูลบัญชี",

      accountInformationDescription:
        "จัดการข้อมูลที่ใช้แสดงในโปรไฟล์ Virtual Herbarium",

      username: "ชื่อผู้ใช้",

      email: "อีเมล",

      emailHint:
        "อีเมลนี้เชื่อมอยู่กับบัญชีของคุณ และไม่สามารถเปลี่ยนจากหน้านี้",

      usernamePlaceholder: "กรอกชื่อผู้ใช้",

      usernameRequired: "กรุณากรอกชื่อผู้ใช้",

      save: "บันทึกการเปลี่ยนแปลง",

      saving: "กำลังบันทึก...",

      cancel: "ยกเลิก",

      back: "ย้อนกลับ",

      loading: "กำลังโหลดข้อมูลบัญชี...",

      loginRequired: "กรุณาเข้าสู่ระบบ",

      saveSuccess: "บันทึกข้อมูลบัญชีเรียบร้อยแล้ว",

      uploadError: "ไม่สามารถอัปโหลดรูปภาพได้",

      profileError: "ไม่สามารถบันทึกข้อมูลบัญชีได้",
    },

    EN: {
      eyebrow: "ACCOUNT SETTINGS",

      title: "Edit Account",

      subtitle: "Update the administrator's username and profile image.",

      profileImage: "Profile Image",

      profileImageDescription: "Choose the image displayed with your account.",

      chooseImage: "Choose Image",

      changeImage: "Change Image",

      imageHint: "JPG, PNG and WEBP are supported",

      accountInformation: "Account Information",

      accountInformationDescription:
        "Manage the information displayed on your Virtual Herbarium profile.",

      username: "Username",

      email: "Email",

      emailHint:
        "This email is connected to your account and cannot be changed here.",

      usernamePlaceholder: "Enter username",

      usernameRequired: "Please enter a username",

      save: "Save Changes",

      saving: "Saving...",

      cancel: "Cancel",

      back: "Go Back",

      loading: "Loading account...",

      loginRequired: "Please log in",

      saveSuccess: "Account updated successfully",

      uploadError: "Unable to upload image",

      profileError: "Unable to save account information",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     LOAD USER
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        setLoading(true);

        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (userError || !user) {
          router.replace("/login");

          return;
        }

        setUser(user);

        const metadata = user.user_metadata || {};

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) return;

        if (profileError) {
          console.error("Load profile error:", profileError);
        }

        const avatarUrl = profile?.avatar_url || metadata.avatar_url || "";

        setForm({
          username: profile?.username || metadata.username || "",

          avatar_url: avatarUrl,
        });

        setPreview(avatarUrl);
      } catch (err) {
        console.error("Load account error:", err);

        if (!mounted) return;

        setError(
          err?.message ||
            (isEnglish
              ? "Unable to load account"
              : "ไม่สามารถโหลดข้อมูลบัญชีได้"),
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [router, isEnglish]);

  /* =====================================================
     CLEAN PREVIEW URL
  ===================================================== */

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  }

  /* =====================================================
     IMAGE CHANGE
  ===================================================== */

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t.uploadError);

      return;
    }

    setError("");

    setSuccess("");

    setImageFile(file);

    const objectUrl = URL.createObjectURL(file);

    setPreview(objectUrl);
  }

  /* =====================================================
     UPLOAD AVATAR
  ===================================================== */

  async function uploadAvatar() {
    if (!imageFile || !user?.id) {
      return form.avatar_url || null;
    }

    const extension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `avatar-${Date.now()}.${extension}`;

    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, imageFile, {
        cacheControl: "3600",

        upsert: true,

        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);

      throw new Error(uploadError.message || t.uploadError);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return publicUrl;
  }

  /* =====================================================
     SAVE ACCOUNT
  ===================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    if (!user?.id) {
      setError(t.loginRequired);

      return;
    }

    const username = form.username.trim();

    if (!username) {
      setError(t.usernameRequired);

      return;
    }

    setSaving(true);

    setError("");

    setSuccess("");

    try {
      let avatarUrl = form.avatar_url || null;

      if (imageFile) {
        avatarUrl = await uploadAvatar();
      }

      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          username,

          avatar_url: avatarUrl,
        },
      });

      if (updateError) {
        console.error("Update account error:", updateError);

        throw new Error(updateError.message || t.profileError);
      }

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,

        username,

        avatar_url: avatarUrl,

        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error("Update profile error:", profileError);

        throw new Error(profileError.message || t.profileError);
      }

      if (data?.user) {
        setUser(data.user);
      }

      setForm((prev) => ({
        ...prev,

        avatar_url: avatarUrl || "",
      }));

      setImageFile(null);

      setSuccess(t.saveSuccess);

      setTimeout(() => {
        router.push("/account");

        router.refresh();
      }, 800);
    } catch (err) {
      console.error("SAVE ACCOUNT ERROR:", err);

      setError(err?.message || t.profileError);
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="page min-h-screen overflow-x-hidden">
        <Navbar />

        <section className="flex min-h-[65dvh] items-center justify-center px-5">
          <div className="text-center">
            <LoadingIcon className="mx-auto h-7 w-7 animate-spin text-moss" />

            <p className="mt-4 font-serif text-[15px] italic text-muted">
              {t.loading}
            </p>
          </div>
        </section>
      </main>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  const saveContent = saving ? (
    <>
      <LoadingIcon className="h-4 w-4 animate-spin" />
      {t.saving}
    </>
  ) : (
    <>
      <SaveIcon className="h-4 w-4" />
      {t.save}
    </>
  );

  return (
    <main className="page min-h-screen overflow-x-hidden">
      <Navbar />

      <section className="relative pb-[calc(104px+env(safe-area-inset-bottom))] pt-6 sm:pb-16 sm:pt-10 lg:pt-12">
        <div
          aria-hidden="true"
          className="vh-grid-paper pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />

        <div className="vh-container relative">
          <div className="mx-auto max-w-[680px]">
            {/* DESKTOP BACK */}

            <button
              type="button"
              onClick={() => router.back()}
              className="vh-btn vh-btn-ghost vh-btn-sm mb-5 hidden !pl-2.5 md:inline-flex"
            >
              <BackIcon className="h-4 w-4" />
              {t.back}
            </button>

            <form
              onSubmit={handleSubmit}
              className="vh-sheet page-enter px-5 py-7 sm:px-9 sm:py-10"
            >
              {/* =================================================
                  HEADER
              ================================================= */}

              <header>
                <p className="vh-eyebrow flex items-center gap-3">
                  <span className="h-px w-6 bg-ochre" />
                  {t.eyebrow}
                </p>

                <h1 className="vh-display mt-4 text-[2.2rem] md:text-[2.7rem]">
                  {t.title}
                </h1>

                <p className="mt-3 max-w-xl text-[14px] leading-7 text-muted">
                  {t.subtitle}
                </p>
              </header>

              <hr className="vh-rule-double my-8" />

              {/* =================================================
                  01 – PROFILE IMAGE
              ================================================= */}

              <section aria-labelledby="section-profile-image">
                <SectionLabel id="section-profile-image" index={1}>
                  {t.profileImage}
                </SectionLabel>

                <p className="mt-2 text-[13px] leading-6 text-muted">
                  {t.profileImageDescription}
                </p>

                <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
                  <AvatarPreview preview={preview} form={form} />

                  <div className="flex min-w-0 flex-col items-center sm:items-start">
                    <label
                      htmlFor="avatar-image"
                      className={`vh-btn vh-btn-outline ${
                        saving ? "pointer-events-none opacity-55" : ""
                      }`}
                    >
                      <ImageIcon className="h-4 w-4 shrink-0" />
                      {preview ? t.changeImage : t.chooseImage}
                    </label>

                    <input
                      id="avatar-image"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={saving}
                    />

                    <p
                      className="vh-catalog mt-3 max-w-[260px] truncate text-center sm:text-left"
                      title={imageFile?.name || t.imageHint}
                    >
                      {imageFile?.name || t.imageHint}
                    </p>
                  </div>
                </div>
              </section>

              <hr className="vh-rule my-8" />

              {/* =================================================
                  02 – ACCOUNT INFORMATION
              ================================================= */}

              <section aria-labelledby="section-account-info">
                <SectionLabel id="section-account-info" index={2}>
                  {t.accountInformation}
                </SectionLabel>

                <p className="mt-2 text-[13px] leading-6 text-muted">
                  {t.accountInformationDescription}
                </p>

                <div className="mt-6 grid gap-5">
                  <Field
                    label={t.username}
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder={t.usernamePlaceholder}
                    icon={<AtIcon className="h-4 w-4" />}
                  />

                  {/* EMAIL (read-only) */}

                  <div>
                    <label htmlFor="account-email" className="vh-field-label">
                      {t.email}
                    </label>

                    <div
                      id="account-email"
                      className="relative flex min-h-[46px] items-center rounded-[6px] border border-dashed border-rule-strong bg-paper-deep/60 py-2 pl-11 pr-4 font-mono text-[13px] text-muted"
                    >
                      <MailIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />

                      <span className="min-w-0 break-all">
                        {user?.email || "-"}
                      </span>
                    </div>

                    <p className="mt-2 text-[12px] leading-5 text-faint">
                      {t.emailHint}
                    </p>
                  </div>
                </div>
              </section>

              {/* =================================================
                  FEEDBACK
              ================================================= */}

              {(error || success) && (
                <div className="mt-8 space-y-3">
                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 rounded-[6px] border border-clay/40 bg-clay-soft px-4 py-3 text-clay"
                    >
                      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      <p className="text-sm leading-6">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="flex items-start gap-3 rounded-[6px] border border-moss/30 bg-moss-soft px-4 py-3 text-moss"
                    >
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      <p className="text-sm leading-6">{success}</p>
                    </div>
                  )}
                </div>
              )}

              {/* =================================================
                  TABLET / DESKTOP ACTIONS
              ================================================= */}

              <div className="mt-10 hidden items-center justify-end gap-3 border-t border-rule pt-6 sm:flex">
                <Link href="/account" className="vh-btn vh-btn-ghost">
                  {t.cancel}
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="vh-btn vh-btn-primary min-w-[190px]"
                >
                  {saveContent}
                </button>
              </div>

              {/* =================================================
                  MOBILE ACTION BAR
              ================================================= */}

              <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-rule bg-paper/95 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
                <div className="mx-auto grid max-w-lg grid-cols-[0.8fr_1.2fr] gap-2.5">
                  <Link href="/account" className="vh-btn vh-btn-outline">
                    {t.cancel}
                  </Link>

                  <button
                    type="submit"
                    disabled={saving}
                    className="vh-btn vh-btn-primary"
                  >
                    {saveContent}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   SECTION LABEL
========================================================= */

function SectionLabel({ id, index, children }) {
  return (
    <h2 id={id} className="vh-eyebrow flex items-center gap-3 !text-ink-soft">
      <span className="font-mono text-[11px] tracking-normal text-ochre">
        {String(index).padStart(2, "0")}
      </span>
      <span className="h-px w-5 bg-rule-strong" />
      {children}
    </h2>
  );
}

/* =========================================================
   AVATAR PREVIEW
========================================================= */

function AvatarPreview({ preview, form }) {
  const initial =
    String(form.username || "U")
      .trim()
      .charAt(0)
      .toUpperCase() || "U";

  return (
    <div className="relative shrink-0">
      <div className="h-[120px] w-[120px] overflow-hidden rounded-full border border-rule-strong bg-sheet-raised p-1 sm:h-[132px] sm:w-[132px]">
        <div className="h-full w-full overflow-hidden rounded-full border border-rule bg-paper-deep">
          {preview ? (
            <img
              src={preview}
              alt="Profile preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-[2.6rem] text-moss">
              {initial}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({ label, name, value, onChange, placeholder, disabled, icon }) {
  return (
    <div>
      <label htmlFor={`account-${name}`} className="vh-field-label">
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint">
          {icon}
        </div>

        <input
          id={`account-${name}`}
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="vh-input !pl-11"
        />
      </div>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function BackIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function AtIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />

      <path d="M16 8v5a2 2 0 0 0 4 0v-1a8 8 0 1 0-3 6.2" />
    </svg>
  );
}

function MailIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />

      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function ImageIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />

      <circle cx="8.5" cy="9" r="1.5" />

      <path d="m4 17 5-5 3 3 2-2 6 5" />
    </svg>
  );
}

function AlertIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />

      <path d="M12 8v5" />

      <path d="M12 16.5h.01" />
    </svg>
  );
}

function CheckIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />

      <path d="m8 12 2.5 2.5L16.5 9" />
    </svg>
  );
}

function SaveIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 3h12l2 2v16H5Z" />

      <path d="M8 3v6h8V3" />

      <path d="M8 21v-7h8v7" />
    </svg>
  );
}

function LoadingIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
