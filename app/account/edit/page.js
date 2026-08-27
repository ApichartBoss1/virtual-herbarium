"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

export default function EditAccountPage() {
  const router = useRouter();

  const { language, darkMode } = useSiteSettings();
  const isEnglish = language === "EN";

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

  const text = {
    TH: {
      title: "แก้ไขข้อมูลบัญชี",
      subtitle: "จัดการข้อมูลส่วนตัวและรูปโปรไฟล์ของคุณ",

      profileImage: "รูปโปรไฟล์",
      chooseImage: "เลือกรูปภาพ",
      changeImage: "เปลี่ยนรูปภาพ",
      imageHint: "รองรับ JPG, PNG และ WEBP",

      fullName: "ชื่อ - นามสกุล",
      username: "ชื่อผู้ใช้",
      bio: "เกี่ยวกับฉัน",

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
      title: "Edit Account",
      subtitle: "Manage your personal information and profile image",

      profileImage: "Profile Image",
      chooseImage: "Choose Image",
      changeImage: "Change Image",
      imageHint: "JPG, PNG and WEBP are supported",

      fullName: "Full Name",
      username: "Username",
      bio: "About Me",

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

  // =====================================================
  // LOAD USER
  // =====================================================

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

        if (mounted) {
          setError(
            err?.message ||
              (isEnglish
                ? "Unable to load account"
                : "ไม่สามารถโหลดข้อมูลบัญชีได้"),
          );
        }
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

  // =====================================================
  // HANDLE FORM
  // =====================================================

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // =====================================================
  // HANDLE IMAGE
  // =====================================================

  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t.uploadError);
      return;
    }

    setError("");

    setImageFile(file);

    const objectUrl = URL.createObjectURL(file);

    setPreview(objectUrl);
  }

  // =====================================================
  // UPLOAD AVATAR
  // =====================================================

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

  // =====================================================
  // SAVE ACCOUNT
  // =====================================================

  async function handleSubmit(e) {
    e.preventDefault();

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

      // =================================================
      // UPDATE SUPABASE AUTH METADATA
      // =================================================

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

      // อัปเดต state user
      if (data?.user) {
        setUser(data.user);
      }

      // อัปเดต URL ใน form
      setForm((prev) => ({
        ...prev,
        avatar_url: avatarUrl || "",
      }));

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

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main
        className={`min-h-screen ${
          darkMode ? "bg-[#07100c] text-white" : "bg-[#f5faf7] text-slate-900"
        }`}
      >
        <Navbar />

        <div className="flex min-h-[70vh] items-center justify-center px-5">
          <div className="text-center">
            <div
              className={`mx-auto h-10 w-10 animate-spin rounded-full border-4 ${
                darkMode
                  ? "border-white/10 border-t-emerald-400"
                  : "border-emerald-100 border-t-emerald-600"
              }`}
            />

            <p
              className={`mt-4 text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {t.loading}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-[#07100c] text-white" : "bg-[#f5faf7] text-slate-900"
      }`}
    >
      <Navbar />

      {/* HEADER */}

      <section
        className={`border-b ${
          darkMode
            ? "border-white/10 bg-[#09150f]"
            : "border-emerald-100 bg-white"
        }`}
      >
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
          {/* BACK BUTTON */}

          <button
            type="button"
            onClick={() => router.back()}
            className={`mb-7 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
              darkMode
                ? "border-white/10 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="text-lg">←</span>

            {t.back}
          </button>

          <span
            className={`inline-flex rounded-full border px-4 py-2 text-xs font-bold ${
              darkMode
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            Virtual Herbarium
          </span>

          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
            {t.title}
          </h1>

          <p className={`mt-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* CONTENT */}

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <form onSubmit={handleSubmit}>
          <div className="space-y-7">
            {/* PROFILE IMAGE */}

            <section
              className={`rounded-3xl border p-6 shadow-xl sm:p-8 ${
                darkMode
                  ? "border-white/10 bg-[#0c1712]"
                  : "border-emerald-100 bg-white"
              }`}
            >
              <div className="mb-7">
                <h2 className="text-xl font-black">{t.profileImage}</h2>

                <p
                  className={`mt-2 text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {t.imageHint}
                </p>
              </div>

              <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
                {/* AVATAR */}

                <div
                  className={`relative h-36 w-36 shrink-0 overflow-hidden rounded-full border-4 ${
                    darkMode
                      ? "border-white/10 bg-emerald-500/10"
                      : "border-emerald-100 bg-emerald-50"
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
                      className={`flex h-full w-full items-center justify-center text-4xl font-black ${
                        darkMode ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    >
                      {form.full_name
                        ? form.full_name.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                  )}
                </div>

                {/* UPLOAD */}

                <div>
                  <label
                    htmlFor="avatar-image"
                    className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                  >
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
                    className={`mt-3 text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {imageFile?.name || t.imageHint}
                  </p>
                </div>
              </div>
            </section>

            {/* ACCOUNT INFORMATION */}

            <section
              className={`rounded-3xl border p-6 shadow-xl sm:p-8 ${
                darkMode
                  ? "border-white/10 bg-[#0c1712]"
                  : "border-emerald-100 bg-white"
              }`}
            >
              <div className="mb-7">
                <h2 className="text-xl font-black">
                  {isEnglish ? "Account Information" : "ข้อมูลบัญชี"}
                </h2>
              </div>

              <div className="grid gap-6">
                <Field
                  label={t.fullName}
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  disabled={saving}
                  darkMode={darkMode}
                  placeholder={
                    isEnglish ? "Enter your full name" : "กรอกชื่อและนามสกุล"
                  }
                />

                <Field
                  label={t.username}
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  disabled={saving}
                  darkMode={darkMode}
                  placeholder={isEnglish ? "Enter username" : "กรอกชื่อผู้ใช้"}
                />

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    {t.bio}
                  </label>

                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    disabled={saving}
                    rows={5}
                    placeholder={
                      isEnglish
                        ? "Tell us something about yourself..."
                        : "บอกข้อมูลเกี่ยวกับตัวคุณ..."
                    }
                    className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition ${
                      darkMode
                        ? "border-white/10 bg-white/[0.04] text-white placeholder:text-gray-500 focus:border-emerald-500"
                        : "border-gray-200 bg-white text-slate-900 placeholder:text-gray-400 focus:border-emerald-500"
                    } focus:ring-2 focus:ring-emerald-500/20`}
                  />
                </div>
              </div>
            </section>

            {/* ERROR */}

            {error && (
              <div
                className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
                  darkMode
                    ? "border-red-500/20 bg-red-500/10 text-red-300"
                    : "border-red-200 bg-red-50 text-red-600"
                }`}
              >
                ❌ {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div
                className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
                  darkMode
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                ✓ {success}
              </div>
            )}

            {/* BUTTONS */}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/account"
                className={`inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-bold transition ${
                  darkMode
                    ? "border-white/10 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {t.cancel}
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? t.saving : `💾 ${t.save}`}
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

// =====================================================
// FIELD COMPONENT
// =====================================================

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  darkMode,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold">{label}</label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
          darkMode
            ? "border-white/10 bg-white/[0.04] text-white placeholder:text-gray-500 focus:border-emerald-500"
            : "border-gray-200 bg-white text-slate-900 placeholder:text-gray-400 focus:border-emerald-500"
        } focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60`}
      />
    </div>
  );
}
