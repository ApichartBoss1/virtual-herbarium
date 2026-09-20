"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   CONFIG
========================================================= */

const FOREST_IMAGE =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=88";

const AVATAR_BUCKET = "avatars";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const USERNAME_PATTERN = /^[a-zA-Zก-๙0-9._-]+$/;

export default function EditAccountPage() {
  const router = useRouter();

  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const [user, setUser] = useState(null);

  const [profileExists, setProfileExists] = useState(false);

  const [email, setEmail] = useState("");

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
      eyebrow: "PERSONAL PROFILE",

      heroTitle: "ดูแลตัวตนในคลังพรรณไม้ของคุณ",

      heroDescription:
        "ปรับข้อมูลผู้ใช้ รูปโปรไฟล์ และรายละเอียดส่วนตัวที่ใช้ในพื้นที่ Virtual Herbarium",

      title: "แก้ไขข้อมูลบัญชี",

      subtitle: "จัดการข้อมูลส่วนตัวและรูปโปรไฟล์ของคุณ",

      back: "กลับไปยังบัญชี",

      profileLabel: "PROFILE IMAGE",

      profileImage: "รูปโปรไฟล์",

      profileDescription: "รูปนี้จะแสดงในบัญชีและพื้นที่ส่วนตัวของคุณ",

      chooseImage: "เลือกรูปภาพ",

      changeImage: "เปลี่ยนรูปภาพ",

      imageHint: "รองรับ JPG, PNG และ WEBP ขนาดไม่เกิน 5MB",

      imageInvalid: "รองรับเฉพาะไฟล์ JPG, PNG และ WEBP",

      imageTooLarge: "ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB",

      informationLabel: "ACCOUNT INFORMATION",

      informationTitle: "ข้อมูลส่วนตัว",

      informationDescription:
        "ข้อมูลเหล่านี้ใช้เพื่อแสดงตัวตนของคุณใน Virtual Herbarium",

      fullName: "ชื่อ - นามสกุล",

      fullNamePlaceholder: "กรอกชื่อและนามสกุล",

      username: "ชื่อผู้ใช้",

      usernamePlaceholder: "กรอกชื่อผู้ใช้",

      usernameHint:
        "อย่างน้อย 3 ตัวอักษร ใช้ภาษาไทย ภาษาอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง",

      usernameRequired: "กรุณากรอกชื่อผู้ใช้",

      usernameLength: "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร",

      usernameInvalid:
        "ชื่อผู้ใช้ใช้ได้เฉพาะภาษาไทย ภาษาอังกฤษ ตัวเลข จุด ขีดกลาง และขีดล่าง",

      email: "อีเมล",

      emailHint: "อีเมลไม่สามารถแก้ไขจากหน้านี้",

      bio: "เกี่ยวกับฉัน",

      bioPlaceholder:
        "บอกข้อมูลเกี่ยวกับตัวคุณ ความสนใจ หรือการทำงานด้านพรรณไม้...",

      bioHint: "สูงสุด 300 ตัวอักษร",

      save: "บันทึกการเปลี่ยนแปลง",

      saving: "กำลังบันทึก...",

      cancel: "ยกเลิก",

      loading: "กำลังโหลดข้อมูลบัญชี...",

      loginRequired: "กรุณาเข้าสู่ระบบ",

      saveSuccess: "บันทึกข้อมูลบัญชีเรียบร้อยแล้ว",

      uploadError: "ไม่สามารถอัปโหลดรูปภาพได้",

      profileError: "ไม่สามารถบันทึกข้อมูลบัญชีได้",

      securityLabel: "PROFILE PRIVACY",

      securityText: "รหัสผ่านและข้อมูลการเข้าสู่ระบบจะไม่ถูกแก้ไขจากหน้านี้",

      imageSelected: "ไฟล์ที่เลือก",

      characters: "ตัวอักษร",
    },

    EN: {
      eyebrow: "PERSONAL PROFILE",

      heroTitle: "Shape your identity in the herbarium",

      heroDescription:
        "Update your profile image and personal information used throughout your Virtual Herbarium workspace.",

      title: "Edit Account",

      subtitle: "Manage your personal information and profile image",

      back: "Back to Account",

      profileLabel: "PROFILE IMAGE",

      profileImage: "Profile Image",

      profileDescription:
        "This image represents you throughout your personal herbarium workspace.",

      chooseImage: "Choose Image",

      changeImage: "Change Image",

      imageHint: "JPG, PNG and WEBP up to 5MB",

      imageInvalid: "Only JPG, PNG and WEBP images are supported",

      imageTooLarge: "The image must be 5MB or smaller",

      informationLabel: "ACCOUNT INFORMATION",

      informationTitle: "Personal Information",

      informationDescription:
        "This information is used to identify your profile in the Virtual Herbarium.",

      fullName: "Full Name",

      fullNamePlaceholder: "Enter your full name",

      username: "Username",

      usernamePlaceholder: "Enter username",

      usernameHint:
        "At least 3 characters. Use Thai or English letters, numbers, dots, hyphens or underscores.",

      usernameRequired: "Please enter a username",

      usernameLength: "Username must be at least 3 characters",

      usernameInvalid:
        "Username may only contain Thai or English letters, numbers, dots, hyphens and underscores",

      email: "Email",

      emailHint: "Email cannot be changed from this page",

      bio: "About Me",

      bioPlaceholder:
        "Tell us about yourself, your interests or your botanical work...",

      bioHint: "Maximum 300 characters",

      save: "Save Changes",

      saving: "Saving...",

      cancel: "Cancel",

      loading: "Loading account...",

      loginRequired: "Please log in",

      saveSuccess: "Account updated successfully",

      uploadError: "Unable to upload image",

      profileError: "Unable to save account information",

      securityLabel: "PROFILE PRIVACY",

      securityText:
        "Your password and login credentials are not changed from this page.",

      imageSelected: "Selected file",

      characters: "characters",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     LOAD USER + PROFILE
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) {
          return;
        }

        if (userError || !currentUser) {
          router.replace("/login");

          return;
        }

        setUser(currentUser);

        setEmail(currentUser.email || "");

        const metadata = currentUser.user_metadata || {};

        /*
         * Account page รองรับตาราง profiles
         * ดังนั้นลองอ่านข้อมูลจาก profiles ก่อน
         * หากไม่มี row หรือ table มีปัญหา
         * จะ fallback ไป Auth metadata
         */

        let profileData = null;

        try {
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();

          if (profileError) {
            console.error("Load profile error:", profileError);

            setProfileExists(false);
          } else {
            profileData = data || null;

            setProfileExists(Boolean(data));
          }
        } catch (profileError) {
          console.error("Load profile failed:", profileError);

          setProfileExists(false);
        }

        if (!mounted) {
          return;
        }

        const nextForm = {
          full_name:
            profileData?.full_name || metadata.full_name || metadata.name || "",

          username: profileData?.username || metadata.username || "",

          bio: profileData?.bio || metadata.bio || "",

          avatar_url: profileData?.avatar_url || metadata.avatar_url || "",
        };

        setForm(nextForm);

        setPreview(nextForm.avatar_url);
      } catch (err) {
        console.error("Load account error:", err);

        if (!mounted) {
          return;
        }

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
     CLEAN OBJECT URL
  ===================================================== */

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /* =====================================================
     FORM
  ===================================================== */

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
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
     IMAGE
  ===================================================== */

  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageFile(null);
      setError(t.imageInvalid);

      e.target.value = "";

      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageFile(null);
      setError(t.imageTooLarge);

      e.target.value = "";

      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setImageFile(file);

    setPreview(objectUrl);
  }

  /* =====================================================
     UPLOAD AVATAR
  ===================================================== */

  async function uploadAvatar() {
    if (!imageFile || !user?.id) {
      return form.avatar_url || null;
    }

    const extension =
      imageFile.name.split(".").pop()?.toLowerCase() ||
      getExtensionFromType(imageFile.type);

    const fileName = `${crypto.randomUUID()}.${extension}`;

    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, imageFile, {
        cacheControl: "3600",

        upsert: false,

        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);

      throw new Error(uploadError.message || t.uploadError);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);

    return publicUrl;
  }

  /* =====================================================
     VALIDATE
  ===================================================== */

  function validateForm() {
    const cleanUsername = form.username.trim();

    if (!cleanUsername) {
      setError(t.usernameRequired);

      return false;
    }

    if (cleanUsername.length < 3) {
      setError(t.usernameLength);

      return false;
    }

    if (!USERNAME_PATTERN.test(cleanUsername)) {
      setError(t.usernameInvalid);

      return false;
    }

    return true;
  }

  /* =====================================================
     SAVE ACCOUNT
  ===================================================== */

  async function handleSubmit(e) {
    e.preventDefault();

    if (saving) {
      return;
    }

    if (!user?.id) {
      setError(t.loginRequired);

      return;
    }

    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      let avatarUrl = form.avatar_url || null;

      if (imageFile) {
        avatarUrl = await uploadAvatar();
      }

      const cleanData = {
        full_name: form.full_name.trim() || null,

        username: form.username.trim(),

        bio: form.bio.trim() || null,

        avatar_url: avatarUrl,
      };

      /* =================================================
         UPDATE AUTH METADATA
      ================================================= */

      const { data, error: updateError } = await supabase.auth.updateUser({
        data: cleanData,
      });

      if (updateError) {
        console.error("Update account error:", updateError);

        throw new Error(updateError.message || t.profileError);
      }

      /*
       * ถ้ามี row ใน profiles อยู่แล้ว
       * sync ให้ตรงกับ Auth metadata
       *
       * ถ้าไม่มี row จะไม่สร้างใหม่
       * เพราะ Account page สามารถ fallback
       * ไปใช้ user_metadata ได้อยู่แล้ว
       */

      if (profileExists) {
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update(cleanData)
          .eq("id", user.id);

        if (profileUpdateError) {
          console.error("Update profiles table error:", profileUpdateError);

          throw new Error(profileUpdateError.message || t.profileError);
        }
      }

      if (data?.user) {
        setUser(data.user);
      }

      setForm((current) => ({
        ...current,
        ...cleanData,
        full_name: cleanData.full_name || "",
        bio: cleanData.bio || "",
        avatar_url: avatarUrl || "",
      }));

      setImageFile(null);

      setPreview(avatarUrl || "");

      setSuccess(t.saveSuccess);

      setTimeout(() => {
        router.push("/account");

        router.refresh();
      }, 850);
    } catch (err) {
      console.error("Save account error:", err);

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
      <main className="page">
        <Navbar />

        <section className="relative flex min-h-[calc(100svh-78px)] items-center justify-center overflow-hidden">
          <div
            className={`pointer-events-none absolute left-1/2 top-[-220px] h-[650px] w-[900px] -translate-x-1/2 rounded-full blur-3xl ${
              darkMode ? "bg-emerald-500/[0.07]" : "bg-emerald-800/[0.06]"
            }`}
          />

          <div className="relative text-center">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${
                darkMode
                  ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300"
                  : "border-emerald-800/10 bg-emerald-800/[0.06] text-emerald-800"
              }`}
            >
              <LoadingIcon className="h-7 w-7 animate-spin" />
            </div>

            <p
              className={`mt-5 text-sm font-semibold ${
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
    <main className="page overflow-hidden">
      <Navbar />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-30 bg-cover bg-center"
          style={{
            backgroundImage: `url("${FOREST_IMAGE}")`,
          }}
        />

        <div
          className={`absolute inset-0 -z-20 ${
            darkMode
              ? "bg-[linear-gradient(90deg,rgba(2,9,5,0.97)_0%,rgba(3,14,7,0.88)_52%,rgba(3,14,7,0.67)_100%)]"
              : "bg-[linear-gradient(90deg,rgba(238,246,236,0.97)_0%,rgba(238,246,236,0.91)_52%,rgba(235,244,233,0.74)_100%)]"
          }`}
        />

        <div
          className={`absolute inset-x-0 bottom-0 -z-10 h-28 ${
            darkMode
              ? "bg-gradient-to-t from-[#07100b] to-transparent"
              : "bg-gradient-to-t from-[#f1f6f1] to-transparent"
          }`}
        />

        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className={`absolute -top-52 right-[10%] h-[680px] w-28 rotate-[24deg] blur-3xl ${
              darkMode
                ? "bg-gradient-to-b from-emerald-100/10 to-transparent"
                : "bg-gradient-to-b from-white/60 to-transparent"
            }`}
          />

          <div className="forest-particle left-[15%] top-[36%]" />

          <div className="forest-particle right-[22%] top-[30%] [animation-delay:-3s]" />
        </div>

        <div className="container">
          <div className="py-14 sm:py-16 lg:py-20">
            <button
              type="button"
              onClick={() => router.back()}
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold backdrop-blur-xl transition ${
                darkMode
                  ? "border-white/10 bg-black/20 text-gray-300 hover:bg-white/[0.08] hover:text-white"
                  : "border-emerald-950/10 bg-white/55 text-emerald-900 hover:bg-white/80"
              }`}
            >
              <ArrowLeftIcon className="h-4 w-4" />

              {t.back}
            </button>

            <div className="mt-8 max-w-3xl">
              <div
                className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 backdrop-blur-xl ${
                  darkMode
                    ? "border-emerald-300/20 bg-black/20 text-emerald-200"
                    : "border-emerald-950/15 bg-white/55 text-emerald-900"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    darkMode
                      ? "bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.9)]"
                      : "bg-emerald-700"
                  }`}
                />

                <span className="text-[10px] font-black tracking-[0.22em]">
                  {t.eyebrow}
                </span>
              </div>

              <h1
                className={`mt-6 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-6xl ${
                  darkMode ? "text-white" : "text-[#102218]"
                }`}
              >
                {t.heroTitle}
              </h1>

              <p
                className={`mt-5 max-w-2xl text-base leading-8 ${
                  darkMode ? "text-[#bdccc1]" : "text-[#475f4e]"
                }`}
              >
                {t.heroDescription}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FORM
      ===================================================== */}

      <section className="container py-10 sm:py-14">
        <form onSubmit={handleSubmit}>
          <div className="mx-auto max-w-5xl space-y-6">
            {/* =================================================
                PROFILE IMAGE
            ================================================= */}

            <section
              className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-xl sm:p-8 ${
                darkMode
                  ? "border-white/10 bg-[#0a1710] shadow-black/20"
                  : "border-emerald-950/10 bg-white/85 shadow-emerald-950/10"
              }`}
            >
              <CardGlow darkMode={darkMode} />

              <div className="relative">
                <SectionHeading
                  darkMode={darkMode}
                  label={t.profileLabel}
                  title={t.profileImage}
                  description={t.profileDescription}
                  icon={<ImageIcon className="h-5 w-5" />}
                />

                <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-center">
                  {/* AVATAR */}

                  <ProfilePreview
                    preview={preview}
                    form={form}
                    darkMode={darkMode}
                  />

                  {/* UPLOAD */}

                  <div className="flex-1">
                    <label
                      htmlFor="avatar-image"
                      className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(6,78,45,0.25)] transition hover:-translate-y-0.5 hover:bg-emerald-600"
                    >
                      <UploadIcon className="h-5 w-5" />

                      {preview ? t.changeImage : t.chooseImage}
                    </label>

                    <input
                      id="avatar-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={saving}
                    />

                    <p
                      className={`mt-4 text-sm leading-6 ${
                        darkMode ? "text-gray-400" : "text-slate-500"
                      }`}
                    >
                      {t.imageHint}
                    </p>

                    {imageFile && (
                      <div
                        className={`mt-4 inline-flex max-w-full items-center gap-2 rounded-xl border px-3 py-2 ${
                          darkMode
                            ? "border-white/10 bg-white/[0.03]"
                            : "border-emerald-950/10 bg-[#f7faf6]"
                        }`}
                      >
                        <ImageIcon
                          className={`h-4 w-4 shrink-0 ${
                            darkMode ? "text-emerald-300" : "text-emerald-700"
                          }`}
                        />

                        <span
                          className={`shrink-0 text-[10px] font-bold ${
                            darkMode ? "text-gray-500" : "text-slate-400"
                          }`}
                        >
                          {t.imageSelected}
                        </span>

                        <span
                          className={`truncate text-xs font-semibold ${
                            darkMode ? "text-gray-300" : "text-slate-700"
                          }`}
                        >
                          {imageFile.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                ACCOUNT INFORMATION
            ================================================= */}

            <section
              className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-xl sm:p-8 ${
                darkMode
                  ? "border-white/10 bg-[#0a1710] shadow-black/20"
                  : "border-emerald-950/10 bg-white/85 shadow-emerald-950/10"
              }`}
            >
              <CardGlow darkMode={darkMode} />

              <div className="relative">
                <SectionHeading
                  darkMode={darkMode}
                  label={t.informationLabel}
                  title={t.informationTitle}
                  description={t.informationDescription}
                  icon={<UserIcon className="h-5 w-5" />}
                />

                <div className="mt-8 grid gap-6">
                  {/* FULL NAME */}

                  <Field
                    darkMode={darkMode}
                    label={t.fullName}
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder={t.fullNamePlaceholder}
                    icon={<IdIcon className="h-5 w-5" />}
                    maxLength={100}
                  />

                  {/* USERNAME */}

                  <Field
                    darkMode={darkMode}
                    label={t.username}
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder={t.usernamePlaceholder}
                    icon={<AtIcon className="h-5 w-5" />}
                    maxLength={30}
                    required
                    hint={t.usernameHint}
                  />

                  {/* EMAIL */}

                  <div>
                    <label
                      htmlFor="account-email"
                      className={`mb-2 block text-sm font-bold ${
                        darkMode ? "text-gray-200" : "text-slate-700"
                      }`}
                    >
                      {t.email}
                    </label>

                    <div className="relative">
                      <MailIcon
                        className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                          darkMode ? "text-gray-600" : "text-slate-400"
                        }`}
                      />

                      <input
                        id="account-email"
                        type="email"
                        value={email}
                        readOnly
                        disabled
                        className={`h-[52px] w-full cursor-not-allowed rounded-xl border pl-12 pr-4 text-sm outline-none ${
                          darkMode
                            ? "border-white/[0.07] bg-black/10 text-gray-500"
                            : "border-emerald-950/[0.07] bg-slate-50 text-slate-500"
                        }`}
                      />
                    </div>

                    <p
                      className={`mt-2 text-xs ${
                        darkMode ? "text-gray-600" : "text-slate-400"
                      }`}
                    >
                      {t.emailHint}
                    </p>
                  </div>

                  {/* BIO */}

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label
                        htmlFor="profile-bio"
                        className={`text-sm font-bold ${
                          darkMode ? "text-gray-200" : "text-slate-700"
                        }`}
                      >
                        {t.bio}
                      </label>

                      <span
                        className={`text-[10px] ${
                          darkMode ? "text-gray-600" : "text-slate-400"
                        }`}
                      >
                        {form.bio.length}
                        /300 {t.characters}
                      </span>
                    </div>

                    <textarea
                      id="profile-bio"
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      disabled={saving}
                      rows={6}
                      maxLength={300}
                      placeholder={t.bioPlaceholder}
                      className={`w-full resize-none rounded-xl border px-4 py-3 text-sm leading-7 outline-none transition ${
                        darkMode
                          ? "border-white/10 bg-black/20 text-white placeholder:text-gray-600 hover:border-white/15 focus:border-emerald-400/45 focus:bg-black/30 focus:ring-4 focus:ring-emerald-400/[0.06]"
                          : "border-emerald-950/10 bg-white/70 text-slate-900 placeholder:text-slate-400 hover:border-emerald-950/20 focus:border-emerald-700/35 focus:bg-white focus:ring-4 focus:ring-emerald-700/[0.06]"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    />

                    <p
                      className={`mt-2 text-xs ${
                        darkMode ? "text-gray-500" : "text-slate-500"
                      }`}
                    >
                      {t.bioHint}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                SECURITY NOTE
            ================================================= */}

            <div
              className={`flex items-start gap-4 rounded-2xl border p-5 ${
                darkMode
                  ? "border-white/10 bg-white/[0.025]"
                  : "border-emerald-950/10 bg-white/65"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  darkMode
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-emerald-800/10 text-emerald-800"
                }`}
              >
                <ShieldIcon className="h-5 w-5" />
              </div>

              <div>
                <p
                  className={`text-[9px] font-black tracking-[0.14em] ${
                    darkMode ? "text-emerald-400" : "text-emerald-700"
                  }`}
                >
                  {t.securityLabel}
                </p>

                <p
                  className={`mt-1 text-sm leading-6 ${
                    darkMode ? "text-gray-400" : "text-slate-500"
                  }`}
                >
                  {t.securityText}
                </p>
              </div>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div
                role="alert"
                className={`flex items-start gap-3 rounded-2xl border px-5 py-4 ${
                  darkMode
                    ? "border-red-400/15 bg-red-400/[0.06] text-red-200"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />

                <p className="text-sm leading-6">{error}</p>
              </div>
            )}

            {/* =================================================
                SUCCESS
            ================================================= */}

            {success && (
              <div
                role="status"
                className={`flex items-start gap-3 rounded-2xl border px-5 py-4 ${
                  darkMode
                    ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-200"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />

                <p className="text-sm leading-6">{success}</p>
              </div>
            )}

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div
              className={`flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end ${
                darkMode ? "border-white/10" : "border-emerald-950/10"
              }`}
            >
              <Link
                href="/account"
                className={`inline-flex min-h-12 items-center justify-center rounded-xl border px-6 text-sm font-bold transition ${
                  darkMode
                    ? "border-white/10 bg-white/[0.035] text-gray-200 hover:bg-white/[0.08]"
                    : "border-emerald-950/10 bg-white text-slate-700 hover:bg-emerald-50"
                }`}
              >
                {t.cancel}
              </Link>

              <button
                type="submit"
                disabled={saving || Boolean(success)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-7 text-sm font-black text-white shadow-[0_12px_30px_rgba(6,78,45,0.25)] transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <LoadingIcon className="h-5 w-5 animate-spin" />

                    {t.saving}
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-5 w-5" />

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
   GET EXTENSION
========================================================= */

function getExtensionFromType(type) {
  if (type === "image/png") {
    return "png";
  }

  if (type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

/* =========================================================
   PROFILE PREVIEW
========================================================= */

function ProfilePreview({ preview, form, darkMode }) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [preview]);

  const initial =
    (form.full_name || form.username || "U").trim().charAt(0).toUpperCase() ||
    "U";

  const showImage = preview && !imageError;

  return (
    <div className="relative shrink-0">
      <div
        className={`h-36 w-36 overflow-hidden rounded-[2rem] border-4 shadow-xl sm:h-40 sm:w-40 ${
          darkMode
            ? "border-white/10 bg-emerald-400/10 shadow-black/25"
            : "border-white bg-emerald-800/10 shadow-emerald-950/10"
        }`}
      >
        {showImage ? (
          <img
            src={preview}
            alt="Profile preview"
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center text-5xl font-black ${
              darkMode ? "text-emerald-300" : "text-emerald-800"
            }`}
          >
            {initial}
          </div>
        )}
      </div>

      <div
        className={`absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border shadow-lg ${
          darkMode
            ? "border-white/10 bg-[#0a1710] text-emerald-300"
            : "border-emerald-950/10 bg-white text-emerald-800"
        }`}
      >
        <ImageIcon className="h-5 w-5" />
      </div>
    </div>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({ darkMode, label, title, description, icon }) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/10 text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <div>
        <p
          className={`text-[9px] font-black tracking-[0.17em] ${
            darkMode ? "text-emerald-400" : "text-emerald-700"
          }`}
        >
          {label}
        </p>

        <h2
          className={`mt-1 text-xl font-black sm:text-2xl ${
            darkMode ? "text-white" : "text-[#14271a]"
          }`}
        >
          {title}
        </h2>

        <p
          className={`mt-2 max-w-xl text-sm leading-6 ${
            darkMode ? "text-gray-400" : "text-slate-500"
          }`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   CARD GLOW
========================================================= */

function CardGlow({ darkMode }) {
  return (
    <>
      <div
        className={`absolute inset-x-14 top-0 h-px ${
          darkMode
            ? "bg-gradient-to-r from-transparent via-emerald-400/45 to-transparent"
            : "bg-gradient-to-r from-transparent via-emerald-700/25 to-transparent"
        }`}
      />

      <div
        className={`pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full blur-3xl ${
          darkMode ? "bg-emerald-400/[0.04]" : "bg-emerald-800/[0.045]"
        }`}
      />
    </>
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
  hint,
  maxLength,
  required = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className={`mb-2 block text-sm font-bold ${
          darkMode ? "text-gray-200" : "text-slate-700"
        }`}
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
          id={name}
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          required={required}
          className={`h-[52px] w-full rounded-xl border pl-12 pr-4 text-sm outline-none transition ${
            darkMode
              ? "border-white/10 bg-black/20 text-white placeholder:text-gray-600 hover:border-white/15 focus:border-emerald-400/45 focus:bg-black/30 focus:ring-4 focus:ring-emerald-400/[0.06]"
              : "border-emerald-950/10 bg-white/70 text-slate-900 placeholder:text-slate-400 hover:border-emerald-950/20 focus:border-emerald-700/35 focus:bg-white focus:ring-4 focus:ring-emerald-700/[0.06]"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        />
      </div>

      {hint && (
        <p
          className={`mt-2 text-xs leading-5 ${
            darkMode ? "text-gray-500" : "text-slate-500"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function ArrowLeftIcon({ className = "" }) {
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
      <path d="M9 12h10" />
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

      <circle cx="9" cy="9" r="2" />

      <path d="m21 15-5-5L5 20" />
    </svg>
  );
}

function UploadIcon({ className = "" }) {
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
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
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

      <path d="M6 16c.7-1.4 3.3-1.4 4 0" />
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

      <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3 6.7" />
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

function SaveIcon({ className = "" }) {
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
      <path d="M5 3h12l3 3v15H4V4a1 1 0 0 1 1-1Z" />

      <path d="M8 3v6h8V3" />

      <rect x="8" y="14" width="8" height="7" rx="1" />
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
