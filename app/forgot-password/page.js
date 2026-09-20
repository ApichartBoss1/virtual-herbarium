"use client";

import Link from "next/link";
import { useState } from "react";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   FOREST BACKGROUND
========================================================= */

const FOREST_IMAGE =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=90";

export default function ForgotPasswordPage() {
  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "ACCOUNT RECOVERY",

      forestTitle: "เส้นทางกลับเข้าสู่บัญชีของคุณ",

      forestDescription:
        "หากคุณจำรหัสผ่านไม่ได้ เพียงกรอกอีเมลที่ใช้สมัครสมาชิก ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ",

      title: "ลืมรหัสผ่าน",

      subtitle:
        "กรอกอีเมลที่ใช้สมัคร Virtual Herbarium เพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่",

      email: "อีเมล",

      placeholder: "example@gmail.com",

      send: "ส่งลิงก์รีเซ็ตรหัสผ่าน",

      sending: "กำลังส่งลิงก์...",

      required: "กรุณากรอกอีเมล",

      invalid: "กรุณากรอกอีเมลให้ถูกต้อง",

      successTitle: "ส่งลิงก์เรียบร้อยแล้ว",

      success:
        "หากอีเมลนี้เชื่อมโยงกับบัญชี ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ กรุณาตรวจสอบ Inbox และ Spam",

      error: "ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้",

      back: "กลับเข้าสู่ระบบ",

      anotherEmail: "ใช้อีเมลอื่น",

      secure: "SECURE RECOVERY",

      secureText:
        "ลิงก์สำหรับรีเซ็ตรหัสผ่านจะนำคุณไปยังหน้าตั้งรหัสผ่านใหม่ของ Virtual Herbarium",

      step1: "กรอกอีเมล",

      step1Text: "ใช้อีเมลเดียวกับที่ใช้สมัครสมาชิก",

      step2: "ตรวจสอบอีเมล",

      step2Text: "เปิด Inbox หรือ Spam เพื่อค้นหาลิงก์รีเซ็ต",

      step3: "ตั้งรหัสผ่านใหม่",

      step3Text: "สร้างรหัสผ่านใหม่แล้วกลับเข้าสู่ระบบอีกครั้ง",
    },

    EN: {
      eyebrow: "ACCOUNT RECOVERY",

      forestTitle: "Find your way back to your account",

      forestDescription:
        "If you cannot remember your password, enter the email address connected to your account and we will send you a link to create a new one.",

      title: "Forgot Password",

      subtitle:
        "Enter the email address used for your Virtual Herbarium account to receive a password reset link.",

      email: "Email",

      placeholder: "example@gmail.com",

      send: "Send Reset Link",

      sending: "Sending link...",

      required: "Please enter your email",

      invalid: "Please enter a valid email address",

      successTitle: "Reset link sent",

      success:
        "If this email is connected to an account, a password reset link will be sent. Please check your Inbox and Spam folder.",

      error: "Unable to send password reset link",

      back: "Back to Login",

      anotherEmail: "Use Another Email",

      secure: "SECURE RECOVERY",

      secureText:
        "The password recovery link will take you to the Virtual Herbarium page where you can create a new password.",

      step1: "Enter your email",

      step1Text: "Use the same email address used to create your account",

      step2: "Check your inbox",

      step2Text: "Look in your Inbox or Spam folder for the recovery link",

      step3: "Create a new password",

      step3Text: "Set a new password and sign in again",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     SEND RESET EMAIL
  ===================================================== */

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    /* -----------------------------------------------------
       REQUIRED
    ----------------------------------------------------- */

    if (!cleanEmail) {
      setError(t.required);

      return;
    }

    /* -----------------------------------------------------
       EMAIL FORMAT
    ----------------------------------------------------- */

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      setError(t.invalid);

      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (resetError) {
        console.error("Forgot password error:", resetError);

        throw new Error(resetError.message || t.error);
      }

      /*
       * ใช้ข้อความแบบ generic
       * เพื่อไม่เปิดเผยว่า Email มีบัญชีอยู่หรือไม่
       */

      setSuccess(t.success);

      setEmail("");
    } catch (err) {
      console.error("Forgot password failed:", err);

      setError(err?.message || t.error);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     RESET FORM
  ===================================================== */

  function handleUseAnotherEmail() {
    setSuccess("");
    setError("");
    setEmail("");
  }

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

        {/* FOREST LIGHT */}

        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className={`absolute -top-52 right-[9%] h-[740px] w-28 rotate-[24deg] blur-3xl ${
              darkMode
                ? "bg-gradient-to-b from-emerald-100/10 to-transparent"
                : "bg-gradient-to-b from-white/60 to-transparent"
            }`}
          />

          <div className="forest-particle left-[12%] top-[22%]" />

          <div className="forest-particle left-[35%] top-[65%] [animation-delay:-2s]" />

          <div className="forest-particle right-[20%] top-[30%] [animation-delay:-4s]" />

          <div className="forest-particle right-[8%] top-[68%] [animation-delay:-6s]" />
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="container">
          <div className="grid min-h-[calc(100svh-78px)] items-center gap-12 py-12 lg:grid-cols-[1fr_0.85fr] lg:gap-20 lg:py-16">
            {/* =================================================
                LEFT INTRO
            ================================================= */}

            <div className="hidden max-w-xl lg:block page-enter">
              {/* BADGE */}

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

              {/* TITLE */}

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

              {/* RECOVERY STEPS */}

              <div className="mt-10 space-y-3">
                <RecoveryStep
                  darkMode={darkMode}
                  number="01"
                  icon={<MailIcon className="h-5 w-5" />}
                  title={t.step1}
                  text={t.step1Text}
                />

                <RecoveryStep
                  darkMode={darkMode}
                  number="02"
                  icon={<InboxIcon className="h-5 w-5" />}
                  title={t.step2}
                  text={t.step2Text}
                />

                <RecoveryStep
                  darkMode={darkMode}
                  number="03"
                  icon={<KeyIcon className="h-5 w-5" />}
                  title={t.step3}
                  text={t.step3Text}
                />
              </div>
            </div>

            {/* =================================================
                FORGOT PASSWORD CARD
            ================================================= */}

            <div className="mx-auto w-full max-w-md page-enter">
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
                    ? "border-white/10 bg-[#07130c]/85 shadow-black/40"
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
                  {/* ICON */}

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                      darkMode
                        ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
                        : "border-emerald-800/10 bg-emerald-800/10 text-emerald-800"
                    }`}
                  >
                    <KeyIcon className="h-6 w-6" />
                  </div>

                  {/* HEADER */}

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
                      SUCCESS SCREEN
                  ================================================= */}

                  {success ? (
                    <div className="mt-8">
                      <div
                        className={`rounded-2xl border p-5 ${
                          darkMode
                            ? "border-emerald-400/15 bg-emerald-400/[0.06]"
                            : "border-emerald-200 bg-emerald-50"
                        }`}
                      >
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                            darkMode
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          <CheckIcon className="h-5 w-5" />
                        </div>

                        <h3
                          className={`mt-5 text-lg font-black ${
                            darkMode ? "text-emerald-200" : "text-emerald-900"
                          }`}
                        >
                          {t.successTitle}
                        </h3>

                        <p
                          className={`mt-2 text-sm leading-7 ${
                            darkMode
                              ? "text-emerald-100/70"
                              : "text-emerald-800"
                          }`}
                        >
                          {success}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleUseAnotherEmail}
                        className={`mt-4 flex min-h-12 w-full items-center justify-center rounded-xl border px-5 text-sm font-bold transition ${
                          darkMode
                            ? "border-white/10 bg-white/[0.035] text-gray-200 hover:bg-white/[0.08]"
                            : "border-emerald-950/10 bg-white text-slate-700 hover:bg-emerald-50"
                        }`}
                      >
                        {t.anotherEmail}
                      </button>
                    </div>
                  ) : (
                    /* =================================================
                       FORM
                    ================================================= */

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                      {/* EMAIL */}

                      <div>
                        <label
                          htmlFor="forgot-email"
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
                            id="forgot-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t.placeholder}
                            autoComplete="email"
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

                      {/* SEND */}

                      <button
                        type="submit"
                        disabled={loading}
                        className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(6,78,45,0.28)] transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[0_16px_35px_rgba(6,78,45,0.35)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <LoadingIcon className="h-5 w-5 animate-spin" />

                            {t.sending}
                          </>
                        ) : (
                          <>
                            <SendIcon className="h-5 w-5" />

                            {t.send}
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* =================================================
                      SECURITY
                  ================================================= */}

                  <div
                    className={`mt-7 flex items-start gap-3 rounded-xl p-4 ${
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

                  {/* =================================================
                      BACK TO LOGIN
                  ================================================= */}

                  <div
                    className={`mt-7 border-t pt-6 text-center ${
                      darkMode ? "border-white/10" : "border-emerald-950/10"
                    }`}
                  >
                    <Link
                      href="/login"
                      className={`text-sm font-black transition ${
                        darkMode
                          ? "text-emerald-300 hover:text-emerald-200"
                          : "text-emerald-700 hover:text-emerald-800"
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
   RECOVERY STEP
========================================================= */

function RecoveryStep({ darkMode, number, icon, title, text }) {
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

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <p
            className={`text-sm font-black ${
              darkMode ? "text-white" : "text-[#173321]"
            }`}
          >
            {title}
          </p>

          <span
            className={`text-[9px] font-black tracking-[0.14em] ${
              darkMode ? "text-emerald-400/70" : "text-emerald-700/70"
            }`}
          >
            {number}
          </span>
        </div>

        <p
          className={`mt-1 text-xs leading-5 ${
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

function InboxIcon({ className = "" }) {
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
      <path d="M4 4h16l2 11v5H2v-5Z" />

      <path d="M2 15h6l2 3h4l2-3h6" />
    </svg>
  );
}

function SendIcon({ className = "" }) {
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
      <path d="m22 2-7 20-4-9-9-4Z" />

      <path d="M22 2 11 13" />
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
