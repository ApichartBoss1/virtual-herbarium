"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { language, setLanguage, darkMode, setDarkMode } = useSiteSettings();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
      lightMode: "โหมดสว่าง",
      darkMode: "โหมดมืด",
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
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     GET USER
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setUser(user || null);
      setLoadingUser(false);
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
     CLOSE MOBILE MENU WHEN PAGE CHANGES
  ===================================================== */

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

  function changeLanguage(lang) {
    setLanguage(lang);
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

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${
          darkMode
            ? "border-white/10 bg-[#07100c]/95 text-white"
            : "border-emerald-100 bg-white/95 text-slate-900"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[82px] items-center justify-between gap-4">
            {/* =================================================
                LOGO
            ================================================= */}

            <Link
              href="/"
              className="group flex shrink-0 items-center gap-3"
              onClick={() => setMenuOpen(false)}
            >
              {/* LOGO */}

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm transition duration-300 group-hover:scale-105 ${
                  darkMode
                    ? "border-emerald-400/20 bg-emerald-500/10"
                    : "border-emerald-200 bg-emerald-50"
                }`}
              >
                <span className="text-3xl">🌿</span>
              </div>

              {/* TEXT */}

              <div className="hidden sm:block">
                <h1 className="text-lg font-extrabold tracking-tight lg:text-xl">
                  Virtual Herbarium
                </h1>

                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {isEnglish
                    ? "Digital Plant Collection"
                    : "คลังพรรณไม้ดิจิทัล"}
                </p>
              </div>
            </Link>

            {/* =================================================
                DESKTOP NAVIGATION
            ================================================= */}

            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    isActive(item.href)
                      ? darkMode
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-emerald-50 text-emerald-700"
                      : darkMode
                        ? "text-gray-300 hover:bg-white/5 hover:text-white"
                        : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* =================================================
                DESKTOP ACTIONS
            ================================================= */}

            <div className="hidden items-center gap-3 md:flex">
              {/* LANGUAGE */}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLanguageOpen(!languageOpen)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    darkMode
                      ? "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                      : "border-gray-200 bg-white text-slate-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{language}</span>

                  <svg
                    className={`h-4 w-4 transition ${
                      languageOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {languageOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-36 overflow-hidden rounded-xl border p-1 shadow-xl ${
                      darkMode
                        ? "border-white/10 bg-[#0c1712]"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => changeLanguage("TH")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                        language === "TH"
                          ? "bg-emerald-600 text-white"
                          : darkMode
                            ? "text-gray-300 hover:bg-white/5"
                            : "text-slate-700 hover:bg-gray-100"
                      }`}
                    >
                      🇹🇭 ไทย
                    </button>

                    <button
                      type="button"
                      onClick={() => changeLanguage("EN")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                        language === "EN"
                          ? "bg-emerald-600 text-white"
                          : darkMode
                            ? "text-gray-300 hover:bg-white/5"
                            : "text-slate-700 hover:bg-gray-100"
                      }`}
                    >
                      🇺🇸 English
                    </button>
                  </div>
                )}
              </div>

              {/* DARK MODE */}

              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                aria-label={darkMode ? t.lightMode : t.darkMode}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                  darkMode
                    ? "border-white/10 bg-white/[0.05] text-yellow-300 hover:bg-white/[0.1]"
                    : "border-gray-200 bg-white text-slate-700 hover:bg-gray-50"
                }`}
              >
                {darkMode ? (
                  /* SUN */

                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="4" />

                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                ) : (
                  /* MOON */

                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                  </svg>
                )}
              </button>

              {/* USER */}

              {!loadingUser &&
                (user ? (
                  <>
                    {/* ACCOUNT */}

                    <Link
                      href="/account"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-emerald-600/30"
                    >
                      {/* USER ICON */}

                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21a8 8 0 0 0-16 0" />

                        <circle cx="12" cy="7" r="4" />
                      </svg>

                      {t.account}
                    </Link>

                    {/* LOGOUT */}

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        darkMode
                          ? "border-red-500/20 text-red-300 hover:bg-red-500/10"
                          : "border-red-200 text-red-600 hover:bg-red-50"
                      }`}
                    >
                      {/* LOGOUT ICON */}

                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M10 17l5-5-5-5" />

                        <path d="M15 12H3" />

                        <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
                      </svg>

                      {loggingOut ? "..." : t.logout}
                    </button>
                  </>
                ) : (
                  <>
                    {/* LOGIN */}

                    <Link
                      href="/login"
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                      {t.login}
                    </Link>

                    {/* REGISTER */}

                    <Link
                      href="/register"
                      className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition ${
                        darkMode
                          ? "border-white/10 text-white hover:bg-white/[0.05]"
                          : "border-gray-200 text-slate-700 hover:bg-gray-50"
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
                onClick={() => setDarkMode(!darkMode)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                  darkMode
                    ? "border-white/10 bg-white/[0.05] text-yellow-300"
                    : "border-gray-200 bg-white text-slate-700"
                }`}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>

              {/* HAMBURGER */}

              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={t.menu}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                  darkMode
                    ? "border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.1]"
                    : "border-gray-200 bg-white text-slate-700 hover:bg-gray-50"
                }`}
              >
                {menuOpen ? (
                  /* CLOSE */

                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                ) : (
                  /* 3 LINES */

                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 6h16" />

                    <path d="M4 12h16" />

                    <path d="M4 18h16" />
                  </svg>
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
            className={`border-t px-4 pb-5 pt-4 shadow-xl md:hidden ${
              darkMode
                ? "border-white/10 bg-[#09150f]"
                : "border-gray-100 bg-white"
            }`}
          >
            <div className="mx-auto max-w-7xl space-y-2">
              {/* =============================================
                  MOBILE NAVIGATION
              ============================================== */}

              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-xl px-4 py-3.5 font-semibold transition ${
                      isActive(item.href)
                        ? "bg-emerald-600 text-white"
                        : darkMode
                          ? "text-gray-200 hover:bg-white/[0.05]"
                          : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    <span>{item.label}</span>

                    <span>→</span>
                  </Link>
                ))}
              </div>

              {/* DIVIDER */}

              <div
                className={`my-4 border-t ${
                  darkMode ? "border-white/10" : "border-gray-100"
                }`}
              />

              {/* =============================================
                  LANGUAGE
              ============================================== */}

              <div
                className={`rounded-xl border p-3 ${
                  darkMode
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <p
                  className={`mb-2 px-1 text-xs font-bold uppercase tracking-wider ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Language
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => changeLanguage("TH")}
                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                      language === "TH"
                        ? "bg-emerald-600 text-white"
                        : darkMode
                          ? "bg-white/[0.04] text-gray-300"
                          : "bg-white text-slate-600"
                    }`}
                  >
                    🇹🇭 ไทย
                  </button>

                  <button
                    type="button"
                    onClick={() => changeLanguage("EN")}
                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                      language === "EN"
                        ? "bg-emerald-600 text-white"
                        : darkMode
                          ? "bg-white/[0.04] text-gray-300"
                          : "bg-white text-slate-600"
                    }`}
                  >
                    🇺🇸 EN
                  </button>
                </div>
              </div>

              {/* =============================================
                  USER
              ============================================== */}

              {!loadingUser && (
                <>
                  <div
                    className={`my-4 border-t ${
                      darkMode ? "border-white/10" : "border-gray-100"
                    }`}
                  />

                  {user ? (
                    <div className="space-y-2">
                      {/* ACCOUNT */}

                      <Link
                        href="/account"
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-emerald-600/20"
                      >
                        👤 {t.account}
                      </Link>

                      {/* LOGOUT */}

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3.5 font-bold transition ${
                          darkMode
                            ? "border-red-500/20 bg-red-500/5 text-red-300"
                            : "border-red-200 bg-red-50 text-red-600"
                        }`}
                      >
                        🚪 {loggingOut ? "..." : t.logout}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/login"
                        className="flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3.5 font-bold text-white"
                      >
                        {t.login}
                      </Link>

                      <Link
                        href="/register"
                        className={`flex items-center justify-center rounded-xl border px-4 py-3.5 font-bold ${
                          darkMode
                            ? "border-white/10 text-white"
                            : "border-gray-200 text-slate-700"
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

      {/* =====================================================
          CLICK OUTSIDE LANGUAGE MENU
      ===================================================== */}
    </>
  );
}
