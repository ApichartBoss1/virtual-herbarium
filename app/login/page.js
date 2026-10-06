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

export default function LoginPage() {
  const router = useRouter();

  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "MEMBER ACCESS",

      forestTitle: "เข้าสู่พื้นที่ของคุณ",

      forestDescription:
        "จัดการตัวอย่างพรรณไม้ บันทึกข้อมูลจากภาคสนาม และร่วมสร้างคลังความรู้ด้านพฤกษศาสตร์",

      title: "เข้าสู่ระบบ",

      subtitle: "เข้าสู่บัญชี Virtual Herbarium ของคุณ",

      email: "อีเมล",

      password: "รหัสผ่าน",

      emailPlaceholder: "example@gmail.com",

      passwordPlaceholder: "กรอกรหัสผ่าน",

      login: "เข้าสู่ระบบ",

      loggingIn: "กำลังเข้าสู่ระบบ...",

      forgot: "ลืมรหัสผ่าน?",

      registerLabel: "ยังไม่มีบัญชี?",

      register: "สมัครสมาชิก",

      required: "กรุณากรอกอีเมลและรหัสผ่าน",

      success: "เข้าสู่ระบบสำเร็จ กำลังพาคุณเข้าสู่บัญชี",

      invalid: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",

      confirm: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",

      back: "กลับหน้าแรก",

      secure: "SECURE ACCESS",

      secureText:
        "ข้อมูลบัญชีของคุณได้รับการจัดการผ่านระบบยืนยันตัวตนที่ปลอดภัย",

      showPassword: "แสดงรหัสผ่าน",

      hidePassword: "ซ่อนรหัสผ่าน",

      collection: "Plant Collection",

      records: "จัดการข้อมูลพรรณไม้ของคุณ",

      field: "Field Records",

      fieldText: "บันทึกข้อมูลตัวอย่างจากภาคสนาม",

      knowledge: "Botanical Knowledge",

      knowledgeText: "ร่วมสร้างคลังความรู้พรรณไม้ดิจิทัล",
    },

    EN: {
      eyebrow: "MEMBER ACCESS",

      forestTitle: "Enter your botanical space",

      forestDescription:
        "Manage plant specimens, preserve field records and contribute to a growing collection of botanical knowledge.",

      title: "Login",

      subtitle: "Sign in to your Virtual Herbarium account",

      email: "Email",

      password: "Password",

      emailPlaceholder: "example@gmail.com",

      passwordPlaceholder: "Enter your password",

      login: "Login",

      loggingIn: "Signing in...",

      forgot: "Forgot password?",

      registerLabel: "Don't have an account?",

      register: "Register",

      required: "Please enter your email and password",

      success: "Login successful. Taking you to your account.",

      invalid: "Invalid email or password",

      confirm: "Please confirm your email before signing in",

      back: "Back to Home",

      secure: "SECURE ACCESS",

      secureText: "Your account is protected through secure authentication.",

      showPassword: "Show password",

      hidePassword: "Hide password",

      collection: "Plant Collection",

      records: "Manage your botanical records",

      field: "Field Records",

      fieldText: "Preserve information from specimen collection",

      knowledge: "Botanical Knowledge",

      knowledgeText: "Contribute to the digital herbarium",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     LOGIN
  ===================================================== */

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

        const message = loginError.message?.toLowerCase().trim();

        if (message?.includes("email not confirmed")) {
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
       * ส่งไปหน้า Account
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
              ? "bg-[linear-gradient(90deg,rgba(2,9,5,0.95)_0%,rgba(3,13,7,0.83)_48%,rgba(3,13,7,0.68)_100%)]"
              : "bg-[linear-gradient(90deg,rgba(238,246,236,0.95)_0%,rgba(238,246,236,0.88)_48%,rgba(235,244,233,0.72)_100%)]"
          }`}
        />

        {/* DEPTH */}

        <div
          className={`absolute inset-0 -z-10 ${
            darkMode
              ? "bg-[linear-gradient(180deg,rgba(2,8,4,0.18)_0%,transparent_40%,rgba(2,8,4,0.48)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,transparent_45%,rgba(230,240,228,0.45)_100%)]"
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

          <div className="forest-particle left-[35%] top-[60%] [animation-delay:-2s]" />

          <div className="forest-particle right-[20%] top-[30%] [animation-delay:-4s]" />

          <div className="forest-particle right-[8%] top-[68%] [animation-delay:-6s]" />
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="container">
          <div className="grid min-h-[calc(100dvh-58px)] items-center gap-8 py-6 sm:py-8 md:min-h-[calc(100dvh-78px)] lg:grid-cols-[1.02fr_0.88fr] lg:gap-16 lg:py-10 xl:gap-20 xl:py-12">
            {/* =================================================
    LEFT INTRO
================================================= */}

            <div className="hidden max-w-[650px] lg:block page-enter">
              {/* MEMBER ACCESS */}

              <div>
                <div
                  className={`inline-flex min-h-[42px] items-center gap-3 rounded-full border px-5 py-2.5 backdrop-blur-xl ${
                    darkMode
                      ? "border-emerald-300/20 bg-black/20 text-emerald-200"
                      : "border-emerald-950/15 bg-white/55 text-emerald-900"
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      darkMode
                        ? "bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.9)]"
                        : "bg-emerald-700"
                    }`}
                  />

                  <span className="text-[10px] font-black tracking-[0.22em]">
                    {t.eyebrow}
                  </span>
                </div>
              </div>

              {/* =================================================
                  TITLE AREA
                  ================================================= */}

              <div className="pt-7">
                <h2
                  className={`max-w-[650px] pb-1 font-black tracking-[-0.035em] ${
                    isEnglish
                      ? "text-5xl leading-[1.08] xl:text-6xl"
                      : "text-[3.15rem] leading-[1.24] xl:text-[3.75rem] xl:leading-[1.22]"
                  } ${darkMode ? "text-white" : "text-[#102218]"}`}
                >
                  {t.forestTitle}
                </h2>

                <p
                  className={`mt-4 max-w-[610px] text-[16px] font-medium leading-[1.85] xl:text-[17px] ${
                    darkMode ? "text-[#bdccc1]" : "text-[#475f4e]"
                  }`}
                >
                  {t.forestDescription}
                </p>
              </div>

              {/* FEATURES */}

              <div className="mt-7 grid max-w-[610px] gap-3">
                <FeatureRow
                  darkMode={darkMode}
                  icon={<LeafIcon className="h-5 w-5" />}
                  title={t.collection}
                  text={t.records}
                />

                <FeatureRow
                  darkMode={darkMode}
                  icon={<DocumentIcon className="h-5 w-5" />}
                  title={t.field}
                  text={t.fieldText}
                />

                <FeatureRow
                  darkMode={darkMode}
                  icon={<BookIcon className="h-5 w-5" />}
                  title={t.knowledge}
                  text={t.knowledgeText}
                />
              </div>
            </div>

            {/* =================================================
                LOGIN PANEL
            ================================================= */}

            <div className="mx-auto w-full max-w-[460px] page-enter">
              {/* MOBILE HEADER */}

              <div className="mb-4 text-center sm:mb-5 lg:hidden">
                <div
                  className={`mx-auto inline-flex items-center gap-3 rounded-full border px-4 py-2 backdrop-blur-xl ${
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
                    {t.eyebrow}
                  </span>
                </div>
              </div>

              {/* CARD */}

              <div
                className={`relative overflow-hidden rounded-[24px] border p-5 shadow-2xl backdrop-blur-2xl min-[390px]:p-6 sm:rounded-[28px] sm:p-7 lg:p-8 ${
                  darkMode
                    ? "border-white/10 bg-[#07130c]/80 shadow-black/40"
                    : "border-white/60 bg-white/75 shadow-emerald-950/15"
                }`}
              >
                {/* GREEN TOP LIGHT */}

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
                    <UserIcon className="h-6 w-6" />
                  </div>

                  {/* TITLE */}

                  <h1
                    className={`mt-5 text-[2rem] font-black tracking-[-0.04em] sm:text-3xl ${
                      darkMode ? "text-white" : "text-[#14271a]"
                    }`}
                  >
                    {t.title}
                  </h1>

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

                  <form
                    onSubmit={handleSubmit}
                    aria-busy={loading}
                    className="mt-6 space-y-5 sm:mt-7"
                  >
                    {/* EMAIL */}

                    <div>
                      <label
                        htmlFor="login-email"
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
                          id="login-email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);

                            if (error) {
                              setError("");
                            }
                          }}
                          placeholder={t.emailPlaceholder}
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

                    {/* PASSWORD */}

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <label
                          htmlFor="login-password"
                          className={`text-sm font-bold ${
                            darkMode ? "text-gray-200" : "text-slate-700"
                          }`}
                        >
                          {t.password}
                        </label>

                        <Link
                          href="/forgot-password"
                          className={`inline-flex min-h-8 items-center text-xs font-bold transition ${
                            darkMode
                              ? "text-emerald-300 hover:text-emerald-200"
                              : "text-emerald-700 hover:text-emerald-800"
                          }`}
                        >
                          {t.forgot}
                        </Link>
                      </div>

                      <div className="relative">
                        <LockIcon
                          className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                            darkMode ? "text-gray-500" : "text-slate-400"
                          }`}
                        />

                        <input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);

                            if (error) {
                              setError("");
                            }
                          }}
                          placeholder={t.passwordPlaceholder}
                          autoComplete="current-password"
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
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={
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

                    {/* LOGIN */}

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(6,78,45,0.28)] transition active:scale-[0.99] hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[0_16px_35px_rgba(6,78,45,0.35)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <LoadingIcon className="h-5 w-5 animate-spin" />

                          {t.loggingIn}
                        </>
                      ) : (
                        <>
                          <LoginIcon className="h-5 w-5" />

                          {t.login}
                        </>
                      )}
                    </button>
                  </form>

                  {/* =================================================
                      REGISTER
                  ================================================= */}

                  <div
                    className={`mt-6 border-t pt-5 sm:mt-7 sm:pt-6 ${
                      darkMode ? "border-white/10" : "border-emerald-950/10"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 whitespace-nowrap text-center">
                      <span
                        className={`text-sm ${
                          darkMode ? "text-gray-500" : "text-slate-500"
                        }`}
                      >
                        {t.registerLabel}
                      </span>

                      <Link
                        href="/register"
                        className={`text-sm font-black transition ${
                          darkMode
                            ? "text-emerald-300 hover:text-emerald-200"
                            : "text-emerald-700 hover:text-emerald-800"
                        }`}
                      >
                        {t.register}
                      </Link>
                    </div>
                  </div>

                  {/* =================================================
                      SECURITY
                  ================================================= */}

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

                  {/* HOME */}

                  <div className="mt-4 text-center sm:mt-5">
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
   FEATURE ROW
========================================================= */

function FeatureRow({ darkMode, icon, title, text }) {
  return (
    <div
      className={`flex min-h-[72px] items-center gap-4 rounded-2xl border p-4 backdrop-blur-xl ${
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

function LoginIcon({ className = "" }) {
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
      <path d="M10 17l5-5-5-5" />

      <path d="M15 12H3" />

      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
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

function DocumentIcon({ className = "" }) {
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
      <path d="M6 3h8l4 4v14H6z" />

      <path d="M14 3v5h5" />

      <path d="M9 13h6" />

      <path d="M9 17h6" />
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
