"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { language } = useSiteSettings();

  const isEnglish = language === "EN";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const text = {
    TH: {
      title: "ตั้งรหัสผ่านใหม่",
      subtitle: "กรอกรหัสผ่านใหม่สำหรับบัญชี Virtual Herbarium ของคุณ",

      password: "รหัสผ่านใหม่",
      confirmPassword: "ยืนยันรหัสผ่านใหม่",

      passwordPlaceholder: "กรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร",

      confirmPlaceholder: "กรอกรหัสผ่านใหม่อีกครั้ง",

      save: "บันทึกรหัสผ่านใหม่",
      saving: "กำลังบันทึก...",

      required: "กรุณากรอกรหัสผ่านให้ครบทุกช่อง",

      short: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",

      mismatch: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",

      invalidLink: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว",

      success: "เปลี่ยนรหัสผ่านสำเร็จแล้ว",

      error: "ไม่สามารถเปลี่ยนรหัสผ่านได้",

      login: "กลับเข้าสู่ระบบ",

      forgot: "ขอลิงก์รีเซ็ตรหัสผ่านใหม่",
    },

    EN: {
      title: "Reset Password",
      subtitle: "Enter a new password for your Virtual Herbarium account.",

      password: "New Password",
      confirmPassword: "Confirm New Password",

      passwordPlaceholder: "At least 6 characters",

      confirmPlaceholder: "Enter your new password again",

      save: "Save New Password",
      saving: "Saving...",

      required: "Please complete both password fields",

      short: "Password must be at least 6 characters",

      mismatch: "Passwords do not match",

      invalidLink: "The password reset link is invalid or expired.",

      success: "Your password has been changed successfully.",

      error: "Unable to change your password",

      login: "Back to Login",

      forgot: "Request a new reset link",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error("Reset session error:", sessionError);

          setError(t.invalidLink);

          setLoading(false);
          return;
        }

        if (!data?.session) {
          setError(t.invalidLink);

          setLoading(false);
          return;
        }

        setReady(true);
        setLoading(false);
      } catch (err) {
        console.error("Reset password session check failed:", err);

        if (!mounted) return;

        setError(t.invalidLink);

        setLoading(false);
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [t.invalidLink]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError(t.required);
      return;
    }

    if (password.length < 6) {
      setError(t.short);
      return;
    }

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
                {/* LOADING */}

                {loading && (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />

                    <p className="text-sm text-[var(--muted)]">
                      {isEnglish
                        ? "Checking reset link..."
                        : "กำลังตรวจสอบลิงก์รีเซ็ต..."}
                    </p>
                  </div>
                )}

                {/* INVALID LINK */}

                {!loading && !ready && (
                  <div className="text-center">
                    <div className="text-5xl">⚠️</div>

                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                      ❌ {error}
                    </div>

                    <Link
                      href="/forgot-password"
                      className="btn btn-primary mt-6 w-full justify-center"
                    >
                      {t.forgot}
                    </Link>
                  </div>
                )}

                {/* RESET FORM */}

                {!loading && ready && (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* PASSWORD */}

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
                          className="input pr-12"
                          disabled={saving}
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-lg opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                        >
                          {showPassword ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>

                    {/* CONFIRM PASSWORD */}

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        {t.confirmPassword}
                      </label>

                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t.confirmPlaceholder}
                          autoComplete="new-password"
                          className="input pr-12"
                          disabled={saving}
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

                    {/* SAVE */}

                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary w-full justify-center py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? t.saving : `🔐 ${t.save}`}
                    </button>
                  </form>
                )}

                {/* LOGIN */}

                <div className="mt-6 border-t border-[var(--border)] pt-6 text-center">
                  <Link
                    href="/login"
                    className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    ← {t.login}
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
