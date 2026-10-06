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
  const [languageOpen, setLanguageOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const languageMenuRef = useRef(null);

  const isEnglish = language === "EN";

  /* =========================================================
     BRAND
  ========================================================= */

  const brandTitle = "Virtual Herbarium";
  const brandSubtitle = "Digital Plant Collection";

  /* =========================================================
     TEXT
  ========================================================= */

  const text = {
    TH: {
      home: "หน้าแรก",
      plants: "พรรณไม้",
      about: "เกี่ยวกับเรา",

      login: "เข้าสู่ระบบ",
      register: "สมัครสมาชิก",

      account: "บัญชีของฉัน",
      accountShort: "บัญชี",

      logout: "ออกจากระบบ",

      language: "เปลี่ยนภาษา",
      thai: "ไทย",
      english: "English",

      lightMode: "โหมดสว่าง",
      darkMode: "โหมดมืด",

      add: "เพิ่ม",
      addPlant: "เพิ่มพรรณไม้",
      editPlant: "แก้ไขพรรณไม้",
      editAccount: "แก้ไขบัญชี",
      myPlants: "พรรณไม้ของฉัน",

      specimen: "รายละเอียดพรรณไม้",

      forgotPassword: "ลืมรหัสผ่าน",
      resetPassword: "ตั้งรหัสผ่านใหม่",

      back: "ย้อนกลับ",
    },

    EN: {
      home: "Home",
      plants: "Plants",
      about: "About",

      login: "Login",
      register: "Register",

      account: "My Account",
      accountShort: "Account",

      logout: "Logout",

      language: "Change Language",
      thai: "ไทย",
      english: "English",

      lightMode: "Light Mode",
      darkMode: "Dark Mode",

      add: "Add",
      addPlant: "Add Plant",
      editPlant: "Edit Plant",
      editAccount: "Edit Account",
      myPlants: "My Plants",

      specimen: "Plant Details",

      forgotPassword: "Forgot Password",
      resetPassword: "Reset Password",

      back: "Back",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =========================================================
     USER
  ========================================================= */

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

  /* =========================================================
     ROUTE CHANGE
  ========================================================= */

  useEffect(() => {
    setLanguageOpen(false);
  }, [pathname]);

  /* =========================================================
     LANGUAGE MENU OUTSIDE CLICK
  ========================================================= */

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

  /* =========================================================
     MOBILE APP SHELL
  ========================================================= */

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  const isEditorRoute =
    pathname === "/account/edit" ||
    pathname === "/account/plants/new" ||
    /^\/account\/plants\/[^/]+\/edit$/.test(pathname);

  const hideMobileBottomNav = isAuthRoute || isEditorRoute;

  useEffect(() => {
    document.body.classList.add("has-mobile-app-shell");

    document.body.classList.toggle(
      "mobile-app-no-bottom-nav",
      hideMobileBottomNav,
    );

    return () => {
      document.body.classList.remove(
        "has-mobile-app-shell",
        "mobile-app-no-bottom-nav",
      );
    };
  }, [hideMobileBottomNav]);

  /* =========================================================
     LOGOUT
  ========================================================= */

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

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  /* =========================================================
     LANGUAGE
  ========================================================= */

  function handleLanguageChange(lang) {
    changeLanguage(lang);
    setLanguageOpen(false);
  }

  function toggleMobileLanguage() {
    changeLanguage(language === "TH" ? "EN" : "TH");
  }

  /* =========================================================
     DESKTOP NAV
  ========================================================= */

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

  /* =========================================================
     USER DISPLAY
  ========================================================= */

  const username =
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name ||
    "";

  const avatarUrl = user?.user_metadata?.avatar_url || "";

  /* =========================================================
     MOBILE BACK
  ========================================================= */

  const mobileRootRoutes = ["/", "/plants", "/about", "/account"];

  const showMobileBack = !mobileRootRoutes.includes(pathname);

  function handleMobileBack() {
    router.back();
  }

  /* =========================================================
     MOBILE BOTTOM NAV
  ========================================================= */

  const accountHref = user ? "/account" : "/login";

  const addHref = user ? "/account/plants/new" : "/login";

  function isBottomActive(type) {
    if (type === "home") {
      return pathname === "/";
    }

    if (type === "plants") {
      return pathname === "/plants" || /^\/plants\/[^/]+$/.test(pathname);
    }

    if (type === "add") {
      return pathname === "/account/plants/new";
    }

    if (type === "about") {
      return pathname === "/about";
    }

    if (type === "account") {
      return pathname.startsWith("/account");
    }

    return false;
  }

  return (
    <>
      {/* =====================================================
          DESKTOP / TABLET HEADER
          FIXED TOP
      ===================================================== */}

      <header
        className={`fixed inset-x-0 top-0 z-[100] hidden border-b backdrop-blur-2xl transition-all duration-300 md:block ${
          darkMode
            ? "border-white/10 bg-[#061009]/85 text-white shadow-[0_10px_40px_rgba(0,0,0,0.18)]"
            : "border-emerald-950/10 bg-[#f4f8f2]/90 text-slate-900 shadow-[0_8px_30px_rgba(21,55,31,0.06)]"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-[78px] items-center justify-between gap-4">
            {/* =================================================
                DESKTOP BRAND
                LOGO + TEXT CLICK -> HOME
            ================================================= */}

            <Link
              href="/"
              aria-label="Virtual Herbarium Home"
              className="group flex shrink-0 items-center gap-3"
            >
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

              <div className="min-w-0">
                <h1
                  className={`text-lg font-extrabold tracking-tight transition lg:text-xl ${
                    darkMode
                      ? "text-white group-hover:text-emerald-200"
                      : "text-[#183320] group-hover:text-emerald-800"
                  }`}
                >
                  {brandTitle}
                </h1>

                <p
                  className={`mt-0.5 text-xs font-medium transition ${
                    darkMode
                      ? "text-[#9eafa3] group-hover:text-white/70"
                      : "text-slate-500 group-hover:text-emerald-700"
                  }`}
                >
                  {brandSubtitle}
                </p>
              </div>
            </Link>

            {/* DESKTOP NAVIGATION */}

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

            {/* DESKTOP ACTIONS */}

            <div className="flex items-center gap-2">
              {/* LANGUAGE */}

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

              {/* THEME */}

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

              {/* AUTH */}

              {!loadingUser &&
                (user && !isAuthRoute ? (
                  <>
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
                    <Link
                      href="/login"
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-600"
                    >
                      {t.login}
                    </Link>

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
          </div>
        </div>
      </header>

      {/* =====================================================
          DESKTOP / TABLET NAVBAR SPACER
      ===================================================== */}

      <div aria-hidden="true" className="hidden h-[78px] md:block" />

      {/* =====================================================
          MOBILE APP BAR
      ===================================================== */}

      <header
        className={`mobile-app-header md:hidden ${
          darkMode
            ? "border-white/10 bg-[#061009]/88"
            : "border-emerald-950/10 bg-[#f4f8f2]/92"
        }`}
      >
        <div className="mobile-app-header-inner">
          {/* LEFT */}

          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {showMobileBack ? (
              <button
                type="button"
                onClick={handleMobileBack}
                aria-label={t.back}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border ${
                  darkMode
                    ? "border-white/10 bg-white/[0.045] text-white"
                    : "border-emerald-950/10 bg-white/75 text-[#183320]"
                }`}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            ) : (
              /* =============================================
                 MOBILE LOGO CLICK -> HOME
              ============================================= */

              <Link
                href="/"
                aria-label="Virtual Herbarium Home"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border transition active:scale-95 ${
                  darkMode
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                    : "border-emerald-800/10 bg-emerald-800/10 text-emerald-700"
                }`}
              >
                <LeafIcon className="h-5 w-5" />
              </Link>
            )}

            {/* ===============================================
                MOBILE BRAND CLICK -> HOME
            =============================================== */}

            <Link
              href="/"
              aria-label="Virtual Herbarium Home"
              className="group min-w-0 flex-1"
            >
              <p
                className={`truncate text-[15px] font-black leading-tight tracking-[-0.02em] transition ${
                  darkMode
                    ? "text-white group-active:text-emerald-300"
                    : "text-[#183320] group-active:text-emerald-700"
                }`}
              >
                {brandTitle}
              </p>

              <p
                className={`mt-0.5 truncate text-[9px] font-semibold tracking-[0.01em] transition ${
                  darkMode
                    ? "text-white/52 group-active:text-white/75"
                    : "text-slate-500 group-active:text-emerald-700"
                }`}
              >
                {brandSubtitle}
              </p>
            </Link>
          </div>

          {/* =================================================
              MOBILE RIGHT
              LANGUAGE + DARK MODE
          ================================================= */}

          <div className="flex shrink-0 items-center gap-1.5">
            {/* LANGUAGE */}

            <button
              type="button"
              onClick={toggleMobileLanguage}
              aria-label={t.language}
              title={t.language}
              className={`flex h-10 min-w-[48px] items-center justify-center gap-1.5 rounded-[14px] border px-2.5 text-[12px] font-black transition active:scale-95 ${
                darkMode
                  ? "border-white/10 bg-white/[0.045] text-white"
                  : "border-emerald-950/10 bg-white/75 text-[#183320]"
              }`}
            >
              <GlobeIcon className="h-[16px] w-[16px]" />

              <span>{language}</span>
            </button>

            {/* DARK MODE */}

            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? t.lightMode : t.darkMode}
              title={darkMode ? t.lightMode : t.darkMode}
              className={`flex h-10 w-10 items-center justify-center rounded-[14px] border transition active:scale-95 ${
                darkMode
                  ? "border-white/10 bg-white/[0.045] text-amber-200"
                  : "border-emerald-950/10 bg-white/75 text-slate-700"
              }`}
            >
              {darkMode ? (
                <SunIcon className="h-[19px] w-[19px]" />
              ) : (
                <MoonIcon className="h-[19px] w-[19px]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
      ===================================================== */}

      {!hideMobileBottomNav && (
        <nav
          className={`mobile-bottom-nav md:hidden ${
            darkMode
              ? "border-white/10 bg-[#07110b]/94"
              : "border-emerald-950/10 bg-[#f7faf5]/95"
          }`}
        >
          <div className="mobile-bottom-nav-inner">
            {/* HOME */}

            <MobileBottomItem
              href="/"
              label={t.home}
              active={isBottomActive("home")}
              darkMode={darkMode}
              icon={<HomeIcon className="h-[21px] w-[21px]" />}
            />

            {/* PLANTS */}

            <MobileBottomItem
              href="/plants"
              label={t.plants}
              active={isBottomActive("plants")}
              darkMode={darkMode}
              icon={<CollectionIcon className="h-[21px] w-[21px]" />}
            />

            {/* ADD */}

            <Link
              href={addHref}
              aria-label={t.addPlant}
              className="relative flex min-w-0 flex-col items-center justify-end"
            >
              <span className="mobile-add-button">
                <PlusIcon className="h-6 w-6" />
              </span>

              <span
                className={`mt-1 truncate text-[9px] font-black ${
                  isBottomActive("add")
                    ? darkMode
                      ? "text-emerald-300"
                      : "text-emerald-700"
                    : darkMode
                      ? "text-white/50"
                      : "text-slate-500"
                }`}
              >
                {t.add}
              </span>
            </Link>

            {/* ABOUT */}

            <MobileBottomItem
              href="/about"
              label={t.about}
              active={isBottomActive("about")}
              darkMode={darkMode}
              icon={<InfoIcon className="h-[21px] w-[21px]" />}
            />

            {/* ACCOUNT */}

            <Link
              href={accountHref}
              className="flex min-w-0 flex-col items-center justify-center gap-1 py-1"
              aria-current={isBottomActive("account") ? "page" : undefined}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center overflow-hidden rounded-[10px] transition ${
                  isBottomActive("account")
                    ? darkMode
                      ? "bg-emerald-400/12 text-emerald-300"
                      : "bg-emerald-700/10 text-emerald-700"
                    : darkMode
                      ? "text-white/50"
                      : "text-slate-500"
                }`}
              >
                {user && avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={username || t.account}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-[21px] w-[21px]" />
                )}
              </span>

              <span
                className={`max-w-full truncate text-[9px] font-bold ${
                  isBottomActive("account")
                    ? darkMode
                      ? "text-emerald-300"
                      : "text-emerald-700"
                    : darkMode
                      ? "text-white/45"
                      : "text-slate-500"
                }`}
              >
                {user ? t.accountShort : t.login}
              </span>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}

/* =========================================================
   MOBILE BOTTOM ITEM
========================================================= */

function MobileBottomItem({ href, label, icon, active, darkMode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="flex min-w-0 flex-col items-center justify-center gap-1 py-1"
    >
      <span
        className={`flex h-7 w-9 items-center justify-center rounded-[11px] transition ${
          active
            ? darkMode
              ? "bg-emerald-400/12 text-emerald-300"
              : "bg-emerald-700/10 text-emerald-700"
            : darkMode
              ? "text-white/50"
              : "text-slate-500"
        }`}
      >
        {icon}
      </span>

      <span
        className={`max-w-full truncate text-[9px] font-bold ${
          active
            ? darkMode
              ? "text-emerald-300"
              : "text-emerald-700"
            : darkMode
              ? "text-white/45"
              : "text-slate-500"
        }`}
      >
        {label}
      </span>
    </Link>
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

function HomeIcon({ className = "" }) {
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
      <path d="m3 11 9-8 9 8" />

      <path d="M5 10v10h14V10" />

      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function CollectionIcon({ className = "" }) {
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
      <path d="M5 4h14v16H5z" />

      <path d="M8 8h8" />

      <path d="M8 12h8" />

      <path d="M8 16h5" />
    </svg>
  );
}

function InfoIcon({ className = "" }) {
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

      <path d="M12 11v5" />

      <path d="M12 8h.01" />
    </svg>
  );
}

function PlusIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />

      <path d="M5 12h14" />
    </svg>
  );
}

function ArrowLeftIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
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
