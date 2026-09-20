"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { language, darkMode, changeLanguage, toggleDarkMode } =
    useSiteSettings();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const languageMenuRef = useRef(null);

  const isEnglish = language === "EN";

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      home: "หน้าแรก",
      plants: "พรรณไม้",
      about: "เกี่ยวกับเรา",

      login: "เข้าสู่ระบบ",
      register: "สมัครสมาชิก",

      account: "บัญชีของฉัน",
      logout: "ออกจากระบบ",

      menu: "เมนู",

      language: "ภาษา",

      thai: "ไทย",
      english: "English",

      lightMode: "โหมดสว่าง",
      darkMode: "โหมดมืด",

      collection: "คลังพรรณไม้ดิจิทัล",
    },

    EN: {
      home: "Home",
      plants: "Plants",
      about: "About",

      login: "Login",
      register: "Register",

      account: "My Account",
      logout: "Logout",

      menu: "Menu",

      language: "Language",

      thai: "ไทย",
      english: "English",

      lightMode: "Light Mode",
      darkMode: "Dark Mode",

      collection: "Digital Plant Collection",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     GET USER
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function getUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        setUser(user || null);
      } catch (error) {
        console.error("Navbar get user error:", error);
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUser(session?.user || null);
      setLoadingUser(false);
    });

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  /* =====================================================
     CLOSE MENU WHEN ROUTE CHANGES
  ===================================================== */

  useEffect(() => {
    setMenuOpen(false);
    setLanguageOpen(false);
  }, [pathname]);

  /* =====================================================
     CLOSE LANGUAGE MENU WHEN CLICK OUTSIDE
  ===================================================== */

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target)
      ) {
        setLanguageOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* =====================================================
     LOGOUT
  ===================================================== */

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);

        return;
      }

      setUser(null);
      setMenuOpen(false);

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  /* =====================================================
     CHANGE LANGUAGE
  ===================================================== */

  function handleLanguageChange(lang) {
    changeLanguage(lang);

    setLanguageOpen(false);
    setMenuOpen(false);
  }

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const navItems = [
    {
      href: "/",
      label: t.home,
    },
    {
      href: "/plants",
      label: t.plants,
    },
    {
      href: "/about",
      label: t.about,
    },
  ];

  function isActive(href) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  /* =====================================================
     USER DISPLAY NAME
  ===================================================== */

  const username =
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name ||
    "";

  const avatarUrl = user?.user_metadata?.avatar_url || "";

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-2xl transition-all duration-300 ${
          darkMode
            ? "border-white/10 bg-[#061009]/85 text-white shadow-[0_10px_40px_rgba(0,0,0,0.18)]"
            : "border-emerald-950/10 bg-[#f4f8f2]/90 text-slate-900 shadow-[0_8px_30px_rgba(21,55,31,0.06)]"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[78px] items-center justify-between gap-4">
            {/* =================================================
                LOGO
            ================================================= */}

            <Link
              href="/"
              className="group flex shrink-0 items-center gap-3"
              onClick={() => setMenuOpen(false)}
            >
              {/* LOGO ICON */}

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition duration-300 group-hover:-translate-y-0.5 ${
                  darkMode
                    ? "border-emerald-400/20 bg-emerald-400/10 shadow-[0_0_30px_rgba(69,185,111,0.08)]"
                    : "border-emerald-700/10 bg-emerald-700/10 shadow-sm"
                }`}
              >
                <LeafIcon
                  className={`h-6 w-6 ${
                    darkMode ? "text-emerald-300" : "text-emerald-700"
                  }`}
                />
              </div>

              {/* LOGO TEXT */}

              <div className="hidden sm:block">
                <h1
                  className={`text-lg font-extrabold tracking-tight lg:text-xl ${
                    darkMode ? "text-white" : "text-[#183320]"
                  }`}
                >
                  Virtual Herbarium
                </h1>

                <p
                  className={`mt-0.5 text-xs font-medium ${
                    darkMode ? "text-[#9eafa3]" : "text-slate-500"
                  }`}
                >
                  {t.collection}
                </p>
              </div>
            </Link>

            {/* =================================================
                DESKTOP NAVIGATION
            ================================================= */}

            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                      active
                        ? darkMode
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-emerald-700/10 text-emerald-800"
                        : darkMode
                          ? "text-gray-300 hover:bg-white/[0.05] hover:text-white"
                          : "text-slate-600 hover:bg-emerald-900/[0.05] hover:text-emerald-800"
                    }`}
                  >
                    {item.label}

                    {active && (
                      <span
                        className={`absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full ${
                          darkMode ? "bg-emerald-400" : "bg-emerald-700"
                        }`}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* =================================================
                DESKTOP ACTIONS
            ================================================= */}

            <div className="hidden items-center gap-2 md:flex">
              {/* =============================================
                  LANGUAGE
              ============================================== */}

              <div ref={languageMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setLanguageOpen((current) => !current)}
                  aria-expanded={languageOpen}
                  aria-label={t.language}
                  className={`flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-bold transition ${
                    darkMode
                      ? "border-white/10 bg-white/[0.04] text-gray-100 hover:border-white/20 hover:bg-white/[0.08]"
                      : "border-emerald-950/10 bg-white/70 text-slate-700 hover:bg-white"
                  }`}
                >
                  <GlobeIcon className="h-[18px] w-[18px]" />

                  <span>{language}</span>

                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 ${
                      languageOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {languageOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-40 overflow-hidden rounded-2xl border p-1.5 shadow-2xl backdrop-blur-2xl ${
                      darkMode
                        ? "border-white/10 bg-[#0b1810]/95"
                        : "border-emerald-950/10 bg-white/95"
                    }`}
                  >
                    {/* TH */}

                    <button
                      type="button"
                      onClick={() => handleLanguageChange("TH")}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                        language === "TH"
                          ? "bg-emerald-600 text-white"
                          : darkMode
                            ? "text-gray-200 hover:bg-white/[0.06]"
                            : "text-slate-700 hover:bg-emerald-900/[0.05]"
                      }`}
                    >
                      <span>{t.thai}</span>

                      <span className="text-xs font-bold opacity-70">TH</span>
                    </button>

                    {/* EN */}

                    <button
                      type="button"
                      onClick={() => handleLanguageChange("EN")}
                      className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                        language === "EN"
                          ? "bg-emerald-600 text-white"
                          : darkMode
                            ? "text-gray-200 hover:bg-white/[0.06]"
                            : "text-slate-700 hover:bg-emerald-900/[0.05]"
                      }`}
                    >
                      <span>{t.english}</span>

                      <span className="text-xs font-bold opacity-70">EN</span>
                    </button>
                  </div>
                )}
              </div>

              {/* =============================================
                  DARK MODE
              ============================================== */}

              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label={darkMode ? t.lightMode : t.darkMode}
                title={darkMode ? t.lightMode : t.darkMode}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                  darkMode
                    ? "border-white/10 bg-white/[0.04] text-amber-200 hover:border-white/20 hover:bg-white/[0.08]"
                    : "border-emerald-950/10 bg-white/70 text-slate-700 hover:bg-white hover:text-emerald-800"
                }`}
              >
                {darkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>

              {/* =============================================
                  USER
              ============================================== */}

              {!loadingUser &&
                (user ? (
                  <>
                    {/* ACCOUNT */}

                    <Link
                      href="/account"
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-600"
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={username || t.account}
                          className="h-7 w-7 rounded-lg object-cover ring-1 ring-white/20"
                        />
                      ) : (
                        <UserIcon className="h-4 w-4" />
                      )}

                      <span>{t.account}</span>
                    </Link>

                    {/* LOGOUT */}

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        darkMode
                          ? "border-red-400/15 bg-red-400/[0.04] text-red-300 hover:bg-red-400/10"
                          : "border-red-200 bg-white/70 text-red-700 hover:bg-red-50"
                      }`}
                    >
                      <LogoutIcon className="h-4 w-4" />

                      <span>{loggingOut ? "..." : t.logout}</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* LOGIN */}

                    <Link
                      href="/login"
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-600"
                    >
                      {t.login}
                    </Link>

                    {/* REGISTER */}

                    <Link
                      href="/register"
                      className={`inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-bold transition ${
                        darkMode
                          ? "border-white/10 bg-white/[0.035] text-white hover:bg-white/[0.08]"
                          : "border-emerald-950/10 bg-white/70 text-slate-700 hover:bg-white hover:text-emerald-800"
                      }`}
                    >
                      {t.register}
                    </Link>
                  </>
                ))}
            </div>

            {/* =================================================
                MOBILE BUTTONS
            ================================================= */}

            <div className="flex items-center gap-2 md:hidden">
              {/* DARK MODE */}

              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label={darkMode ? t.lightMode : t.darkMode}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  darkMode
                    ? "border-white/10 bg-white/[0.04] text-amber-200"
                    : "border-emerald-950/10 bg-white/70 text-slate-700"
                }`}
              >
                {darkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>

              {/* HAMBURGER */}

              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                aria-label={t.menu}
                aria-expanded={menuOpen}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  darkMode
                    ? "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                    : "border-emerald-950/10 bg-white/70 text-slate-700 hover:bg-white"
                }`}
              >
                {menuOpen ? (
                  <CloseIcon className="h-5 w-5" />
                ) : (
                  <MenuIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            MOBILE MENU
        ===================================================== */}

        {menuOpen && (
          <div
            className={`border-t px-4 pb-5 pt-4 shadow-2xl backdrop-blur-2xl md:hidden ${
              darkMode
                ? "border-white/10 bg-[#07100c]/95"
                : "border-emerald-950/10 bg-[#f4f8f2]/95"
            }`}
          >
            <div className="mx-auto max-w-7xl space-y-4">
              {/* =============================================
                  MOBILE NAVIGATION
              ============================================== */}

              <div className="space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex min-h-12 items-center rounded-xl px-4 font-bold transition ${
                        active
                          ? "bg-emerald-700 text-white"
                          : darkMode
                            ? "text-gray-200 hover:bg-white/[0.05]"
                            : "text-slate-700 hover:bg-emerald-900/[0.05] hover:text-emerald-800"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* DIVIDER */}

              <div
                className={`border-t ${
                  darkMode ? "border-white/10" : "border-emerald-950/10"
                }`}
              />

              {/* =============================================
                  MOBILE LANGUAGE
              ============================================== */}

              <div
                className={`rounded-2xl border p-3 ${
                  darkMode
                    ? "border-white/10 bg-white/[0.025]"
                    : "border-emerald-950/10 bg-white/60"
                }`}
              >
                <div className="mb-3 flex items-center gap-2 px-1">
                  <GlobeIcon
                    className={`h-4 w-4 ${
                      darkMode ? "text-emerald-300" : "text-emerald-700"
                    }`}
                  />

                  <p
                    className={`text-xs font-bold uppercase tracking-[0.12em] ${
                      darkMode ? "text-gray-400" : "text-slate-500"
                    }`}
                  >
                    {t.language}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* TH */}

                  <button
                    type="button"
                    onClick={() => handleLanguageChange("TH")}
                    className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                      language === "TH"
                        ? "bg-emerald-700 text-white"
                        : darkMode
                          ? "bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]"
                          : "bg-white text-slate-700 hover:bg-emerald-50"
                    }`}
                  >
                    ไทย
                  </button>

                  {/* EN */}

                  <button
                    type="button"
                    onClick={() => handleLanguageChange("EN")}
                    className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                      language === "EN"
                        ? "bg-emerald-700 text-white"
                        : darkMode
                          ? "bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]"
                          : "bg-white text-slate-700 hover:bg-emerald-50"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* =============================================
                  MOBILE USER
              ============================================== */}

              {!loadingUser && (
                <>
                  <div
                    className={`border-t ${
                      darkMode ? "border-white/10" : "border-emerald-950/10"
                    }`}
                  />

                  {user ? (
                    <div className="space-y-2">
                      {/* ACCOUNT */}

                      <Link
                        href="/account"
                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-bold text-white shadow-lg shadow-emerald-950/20"
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={username || t.account}
                            className="h-7 w-7 rounded-lg object-cover"
                          />
                        ) : (
                          <UserIcon className="h-5 w-5" />
                        )}

                        {t.account}
                      </Link>

                      {/* LOGOUT */}

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 font-bold transition disabled:opacity-50 ${
                          darkMode
                            ? "border-red-400/15 bg-red-400/[0.04] text-red-300 hover:bg-red-400/10"
                            : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        <LogoutIcon className="h-5 w-5" />

                        {loggingOut ? "..." : t.logout}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/login"
                        className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-4 font-bold text-white shadow-lg shadow-emerald-950/20"
                      >
                        {t.login}
                      </Link>

                      <Link
                        href="/register"
                        className={`flex min-h-12 items-center justify-center rounded-xl border px-4 font-bold ${
                          darkMode
                            ? "border-white/10 bg-white/[0.035] text-white"
                            : "border-emerald-950/10 bg-white text-slate-700"
                        }`}
                      >
                        {t.register}
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.5 3.5C14 3.8 8.2 6 5.2 10.1c-2.2 3-1.9 6.4.1 8.6 2.2 2.4 6.1 2.4 9-.1 3.8-3.3 5.6-8.9 6.2-15.1Z" />

      <path d="M4 20c3.2-4.9 7.1-8.4 12.7-11.2" />
    </svg>
  );
}

function GlobeIcon({ className = "" }) {
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

      <path d="M3 12h18" />

      <path d="M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21" />

      <path d="M12 3c-2.2 2.5-3.3 5.5-3.3 9S9.8 18.5 12 21" />
    </svg>
  );
}

function ChevronDownIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SunIcon({ className = "" }) {
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
      <circle cx="12" cy="12" r="4" />

      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.93 19.07 1.41-1.41" />
      <path d="m17.66 6.34 1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className = "" }) {
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
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />

      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function LogoutIcon({ className = "" }) {
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

function MenuIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
