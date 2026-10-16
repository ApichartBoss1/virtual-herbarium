"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import BioHeroLazy from "@/components/BioHeroLazy";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   PLATE IMAGE
========================================================= */

const FOREST_IMAGE =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=90";

export default function LoginPage() {
  const router = useRouter();

  const { language } = useSiteSettings();
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
      eyebrow: "สำหรับผู้ดูแลระบบ",

      forestTitle: "พื้นที่จัดการคลังพรรณไม้",

      forestDescription:
        "บริหารจัดการข้อมูลตัวอย่างพรรณไม้ บันทึกข้อมูลภาคสนาม และดูแลคลังความรู้ด้านพฤกษศาสตร์",

      title: "เข้าสู่ระบบผู้ดูแล",
      subtitle: "สำหรับผู้ดูแลระบบ Virtual Herbarium เท่านั้น",

      email: "อีเมล",
      password: "รหัสผ่าน",
      emailPlaceholder: "อีเมลผู้ดูแลระบบ",
      passwordPlaceholder: "กรอกรหัสผ่าน",

      login: "เข้าสู่ระบบผู้ดูแล",
      loggingIn: "กำลังเข้าสู่ระบบ...",

      required: "กรุณากรอกอีเมลและรหัสผ่าน",
      success: "ยืนยันสิทธิ์ผู้ดูแลสำเร็จ กำลังเปิดหน้าจัดการ",
      invalid: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      unauthorized: "บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ",
      confirm: "กรุณายืนยันอีเมลผู้ดูแลก่อนเข้าสู่ระบบ",

      back: "กลับหน้าแรก",

      secure: "สำหรับผู้ดูแลเท่านั้น",
      secureText: "ระบบนี้อนุญาตเฉพาะบัญชีที่ได้รับสิทธิ์ผู้ดูแลระบบเท่านั้น",

      showPassword: "แสดงรหัสผ่าน",
      hidePassword: "ซ่อนรหัสผ่าน",

      collection: "คลังพรรณไม้",
      records: "เพิ่ม แก้ไข และจัดการข้อมูลพรรณไม้",

      field: "ข้อมูลภาคสนาม",
      fieldText: "บันทึกข้อมูลตัวอย่างจากภาคสนาม",

      knowledge: "องค์ความรู้พฤกษศาสตร์",
      knowledgeText: "ดูแลคลังความรู้พรรณไม้ดิจิทัล",
    },

    EN: {
      eyebrow: "ADMIN ACCESS",

      forestTitle: "Your botanical control center",

      forestDescription:
        "Manage plant specimens, preserve field records, and maintain the botanical knowledge collection.",

      title: "Admin Login",
      subtitle: "Authorized Virtual Herbarium administrator only",

      email: "Email",
      password: "Password",
      emailPlaceholder: "Admin email",
      passwordPlaceholder: "Enter your password",

      login: "Admin Login",
      loggingIn: "Signing in...",

      required: "Please enter your email and password",
      success: "Administrator verified. Opening the dashboard.",
      invalid: "Invalid email or password",
      unauthorized: "This account does not have administrator access.",
      confirm: "Please confirm the administrator email before signing in",

      back: "Back to Home",

      secure: "ADMIN-ONLY ACCESS",
      secureText:
        "Only accounts with administrator privileges can access the dashboard.",

      showPassword: "Show password",
      hidePassword: "Hide password",

      collection: "Plant Collection",
      records: "Add, edit, and manage plant records",

      field: "Field Records",
      fieldText: "Preserve information from specimen collection",

      knowledge: "Botanical Knowledge",
      knowledgeText: "Maintain the digital herbarium",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     ADMIN LOGIN
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

      /*
       * ตรวจสอบผู้ใช้กับ Supabase Auth อีกครั้ง
       *
       * สิทธิ์ admin ต้องอยู่ใน app_metadata
       * ซึ่งกำหนดโดยผู้ดูแลโปรเจกต์ฝั่งเซิร์ฟเวอร์
       *
       * ห้ามใช้ user_metadata หรือเช็คแค่อีเมล
       */

      const { data: verifiedData, error: verifyError } =
        await supabase.auth.getUser();

      if (
        verifyError ||
        !verifiedData?.user ||
        verifiedData.user.id !== data.user.id ||
        verifiedData.user.app_metadata?.role !== "admin"
      ) {
        await supabase.auth.signOut();

        throw new Error(t.unauthorized);
      }

      /*
       * ยืนยันสิทธิ์ Admin สำเร็จ
       */

      setSuccess(t.success);

      setTimeout(() => {
        router.replace("/account");
        router.refresh();
      }, 500);
    } catch (err) {
      console.error("Admin login failed:", err);

      setError(err?.message || t.invalid);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     PAGE
  ===================================================== */

  const features = [
    { icon: LeafIcon, title: t.collection, text: t.records },
    { icon: DocumentIcon, title: t.field, text: t.fieldText },
    { icon: BookIcon, title: t.knowledge, text: t.knowledgeText },
  ];

  return (
    <main className="page overflow-x-hidden">
      <Navbar />

      <section className="vh-container py-8 md:py-12 lg:py-16">
        <div className="grid items-stretch gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 xl:gap-20">
          {/* =================================================
              LEFT – HERBARIUM PLATE
          ================================================= */}

          <aside className="page-enter hidden min-w-0 flex-col lg:flex">
            <figure className="vh-sheet flex flex-1 flex-col p-3">
              <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-[3px] bg-paper-deep">
                <img
                  src={FOREST_IMAGE}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-7 xl:p-9">
                  <p
                    className={`text-white/75 ${
                      isEnglish
                        ? "font-mono text-[11px] uppercase tracking-[0.16em]"
                        : "text-[13px]"
                    }`}
                  >
                    {t.eyebrow}
                  </p>

                  <h2
                    className={`mt-3 max-w-[520px] font-serif text-[2.4rem] text-white xl:text-[2.8rem] ${
                      isEnglish ? "leading-[1.08]" : "leading-[1.3]"
                    }`}
                  >
                    {t.forestTitle}
                  </h2>

                  <p className="mt-3 max-w-[480px] text-[15px] leading-relaxed text-white/80">
                    {t.forestDescription}
                  </p>
                </div>
              </div>

              {/* CAPTION – herbarium label */}

              <figcaption className="vh-label-card mt-3">
                <dl className="relative grid grid-cols-3 gap-4">
                  {features.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className={`min-w-0 ${
                          index > 0 ? "border-l border-dashed border-rule-strong pl-4" : ""
                        }`}
                      >
                        <dt className="flex items-center gap-2 text-[13px] font-medium text-ink">
                          <Icon className="h-4 w-4 shrink-0 text-moss" />
                          <span className="min-w-0">{item.title}</span>
                        </dt>

                        <dd className="mt-1 text-[12px] leading-snug text-muted">
                          {item.text}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </figcaption>
            </figure>
          </aside>

          {/* =================================================
              RIGHT – ADMIN LOGIN
          ================================================= */}

          <div className="page-enter flex min-w-0 items-center">
            <div className="mx-auto w-full max-w-[440px]">
              <div className="relative">
                {/* Seed-head drawing behind the card – stops at the card's bottom edge */}
                <div className="pointer-events-none absolute -inset-x-[30%] -top-[20%] bottom-0 hidden md:block">
                  <BioHeroLazy variant="phyllotaxis" minWidth={768} opacity={0.55} />
                </div>

                <div className="vh-sheet relative p-6 min-[390px]:p-7 md:p-9">
                  <p className="vh-eyebrow flex items-center gap-3">
                    <span className="h-px w-6 bg-ochre" />
                    {t.eyebrow}
                  </p>

                  <h1
                    className={`vh-display mt-4 text-[2.2rem] md:text-[2.5rem] ${
                      isEnglish ? "" : "!leading-[1.3]"
                    }`}
                  >
                    {t.title}
                  </h1>

                  <p className="mt-2 text-[14px] leading-relaxed text-muted">
                    {t.subtitle}
                  </p>

                  <div className="vh-rule-double mt-6" />

                  {/* =================================================
                      ADMIN LOGIN FORM
                  ================================================= */}

                  <form
                    onSubmit={handleSubmit}
                    aria-busy={loading}
                    className="mt-6 space-y-5"
                  >
                    {/* EMAIL */}

                    <div>
                      <label htmlFor="login-email" className="vh-field-label">
                        {t.email}
                      </label>

                      <div className="relative">
                        <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-faint" />

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
                          className="vh-input !pl-11"
                        />
                      </div>
                    </div>

                    {/* PASSWORD */}

                    <div>
                      <label htmlFor="login-password" className="vh-field-label">
                        {t.password}
                      </label>

                      <div className="relative">
                        <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-faint" />

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
                          className="vh-input !pl-11 !pr-12"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={showPassword ? t.hidePassword : t.showPassword}
                          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-faint transition-colors hover:bg-moss-soft hover:text-ink"
                        >
                          {showPassword ? (
                            <EyeOffIcon className="h-[18px] w-[18px]" />
                          ) : (
                            <EyeIcon className="h-[18px] w-[18px]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ERROR */}

                    {error && (
                      <div
                        role="alert"
                        className="flex items-start gap-3 rounded-[4px] border border-clay/40 bg-clay-soft px-4 py-3 text-clay"
                      >
                        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />

                        <p className="text-[14px] leading-6">{error}</p>
                      </div>
                    )}

                    {/* SUCCESS */}

                    {success && (
                      <div
                        role="status"
                        className="flex items-start gap-3 rounded-[4px] border border-moss/30 bg-moss-soft px-4 py-3 text-moss"
                      >
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />

                        <p className="text-[14px] leading-6">{success}</p>
                      </div>
                    )}

                    {/* ADMIN LOGIN BUTTON */}

                    <button
                      type="submit"
                      disabled={loading}
                      className="vh-btn vh-btn-primary w-full !min-h-[48px]"
                    >
                      {loading ? (
                        <>
                          <LoadingIcon className="h-[18px] w-[18px] animate-spin" />
                          {t.loggingIn}
                        </>
                      ) : (
                        <>
                          <LoginIcon className="h-[18px] w-[18px]" />
                          {t.login}
                        </>
                      )}
                    </button>
                  </form>

                  {/* =================================================
                      ADMIN SECURITY
                  ================================================= */}

                  <div className="mt-7 flex items-start gap-3 border-t border-dashed border-rule-strong pt-5">
                    <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />

                    <div>
                      <p className="vh-eyebrow !text-[10px]">{t.secure}</p>

                      <p className="mt-1 text-[13px] leading-relaxed text-muted">
                        {t.secureText}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* HOME */}

              <div className="mt-5 text-center">
                <Link
                  href="/"
                  className="text-[13px] text-muted underline-offset-4 transition-colors hover:text-moss hover:underline"
                >
                  {t.back}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
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
        strokeWidth="1.8"
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
