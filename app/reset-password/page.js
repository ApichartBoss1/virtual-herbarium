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

/* =========================================================
   PAGE
========================================================= */

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
      eyebrow: "PASSWORD RECOVERY",

      title: "ตั้งรหัสผ่านใหม่",

      subtitle: "กรอกรหัสผ่านใหม่สำหรับบัญชี Virtual Herbarium ของคุณ",

      password: "รหัสผ่านใหม่",

      confirmPassword: "ยืนยันรหัสผ่านใหม่",

      passwordPlaceholder: "อย่างน้อย 6 ตัวอักษร",

      confirmPlaceholder: "กรอกรหัสผ่านใหม่อีกครั้ง",

      save: "บันทึกรหัสผ่านใหม่",

      saving: "กำลังบันทึก...",

      checking: "กำลังตรวจสอบลิงก์รีเซ็ต...",

      required: "กรุณากรอกรหัสผ่านให้ครบทุกช่อง",

      short: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",

      mismatch: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",

      invalidLink: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว",

      success: "เปลี่ยนรหัสผ่านสำเร็จแล้ว",

      successText: "กำลังพาคุณกลับไปหน้าเข้าสู่ระบบ",

      error: "ไม่สามารถเปลี่ยนรหัสผ่านได้",

      login: "กลับเข้าสู่ระบบ",

      forgot: "ขอลิงก์รีเซ็ตรหัสผ่านใหม่",

      showPassword: "แสดงรหัสผ่าน",

      hidePassword: "ซ่อนรหัสผ่าน",

      passwordMatch: "รหัสผ่านตรงกัน",

      passwordNotMatch: "รหัสผ่านยังไม่ตรงกัน",

      secure: "SECURE PASSWORD RESET",

      secureText:
        "หลังจากบันทึกรหัสผ่านใหม่ คุณจะต้องเข้าสู่ระบบอีกครั้งด้วยรหัสผ่านใหม่",
    },

    EN: {
      eyebrow: "PASSWORD RECOVERY",

      title: "Reset Password",

      subtitle: "Enter a new password for your Virtual Herbarium account.",

      password: "New Password",

      confirmPassword: "Confirm New Password",

      passwordPlaceholder: "At least 6 characters",

      confirmPlaceholder: "Enter your new password again",

      save: "Save New Password",

      saving: "Saving...",

      checking: "Checking reset link...",

      required: "Please complete both password fields",

      short: "Password must be at least 6 characters",

      mismatch: "Passwords do not match",

      invalidLink: "The password reset link is invalid or expired.",

      success: "Your password has been changed successfully.",

      successText: "Taking you back to the login page",

      error: "Unable to change your password",

      login: "Back to Login",

      forgot: "Request a new reset link",

      showPassword: "Show password",

      hidePassword: "Hide password",

      passwordMatch: "Passwords match",

      passwordNotMatch: "Passwords do not match",

      secure: "SECURE PASSWORD RESET",

      secureText:
        "After saving your new password, you will need to sign in again using the new password.",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     CHECK RESET SESSION
  ===================================================== */

  useEffect(() => {
    let mounted = true;
    let recoveryDetected = false;

    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, ""),
    );

    const searchParams = new URLSearchParams(window.location.search);

    const urlError = hashParams.get("error") || searchParams.get("error");

    const urlErrorCode =
      hashParams.get("error_code") || searchParams.get("error_code");

    const recoveryType = hashParams.get("type") || searchParams.get("type");

    const hasRecoveryCode = searchParams.has("code");

    /*
     * ถ้า Supabase ส่ง error กลับมา เช่น
     * otp_expired / access_denied
     * ให้หยุดทันที
     */

    if (urlError || urlErrorCode) {
      setError(t.invalidLink);
      setReady(false);
      setLoading(false);

      return;
    }

    /*
     * Implicit flow:
     * #type=recovery
     *
     * PKCE flow:
     * ?code=...
     */

    const hasRecoveryUrl = recoveryType === "recovery" || hasRecoveryCode;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        recoveryDetected = true;

        setError("");
        setReady(true);
        setLoading(false);
      }
    });

    async function checkRecoverySession() {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error("Reset session error:", sessionError);

          setError(t.invalidLink);
          setReady(false);
          setLoading(false);

          return;
        }

        /*
         * สำคัญ:
         * จะไม่ยอมรับ session ปกติที่ผู้ใช้ login ค้างไว้
         *
         * ต้องมีหลักฐานจาก URL ว่าเป็น recovery เท่านั้น
         */

        if (hasRecoveryUrl && data?.session) {
          recoveryDetected = true;

          setError("");
          setReady(true);
          setLoading(false);

          return;
        }

        /*
         * ให้ Supabase มีเวลาประมวลผล
         * PASSWORD_RECOVERY event ก่อน
         */

        window.setTimeout(() => {
          if (!mounted) return;

          if (!recoveryDetected) {
            setError(t.invalidLink);
            setReady(false);
            setLoading(false);
          }
        }, 800);
      } catch (err) {
        console.error("Reset password session check failed:", err);

        if (!mounted) return;

        setError(t.invalidLink);
        setReady(false);
        setLoading(false);
      }
    }

    checkRecoverySession();

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, [t.invalidLink]);

  /* =====================================================
     RESET PASSWORD
  ===================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    /* REQUIRED */

    if (!password || !confirmPassword) {
      setError(t.required);

      return;
    }

    /* LENGTH */

    if (password.length < 6) {
      setError(t.short);

      return;
    }

    /* MATCH */

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
       * Sign out after password reset.
       * User will need to login with the new password.
       */

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login");
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
     PASSWORD STATUS
  ===================================================== */

  const hasConfirmPassword = confirmPassword.length > 0;

  const passwordsMatch =
    password && confirmPassword && password === confirmPassword;

  /* =====================================================
     CLEAR ERROR
  ===================================================== */

  function handlePasswordChange(value) {
    setPassword(value);

    if (error) {
      setError("");
    }
  }

  function handleConfirmPasswordChange(value) {
    setConfirmPassword(value);

    if (error) {
      setError("");
    }
  }

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
              ? "bg-[linear-gradient(180deg,rgba(2,9,5,0.92)_0%,rgba(3,14,7,0.86)_50%,rgba(3,14,7,0.95)_100%)] md:bg-[linear-gradient(90deg,rgba(2,9,5,0.95)_0%,rgba(3,14,7,0.86)_50%,rgba(3,14,7,0.72)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(238,246,236,0.94)_0%,rgba(238,246,236,0.91)_50%,rgba(235,244,233,0.97)_100%)] md:bg-[linear-gradient(90deg,rgba(238,246,236,0.96)_0%,rgba(238,246,236,0.91)_50%,rgba(235,244,233,0.76)_100%)]"
          }`}
        />

        {/* DEPTH */}

        <div
          className={`absolute inset-0 -z-10 ${
            darkMode
              ? "bg-[linear-gradient(180deg,rgba(2,8,4,0.16)_0%,transparent_42%,rgba(2,8,4,0.54)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,transparent_45%,rgba(230,240,228,0.48)_100%)]"
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
          <div className="flex min-h-[calc(100dvh-58px)] items-center justify-center py-6 sm:py-8 md:min-h-[calc(100dvh-78px)] md:py-10 lg:py-12">
            <div className="w-full max-w-[500px] page-enter">
              {/* BADGE */}

              <div className="mb-4 text-center sm:mb-5">
                <div
                  className={`inline-flex min-h-[40px] items-center gap-3 rounded-full border px-4 py-2 backdrop-blur-xl ${
                    darkMode
                      ? "border-emerald-300/20 bg-black/20 text-emerald-200"
                      : "border-emerald-950/15 bg-white/55 text-emerald-900"
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
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
                    ? "border-white/10 bg-[#07130c]/84 shadow-black/40"
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
                      <LockKeyIcon className="h-6 w-6" />
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
                      LOADING
                  ================================================= */}

                  {loading && (
                    <div className="py-12 text-center">
                      <LoadingIcon
                        className={`mx-auto h-9 w-9 animate-spin ${
                          darkMode ? "text-emerald-300" : "text-emerald-700"
                        }`}
                      />

                      <p
                        className={`mt-4 text-sm font-medium ${
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
                    <div className="mt-6 sm:mt-7">
                      <div
                        role="alert"
                        className={`rounded-2xl border p-4 sm:p-5 ${
                          darkMode
                            ? "border-red-400/15 bg-red-400/[0.06]"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                            darkMode
                              ? "bg-red-400/10 text-red-300"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <AlertIcon className="h-5 w-5" />
                        </div>

                        <h2
                          className={`mt-4 text-base font-black ${
                            darkMode ? "text-red-200" : "text-red-800"
                          }`}
                        >
                          {t.invalidLink}
                        </h2>
                      </div>

                      <Link
                        href="/forgot-password"
                        className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(6,78,45,0.24)] transition active:scale-[0.99] hover:-translate-y-0.5 hover:bg-emerald-600"
                      >
                        <RefreshIcon className="h-5 w-5" />

                        {t.forgot}
                      </Link>
                    </div>
                  )}

                  {/* =================================================
                      RESET FORM
                  ================================================= */}

                  {!loading && ready && (
                    <form
                      onSubmit={handleSubmit}
                      aria-busy={saving}
                      className="mt-6 space-y-5 sm:mt-7"
                    >
                      {/* PASSWORD */}

                      <div>
                        <label
                          htmlFor="reset-password"
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
                            id="reset-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) =>
                              handlePasswordChange(event.target.value)
                            }
                            placeholder={t.passwordPlaceholder}
                            autoComplete="new-password"
                            minLength={6}
                            disabled={saving}
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

                        <p
                          className={`mt-1.5 text-[10px] leading-5 ${
                            darkMode ? "text-gray-500" : "text-slate-500"
                          }`}
                        >
                          {t.short}
                        </p>
                      </div>

                      {/* CONFIRM PASSWORD */}

                      <div>
                        <label
                          htmlFor="reset-confirm-password"
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
                            id="reset-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(event) =>
                              handleConfirmPasswordChange(event.target.value)
                            }
                            placeholder={t.confirmPlaceholder}
                            autoComplete="new-password"
                            minLength={6}
                            disabled={saving}
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

                      {/* PASSWORD MATCH */}

                      {hasConfirmPassword && (
                        <div
                          role="status"
                          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 ${
                            passwordsMatch
                              ? darkMode
                                ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-200"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : darkMode
                                ? "border-red-400/15 bg-red-400/[0.05] text-red-200"
                                : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {passwordsMatch ? (
                            <CheckIcon className="h-4 w-4 shrink-0" />
                          ) : (
                            <AlertIcon className="h-4 w-4 shrink-0" />
                          )}

                          <p className="text-xs font-bold">
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
                          aria-live="polite"
                          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                            darkMode
                              ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-200"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />

                          <div>
                            <p className="text-sm font-black">{success}</p>

                            <p className="mt-1 text-xs leading-5 opacity-75">
                              {t.successText}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* SAVE */}

                      <button
                        type="submit"
                        disabled={saving || Boolean(success)}
                        className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(6,78,45,0.28)] transition active:scale-[0.99] hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[0_16px_35px_rgba(6,78,45,0.35)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
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
                    </form>
                  )}

                  {/* =================================================
                      SECURITY
                  ================================================= */}

                  {!loading && ready && (
                    <div
                      className={`mt-5 flex items-start gap-3 rounded-xl p-3.5 sm:mt-6 sm:p-4 ${
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
                    className={`mt-5 border-t pt-5 text-center sm:mt-6 sm:pt-6 ${
                      darkMode ? "border-white/10" : "border-emerald-950/10"
                    }`}
                  >
                    <Link
                      href="/login"
                      className={`inline-flex min-h-9 items-center justify-center text-sm font-black transition ${
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
   ICONS
========================================================= */

function LockKeyIcon({ className = "" }) {
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

      <circle cx="12" cy="15" r="1.2" />

      <path d="M12 16.2V18" />
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

function RefreshIcon({ className = "" }) {
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
      <path d="M20 6v5h-5" />

      <path d="M4 18v-5h5" />

      <path d="M6.1 9a7 7 0 0 1 11.8-2.5L20 11" />

      <path d="M17.9 15a7 7 0 0 1-11.8 2.5L4 13" />
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
