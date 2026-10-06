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

/* =========================================================
   PAGE
========================================================= */

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
      eyebrow: "MEMBER REGISTRATION",

      title: "สมัครสมาชิก",

      subtitle: "สร้างบัญชี Virtual Herbarium ของคุณ",

      username: "ชื่อผู้ใช้",

      usernamePlaceholder: "เช่น สมชาย หรือ herbarium_user",

      email: "อีเมล",

      emailPlaceholder: "example@gmail.com",

      password: "รหัสผ่าน",

      passwordPlaceholder: "อย่างน้อย 8 ตัวอักษร",

      confirmPassword: "ยืนยันรหัสผ่าน",

      confirmPasswordPlaceholder: "พิมพ์รหัสผ่านอีกครั้ง",

      usernameHint: "ใช้ภาษาไทย ภาษาอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง",

      passwordHint: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",

      register: "สมัครสมาชิก",

      registering: "กำลังสร้างบัญชี...",

      alreadyAccount: "มีบัญชีอยู่แล้ว?",

      login: "เข้าสู่ระบบ",

      back: "กลับหน้าแรก",

      required: "กรุณากรอกข้อมูลให้ครบทุกช่อง",

      usernameLength: "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร",

      usernameInvalid:
        "ชื่อผู้ใช้ใช้ได้เฉพาะภาษาไทย ภาษาอังกฤษ ตัวเลข จุด ขีดกลาง และขีดล่าง",

      invalidEmail: "กรุณากรอกอีเมลให้ถูกต้อง",

      passwordLength: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",

      passwordMismatch: "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน",

      emailExists: "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ",

      registerFailed: "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง",

      accountCreated: "สมัครสมาชิกสำเร็จ",

      confirmationSent: "ระบบได้ส่งลิงก์ยืนยันบัญชีไปยัง",

      confirmationCheck:
        "กรุณาตรวจสอบ Inbox หรือ Spam แล้วกดลิงก์ยืนยันก่อนเข้าสู่ระบบ",

      noConfirmation: "บัญชีถูกสร้างแล้ว กำลังพาคุณเข้าสู่บัญชี",

      goLogin: "ไปหน้าเข้าสู่ระบบ",

      passwordMatch: "รหัสผ่านตรงกัน",

      passwordNotMatch: "รหัสผ่านยังไม่ตรงกัน",

      showPassword: "แสดงรหัสผ่าน",

      hidePassword: "ซ่อนรหัสผ่าน",

      secure: "SECURE REGISTRATION",

      secureText: "ข้อมูลบัญชีจะถูกส่งผ่านระบบยืนยันตัวตนของ Virtual Herbarium",
    },

    EN: {
      eyebrow: "MEMBER REGISTRATION",

      title: "Create Account",

      subtitle: "Create your Virtual Herbarium account",

      username: "Username",

      usernamePlaceholder: "e.g. Somchai or herbarium_user",

      email: "Email",

      emailPlaceholder: "example@gmail.com",

      password: "Password",

      passwordPlaceholder: "At least 8 characters",

      confirmPassword: "Confirm Password",

      confirmPasswordPlaceholder: "Type your password again",

      usernameHint:
        "Use Thai or English letters, numbers, dots, hyphens or underscores",

      passwordHint: "Password must contain at least 8 characters",

      register: "Create Account",

      registering: "Creating account...",

      alreadyAccount: "Already have an account?",

      login: "Login",

      back: "Back to Home",

      required: "Please complete all fields",

      usernameLength: "Username must be at least 3 characters",

      usernameInvalid:
        "Username may only contain Thai or English letters, numbers, dots, hyphens and underscores",

      invalidEmail: "Please enter a valid email address",

      passwordLength: "Password must contain at least 8 characters",

      passwordMismatch: "Passwords do not match",

      emailExists: "This email is already registered. Please login.",

      registerFailed: "Unable to create your account. Please try again.",

      accountCreated: "Account created successfully",

      confirmationSent: "A confirmation link has been sent to",

      confirmationCheck:
        "Please check your Inbox or Spam folder and confirm your email before logging in.",

      noConfirmation:
        "Your account has been created. Taking you to your account.",

      goLogin: "Go to Login",

      passwordMatch: "Passwords match",

      passwordNotMatch: "Passwords do not match",

      showPassword: "Show password",

      hidePassword: "Hide password",

      secure: "SECURE REGISTRATION",

      secureText:
        "Your account information is handled through secure authentication.",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     HELPERS
  ===================================================== */

  function clearFeedback() {
    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  }

  /* =====================================================
     REGISTER
  ===================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const cleanUsername = username.trim();

    const cleanEmail = email.trim().toLowerCase();

    /* =================================================
       REQUIRED
    ================================================= */

    if (!cleanUsername || !cleanEmail || !password || !confirmPassword) {
      setError(t.required);

      return;
    }

    /* =================================================
       USERNAME
    ================================================= */

    if (cleanUsername.length < 3) {
      setError(t.usernameLength);

      return;
    }

    if (!/^[a-zA-Zก-๙0-9._-]+$/.test(cleanUsername)) {
      setError(t.usernameInvalid);

      return;
    }

    /* =================================================
       EMAIL
    ================================================= */

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(t.invalidEmail);

      return;
    }

    /* =================================================
       PASSWORD
    ================================================= */

    if (password.length < 8) {
      setError(t.passwordLength);

      return;
    }

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
        console.error("Register error:", signUpError);

        const message = signUpError.message?.toLowerCase() || "";

        if (
          message.includes("already registered") ||
          message.includes("already exists") ||
          message.includes("user already")
        ) {
          setError(t.emailExists);

          return;
        }

        setError(t.registerFailed);

        return;
      }

      /* =================================================
         NO USER
      ================================================= */

      if (!data?.user) {
        setError(t.registerFailed);

        return;
      }

      /*
       * Supabase บาง configuration
       * จะไม่ throw error เมื่อ email มีอยู่แล้ว
       */

      if (
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        setError(t.emailExists);

        return;
      }

      /* =================================================
         EMAIL CONFIRMATION ENABLED
      ================================================= */

      if (!data.session) {
        setSuccess(
          `${t.accountCreated}. ${t.confirmationSent} ${cleanEmail}. ${t.confirmationCheck}`,
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
     PASSWORD STATUS
  ===================================================== */

  const hasConfirmPassword = confirmPassword.length > 0;

  const passwordMatches =
    password && confirmPassword && password === confirmPassword;

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="page overflow-x-hidden">
      <Navbar />

      <section className="relative isolate min-h-[calc(100dvh-58px)] overflow-x-hidden md:min-h-[calc(100dvh-78px)]">
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
              ? "bg-[linear-gradient(180deg,rgba(2,9,5,0.91)_0%,rgba(3,13,7,0.85)_48%,rgba(3,13,7,0.94)_100%)] md:bg-[linear-gradient(90deg,rgba(2,9,5,0.96)_0%,rgba(3,13,7,0.84)_48%,rgba(3,13,7,0.70)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(238,246,236,0.93)_0%,rgba(238,246,236,0.90)_48%,rgba(235,244,233,0.96)_100%)] md:bg-[linear-gradient(90deg,rgba(238,246,236,0.96)_0%,rgba(238,246,236,0.90)_48%,rgba(235,244,233,0.76)_100%)]"
          }`}
        />

        {/* DEPTH */}

        <div
          className={`absolute inset-0 -z-10 ${
            darkMode
              ? "bg-[linear-gradient(180deg,rgba(2,8,4,0.14)_0%,transparent_40%,rgba(2,8,4,0.52)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,transparent_45%,rgba(230,240,228,0.48)_100%)]"
          }`}
        />

        {/* LIGHT */}

        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className={`absolute -top-52 right-[8%] h-[720px] w-28 rotate-[24deg] blur-3xl ${
              darkMode
                ? "bg-gradient-to-b from-emerald-100/10 to-transparent"
                : "bg-gradient-to-b from-white/60 to-transparent"
            }`}
          />

          <div className="forest-particle left-[10%] top-[24%]" />

          <div className="forest-particle right-[20%] top-[30%] [animation-delay:-4s]" />

          <div className="forest-particle right-[8%] top-[68%] [animation-delay:-6s]" />
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="container">
          <div className="flex min-h-[calc(100dvh-58px)] items-center justify-center py-6 sm:py-8 md:min-h-[calc(100dvh-78px)] md:py-10 lg:py-12">
            <div className="w-full max-w-[540px] page-enter">
              {/* =================================================
                  MOBILE / PAGE BADGE
              ================================================= */}

              <div className="mb-4 text-center sm:mb-5">
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
                        ? "bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]"
                        : "bg-emerald-700"
                    }`}
                  />

                  <span className="text-[10px] font-black tracking-[0.2em]">
                    {t.eyebrow}
                  </span>
                </div>
              </div>

              {/* =================================================
                  CARD
              ================================================= */}

              <div
                className={`relative overflow-hidden rounded-[24px] border p-5 shadow-2xl backdrop-blur-2xl min-[390px]:p-6 sm:rounded-[28px] sm:p-7 lg:p-8 ${
                  darkMode
                    ? "border-white/10 bg-[#07130c]/82 shadow-black/40"
                    : "border-white/60 bg-white/80 shadow-emerald-950/15"
                }`}
              >
                {/* TOP LIGHT */}

                <div
                  className={`absolute inset-x-12 top-0 h-px ${
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
                  {/* HEADER */}

                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                        darkMode
                          ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
                          : "border-emerald-800/10 bg-emerald-800/10 text-emerald-800"
                      }`}
                    >
                      <UserPlusIcon className="h-6 w-6" />
                    </div>

                    <div className="min-w-0">
                      <h1
                        className={`text-[2rem] font-black leading-tight tracking-[-0.04em] sm:text-3xl ${
                          darkMode ? "text-white" : "text-[#14271a]"
                        }`}
                      >
                        {t.title}
                      </h1>

                      <p
                        className={`mt-1.5 text-sm leading-6 ${
                          darkMode ? "text-gray-400" : "text-slate-500"
                        }`}
                      >
                        {t.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* =================================================
                      FORM
                  ================================================= */}

                  <form
                    onSubmit={handleSubmit}
                    aria-busy={loading}
                    className="mt-6 space-y-5 sm:mt-7"
                  >
                    {/* USERNAME */}

                    <div>
                      <label
                        htmlFor="register-username"
                        className={`mb-2 block text-sm font-bold ${
                          darkMode ? "text-gray-200" : "text-slate-700"
                        }`}
                      >
                        {t.username}
                      </label>

                      <div className="relative">
                        <UserIcon
                          className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                            darkMode ? "text-gray-500" : "text-slate-400"
                          }`}
                        />

                        <input
                          id="register-username"
                          type="text"
                          value={username}
                          onChange={(event) => {
                            setUsername(event.target.value);

                            clearFeedback();
                          }}
                          placeholder={t.usernamePlaceholder}
                          autoComplete="username"
                          maxLength={30}
                          disabled={loading}
                          required
                          className={`h-[52px] w-full rounded-xl border pl-12 pr-4 text-sm outline-none transition ${
                            darkMode
                              ? "border-white/10 bg-black/20 text-white placeholder:text-gray-600 hover:border-white/15 focus:border-emerald-400/45 focus:bg-black/30 focus:ring-4 focus:ring-emerald-400/[0.06]"
                              : "border-emerald-950/10 bg-white/70 text-slate-900 placeholder:text-slate-400 hover:border-emerald-950/20 focus:border-emerald-700/35 focus:bg-white focus:ring-4 focus:ring-emerald-700/[0.06]"
                          }`}
                        />
                      </div>

                      <p
                        className={`mt-1.5 text-[10px] leading-5 ${
                          darkMode ? "text-gray-500" : "text-slate-500"
                        }`}
                      >
                        {t.usernameHint}
                      </p>
                    </div>

                    {/* EMAIL */}

                    <div>
                      <label
                        htmlFor="register-email"
                        className={`mb-2 block text-sm font-bold ${
                          darkMode ? "text-gray-200" : "text-slate-700"
                        }`}
                      >
                        {t.email}
                      </label>

                      <div className="relative">
                        <MailIcon
                          className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                            darkMode ? "text-gray-500" : "text-slate-400"
                          }`}
                        />

                        <input
                          id="register-email"
                          type="email"
                          inputMode="email"
                          value={email}
                          onChange={(event) => {
                            setEmail(event.target.value);

                            clearFeedback();
                          }}
                          placeholder={t.emailPlaceholder}
                          autoComplete="email"
                          autoCapitalize="none"
                          spellCheck={false}
                          disabled={loading}
                          required
                          className={`h-[52px] w-full rounded-xl border pl-12 pr-4 text-sm outline-none transition ${
                            darkMode
                              ? "border-white/10 bg-black/20 text-white placeholder:text-gray-600 hover:border-white/15 focus:border-emerald-400/45 focus:bg-black/30 focus:ring-4 focus:ring-emerald-400/[0.06]"
                              : "border-emerald-950/10 bg-white/70 text-slate-900 placeholder:text-slate-400 hover:border-emerald-950/20 focus:border-emerald-700/35 focus:bg-white focus:ring-4 focus:ring-emerald-700/[0.06]"
                          }`}
                        />
                      </div>
                    </div>

                    {/* PASSWORDS */}

                    <div className="grid gap-5 sm:grid-cols-2">
                      {/* PASSWORD */}

                      <div className="min-w-0">
                        <label
                          htmlFor="register-password"
                          className={`mb-2 block text-sm font-bold ${
                            darkMode ? "text-gray-200" : "text-slate-700"
                          }`}
                        >
                          {t.password}
                        </label>

                        <div className="relative">
                          <LockIcon
                            className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                              darkMode ? "text-gray-500" : "text-slate-400"
                            }`}
                          />

                          <input
                            id="register-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => {
                              setPassword(event.target.value);

                              clearFeedback();
                            }}
                            placeholder={t.passwordPlaceholder}
                            autoComplete="new-password"
                            minLength={8}
                            disabled={loading}
                            required
                            className={`h-[52px] w-full rounded-xl border pl-12 pr-12 text-sm outline-none transition ${
                              darkMode
                                ? "border-white/10 bg-black/20 text-white placeholder:text-gray-600 hover:border-white/15 focus:border-emerald-400/45 focus:bg-black/30 focus:ring-4 focus:ring-emerald-400/[0.06]"
                                : "border-emerald-950/10 bg-white/70 text-slate-900 placeholder:text-slate-400 hover:border-emerald-950/20 focus:border-emerald-700/35 focus:bg-white focus:ring-4 focus:ring-emerald-700/[0.06]"
                            }`}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((current) => !current)
                            }
                            aria-label={
                              showPassword ? t.hidePassword : t.showPassword
                            }
                            title={
                              showPassword ? t.hidePassword : t.showPassword
                            }
                            className={`absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg transition ${
                              darkMode
                                ? "text-gray-500 hover:bg-white/[0.06] hover:text-gray-200"
                                : "text-slate-400 hover:bg-emerald-950/[0.05] hover:text-slate-700"
                            }`}
                          >
                            {showPassword ? (
                              <EyeOffIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* CONFIRM PASSWORD */}

                      <div className="min-w-0">
                        <label
                          htmlFor="register-confirm-password"
                          className={`mb-2 block text-sm font-bold ${
                            darkMode ? "text-gray-200" : "text-slate-700"
                          }`}
                        >
                          {t.confirmPassword}
                        </label>

                        <div className="relative">
                          <LockIcon
                            className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                              darkMode ? "text-gray-500" : "text-slate-400"
                            }`}
                          />

                          <input
                            id="register-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(event) => {
                              setConfirmPassword(event.target.value);

                              clearFeedback();
                            }}
                            placeholder={t.confirmPasswordPlaceholder}
                            autoComplete="new-password"
                            minLength={8}
                            disabled={loading}
                            required
                            className={`h-[52px] w-full rounded-xl border pl-12 pr-12 text-sm outline-none transition ${
                              darkMode
                                ? "border-white/10 bg-black/20 text-white placeholder:text-gray-600 hover:border-white/15 focus:border-emerald-400/45 focus:bg-black/30 focus:ring-4 focus:ring-emerald-400/[0.06]"
                                : "border-emerald-950/10 bg-white/70 text-slate-900 placeholder:text-slate-400 hover:border-emerald-950/20 focus:border-emerald-700/35 focus:bg-white focus:ring-4 focus:ring-emerald-700/[0.06]"
                            }`}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword((current) => !current)
                            }
                            aria-label={
                              showConfirmPassword
                                ? t.hidePassword
                                : t.showPassword
                            }
                            title={
                              showConfirmPassword
                                ? t.hidePassword
                                : t.showPassword
                            }
                            className={`absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg transition ${
                              darkMode
                                ? "text-gray-500 hover:bg-white/[0.06] hover:text-gray-200"
                                : "text-slate-400 hover:bg-emerald-950/[0.05] hover:text-slate-700"
                            }`}
                          >
                            {showConfirmPassword ? (
                              <EyeOffIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* PASSWORD HINT */}

                    <div
                      className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 ${
                        darkMode ? "bg-white/[0.025]" : "bg-emerald-950/[0.035]"
                      }`}
                    >
                      <InfoIcon
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          darkMode ? "text-emerald-400" : "text-emerald-700"
                        }`}
                      />

                      <p
                        className={`text-[10px] leading-5 ${
                          darkMode ? "text-gray-500" : "text-slate-500"
                        }`}
                      >
                        {t.passwordHint}
                      </p>
                    </div>

                    {/* PASSWORD MATCH */}

                    {hasConfirmPassword && (
                      <div
                        role="status"
                        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 ${
                          passwordMatches
                            ? darkMode
                              ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-200"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : darkMode
                              ? "border-red-400/15 bg-red-400/[0.05] text-red-200"
                              : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {passwordMatches ? (
                          <CheckIcon className="h-4 w-4 shrink-0" />
                        ) : (
                          <AlertIcon className="h-4 w-4 shrink-0" />
                        )}

                        <p className="text-xs font-bold">
                          {passwordMatches
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
                        aria-live="polite"
                        className={`rounded-xl border p-4 ${
                          darkMode
                            ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-200"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />

                          <div className="min-w-0">
                            <p className="text-sm font-black">
                              {t.accountCreated}
                            </p>

                            <p className="mt-1.5 break-words text-xs leading-6">
                              {success}
                            </p>
                          </div>
                        </div>

                        <Link
                          href="/login"
                          className={`mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-black transition ${
                            darkMode
                              ? "bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15"
                              : "bg-emerald-700/10 text-emerald-800 hover:bg-emerald-700/15"
                          }`}
                        >
                          {t.goLogin}

                          <ArrowRightIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    )}

                    {/* REGISTER BUTTON */}

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(6,78,45,0.28)] transition active:scale-[0.99] hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[0_16px_35px_rgba(6,78,45,0.35)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
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

                  {/* =================================================
                      LOGIN
                  ================================================= */}

                  <div
                    className={`mt-6 border-t pt-5 ${
                      darkMode ? "border-white/10" : "border-emerald-950/10"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
                      <span
                        className={`text-sm ${
                          darkMode ? "text-gray-500" : "text-slate-500"
                        }`}
                      >
                        {t.alreadyAccount}
                      </span>

                      <Link
                        href="/login"
                        className={`text-sm font-black transition ${
                          darkMode
                            ? "text-emerald-300 hover:text-emerald-200"
                            : "text-emerald-700 hover:text-emerald-800"
                        }`}
                      >
                        {t.login}
                      </Link>
                    </div>
                  </div>

                  {/* =================================================
                      SECURITY
                  ================================================= */}

                  <div
                    className={`mt-5 flex items-start gap-3 rounded-xl p-3.5 ${
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

                  <div className="mt-4 text-center">
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
   ICONS
========================================================= */

function UserPlusIcon({ className = "" }) {
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
      <circle cx="9" cy="8" r="4" />

      <path d="M2.5 21a7 7 0 0 1 13 0" />

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

function InfoIcon({ className = "" }) {
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

      <path d="M12 11v5" />

      <path d="M12 8h.01" />
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

function ArrowRightIcon({ className = "" }) {
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
      <path d="M5 12h14" />

      <path d="m15 8 4 4-4 4" />
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
