"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useSiteSettings } from "@/components/SiteSettingsContext";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const router = useRouter();

  const { language, darkMode, changeLanguage, toggleDarkMode } =
    useSiteSettings();

  const isEnglish = language === "EN";

  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // ตรวจสอบสถานะ Login
  useEffect(() => {
    let mounted = true;

    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setUser(user ?? null);
      setLoadingAuth(false);
    }

    getUser();

    // ฟังการเปลี่ยนแปลง Login / Logout แบบ realtime
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${
        darkMode
          ? "border-white/10 bg-[#0b120f]/90"
          : "border-emerald-100 bg-white/90"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
              darkMode
                ? "border-white/10 bg-white/5"
                : "border-emerald-100 bg-emerald-50"
            }`}
          >
            <Image
              src="/logo.png"
              alt="Virtual Herbarium"
              width={44}
              height={44}
              className="h-10 w-10 object-contain"
              priority
            />
          </div>

          <div className="hidden sm:block">
            <div
              className={`text-lg font-bold tracking-tight ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Virtual Herbarium
            </div>

            <div
              className={`text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {isEnglish
                ? "Digital Plant Collection"
                : "คลังข้อมูลพรรณไม้ดิจิทัล"}
            </div>
          </div>
        </Link>

        {/* NAVIGATION */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              darkMode
                ? "text-gray-300 hover:bg-white/10 hover:text-white"
                : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            {isEnglish ? "Home" : "หน้าแรก"}
          </Link>

          <Link
            href="/plants"
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              darkMode
                ? "text-gray-300 hover:bg-white/10 hover:text-white"
                : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            {isEnglish ? "Plants" : "พรรณไม้"}
          </Link>

          <Link
            href="/about"
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              darkMode
                ? "text-gray-300 hover:bg-white/10 hover:text-white"
                : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            {isEnglish ? "About" : "เกี่ยวกับเรา"}
          </Link>
        </nav>

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-2">
          {/* LANGUAGE */}
          <div
            className={`hidden items-center rounded-xl p-1 sm:flex ${
              darkMode ? "bg-white/10" : "bg-gray-100"
            }`}
          >
            <button
              type="button"
              onClick={() => changeLanguage("TH")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                language === "TH"
                  ? darkMode
                    ? "bg-white text-gray-900"
                    : "bg-white text-emerald-700 shadow-sm"
                  : darkMode
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-500 hover:text-gray-900"
              }`}
            >
              TH
            </button>

            <button
              type="button"
              onClick={() => changeLanguage("EN")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                language === "EN"
                  ? darkMode
                    ? "bg-white text-gray-900"
                    : "bg-white text-emerald-700 shadow-sm"
                  : darkMode
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-500 hover:text-gray-900"
              }`}
            >
              EN
            </button>
          </div>

          {/* MOBILE LANGUAGE */}
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className={`rounded-lg px-2 py-2 text-xs sm:hidden ${
              darkMode
                ? "bg-white/10 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <option value="TH">TH</option>
            <option value="EN">EN</option>
          </select>

          {/* DARK MODE */}
          <button
            type="button"
            onClick={toggleDarkMode}
            title={darkMode ? "Light Mode" : "Dark Mode"}
            aria-label={darkMode ? "Light Mode" : "Dark Mode"}
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-base transition ${
              darkMode
                ? "border border-white/10 bg-white/5 text-yellow-300 hover:bg-white/10"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {darkMode ? "☀" : "☾"}
          </button>

          {/* AUTH */}
          {!loadingAuth && user ? (
            <>
              {/* ACCOUNT */}
              <Link
                href="/account"
                className={`hidden rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:block ${
                  darkMode
                    ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {isEnglish ? "My Account" : "บัญชีของฉัน"}
              </Link>

              {/* LOGOUT */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className={`hidden rounded-xl px-5 py-2.5 text-sm font-semibold transition sm:block ${
                  darkMode
                    ? "bg-red-500/90 text-white hover:bg-red-500"
                    : "bg-red-600 text-white hover:bg-red-700"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {loggingOut
                  ? isEnglish
                    ? "Logging out..."
                    : "กำลังออก..."
                  : isEnglish
                    ? "Logout"
                    : "ออกจากระบบ"}
              </button>

              {/* MOBILE ACCOUNT */}
              <Link
                href="/account"
                aria-label={isEnglish ? "My Account" : "บัญชีของฉัน"}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold sm:hidden ${
                  darkMode
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {user.email?.charAt(0).toUpperCase() || "U"}
              </Link>

              {/* MOBILE LOGOUT */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label={isEnglish ? "Logout" : "ออกจากระบบ"}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold sm:hidden ${
                  darkMode
                    ? "bg-red-500/90 text-white"
                    : "bg-red-600 text-white"
                } disabled:opacity-60`}
              >
                ⎋
              </button>
            </>
          ) : (
            <>
              {/* LOGIN */}
              <Link
                href="/login"
                className={`hidden rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition sm:block ${
                  darkMode
                    ? "bg-emerald-500 text-white hover:bg-emerald-400"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {isEnglish ? "Login" : "เข้าสู่ระบบ"}
              </Link>

              {/* MOBILE LOGIN */}
              <Link
                href="/login"
                aria-label={isEnglish ? "Login" : "เข้าสู่ระบบ"}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold sm:hidden ${
                  darkMode
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                Login
              </Link>
            </>
          )}

          {/* MOBILE MENU */}
          <button
            type="button"
            aria-label="Menu"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg md:hidden ${
              darkMode
                ? "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            ≡
          </button>
        </div>
      </div>
    </header>
  );
}