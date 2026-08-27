"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

export default function RegisterPage() {
  const router = useRouter();
  const { language } = useSiteSettings();

  const isEnglish = language === "EN";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const text = {
    TH: {
      badge: "🌿 Virtual Herbarium",
      title: "สมัครสมาชิก",
      subtitle: "สร้างบัญชี Virtual Herbarium ของคุณ",

      username: "ชื่อผู้ใช้",
      usernamePlaceholder: "เช่น herbarium_user",

      email: "อีเมล",
      emailPlaceholder: "example@gmail.com",

      password: "รหัสผ่าน",
      passwordPlaceholder: "ตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร",

      confirmPassword: "ยืนยันรหัสผ่าน",
      confirmPasswordPlaceholder: "พิมพ์รหัสผ่านอีกครั้ง",

      usernameHint: "ใช้ตัวอักษรภาษาอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง",

      passwordHint: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",

      confirmHint: "กรุณาพิมพ์รหัสผ่านด้วยตัวเองอีกครั้ง",

      register: "สมัครสมาชิก",
      registering: "กำลังสมัครสมาชิก...",

      alreadyAccount: "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ",
      back: "กลับหน้าแรก",

      required: "กรุณากรอกข้อมูลให้ครบทุกช่อง",

      usernameLength: "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร",

      usernameInvalid:
        "ชื่อผู้ใช้ใช้ได้เฉพาะภาษาอังกฤษ ตัวเลข จุด ขีดกลาง และขีดล่าง",

      invalidEmail: "กรุณากรอกอีเมลให้ถูกต้อง",

      passwordLength: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",

      passwordMismatch: "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน",

      emailExists: "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ",

      registerFailed: "ไม่สามารถสมัครสมาชิกได้",

      accountCreated: "สมัครสมาชิกสำเร็จ 🎉",

      confirmationSent: "ระบบได้ส่งลิงก์ยืนยันไปยัง",

      confirmationCheck:
        "กรุณาตรวจสอบ Inbox หรือ Spam แล้วกดลิงก์ยืนยันก่อนเข้าสู่ระบบ",

      noConfirmation: "บัญชีถูกสร้างแล้ว สามารถเข้าสู่ระบบได้",

      goLogin: "ไปหน้าเข้าสู่ระบบ",

      passwordMatch: "รหัสผ่านตรงกัน",

      passwordNotMatch: "รหัสผ่านยังไม่ตรงกัน",
    },

    EN: {
      badge: "🌿 Virtual Herbarium",
      title: "Create Account",
      subtitle: "Create your Virtual Herbarium account",

      username: "Username",
      usernamePlaceholder: "e.g. herbarium_user",

      email: "Email",
      emailPlaceholder: "example@gmail.com",

      password: "Password",
      passwordPlaceholder: "Create a password with at least 8 characters",

      confirmPassword: "Confirm Password",
      confirmPasswordPlaceholder: "Type your password again",

      usernameHint:
        "Use English letters, numbers, dots, hyphens or underscores",

      passwordHint: "Password must contain at least 8 characters",

      confirmHint: "Please type your password again manually",

      register: "Create Account",
      registering: "Creating account...",

      alreadyAccount: "Already have an account? Login",

      back: "Back to Home",

      required: "Please complete all fields",

      usernameLength: "Username must be at least 3 characters",

      usernameInvalid:
        "Username may only contain English letters, numbers, dots, hyphens and underscores",

      invalidEmail: "Please enter a valid email address",

      passwordLength: "Password must be at least 8 characters",

      passwordMismatch: "Passwords do not match",

      emailExists: "This email is already registered. Please login.",

      registerFailed: "Unable to create your account",

      accountCreated: "Account created successfully 🎉",

      confirmationSent: "A confirmation link has been sent to",

      confirmationCheck:
        "Please check your Inbox or Spam folder and confirm your email before logging in.",

      noConfirmation: "Your account has been created. You can login now.",

      goLogin: "Go to Login",

      passwordMatch: "Passwords match",

      passwordNotMatch: "Passwords do not match",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  // ==========================================================
  // BLOCK COPY / CUT / PASTE
  // ==========================================================

  function blockClipboard(e) {
    e.preventDefault();
  }

  // ==========================================================
  // REGISTER
  // ==========================================================

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // --------------------------------------------------------
    // REQUIRED
    // --------------------------------------------------------

    if (!cleanUsername || !cleanEmail || !password || !confirmPassword) {
      setError(t.required);
      return;
    }

    // --------------------------------------------------------
    // USERNAME
    // --------------------------------------------------------

    if (cleanUsername.length < 3) {
      setError(t.usernameLength);
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(cleanUsername)) {
      setError(t.usernameInvalid);
      return;
    }

    // --------------------------------------------------------
    // EMAIL
    // --------------------------------------------------------

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(t.invalidEmail);
      return;
    }

    // --------------------------------------------------------
    // PASSWORD
    // --------------------------------------------------------

    if (password.length < 8) {
      setError(t.passwordLength);
      return;
    }

    // --------------------------------------------------------
    // CONFIRM PASSWORD
    // --------------------------------------------------------

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      // ======================================================
      // SUPABASE SIGN UP
      // ======================================================

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,

        options: {
          data: {
            username: cleanUsername,
          },

          // หลังจากกดยืนยัน Email
          // ให้กลับมาหน้า Login
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      // ======================================================
      // DEBUG
      // ======================================================

      console.log("========== VIRTUAL HERBARIUM REGISTER ==========");

      console.log("User:", data?.user);
      console.log("Session:", data?.session);
      console.log("Supabase Error:", signUpError);

      console.log("=================================================");

      // ======================================================
      // SUPABASE ERROR
      // ======================================================

      if (signUpError) {
        const message = signUpError.message || "";

        const lowerMessage = message.toLowerCase();

        console.error("REGISTER ERROR:", signUpError);

        if (
          lowerMessage.includes("already registered") ||
          lowerMessage.includes("already exists") ||
          lowerMessage.includes("user already")
        ) {
          setError(t.emailExists);
        } else {
          // แสดง error จริงจาก Supabase
          setError(`${t.registerFailed}: ${message}`);
        }

        return;
      }

      // ======================================================
      // NO USER
      // ======================================================

      if (!data?.user) {
        setError(t.registerFailed);
        return;
      }

      // ======================================================
      // EMAIL CONFIRMATION ENABLED
      // ======================================================

      if (!data.session) {
        setSuccess(
          `${t.accountCreated} ${t.confirmationSent} ${cleanEmail}. ${t.confirmationCheck}`,
        );

        return;
      }

      // ======================================================
      // EMAIL CONFIRMATION DISABLED
      // ======================================================

      setSuccess(t.noConfirmation);

      setTimeout(() => {
        router.push("/account");
        router.refresh();
      }, 800);
    } catch (err) {
      console.error("REGISTER FAILED:", err);

      setError(err?.message || t.registerFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <Navbar />

      <section className="hero">
        <div className="container">
          <div className="flex min-h-[calc(100vh-80px)] items-center justify-center py-12">
            <div className="w-full max-w-md">
              {/* ==================================================
                  HEADER
              ================================================== */}

              <div className="mb-8 text-center">
                <span className="badge badge-green">{t.badge}</span>

                <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {t.title}
                </h1>

                <p className="mt-3 text-[var(--muted)]">{t.subtitle}</p>
              </div>

              {/* ==================================================
                  CARD
              ================================================== */}

              <div className="card p-6 shadow-xl sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* =================================================
                      USERNAME
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      {t.username}
                    </label>

                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t.usernamePlaceholder}
                      autoComplete="username"
                      maxLength={30}
                      className="input"
                      disabled={loading}
                    />

                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {t.usernameHint}
                    </p>
                  </div>

                  {/* =================================================
                      EMAIL
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      {t.email}
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      autoComplete="email"
                      className="input"
                      disabled={loading}
                    />
                  </div>

                  {/* =================================================
                      PASSWORD
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      {t.password}
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t.passwordPlaceholder}
                        autoComplete="new-password"
                        minLength={8}
                        className="input pr-12"
                        disabled={loading}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-lg opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {t.passwordHint}
                    </p>
                  </div>

                  {/* =================================================
                      CONFIRM PASSWORD
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      {t.confirmPassword}
                    </label>

                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        /*
                         * ห้าม Copy
                         * ห้าม Cut
                         * ห้าม Paste
                         * ห้าม Drag & Drop
                         */

                        onPaste={blockClipboard}
                        onCopy={blockClipboard}
                        onCut={blockClipboard}
                        onDrop={blockClipboard}
                        onContextMenu={blockClipboard}
                        placeholder={t.confirmPasswordPlaceholder}
                        autoComplete="new-password"
                        minLength={8}
                        className="input pr-12"
                        disabled={loading}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-lg opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                      >
                        {showConfirmPassword ? "🙈" : "👁️"}
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {t.confirmHint}
                    </p>
                  </div>

                  {/* =================================================
                      PASSWORD MATCH
                  ================================================= */}

                  {password && confirmPassword && (
                    <div
                      className={`rounded-xl border px-4 py-3 text-sm ${
                        password === confirmPassword
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300"
                          : "border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300"
                      }`}
                    >
                      {password === confirmPassword
                        ? `✓ ${t.passwordMatch}`
                        : `❌ ${t.passwordNotMatch}`}
                    </div>
                  )}

                  {/* =================================================
                      ERROR
                  ================================================= */}

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                      ❌ {error}
                    </div>
                  )}

                  {/* =================================================
                      SUCCESS
                  ================================================= */}

                  {success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
                      <p className="font-bold">{t.accountCreated}</p>

                      <p className="mt-2">{success}</p>

                      <Link
                        href="/login"
                        className="mt-4 inline-flex font-bold underline underline-offset-4"
                      >
                        {t.goLogin} →
                      </Link>
                    </div>
                  )}

                  {/* =================================================
                      REGISTER BUTTON
                  ================================================= */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full justify-center py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? t.registering : `🌿 ${t.register}`}
                  </button>
                </form>

                {/* ==================================================
                    LOGIN
                ================================================== */}

                <div className="mt-6 border-t border-[var(--border)] pt-6 text-center">
                  <Link
                    href="/login"
                    className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    {t.alreadyAccount} →
                  </Link>
                </div>

                {/* ==================================================
                    HOME
                ================================================== */}

                <div className="mt-4 text-center">
                  <Link
                    href="/"
                    className="text-sm text-[var(--muted)] hover:text-emerald-600"
                  >
                    ← {t.back}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
