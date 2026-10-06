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

  const { language, darkMode } = useSiteSettings();

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
    full_name: "",
    username: "",
    bio: "",
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

      subtitle: "ปรับข้อมูลส่วนตัว รูปโปรไฟล์ และความปลอดภัยของบัญชี",

      profileImage: "รูปโปรไฟล์",

      profileImageDescription: "เลือกรูปที่ใช้แสดงในพื้นที่บัญชีของคุณ",

      chooseImage: "เลือกรูปภาพ",

      changeImage: "เปลี่ยนรูปภาพ",

      imageHint: "รองรับ JPG, PNG และ WEBP",

      accountInformation: "ข้อมูลบัญชี",

      accountInformationDescription:
        "จัดการข้อมูลที่ใช้แสดงในโปรไฟล์ Virtual Herbarium",

      fullName: "ชื่อ - นามสกุล",

      username: "ชื่อผู้ใช้",

      email: "อีเมล",

      emailHint:
        "อีเมลนี้เชื่อมอยู่กับบัญชีของคุณ และไม่สามารถเปลี่ยนจากหน้านี้",

      bio: "เกี่ยวกับฉัน",

      fullNamePlaceholder: "กรอกชื่อและนามสกุล",

      usernamePlaceholder: "กรอกชื่อผู้ใช้",

      bioPlaceholder: "เขียนข้อมูลสั้น ๆ เกี่ยวกับตัวคุณ...",

      securityLabel: "ACCOUNT SECURITY",

      security: "ความปลอดภัยของบัญชี",

      securityDescription:
        "หากต้องการเปลี่ยนรหัสผ่าน ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณ",

      changePassword: "เปลี่ยนรหัสผ่าน",

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

      subtitle:
        "Update your personal information, profile image and account security.",

      profileImage: "Profile Image",

      profileImageDescription: "Choose the image displayed with your account.",

      chooseImage: "Choose Image",

      changeImage: "Change Image",

      imageHint: "JPG, PNG and WEBP are supported",

      accountInformation: "Account Information",

      accountInformationDescription:
        "Manage the information displayed on your Virtual Herbarium profile.",

      fullName: "Full Name",

      username: "Username",

      email: "Email",

      emailHint:
        "This email is connected to your account and cannot be changed here.",

      bio: "About Me",

      fullNamePlaceholder: "Enter your full name",

      usernamePlaceholder: "Enter username",

      bioPlaceholder: "Write something about yourself...",

      securityLabel: "ACCOUNT SECURITY",

      security: "Account Security",

      securityDescription:
        "To change your password, a password reset link will be sent to your email.",

      changePassword: "Change Password",

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

        setForm({
          full_name: metadata.full_name || metadata.name || "",

          username: metadata.username || "",

          bio: metadata.bio || "",

          avatar_url: metadata.avatar_url || "",
        });

        setPreview(metadata.avatar_url || "");
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
          full_name: form.full_name.trim() || null,

          username: form.username.trim() || null,

          bio: form.bio.trim() || null,

          avatar_url: avatarUrl,
        },
      });

      if (updateError) {
        console.error("Update account error:", updateError);

        throw new Error(updateError.message || t.profileError);
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
      <main
        className={`page min-h-screen overflow-x-hidden ${
          darkMode ? "bg-[#07100c] text-white" : "bg-[#f3f8f3] text-slate-900"
        }`}
      >
        <Navbar />

        <section className="flex min-h-[65dvh] items-center justify-center px-5">
          <div className="text-center">
            <LoadingIcon
              className={`mx-auto h-8 w-8 animate-spin ${
                darkMode ? "text-emerald-300" : "text-emerald-700"
              }`}
            />

            <p
              className={`mt-4 text-sm font-medium ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
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

  return (
    <main
      className={`page min-h-screen overflow-x-hidden transition-colors duration-300 ${
        darkMode ? "bg-[#07100c] text-white" : "bg-[#f3f8f3] text-slate-900"
      }`}
    >
      <Navbar />

      {/* =================================================
          HEADER
      ================================================= */}

      <section
        className={`relative overflow-hidden border-b ${
          darkMode
            ? "border-white/[0.08] bg-[#09150f]"
            : "border-emerald-950/[0.07] bg-white/85"
        }`}
      >
        <div
          className={`pointer-events-none absolute -right-20 -top-40 h-96 w-96 rounded-full blur-3xl ${
            darkMode ? "bg-emerald-400/[0.04]" : "bg-emerald-600/[0.045]"
          }`}
        />

        <div className="container relative py-5 sm:py-8 lg:py-9">
          {/* DESKTOP BACK */}

          <button
            type="button"
            onClick={() => router.back()}
            className={`mb-5 hidden min-h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition md:inline-flex ${
              darkMode
                ? "border-white/10 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]"
                : "border-emerald-950/10 bg-white text-slate-700 hover:bg-emerald-50"
            }`}
          >
            <BackIcon className="h-4 w-4" />

            {t.back}
          </button>

          {/* BADGE */}

          <div
            className={`inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 ${
              darkMode
                ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                darkMode ? "bg-emerald-400" : "bg-emerald-700"
              }`}
            />

            <span className="text-[9px] font-black tracking-[0.18em]">
              {t.eyebrow}
            </span>
          </div>

          {/* TITLE */}

          <div className="mt-4 flex max-w-3xl flex-col gap-2.5">
            <h1
              className={`font-black tracking-[-0.035em] ${
                isEnglish
                  ? "text-[2rem] leading-[1.12] sm:text-4xl sm:leading-[1.1]"
                  : "text-[2rem] leading-[1.3] sm:text-[2.65rem] sm:leading-[1.25]"
              }`}
            >
              {t.title}
            </h1>

            <p
              className={`max-w-2xl text-[13px] leading-6 sm:text-[15px] sm:leading-7 ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              {t.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="container pb-[calc(104px+env(safe-area-inset-bottom))] pt-5 sm:pb-10 sm:pt-8 lg:py-10">
        <form onSubmit={handleSubmit} className="mx-auto max-w-5xl">
          {/* =================================================
              PROFILE + ACCOUNT
          ================================================= */}

          <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-stretch">
            {/* =================================================
                PROFILE IMAGE
            ================================================= */}

            <section
              className={`rounded-[20px] border p-4 shadow-lg sm:p-5 lg:h-full ${
                darkMode
                  ? "border-white/[0.08] bg-[#0c1712]"
                  : "border-emerald-950/[0.07] bg-white"
              }`}
            >
              <div className="flex h-full flex-col">
                {/* HEADER */}

                <div>
                  <h2
                    className={`text-[18px] font-black leading-[1.3] sm:text-lg sm:leading-6 ${
                      darkMode ? "text-white" : "text-[#14271a]"
                    }`}
                  >
                    {t.profileImage}
                  </h2>

                  <p
                    className={`mt-1 text-[12px] leading-[1.65] sm:text-[11px] sm:leading-5 ${
                      darkMode ? "text-gray-400" : "text-slate-500"
                    }`}
                  >
                    {t.profileImageDescription}
                  </p>
                </div>

                {/* =================================================
                    MOBILE PROFILE AREA
                ================================================= */}

                <div className="mt-5 sm:hidden">
                  <div className="mx-auto grid w-full max-w-[300px] grid-cols-[104px_minmax(0,1fr)] items-center gap-4">
                    {/* AVATAR */}

                    <AvatarPreview
                      preview={preview}
                      form={form}
                      darkMode={darkMode}
                      mobile
                    />

                    {/* ACTION */}

                    <div className="flex min-w-0 flex-col items-stretch">
                      <label
                        htmlFor="avatar-image-mobile"
                        className="inline-flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-emerald-700 px-3 text-[13px] font-black text-white shadow-[0_7px_18px_rgba(6,78,45,0.16)] transition active:scale-[0.98]"
                      >
                        <ImageIcon className="h-[17px] w-[17px] shrink-0" />

                        <span className="whitespace-nowrap">
                          {preview ? t.changeImage : t.chooseImage}
                        </span>
                      </label>

                      <input
                        id="avatar-image-mobile"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={saving}
                      />

                      <p
                        className={`mt-2 text-center text-[10px] leading-[1.55] ${
                          darkMode ? "text-gray-500" : "text-slate-400"
                        }`}
                        title={imageFile?.name || t.imageHint}
                      >
                        {imageFile?.name || t.imageHint}
                      </p>
                    </div>
                  </div>
                </div>

                {/* =================================================
                    TABLET / DESKTOP PROFILE AREA
                ================================================= */}

                <div className="mt-4 hidden flex-1 items-center gap-4 sm:flex lg:flex-col lg:justify-center lg:gap-5">
                  <AvatarPreview
                    preview={preview}
                    form={form}
                    darkMode={darkMode}
                  />

                  <div className="min-w-0 flex-1 lg:flex lg:w-full lg:flex-none lg:flex-col lg:items-center">
                    <label
                      htmlFor="avatar-image-desktop"
                      className="inline-flex min-h-10 w-fit max-w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-black text-white shadow-[0_8px_20px_rgba(6,78,45,0.16)] transition hover:bg-emerald-600 active:scale-[0.98] lg:w-[190px] lg:px-5 xl:w-[205px]"
                    >
                      <ImageIcon className="h-4 w-4 shrink-0" />

                      <span className="whitespace-nowrap">
                        {preview ? t.changeImage : t.chooseImage}
                      </span>
                    </label>

                    <input
                      id="avatar-image-desktop"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={saving}
                    />

                    <p
                      className={`mt-2 max-w-[205px] text-[10px] leading-[1.6] lg:text-center ${
                        darkMode ? "text-gray-500" : "text-slate-400"
                      }`}
                      title={imageFile?.name || t.imageHint}
                    >
                      {imageFile?.name || t.imageHint}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                ACCOUNT INFORMATION
            ================================================= */}

            <section
              className={`rounded-[20px] border p-4 shadow-lg sm:p-6 lg:h-full ${
                darkMode
                  ? "border-white/[0.08] bg-[#0c1712]"
                  : "border-emerald-950/[0.07] bg-white"
              }`}
            >
              {/* HEADER */}

              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-emerald-800/[0.07] text-emerald-800"
                  }`}
                >
                  <UserIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2
                    className={`text-lg font-black leading-6 sm:text-xl ${
                      darkMode ? "text-white" : "text-[#14271a]"
                    }`}
                  >
                    {t.accountInformation}
                  </h2>

                  <p
                    className={`mt-1 max-w-xl text-[11px] leading-5 sm:text-xs ${
                      darkMode ? "text-gray-500" : "text-slate-500"
                    }`}
                  >
                    {t.accountInformationDescription}
                  </p>
                </div>
              </div>

              {/* FIELDS */}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field
                  label={t.fullName}
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  disabled={saving}
                  darkMode={darkMode}
                  placeholder={t.fullNamePlaceholder}
                  icon={<IdIcon className="h-4 w-4" />}
                />

                <Field
                  label={t.username}
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  disabled={saving}
                  darkMode={darkMode}
                  placeholder={t.usernamePlaceholder}
                  icon={<AtIcon className="h-4 w-4" />}
                />

                {/* EMAIL */}

                <div className="sm:col-span-2">
                  <label
                    htmlFor="account-email"
                    className="mb-2 block text-[12px] font-bold sm:text-sm"
                  >
                    {t.email}
                  </label>

                  <div
                    id="account-email"
                    className={`relative flex min-h-[48px] items-center rounded-xl border py-2 pl-11 pr-4 text-sm ${
                      darkMode
                        ? "border-white/[0.07] bg-white/[0.025] text-gray-400"
                        : "border-emerald-950/[0.07] bg-[#f7faf6] text-slate-500"
                    }`}
                  >
                    <MailIcon
                      className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${
                        darkMode ? "text-gray-500" : "text-slate-400"
                      }`}
                    />

                    <span className="min-w-0 break-all">
                      {user?.email || "-"}
                    </span>
                  </div>

                  <p
                    className={`mt-1.5 text-[10px] leading-5 ${
                      darkMode ? "text-gray-600" : "text-slate-400"
                    }`}
                  >
                    {t.emailHint}
                  </p>
                </div>

                {/* BIO */}

                <div className="sm:col-span-2">
                  <label
                    htmlFor="account-bio"
                    className="mb-2 block text-[12px] font-bold sm:text-sm"
                  >
                    {t.bio}
                  </label>

                  <textarea
                    id="account-bio"
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    disabled={saving}
                    rows={4}
                    placeholder={t.bioPlaceholder}
                    className={`w-full resize-none rounded-xl border px-4 py-3 text-sm leading-6 outline-none transition ${
                      darkMode
                        ? "border-white/10 bg-white/[0.04] text-white placeholder:text-gray-500 hover:border-white/15 focus:border-emerald-500"
                        : "border-emerald-950/10 bg-white text-slate-900 placeholder:text-gray-400 hover:border-emerald-950/20 focus:border-emerald-500"
                    } focus:ring-4 focus:ring-emerald-500/[0.07] disabled:cursor-not-allowed disabled:opacity-60`}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* =================================================
              ACCOUNT SECURITY
          ================================================= */}

          <section
            className={`relative mt-5 overflow-hidden rounded-[20px] border p-4 shadow-lg sm:p-5 ${
              darkMode
                ? "border-white/[0.08] bg-[#0c1712]"
                : "border-emerald-950/[0.07] bg-white"
            }`}
          >
            <div
              className={`pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full blur-3xl ${
                darkMode ? "bg-emerald-400/[0.04]" : "bg-emerald-700/[0.035]"
              }`}
            />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              {/* LEFT */}

              <div className="flex min-w-0 items-start gap-3.5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-emerald-800/[0.07] text-emerald-800"
                  }`}
                >
                  <ShieldIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-[9px] font-black tracking-[0.16em] ${
                      darkMode ? "text-emerald-400" : "text-emerald-700"
                    }`}
                  >
                    {t.securityLabel}
                  </p>

                  <h2
                    className={`mt-1 text-[17px] font-black leading-6 sm:text-lg ${
                      darkMode ? "text-white" : "text-[#14271a]"
                    }`}
                  >
                    {t.security}
                  </h2>

                  <p
                    className={`mt-1.5 max-w-xl text-[11px] leading-5 sm:text-xs sm:leading-6 ${
                      darkMode ? "text-gray-400" : "text-slate-500"
                    }`}
                  >
                    {t.securityDescription}
                  </p>
                </div>
              </div>

              {/* CHANGE PASSWORD */}

              <Link
                href="/forgot-password"
                className={`group inline-flex min-h-[46px] w-full shrink-0 items-center justify-center gap-2.5 rounded-xl border px-4 text-[12px] font-black transition active:scale-[0.99] sm:w-auto sm:min-w-[190px] sm:px-5 sm:text-sm ${
                  darkMode
                    ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300 hover:bg-emerald-400/[0.13]"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    darkMode ? "bg-emerald-400/10" : "bg-emerald-100"
                  }`}
                >
                  <KeyIcon className="h-4 w-4" />
                </span>

                {t.changePassword}
              </Link>
            </div>
          </section>

          {/* =================================================
              FEEDBACK
          ================================================= */}

          <div className="mt-5 space-y-3">
            {error && (
              <div
                role="alert"
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                  darkMode
                    ? "border-red-500/20 bg-red-500/[0.08] text-red-300"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />

                <p className="text-sm leading-6">{error}</p>
              </div>
            )}

            {success && (
              <div
                role="status"
                aria-live="polite"
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                  darkMode
                    ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />

                <p className="text-sm leading-6">{success}</p>
              </div>
            )}
          </div>

          {/* =================================================
              TABLET / DESKTOP ACTIONS
          ================================================= */}

          <div className="mt-5 hidden justify-end gap-3 sm:flex">
            <Link
              href="/account"
              className={`inline-flex min-h-11 min-w-[128px] items-center justify-center rounded-xl border px-5 text-sm font-bold transition ${
                darkMode
                  ? "border-white/10 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]"
                  : "border-emerald-950/10 bg-white text-slate-700 hover:bg-emerald-50"
              }`}
            >
              {t.cancel}
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 min-w-[190px] items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-black text-white shadow-[0_10px_26px_rgba(6,78,45,0.20)] transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoadingIcon className="h-4 w-4 animate-spin" />

                  {t.saving}
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4" />

                  {t.save}
                </>
              )}
            </button>
          </div>

          {/* =================================================
              MOBILE ACTION BAR
          ================================================= */}

          <div
            className={`fixed inset-x-0 bottom-0 z-[70] border-t px-3 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-2xl sm:hidden ${
              darkMode
                ? "border-white/10 bg-[#07100c]/94"
                : "border-emerald-950/10 bg-[#f6faf5]/95"
            }`}
          >
            <div className="mx-auto grid max-w-lg grid-cols-[0.8fr_1.2fr] gap-2.5">
              <Link
                href="/account"
                className={`inline-flex min-h-[48px] items-center justify-center rounded-xl border px-3 text-[12px] font-bold ${
                  darkMode
                    ? "border-white/10 bg-white/[0.04] text-gray-200"
                    : "border-emerald-950/10 bg-white text-slate-700"
                }`}
              >
                {t.cancel}
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 text-[12px] font-black text-white shadow-[0_8px_20px_rgba(6,78,45,0.25)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoadingIcon className="h-4 w-4 animate-spin" />

                    {t.saving}
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4" />

                    {t.save}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

/* =========================================================
   AVATAR PREVIEW
========================================================= */

function AvatarPreview({ preview, form, darkMode, mobile = false }) {
  const initial =
    String(form.full_name || form.username || "U")
      .trim()
      .charAt(0)
      .toUpperCase() || "U";

  return (
    <div
      className={`shrink-0 overflow-hidden border transition-all duration-300 ${
        mobile
          ? "h-[104px] w-[104px] rounded-[24px]"
          : "h-[86px] w-[86px] rounded-[22px] lg:h-[190px] lg:w-[190px] lg:self-center lg:rounded-[32px] xl:h-[205px] xl:w-[205px] xl:rounded-[34px]"
      } ${
        darkMode
          ? "border-white/10 bg-emerald-500/10"
          : "border-emerald-950/10 bg-emerald-50"
      }`}
    >
      {preview ? (
        <img
          src={preview}
          alt="Profile preview"
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-black ${
            mobile ? "text-3xl" : "text-2xl lg:text-5xl"
          } ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}
        >
          {initial}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  darkMode,
  icon,
}) {
  return (
    <div>
      <label
        htmlFor={`account-${name}`}
        className="mb-2 block text-[12px] font-bold sm:text-sm"
      >
        {label}
      </label>

      <div className="relative">
        <div
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${
            darkMode ? "text-gray-500" : "text-slate-400"
          }`}
        >
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
          className={`h-[48px] w-full rounded-xl border pl-11 pr-4 text-sm outline-none transition ${
            darkMode
              ? "border-white/10 bg-white/[0.04] text-white placeholder:text-gray-500 hover:border-white/15 focus:border-emerald-500"
              : "border-emerald-950/10 bg-white text-slate-900 placeholder:text-gray-400 hover:border-emerald-950/20 focus:border-emerald-500"
          } focus:ring-4 focus:ring-emerald-500/[0.07] disabled:cursor-not-allowed disabled:opacity-60`}
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

function UserIcon({ className = "" }) {
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
      <circle cx="12" cy="8" r="4" />

      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function IdIcon({ className = "" }) {
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

      <circle cx="8" cy="11" r="2" />

      <path d="M5.5 16c.8-1.6 4.2-1.6 5 0" />

      <path d="M13 9h5" />

      <path d="M13 13h5" />
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

function ShieldIcon({ className = "" }) {
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
      <path d="M12 3 20 6v5c0 5.2-3.4 8.6-8 10-4.6-1.4-8-4.8-8-10V6Z" />

      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function KeyIcon({ className = "" }) {
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
      <circle cx="8" cy="12" r="4" />

      <path d="M12 12h9" />

      <path d="M18 12v3" />

      <path d="M15 12v2" />
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
