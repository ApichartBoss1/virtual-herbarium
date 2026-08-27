"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

export default function LoginPage() {
  const router = useRouter();
  const { language } = useSiteSettings();

  const isEnglish = language === "EN";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const text = {
    TH: {
      title: "เข้าสู่ระบบ",
      subtitle: "เข้าสู่ระบบ Virtual Herbarium ของคุณ",

      email: "อีเมล",
      password: "รหัสผ่าน",

      emailPlaceholder: "example@gmail.com",
      passwordPlaceholder: "กรอกรหัสผ่าน",

      login: "เข้าสู่ระบบ",
      loggingIn: "กำลังเข้าสู่ระบบ...",

      forgot: "ลืมรหัสผ่าน?",
      register: "ยังไม่มีบัญชี? สมัครสมาชิก",

      required: "กรุณากรอกอีเมลและรหัสผ่าน",

      success: "เข้าสู่ระบบสำเร็จ",

      invalid: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",

      confirm: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",

      back: "กลับหน้าแรก",
    },

    EN: {
      title: "Login",
      subtitle: "Sign in to your Virtual Herbarium account",

      email: "Email",
      password: "Password",

      emailPlaceholder: "example@gmail.com",
      passwordPlaceholder: "Enter your password",

      login: "Login",
      loggingIn: "Signing in...",

      forgot: "Forgot password?",
      register: "Don't have an account? Register",

      required: "Please enter your email and password",

      success: "Login successful",

      invalid: "Invalid email or password",

      confirm: "Please confirm your email before signing in",

      back: "Back to Home",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError(t.required);
      return;
    }

    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        console.error("Login error:", loginError);

        if (loginError.message?.toLowerCase().includes("email not confirmed")) {
          throw new Error(t.confirm);
        }

        throw new Error(t.invalid);
      }

      if (!data?.user) {
        throw new Error(t.invalid);
      }

      setSuccess(t.success);

      /*
       * Login สำเร็จ
       * ส่งผู้ใช้ไปหน้า Account
       */
      setTimeout(() => {
        router.push("/account");
        router.refresh();
      }, 500);
    } catch (err) {
      console.error("Login failed:", err);

      setError(err?.message || t.invalid);
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
              {/* HEADER */}

              <div className="mb-8 text-center">
                <span className="badge badge-green">🔐 Virtual Herbarium</span>

                <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {t.title}
                </h1>

                <p className="mt-3 text-[var(--muted)]">{t.subtitle}</p>
              </div>

              {/* LOGIN CARD */}

              <div className="card p-6 shadow-xl sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* EMAIL */}

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
                      required
                    />
                  </div>

                  {/* PASSWORD */}

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-semibold">
                        {t.password}
                      </label>

                      <Link
                        href="/forgot-password"
                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                      >
                        {t.forgot}
                      </Link>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t.passwordPlaceholder}
                        autoComplete="current-password"
                        className="input pr-12"
                        disabled={loading}
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-lg opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  {/* ERROR */}

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                      ❌ {error}
                    </div>
                  )}

                  {/* SUCCESS */}

                  {success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
                      ✅ {success}
                    </div>
                  )}

                  {/* LOGIN BUTTON */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full justify-center py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? t.loggingIn : `🔐 ${t.login}`}
                  </button>
                </form>

                {/* REGISTER */}

                <div className="mt-6 border-t border-[var(--border)] pt-6 text-center">
                  <Link
                    href="/register"
                    className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    {t.register} →
                  </Link>
                </div>

                {/* HOME */}

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
