"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useSignedInAdmin } from "@/components/AdminContext";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { language, darkMode, changeLanguage, toggleDarkMode } =
    useSiteSettings();

  /* แสดงลิงก์จัดการข้อมูลเฉพาะ admin ที่ล็อกอินอยู่ ผู้ใช้ทั่วไปไม่ต้องล็อกอิน */
  const user = useSignedInAdmin();
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

      account: "จัดการข้อมูล",
      accountShort: "จัดการข้อมูล",

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
      back: "ย้อนกลับ",

    },

    EN: {
      home: "Home",
      plants: "Plants",
      about: "About",

      account: "Manage Data",
      accountShort: "Manage",

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
      back: "Back",

    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =========================================================
     MOBILE APP SHELL
  ========================================================= */

  const isAuthRoute =
    pathname === "/login";

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

      /* ใน /account ให้ app/account/layout.js พาไป /login, หน้า public อยู่หน้าเดิม */
      if (!pathname.startsWith("/account")) {
        router.refresh();
      }
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
      ===================================================== */}

      <header className="fixed inset-x-0 top-0 z-[100] hidden border-b border-rule bg-paper/85 text-ink backdrop-blur-xl md:block">
        <div className="vh-container">
          <div className="flex h-[72px] items-center justify-between gap-4 lg:gap-6">
            {/* BRAND */}

            <Link
              href="/"
              aria-label="Virtual Herbarium Home"
              className="group flex shrink-0 items-center gap-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-rule-strong text-moss transition group-hover:border-moss group-hover:bg-moss-soft">
                <LeafIcon className="h-[18px] w-[18px]" />
              </span>

              <span className="min-w-0">
                <span className="block font-serif text-[19px] leading-none tracking-[-0.01em] text-ink">
                  {brandTitle}
                </span>

                <span className="vh-eyebrow mt-1.5 hidden !text-[9.5px] !tracking-[0.2em] lg:block">
                  {brandSubtitle}
                </span>
              </span>
            </Link>

            {/* NAVIGATION */}

            <nav className="flex items-center gap-5 lg:gap-8">
              {navItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative py-2 text-[14px] transition-colors ${
                      active
                        ? "font-medium text-ink"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {item.label}

                    <span
                      className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-moss transition-transform duration-300 ${
                        active ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* ACTIONS */}

            <div className="flex items-center gap-2">
              {/* LANGUAGE */}

              <div ref={languageMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setLanguageOpen((current) => !current)}
                  aria-expanded={languageOpen}
                  aria-label={t.language}
                  className="flex h-10 items-center gap-1.5 rounded-full border border-rule px-3 font-mono text-[12px] tracking-[0.08em] text-ink-soft transition hover:border-rule-strong hover:bg-moss-soft hover:text-ink"
                >
                  <GlobeIcon className="h-4 w-4" />

                  <span>{language}</span>

                  <ChevronDownIcon
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      languageOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {languageOpen && (
                  <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-md border border-rule bg-sheet-raised p-1 shadow-lift">
                    {[
                      { code: "TH", label: t.thai },
                      { code: "EN", label: t.english },
                    ].map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => handleLanguageChange(option.code)}
                        className={`flex w-full items-center justify-between rounded px-3 py-2.5 text-left text-sm transition ${
                          language === option.code
                            ? "bg-moss-soft font-medium text-moss"
                            : "text-ink-soft hover:bg-moss-soft hover:text-ink"
                        }`}
                      >
                        <span>{option.label}</span>

                        <span className="font-mono text-[11px] tracking-[0.1em] opacity-70">
                          {option.code}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* THEME */}

              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label={darkMode ? t.lightMode : t.darkMode}
                title={darkMode ? t.lightMode : t.darkMode}
                className="vh-icon-btn"
              >
                {darkMode ? (
                  <SunIcon className="h-[18px] w-[18px]" />
                ) : (
                  <MoonIcon className="h-[18px] w-[18px]" />
                )}
              </button>

              {/* ADMIN (เฉพาะ admin ที่ล็อกอินอยู่) */}

              {user && !isAuthRoute && (
                <>
                  <span aria-hidden="true" className="mx-1 h-6 w-px bg-rule" />

                  <Link
                    href="/account"
                    aria-label={t.account}
                    className="vh-btn vh-btn-primary !px-1.5 lg:!pl-1.5 lg:!pr-5"
                  >
                    <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-on-moss/15">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={username || t.account}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-4 w-4" />
                      )}
                    </span>

                    <span className="hidden lg:inline">{t.account}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    aria-label={t.logout}
                    title={t.logout}
                    className="vh-icon-btn hover:!border-clay/40 hover:!bg-clay-soft hover:!text-clay"
                  >
                    {loggingOut ? (
                      <span className="font-mono text-xs">…</span>
                    ) : (
                      <LogoutIcon className="h-4 w-4" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* DESKTOP / TABLET SPACER */}

      <div aria-hidden="true" className="hidden h-[72px] md:block" />

      {/* =====================================================
          MOBILE APP BAR
      ===================================================== */}

      <header className="mobile-app-header text-ink md:hidden">
        <div className="mobile-app-header-inner">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {showMobileBack ? (
              <button
                type="button"
                onClick={handleMobileBack}
                aria-label={t.back}
                className="vh-icon-btn !h-9 !w-9"
              >
                <ArrowLeftIcon className="h-[18px] w-[18px]" />
              </button>
            ) : (
              <Link
                href="/"
                aria-label="Virtual Herbarium Home"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rule-strong text-moss transition active:scale-95"
              >
                <LeafIcon className="h-4 w-4" />
              </Link>
            )}

            <Link
              href="/"
              aria-label="Virtual Herbarium Home"
              className="min-w-0 flex-1"
            >
              <span className="block truncate font-serif text-[17px] leading-tight text-ink">
                {brandTitle}
              </span>

              <span className="vh-eyebrow mt-0.5 block truncate !text-[8.5px] !tracking-[0.18em]">
                {brandSubtitle}
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMobileLanguage}
              aria-label={t.language}
              title={t.language}
              className="flex h-9 min-w-[44px] items-center justify-center rounded-full border border-rule px-2.5 font-mono text-[11px] tracking-[0.08em] text-ink-soft transition active:scale-95"
            >
              {language}
            </button>

            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? t.lightMode : t.darkMode}
              title={darkMode ? t.lightMode : t.darkMode}
              className="vh-icon-btn !h-9 !w-9"
            >
              {darkMode ? (
                <SunIcon className="h-[17px] w-[17px]" />
              ) : (
                <MoonIcon className="h-[17px] w-[17px]" />
              )}
            </button>

            {user && !isAuthRoute && (
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label={t.logout}
                title={t.logout}
                className="vh-icon-btn !h-9 !w-9 hover:!border-clay/40 hover:!bg-clay-soft hover:!text-clay"
              >
                {loggingOut ? (
                  <span className="font-mono text-xs">…</span>
                ) : (
                  <LogoutIcon className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
      ===================================================== */}

      {!hideMobileBottomNav && (
        <nav className="mobile-bottom-nav md:hidden">
          <div
            className={`mobile-bottom-nav-inner ${user ? "" : "!grid-cols-3"}`}
          >
            <MobileBottomItem
              href="/"
              label={t.home}
              active={isBottomActive("home")}
              icon={<HomeIcon className="h-5 w-5" />}
            />

            <MobileBottomItem
              href="/plants"
              label={t.plants}
              active={isBottomActive("plants")}
              icon={<CollectionIcon className="h-5 w-5" />}
            />

            {user && (
              <Link
                href="/account/plants/new"
                aria-label={t.addPlant}
                className="relative flex min-w-0 flex-col items-center justify-end"
              >
                <span className="mobile-add-button">
                  <PlusIcon className="h-5 w-5" />
                </span>

                <span
                  className={`mt-1 truncate text-[10px] ${
                    isBottomActive("add") ? "font-medium text-moss" : "text-muted"
                  }`}
                >
                  {t.add}
                </span>
              </Link>
            )}

            <MobileBottomItem
              href="/about"
              label={t.about}
              active={isBottomActive("about")}
              icon={<InfoIcon className="h-5 w-5" />}
            />

            {user && (
              <MobileBottomItem
                href="/account"
                label={t.accountShort}
                active={isBottomActive("account")}
                icon={
                  avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={username || t.account}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-5 w-5" />
                  )
                }
              />
            )}
          </div>
        </nav>
      )}
    </>
  );
}

/* =========================================================
   MOBILE BOTTOM ITEM
========================================================= */

function MobileBottomItem({ href, label, icon, active }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="flex min-w-0 flex-col items-center justify-center gap-1 py-1"
    >
      <span
        className={`flex h-7 w-10 items-center justify-center rounded-full transition ${
          active ? "bg-moss-soft text-moss" : "text-muted"
        }`}
      >
        {icon}
      </span>

      <span
        className={`max-w-full truncate text-[10px] ${
          active ? "font-medium text-moss" : "text-muted"
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
