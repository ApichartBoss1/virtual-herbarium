"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   FOREST BACKGROUND
========================================================= */

const FOREST_IMAGE =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=90";

export default function ResetPasswordPage() {
  const router = useRouter();

  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [ready, setReady] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "ACCOUNT RECOVERY",

      forestTitle: "สร้างกุญแจใหม่สำหรับบัญชีของคุณ",

      forestDescription:
        "ตั้งรหัสผ่านใหม่เพื่อกลับเข้าสู่พื้นที่ส่วนตัวของ Virtual Herbarium และจัดการข้อมูลพรรณไม้ของคุณต่อได้อย่างปลอดภัย",

      title: "ตั้งรหัสผ่านใหม่",

      subtitle: "กำหนดรหัสผ่านใหม่สำหรับบัญชี Virtual Herbarium",

      password: "รหัสผ่านใหม่",

      confirmPassword: "ยืนยันรหัสผ่านใหม่",

      passwordPlaceholder: "รหัสผ่านอย่างน้อย 8 ตัวอักษร",

      confirmPlaceholder: "พิมพ์รหัสผ่านใหม่อีกครั้ง",

      passwordHint: "ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร",

      confirmHint: "กรอกรหัสผ่านเดิมอีกครั้งเพื่อยืนยัน",

      save: "บันทึกรหัสผ่านใหม่",

      saving: "กำลังบันทึก...",

      checking: "กำลังตรวจสอบลิงก์รีเซ็ต...",

      required: "กรุณากรอกรหัสผ่านให้ครบทั้งสองช่อง",

      short: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",

      mismatch: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",

      match: "รหัสผ่านตรงกัน",

      invalidLink: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว",

      success: "เปลี่ยนรหัสผ่านสำเร็จ กำลังพาคุณกลับไปเข้าสู่ระบบ",

      error: "ไม่สามารถเปลี่ยนรหัสผ่านได้",

      login: "กลับไปหน้าเข้าสู่ระบบ",

      forgot: "ขอลิงก์รีเซ็ตรหัสผ่านใหม่",

      invalidTitle: "ไม่สามารถใช้ลิงก์นี้ได้",

      invalidDescription:
        "ลิงก์สำหรับตั้งรหัสผ่านใหม่อาจหมดอายุ ถูกใช้งานไปแล้ว หรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่อีกครั้ง",

      secure: "SECURE PASSWORD RESET",

      secureText:
        "เมื่อเปลี่ยนรหัสผ่านสำเร็จ ระบบจะออกจากบัญชีและให้คุณเข้าสู่ระบบใหม่ด้วยรหัสผ่านที่เพิ่งตั้ง",

      feature1: "Secure Access",

      feature1Text: "สร้างรหัสผ่านใหม่สำหรับบัญชีของคุณ",

      feature2: "Protected Records",

      feature2Text: "กลับมาจัดการข้อมูลพรรณไม้ของคุณอย่างปลอดภัย",

      feature3: "Fresh Session",

      feature3Text: "เข้าสู่ระบบใหม่หลังตั้งรหัสผ่านเรียบร้อยแล้ว",
    },

    EN: {
      eyebrow: "ACCOUNT RECOVERY",

      forestTitle: "Create a new key for your account",

      forestDescription:
        "Set a new password to return to your Virtual Herbarium workspace and continue managing your botanical records securely.",

      title: "Reset Password",

      subtitle: "Create a new password for your Virtual Herbarium account.",

      password: "New Password",

      confirmPassword: "Confirm New Password",

      passwordPlaceholder: "At least 8 characters",

      confirmPlaceholder: "Enter your new password again",

      passwordHint: "Use a password with at least 8 characters",

      confirmHint: "Enter the same password again to confirm it",

      save: "Save New Password",

      saving: "Saving...",

      checking: "Checking reset link...",

      required: "Please complete both password fields",

      short: "Password must be at least 8 characters",

      mismatch: "Passwords do not match",

      match: "Passwords match",

      invalidLink: "The password reset link is invalid or expired.",

      success: "Password changed successfully. Taking you back to login.",

      error: "Unable to change your password",

      login: "Back to Login",

      forgot: "Request a New Reset Link",

      invalidTitle: "This link cannot be used",

      invalidDescription:
        "The password reset link may have expired, already been used, or be invalid. Please request a new reset link.",

      secure: "SECURE PASSWORD RESET",

      secureText:
        "After your password is changed, you will be signed out and asked to sign in again with your new password.",

      feature1: "Secure Access",

      feature1Text: "Create a new password for your account",

      feature2: "Protected Records",

      feature2Text: "Return securely to your botanical records",

      feature3: "Fresh Session",

      feature3Text: "Sign in again after your password has been changed",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     CHECK RECOVERY SESSION
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      setLoading(true);
      setError("");

      try {
        /*
         * เมื่อผู้ใช้กดลิงก์ Recovery จาก Email
         * Supabase จะสร้าง recovery session ให้กับหน้าเว็บ
         */

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error("Reset session error:", sessionError);

          setReady(false);
          setError(t.invalidLink);

          return;
        }

        if (!data?.session) {
          setReady(false);
          setError(t.invalidLink);

          return;
        }

        setReady(true);
      } catch (err) {
        console.error("Reset password session check failed:", err);

        if (!mounted) {
          return;
        }

        setReady(false);

        setError(t.invalidLink);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [language]);

  /* =====================================================
     SAVE NEW PASSWORD
  ===================================================== */

  async function handleSubmit(e) {
    e.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    /* -----------------------------------------------------
       REQUIRED
    ----------------------------------------------------- */

    if (!password || !confirmPassword) {
      setError(t.required);

      return;
    }

    /* -----------------------------------------------------
       PASSWORD LENGTH
    ----------------------------------------------------- */

    if (password.length < 8) {
      setError(t.short);

      return;
    }

    /* -----------------------------------------------------
       PASSWORD MATCH
    ----------------------------------------------------- */

    if (password !== confirmPassword) {
      setError(t.mismatch);

      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error("Update password error:", updateError);

        throw new Error(updateError.message || t.error);
      }

      setSuccess(t.success);

      setPassword("");
      setConfirmPassword("");

      /*
       * หลังเปลี่ยนรหัสผ่าน
       * ออกจาก session ปัจจุบัน
       * แล้วให้ผู้ใช้ Login ใหม่
       */

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error("Sign out after password reset error:", signOutError);
      }

      setTimeout(() => {
        router.push("/login");

        router.refresh();
      }, 1200);
    } catch (err) {
      console.error("Reset password failed:", err);

      setError(err?.message || t.error);
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     PASSWORD MATCH STATE
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

          <div className="forest-particle left-[12%] top-[22%]" />

          <div className="forest-particle left-[36%] top-[64%] [animation-delay:-2s]" />

          <div className="forest-particle right-[20%] top-[30%] [animation-delay:-4s]" />

          <div className="forest-particle right-[8%] top-[67%] [animation-delay:-6s]" />
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="container">
          <div className="grid min-h-[calc(100svh-78px)] items-center gap-12 py-12 lg:grid-cols-[1fr_0.85fr] lg:gap-20 lg:py-16">
            {/* =================================================
                LEFT
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

              <div className="mt-10 space-y-3">
                <FeatureRow
                  darkMode={darkMode}
                  icon={<LockIcon className="h-5 w-5" />}
                  title={t.feature1}
                  text={t.feature1Text}
                />

                <FeatureRow
                  darkMode={darkMode}
                  icon={<LeafIcon className="h-5 w-5" />}
                  title={t.feature2}
                  text={t.feature2Text}
                />

                <FeatureRow
                  darkMode={darkMode}
                  icon={<RefreshIcon className="h-5 w-5" />}
                  title={t.feature3}
                  text={t.feature3Text}
                />
              </div>
            </div>

            {/* =================================================
                RESET CARD
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
                  {/* HEADER */}

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                      darkMode
                        ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
                        : "border-emerald-800/10 bg-emerald-800/10 text-emerald-800"
                    }`}
                  >
                    <KeyIcon className="h-6 w-6" />
                  </div>

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
                      LOADING
                  ================================================= */}

                  {loading && (
                    <div className="py-12 text-center">
                      <div
                        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
                          darkMode
                            ? "bg-emerald-400/[0.07] text-emerald-300"
                            : "bg-emerald-800/[0.07] text-emerald-800"
                        }`}
                      >
                        <LoadingIcon className="h-6 w-6 animate-spin" />
                      </div>

                      <p
                        className={`mt-5 text-sm ${
                          darkMode ? "text-gray-400" : "text-slate-500"
                        }`}
                      >
                        {t.checking}
                      </p>
                    </div>
                  )}

                  {/* =================================================
                      INVALID LINK
                  ================================================= */}

                  {!loading && !ready && (
                    <div className="pt-8">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                          darkMode
                            ? "bg-red-400/10 text-red-300"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        <AlertIcon className="h-6 w-6" />
                      </div>

                      <h3
                        className={`mt-5 text-xl font-black ${
                          darkMode ? "text-white" : "text-[#14271a]"
                        }`}
                      >
                        {t.invalidTitle}
                      </h3>

                      <p
                        className={`mt-3 text-sm leading-7 ${
                          darkMode ? "text-gray-400" : "text-slate-500"
                        }`}
                      >
                        {error || t.invalidDescription}
                      </p>

                      <Link
                        href="/forgot-password"
                        className="mt-7 flex min-h-[50px] w-full items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-600"
                      >
                        {t.forgot}
                      </Link>
                    </div>
                  )}

                  {/* =================================================
                      FORM
                  ================================================= */}

                  {!loading && ready && (
                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                      {/* NEW PASSWORD */}

                      <div>
                        <label
                          htmlFor="new-password"
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
                            id="new-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t.passwordPlaceholder}
                            autoComplete="new-password"
                            minLength={8}
                            disabled={saving}
                            required
                            className={`${inputClass(darkMode)} pr-12`}
                          />

                          <PasswordButton
                            darkMode={darkMode}
                            visible={showPassword}
                            onClick={() =>
                              setShowPassword((current) => !current)
                            }
                          />
                        </div>

                        <p
                          className={`mt-2 text-xs ${
                            darkMode ? "text-gray-500" : "text-slate-500"
                          }`}
                        >
                          {t.passwordHint}
                        </p>
                      </div>

                      {/* CONFIRM */}

                      <div>
                        <label
                          htmlFor="confirm-new-password"
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
                            id="confirm-new-password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t.confirmPlaceholder}
                            autoComplete="new-password"
                            minLength={8}
                            disabled={saving}
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

                        <p
                          className={`mt-2 text-xs ${
                            darkMode ? "text-gray-500" : "text-slate-500"
                          }`}
                        >
                          {t.confirmHint}
                        </p>
                      </div>

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
                            {passwordsMatch ? t.match : t.mismatch}
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
                          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                            darkMode
                              ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-200"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />

                          <p className="text-sm leading-6">{success}</p>
                        </div>
                      )}

                      {/* SAVE */}

                      <button
                        type="submit"
                        disabled={saving || Boolean(success)}
                        className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(6,78,45,0.28)] transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[0_16px_35px_rgba(6,78,45,0.35)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                      >
                        {saving ? (
                          <>
                            <LoadingIcon className="h-5 w-5 animate-spin" />

                            {t.saving}
                          </>
                        ) : (
                          <>
                            <KeyIcon className="h-5 w-5" />

                            {t.save}
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* =================================================
                      SECURITY NOTE
                  ================================================= */}

                  {!loading && ready && (
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
                  )}

                  {/* =================================================
                      LOGIN
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
                      {t.login}
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

function RefreshIcon({ className = "" }) {
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
      <path d="M20 11a8.1 8.1 0 0 0-14.9-3.9L3 10" />
      <path d="M3 4v6h6" />

      <path d="M4 13a8.1 8.1 0 0 0 14.9 3.9L21 14" />
      <path d="M21 20v-6h-6" />
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
