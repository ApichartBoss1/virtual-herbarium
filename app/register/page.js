"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   FOREST BACKGROUND
========================================================= */

const FOREST_IMAGE =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=90";

export default function RegisterPage() {
  const router = useRouter();

  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const [username, setUsername] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "JOIN THE HERBARIUM",

      forestTitle: "ร่วมสร้างคลังความรู้จากธรรมชาติ",

      forestDescription:
        "สร้างบัญชีเพื่อบันทึกตัวอย่างพรรณไม้ จัดการข้อมูลจากภาคสนาม และร่วมเก็บรักษาความรู้ทางพฤกษศาสตร์ในรูปแบบดิจิทัล",

      title: "สมัครสมาชิก",

      subtitle: "สร้างบัญชี Virtual Herbarium ของคุณ",

      username: "ชื่อผู้ใช้",

      usernamePlaceholder: "เช่น Somchai หรือ herbarium_user",

      email: "อีเมล",

      emailPlaceholder: "example@gmail.com",

      password: "รหัสผ่าน",

      passwordPlaceholder: "ตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร",

      confirmPassword: "ยืนยันรหัสผ่าน",

      confirmPasswordPlaceholder: "พิมพ์รหัสผ่านอีกครั้ง",

      usernameHint: "ใช้ภาษาไทย ภาษาอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง",

      passwordHint: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",

      confirmHint: "กรุณาพิมพ์รหัสผ่านอีกครั้งเพื่อยืนยัน",

      register: "สร้างบัญชี",

      registering: "กำลังสร้างบัญชี...",

      alreadyLabel: "มีบัญชีอยู่แล้ว?",

      alreadyAccount: "เข้าสู่ระบบ",

      back: "กลับหน้าแรก",

      required: "กรุณากรอกข้อมูลให้ครบทุกช่อง",

      usernameLength: "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร",

      usernameInvalid:
        "ชื่อผู้ใช้ใช้ได้เฉพาะภาษาไทย ภาษาอังกฤษ ตัวเลข จุด ขีดกลาง และขีดล่าง",

      invalidEmail: "กรุณากรอกอีเมลให้ถูกต้อง",

      passwordLength: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",

      passwordMismatch: "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน",

      emailExists: "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ",

      registerFailed: "ไม่สามารถสมัครสมาชิกได้",

      accountCreated: "สร้างบัญชีสำเร็จ",

      confirmationSent: "ระบบได้ส่งลิงก์ยืนยันบัญชีไปยัง",

      confirmationCheck:
        "กรุณาตรวจสอบ Inbox หรือ Spam และกดลิงก์ยืนยันก่อนเข้าสู่ระบบ",

      noConfirmation: "บัญชีของคุณถูกสร้างเรียบร้อยแล้ว",

      goLogin: "ไปหน้าเข้าสู่ระบบ",

      passwordMatch: "รหัสผ่านตรงกัน",

      passwordNotMatch: "รหัสผ่านยังไม่ตรงกัน",

      secure: "SECURE REGISTRATION",

      secureText:
        "ข้อมูลบัญชีและรหัสผ่านได้รับการจัดการผ่านระบบยืนยันตัวตนของ Supabase",

      feature1: "My Plant Collection",

      feature1Text: "บันทึกและจัดการตัวอย่างพรรณไม้ของคุณ",

      feature2: "Field Information",

      feature2Text: "เก็บข้อมูลสถานที่ ถิ่นอาศัย และรายละเอียดการเก็บตัวอย่าง",

      feature3: "Digital Herbarium",

      feature3Text: "ร่วมสร้างคลังข้อมูลพรรณไม้ที่สามารถค้นหาและเรียนรู้ได้",
    },

    EN: {
      eyebrow: "JOIN THE HERBARIUM",

      forestTitle: "Help preserve knowledge from nature",

      forestDescription:
        "Create an account to record plant specimens, manage field information and contribute to a growing digital collection of botanical knowledge.",

      title: "Create Account",

      subtitle: "Create your Virtual Herbarium account",

      username: "Username",

      usernamePlaceholder: "e.g. Somchai or herbarium_user",

      email: "Email",

      emailPlaceholder: "example@gmail.com",

      password: "Password",

      passwordPlaceholder: "Create a password with at least 8 characters",

      confirmPassword: "Confirm Password",

      confirmPasswordPlaceholder: "Type your password again",

      usernameHint:
        "Use Thai or English letters, numbers, dots, hyphens or underscores",

      passwordHint: "Password must contain at least 8 characters",

      confirmHint: "Type your password again to confirm it",

      register: "Create Account",

      registering: "Creating account...",

      alreadyLabel: "Already have an account?",

      alreadyAccount: "Login",

      back: "Back to Home",

      required: "Please complete all fields",

      usernameLength: "Username must be at least 3 characters",

      usernameInvalid:
        "Username may only contain Thai or English letters, numbers, dots, hyphens and underscores",

      invalidEmail: "Please enter a valid email address",

      passwordLength: "Password must contain at least 8 characters",

      passwordMismatch: "Passwords do not match",

      emailExists: "This email is already registered. Please login.",

      registerFailed: "Unable to create your account",

      accountCreated: "Account created successfully",

      confirmationSent: "A confirmation link has been sent to",

      confirmationCheck:
        "Please check your Inbox or Spam folder and confirm your email before logging in.",

      noConfirmation: "Your account has been created successfully.",

      goLogin: "Go to Login",

      passwordMatch: "Passwords match",

      passwordNotMatch: "Passwords do not match",

      secure: "SECURE REGISTRATION",

      secureText:
        "Your account and password are handled through Supabase authentication.",

      feature1: "My Plant Collection",

      feature1Text: "Record and manage your own plant specimens",

      feature2: "Field Information",

      feature2Text:
        "Preserve locations, habitats and specimen collection details",

      feature3: "Digital Herbarium",

      feature3Text:
        "Contribute to an accessible collection of botanical knowledge",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     BLOCK CLIPBOARD ON CONFIRM PASSWORD
     เก็บพฤติกรรมเดิมของโปรเจกต์ไว้
  ===================================================== */

  function blockClipboard(e) {
    e.preventDefault();
  }

  /* =====================================================
     REGISTER
  ===================================================== */

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const cleanUsername = username.trim();

    const cleanEmail = email.trim().toLowerCase();

    /* -----------------------------------------------------
       REQUIRED
    ----------------------------------------------------- */

    if (!cleanUsername || !cleanEmail || !password || !confirmPassword) {
      setError(t.required);

      return;
    }

    /* -----------------------------------------------------
       USERNAME LENGTH
    ----------------------------------------------------- */

    if (cleanUsername.length < 3) {
      setError(t.usernameLength);

      return;
    }

    /* -----------------------------------------------------
       USERNAME VALIDATION

       รองรับ:
       - ภาษาไทย
       - ภาษาอังกฤษ
       - ตัวเลข
       - .
       - _
       - -
    ----------------------------------------------------- */

    if (!/^[a-zA-Zก-๙0-9._-]+$/.test(cleanUsername)) {
      setError(t.usernameInvalid);

      return;
    }

    /* -----------------------------------------------------
       EMAIL
    ----------------------------------------------------- */

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(t.invalidEmail);

      return;
    }

    /* -----------------------------------------------------
       PASSWORD
    ----------------------------------------------------- */

    if (password.length < 8) {
      setError(t.passwordLength);

      return;
    }

    /* -----------------------------------------------------
       CONFIRM PASSWORD
    ----------------------------------------------------- */

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);

      return;
    }

    setLoading(true);

    try {
      /* =================================================
         SUPABASE SIGN UP
      ================================================= */

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,

        password,

        options: {
          data: {
            username: cleanUsername,
          },

          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      /* =================================================
         ERROR
      ================================================= */

      if (signUpError) {
        const message = signUpError.message || "";

        const lowerMessage = message.toLowerCase();

        console.error("Register error:", signUpError);

        if (
          lowerMessage.includes("already registered") ||
          lowerMessage.includes("already exists") ||
          lowerMessage.includes("user already")
        ) {
          setError(t.emailExists);
        } else {
          setError(`${t.registerFailed}: ${message}`);
        }

        return;
      }

      /* =================================================
         NO USER
      ================================================= */

      if (!data?.user) {
        setError(t.registerFailed);

        return;
      }

      /* =================================================
         EMAIL CONFIRMATION ENABLED
      ================================================= */

      if (!data.session) {
        setSuccess(
          `${t.confirmationSent} ${cleanEmail}. ${t.confirmationCheck}`,
        );

        return;
      }

      /* =================================================
         EMAIL CONFIRMATION DISABLED
      ================================================= */

      setSuccess(t.noConfirmation);

      setTimeout(() => {
        router.push("/account");

        router.refresh();
      }, 800);
    } catch (err) {
      console.error("Register failed:", err);

      setError(err?.message || t.registerFailed);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     PASSWORD STATE
  ===================================================== */

  const passwordHasValue = password.length > 0;

  const confirmHasValue = confirmPassword.length > 0;

  const passwordsMatch =
    passwordHasValue && confirmHasValue && password === confirmPassword;

  const passwordsDoNotMatch =
    passwordHasValue && confirmHasValue && password !== confirmPassword;

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="page overflow-hidden">
      <Navbar />

      <section className="relative isolate min-h-[calc(100svh-78px)] overflow-hidden">
        {/* =================================================
            FOREST BACKGROUND
        ================================================= */}

        <div
          className="absolute inset-0 -z-30 bg-cover bg-center"
          style={{
            backgroundImage: `url("${FOREST_IMAGE}")`,
          }}
        />

        {/* THEME OVERLAY */}

        <div
          className={`absolute inset-0 -z-20 ${
            darkMode
              ? "bg-[linear-gradient(90deg,rgba(2,9,5,0.96)_0%,rgba(3,14,7,0.86)_48%,rgba(3,14,7,0.70)_100%)]"
              : "bg-[linear-gradient(90deg,rgba(238,246,236,0.96)_0%,rgba(238,246,236,0.90)_48%,rgba(235,244,233,0.74)_100%)]"
          }`}
        />

        {/* DEPTH */}

        <div
          className={`absolute inset-0 -z-10 ${
            darkMode
              ? "bg-[linear-gradient(180deg,rgba(2,8,4,0.18)_0%,transparent_40%,rgba(2,8,4,0.52)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,transparent_45%,rgba(230,240,228,0.48)_100%)]"
          }`}
        />

        {/* LIGHT */}

        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className={`absolute -top-52 right-[9%] h-[740px] w-28 rotate-[24deg] blur-3xl ${
              darkMode
                ? "bg-gradient-to-b from-emerald-100/10 to-transparent"
                : "bg-gradient-to-b from-white/60 to-transparent"
            }`}
          />

          <div className="forest-particle left-[12%] top-[20%]" />

          <div className="forest-particle left-[37%] top-[62%] [animation-delay:-2s]" />

          <div className="forest-particle right-[20%] top-[28%] [animation-delay:-4s]" />

          <div className="forest-particle right-[8%] top-[68%] [animation-delay:-6s]" />
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="container">
          <div className="grid min-h-[calc(100svh-78px)] items-start gap-12 py-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-20 lg:py-16">
            {/* =================================================
                LEFT INTRO
            ================================================= */}

            <div className="hidden max-w-xl lg:block page-enter">
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
                className={`mt-7 text-5xl font-black leading-[1.03] tracking-[-0.05em] xl:text-6xl ${
                  darkMode ? "text-white" : "text-[#102218]"
                }`}
              >
                {t.forestTitle}
              </h1>

              <p
                className={`mt-6 max-w-lg text-base leading-8 ${
                  darkMode ? "text-[#bdccc1]" : "text-[#475f4e]"
                }`}
              >
                {t.forestDescription}
              </p>

              {/* FEATURES */}

              <div className="mt-10 space-y-3">
                <FeatureRow
                  darkMode={darkMode}
                  icon={<LeafIcon className="h-5 w-5" />}
                  title={t.feature1}
                  text={t.feature1Text}
                />

                <FeatureRow
                  darkMode={darkMode}
                  icon={<PinIcon className="h-5 w-5" />}
                  title={t.feature2}
                  text={t.feature2Text}
                />

                <FeatureRow
                  darkMode={darkMode}
                  icon={<BookIcon className="h-5 w-5" />}
                  title={t.feature3}
                  text={t.feature3Text}
                />
              </div>
            </div>

            {/* =================================================
                REGISTER CARD
            ================================================= */}

            <div className="mx-auto w-full max-w-xl page-enter">
              {/* MOBILE BADGE */}

              <div className="mb-6 text-center lg:hidden">
                <div
                  className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 backdrop-blur-xl ${
                    darkMode
                      ? "border-emerald-300/20 bg-black/20 text-emerald-200"
                      : "border-emerald-950/15 bg-white/55 text-emerald-900"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      darkMode ? "bg-emerald-400" : "bg-emerald-700"
                    }`}
                  />

                  <span className="text-[10px] font-black tracking-[0.2em]">
                    VIRTUAL HERBARIUM
                  </span>
                </div>
              </div>

              <div
                className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-2xl sm:p-8 ${
                  darkMode
                    ? "border-white/10 bg-[#07130c]/82 shadow-black/40"
                    : "border-white/60 bg-white/78 shadow-emerald-950/15"
                }`}
              >
                {/* TOP LIGHT */}

                <div
                  className={`absolute inset-x-14 top-0 h-px ${
                    darkMode
                      ? "bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
                      : "bg-gradient-to-r from-transparent via-emerald-700/30 to-transparent"
                  }`}
                />

                {/* GLOW */}

                <div
                  className={`pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full blur-3xl ${
                    darkMode ? "bg-emerald-400/[0.06]" : "bg-emerald-700/[0.07]"
                  }`}
                />

                <div className="relative">
                  {/* ICON */}

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                      darkMode
                        ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
                        : "border-emerald-800/10 bg-emerald-800/10 text-emerald-800"
                    }`}
                  >
                    <UserPlusIcon className="h-6 w-6" />
                  </div>

                  {/* TITLE */}

                  <h2
                    className={`mt-6 text-3xl font-black tracking-[-0.04em] ${
                      darkMode ? "text-white" : "text-[#14271a]"
                    }`}
                  >
                    {t.title}
                  </h2>

                  <p
                    className={`mt-2 text-sm leading-6 ${
                      darkMode ? "text-gray-400" : "text-slate-500"
                    }`}
                  >
                    {t.subtitle}
                  </p>

                  {/* =================================================
                      FORM
                  ================================================= */}

                  <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    {/* USERNAME */}

                    <FormField
                      darkMode={darkMode}
                      label={t.username}
                      hint={t.usernameHint}
                    >
                      <div className="relative">
                        <UserIcon
                          className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                            darkMode ? "text-gray-500" : "text-slate-400"
                          }`}
                        />

                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder={t.usernamePlaceholder}
                          autoComplete="username"
                          maxLength={30}
                          disabled={loading}
                          required
                          className={inputClass(darkMode)}
                        />
                      </div>
                    </FormField>

                    {/* EMAIL */}

                    <FormField darkMode={darkMode} label={t.email}>
                      <div className="relative">
                        <MailIcon
                          className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                            darkMode ? "text-gray-500" : "text-slate-400"
                          }`}
                        />

                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t.emailPlaceholder}
                          autoComplete="email"
                          disabled={loading}
                          required
                          className={inputClass(darkMode)}
                        />
                      </div>
                    </FormField>

                    {/* PASSWORD */}

                    <FormField
                      darkMode={darkMode}
                      label={t.password}
                      hint={t.passwordHint}
                    >
                      <div className="relative">
                        <LockIcon
                          className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                            darkMode ? "text-gray-500" : "text-slate-400"
                          }`}
                        />

                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t.passwordPlaceholder}
                          autoComplete="new-password"
                          minLength={8}
                          disabled={loading}
                          required
                          className={`${inputClass(darkMode)} pr-12`}
                        />

                        <PasswordButton
                          darkMode={darkMode}
                          visible={showPassword}
                          onClick={() => setShowPassword((current) => !current)}
                        />
                      </div>
                    </FormField>

                    {/* CONFIRM PASSWORD */}

                    <FormField
                      darkMode={darkMode}
                      label={t.confirmPassword}
                      hint={t.confirmHint}
                    >
                      <div className="relative">
                        <LockIcon
                          className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                            darkMode ? "text-gray-500" : "text-slate-400"
                          }`}
                        />

                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onPaste={blockClipboard}
                          onCopy={blockClipboard}
                          onCut={blockClipboard}
                          onDrop={blockClipboard}
                          onContextMenu={blockClipboard}
                          placeholder={t.confirmPasswordPlaceholder}
                          autoComplete="new-password"
                          minLength={8}
                          disabled={loading}
                          required
                          className={`${inputClass(darkMode)} pr-12`}
                        />

                        <PasswordButton
                          darkMode={darkMode}
                          visible={showConfirmPassword}
                          onClick={() =>
                            setShowConfirmPassword((current) => !current)
                          }
                        />
                      </div>
                    </FormField>

                    {/* PASSWORD MATCH */}

                    {(passwordsMatch || passwordsDoNotMatch) && (
                      <div
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                          passwordsMatch
                            ? darkMode
                              ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-200"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : darkMode
                              ? "border-red-400/15 bg-red-400/[0.06] text-red-200"
                              : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {passwordsMatch ? (
                          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : (
                          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        )}

                        <p className="text-sm">
                          {passwordsMatch
                            ? t.passwordMatch
                            : t.passwordNotMatch}
                        </p>
                      </div>
                    )}

                    {/* ERROR */}

                    {error && (
                      <div
                        role="alert"
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                          darkMode
                            ? "border-red-400/15 bg-red-400/[0.06] text-red-200"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />

                        <p className="text-sm leading-6">{error}</p>
                      </div>
                    )}

                    {/* SUCCESS */}

                    {success && (
                      <div
                        role="status"
                        className={`rounded-2xl border p-5 ${
                          darkMode
                            ? "border-emerald-400/15 bg-emerald-400/[0.06]"
                            : "border-emerald-200 bg-emerald-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              darkMode
                                ? "bg-emerald-400/10 text-emerald-300"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" />
                          </div>

                          <div>
                            <p
                              className={`font-black ${
                                darkMode
                                  ? "text-emerald-200"
                                  : "text-emerald-900"
                              }`}
                            >
                              {t.accountCreated}
                            </p>

                            <p
                              className={`mt-2 text-sm leading-6 ${
                                darkMode
                                  ? "text-emerald-200/75"
                                  : "text-emerald-800"
                              }`}
                            >
                              {success}
                            </p>

                            <Link
                              href="/login"
                              className={`mt-4 inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-bold transition ${
                                darkMode
                                  ? "bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15"
                                  : "bg-emerald-700 text-white hover:bg-emerald-800"
                              }`}
                            >
                              {t.goLogin}
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* REGISTER BUTTON */}

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(6,78,45,0.28)] transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[0_16px_35px_rgba(6,78,45,0.35)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <LoadingIcon className="h-5 w-5 animate-spin" />

                          {t.registering}
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="h-5 w-5" />

                          {t.register}
                        </>
                      )}
                    </button>
                  </form>

                  {/* LOGIN */}

                  <div
                    className={`mt-7 border-t pt-6 ${
                      darkMode ? "border-white/10" : "border-emerald-950/10"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1 text-center sm:flex-row sm:gap-2">
                      <span
                        className={`text-sm ${
                          darkMode ? "text-gray-500" : "text-slate-500"
                        }`}
                      >
                        {t.alreadyLabel}
                      </span>

                      <Link
                        href="/login"
                        className={`text-sm font-black transition ${
                          darkMode
                            ? "text-emerald-300 hover:text-emerald-200"
                            : "text-emerald-700 hover:text-emerald-800"
                        }`}
                      >
                        {t.alreadyAccount}
                      </Link>
                    </div>
                  </div>

                  {/* SECURITY */}

                  <div
                    className={`mt-6 flex items-start gap-3 rounded-xl p-4 ${
                      darkMode ? "bg-white/[0.025]" : "bg-emerald-950/[0.035]"
                    }`}
                  >
                    <ShieldIcon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        darkMode ? "text-emerald-400" : "text-emerald-700"
                      }`}
                    />

                    <div>
                      <p
                        className={`text-[9px] font-black tracking-[0.14em] ${
                          darkMode ? "text-gray-400" : "text-slate-500"
                        }`}
                      >
                        {t.secure}
                      </p>

                      <p
                        className={`mt-1 text-xs leading-5 ${
                          darkMode ? "text-gray-500" : "text-slate-500"
                        }`}
                      >
                        {t.secureText}
                      </p>
                    </div>
                  </div>

                  {/* HOME */}

                  <div className="mt-5 text-center">
                    <Link
                      href="/"
                      className={`text-xs font-bold transition ${
                        darkMode
                          ? "text-gray-500 hover:text-emerald-300"
                          : "text-slate-500 hover:text-emerald-700"
                      }`}
                    >
                      {t.back}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MIST */}

        <div className="pointer-events-none absolute bottom-[-70px] left-[-10%] right-[-10%] h-40 bg-white/[0.035] blur-3xl" />
      </section>
    </main>
  );
}

/* =========================================================
   INPUT CLASS
========================================================= */

function inputClass(darkMode) {
  return `h-[52px] w-full rounded-xl border pl-12 pr-4 text-sm outline-none transition ${
    darkMode
      ? "border-white/10 bg-black/20 text-white placeholder:text-gray-600 hover:border-white/15 focus:border-emerald-400/45 focus:bg-black/30 focus:ring-4 focus:ring-emerald-400/[0.06]"
      : "border-emerald-950/10 bg-white/70 text-slate-900 placeholder:text-slate-400 hover:border-emerald-950/20 focus:border-emerald-700/35 focus:bg-white focus:ring-4 focus:ring-emerald-700/[0.06]"
  }`;
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({ darkMode, label, hint, children }) {
  return (
    <div>
      <label
        className={`mb-2 block text-sm font-bold ${
          darkMode ? "text-gray-200" : "text-slate-700"
        }`}
      >
        {label}
      </label>

      {children}

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
   PASSWORD BUTTON
========================================================= */

function PasswordButton({ darkMode, visible, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={visible ? "Hide password" : "Show password"}
      className={`absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg transition ${
        darkMode
          ? "text-gray-500 hover:bg-white/[0.06] hover:text-gray-200"
          : "text-slate-400 hover:bg-emerald-950/[0.05] hover:text-slate-700"
      }`}
    >
      {visible ? (
        <EyeOffIcon className="h-5 w-5" />
      ) : (
        <EyeIcon className="h-5 w-5" />
      )}
    </button>
  );
}

/* =========================================================
   FEATURE ROW
========================================================= */

function FeatureRow({ darkMode, icon, title, text }) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border p-4 backdrop-blur-xl ${
        darkMode
          ? "border-white/10 bg-black/15"
          : "border-emerald-950/10 bg-white/45"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/10 text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <div>
        <p
          className={`text-sm font-black ${
            darkMode ? "text-white" : "text-[#173321]"
          }`}
        >
          {title}
        </p>

        <p
          className={`mt-0.5 text-xs ${
            darkMode ? "text-gray-400" : "text-slate-500"
          }`}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function UserPlusIcon({ className = "" }) {
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
      <circle cx="9" cy="8" r="4" />

      <path d="M2 21a7 7 0 0 1 14 0" />

      <path d="M19 8v6" />
      <path d="M16 11h6" />
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

function LockIcon({ className = "" }) {
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
      <rect x="4" y="10" width="16" height="11" rx="2" />

      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon({ className = "" }) {
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
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />

      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon({ className = "" }) {
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
      <path d="m3 3 18 18" />

      <path d="M10.5 6.2A10.4 10.4 0 0 1 12 6c6 0 9.5 6 9.5 6a15.8 15.8 0 0 1-2.3 2.9" />

      <path d="M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6a10 10 0 0 0 3.2-.5" />

      <path d="M10 10a2.8 2.8 0 0 0 4 4" />
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

function LeafIcon({ className = "" }) {
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
      <path d="M20 4C10 4 5 8 5 15c0 2.8 2 5 5 5 7 0 10-5 10-16Z" />

      <path d="M4 20c4-5 7-7 13-10" />
    </svg>
  );
}

function PinIcon({ className = "" }) {
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
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function BookIcon({ className = "" }) {
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
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />

      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z" />
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
