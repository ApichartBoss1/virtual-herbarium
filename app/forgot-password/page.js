"use client";

import Link from "next/link";
import { useState } from "react";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

export default function ForgotPasswordPage() {
  const { language } = useSiteSettings();

  const isEnglish = language === "EN";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const text = {
    TH: {
      title: "ลืมรหัสผ่าน",
      subtitle:
        "กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ",

      email: "อีเมล",
      placeholder: "example@gmail.com",

      send: "ส่งลิงก์รีเซ็ตรหัสผ่าน",
      sending: "กำลังส่ง...",

      required: "กรุณากรอกอีเมล",

      invalid: "กรุณากรอกอีเมลให้ถูกต้อง",

      success: "ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว กรุณาตรวจสอบอีเมลของคุณ",

      error: "ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้",

      back: "กลับเข้าสู่ระบบ",
    },

    EN: {
      title: "Forgot Password",
      subtitle:
        "Enter the email address you used to register. We will send you a password reset link.",

      email: "Email",
      placeholder: "example@gmail.com",

      send: "Send Reset Link",
      sending: "Sending...",

      required: "Please enter your email",

      invalid: "Please enter a valid email address",

      success: "Password reset link sent. Please check your email.",

      error: "Unable to send password reset link",

      back: "Back to Login",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(t.required);
      return;
    }

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

      setSuccess(t.success);
      setEmail("");
    } catch (err) {
      console.error("Forgot password failed:", err);

      setError(err?.message || t.error);
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

                <p className="mt-3 leading-7 text-[var(--muted)]">
                  {t.subtitle}
                </p>
              </div>

              {/* CARD */}

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
                      placeholder={t.placeholder}
                      autoComplete="email"
                      className="input"
                      disabled={loading}
                    />
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

                  {/* BUTTON */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full justify-center py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? t.sending : `✉️ ${t.send}`}
                  </button>
                </form>

                {/* BACK */}

                <div className="mt-6 border-t border-[var(--border)] pt-6 text-center">
                  <Link
                    href="/login"
                    className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
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
