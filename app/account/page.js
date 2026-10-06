"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   FOREST
========================================================= */

const FOREST_IMAGE =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=88";

/* =========================================================
   PAGE
========================================================= */

export default function AccountPage() {
  const router = useRouter();

  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const [user, setUser] = useState(null);

  const [profile, setProfile] = useState(null);

  const [plants, setPlants] = useState([]);

  const [loading, setLoading] = useState(true);

  const [plantsLoading, setPlantsLoading] = useState(false);

  const [error, setError] = useState("");

  const [loggingOut, setLoggingOut] = useState(false);

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "PERSONAL HERBARIUM",

      title: "พื้นที่พรรณไม้ของฉัน",

      subtitle:
        "จัดการบัญชีและตัวอย่างพรรณไม้ที่คุณเพิ่มเข้าสู่ Virtual Herbarium",

      welcome: "ยินดีต้อนรับกลับ",

      addPlant: "เพิ่มพรรณไม้",

      managePlants: "จัดการทั้งหมด",

      profileLabel: "PROFILE",

      memberSince: "เป็นสมาชิกตั้งแต่",

      verified: "ยืนยันอีเมลแล้ว",

      unverified: "ยังไม่ได้ยืนยันอีเมล",

      editProfile: "แก้ไขบัญชี",

      logout: "ออกจากระบบ",

      loggingOut: "กำลังออก...",

      myPlants: "พรรณไม้ของฉัน",

      myPlantsLabel: "MY COLLECTION",

      myPlantsDescription: "ตัวอย่างพรรณไม้ที่คุณเป็นผู้เพิ่มเข้าสู่คลัง",

      totalPlants: "ตัวอย่างทั้งหมด",

      families: "วงศ์พืช",

      provinces: "จังหวัด",

      edit: "แก้ไข",

      view: "ดู",

      noPlants: "ยังไม่มีข้อมูลพรรณไม้",

      noPlantsDescription:
        "เริ่มสร้างคลังส่วนตัวด้วยการเพิ่มตัวอย่างพรรณไม้แรกของคุณ",

      loading: "กำลังเปิดพื้นที่ของคุณ...",

      loadingPlants: "กำลังโหลดพรรณไม้...",

      family: "วงศ์",

      province: "จังหวัด",

      specimen: "ตัวอย่าง",

      login: "เข้าสู่ระบบ",

      register: "สมัครสมาชิก",

      notLoggedIn: "กรุณาเข้าสู่ระบบ",

      notLoggedDescription: "เข้าสู่ระบบเพื่อจัดการบัญชีและคลังพรรณไม้ของคุณ",

      loadError: "ไม่สามารถโหลดข้อมูลพรรณไม้ได้",

      retry: "ลองอีกครั้ง",

      unknownPlant: "ไม่ระบุชื่อ",

      morePlants: "รายการเพิ่มเติม",

      showAll: "ดูทั้งหมด",
    },

    EN: {
      eyebrow: "PERSONAL HERBARIUM",

      title: "My Botanical Space",

      subtitle:
        "Manage your account and plant specimens contributed to the Virtual Herbarium.",

      welcome: "Welcome back",

      addPlant: "Add Plant",

      managePlants: "Manage All",

      profileLabel: "PROFILE",

      memberSince: "Member since",

      verified: "Email verified",

      unverified: "Email not verified",

      editProfile: "Edit Account",

      logout: "Sign Out",

      loggingOut: "Signing out...",

      myPlants: "My Plants",

      myPlantsLabel: "MY COLLECTION",

      myPlantsDescription:
        "Plant specimens contributed to the collection by you.",

      totalPlants: "Total Specimens",

      families: "Plant Families",

      provinces: "Provinces",

      edit: "Edit",

      view: "View",

      noPlants: "No plant records yet",

      noPlantsDescription:
        "Begin your personal collection by adding your first specimen.",

      loading: "Opening your workspace...",

      loadingPlants: "Loading your plants...",

      family: "Family",

      province: "Province",

      specimen: "Specimen",

      login: "Login",

      register: "Register",

      notLoggedIn: "You are not signed in",

      notLoggedDescription:
        "Sign in to manage your account and plant collection.",

      loadError: "Unable to load your plants.",

      retry: "Try Again",

      unknownPlant: "Unnamed Plant",

      morePlants: "More plants",

      showAll: "View all",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     FETCH PROFILE
  ===================================================== */

  async function fetchProfile(currentUser) {
    if (!currentUser?.id) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (error) {
        console.error("Load profile error:", error);

        return null;
      }

      return data || null;
    } catch (err) {
      console.error("Load profile failed:", err);

      return null;
    }
  }

  /* =====================================================
     FETCH MY PLANTS
  ===================================================== */

  async function fetchMyPlants(userId) {
    if (!userId) return;

    setPlantsLoading(true);

    setError("");

    try {
      const { data, error } = await supabase
        .from("plants")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setPlants(data || []);
    } catch (err) {
      console.error("Fetch my plants failed:", err);

      setPlants([]);

      setError(err?.message || t.loadError);
    } finally {
      setPlantsLoading(false);
    }
  }

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);

      setError("");

      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!mounted) return;

        if (!currentUser) {
          setUser(null);

          setProfile(null);

          setPlants([]);

          return;
        }

        setUser(currentUser);

        const profileData = await fetchProfile(currentUser);

        if (!mounted) return;

        setProfile(profileData);

        await fetchMyPlants(currentUser.id);
      } catch (err) {
        console.error("Account loading error:", err);

        if (!mounted) return;

        setError(
          err?.message ||
            (isEnglish
              ? "Unable to load account."
              : "ไม่สามารถโหลดข้อมูลบัญชีได้"),
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    /* =================================================
       AUTH LISTENER
    ================================================= */

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const currentUser = session?.user || null;

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);

        setPlants([]);

        return;
      }

      const profileData = await fetchProfile(currentUser);

      if (!mounted) return;

      setProfile(profileData);

      await fetchMyPlants(currentUser.id);
    });

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, [isEnglish]);

  /* =====================================================
     LOGOUT
  ===================================================== */

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    setError("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);

      setProfile(null);

      setPlants([]);

      router.push("/");

      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);

      setError(
        err?.message ||
          (isEnglish ? "Unable to sign out." : "ไม่สามารถออกจากระบบได้"),
      );
    } finally {
      setLoggingOut(false);
    }
  }

  /* =====================================================
     STATS
  ===================================================== */

  const stats = useMemo(() => {
    const families = new Set(
      plants.map((plant) => plant.family).filter(Boolean),
    ).size;

    const provinces = new Set(
      plants.map((plant) => plant.province).filter(Boolean),
    ).size;

    return {
      plants: plants.length,
      families,
      provinces,
    };
  }, [plants]);

  /* =====================================================
     MOBILE PREVIEW

     สูงสุด 4 block
     ถ้ามากกว่า 4 -> 3 plant + 1 remaining
  ===================================================== */

  const mobilePreview = useMemo(() => {
    if (plants.length <= 4) {
      return {
        items: plants,
        remaining: 0,
      };
    }

    return {
      items: plants.slice(0, 3),
      remaining: plants.length - 3,
    };
  }, [plants]);

  /* =====================================================
     DESKTOP PREVIEW

     สูงสุด 6 block
     ถ้ามากกว่า 6 -> 5 plant + 1 remaining
  ===================================================== */

  const desktopPreview = useMemo(() => {
    if (plants.length <= 6) {
      return {
        items: plants,
        remaining: 0,
      };
    }

    return {
      items: plants.slice(0, 5),
      remaining: plants.length - 5,
    };
  }, [plants]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="page overflow-x-hidden">
        <Navbar />

        <section className="flex min-h-[60dvh] items-center justify-center px-5">
          <div className="text-center">
            <LoadingIcon
              className={`mx-auto h-8 w-8 animate-spin ${
                darkMode ? "text-emerald-300" : "text-emerald-700"
              }`}
            />

            <p
              className={`mt-4 text-sm font-semibold ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              {t.loading}
            </p>
          </div>
        </section>
      </main>
    );
  }

  /* =====================================================
     NOT LOGGED IN
  ===================================================== */

  if (!user) {
    return (
      <main className="page overflow-x-hidden">
        <Navbar />

        <section className="relative isolate flex min-h-[calc(100dvh-58px)] items-center justify-center overflow-hidden px-5 py-10 md:min-h-[calc(100dvh-78px)]">
          <div
            className="absolute inset-0 -z-30 bg-cover bg-center"
            style={{
              backgroundImage: `url("${FOREST_IMAGE}")`,
            }}
          />

          <div
            className={`absolute inset-0 -z-20 ${
              darkMode ? "bg-black/75" : "bg-[#edf5eb]/85"
            }`}
          />

          <div
            className={`w-full max-w-md rounded-[24px] border p-6 text-center shadow-xl backdrop-blur-xl sm:p-8 ${
              darkMode
                ? "border-white/10 bg-[#07130c]/85"
                : "border-white/60 bg-white/85"
            }`}
          >
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
                darkMode
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "bg-emerald-800/10 text-emerald-800"
              }`}
            >
              <UserIcon className="h-6 w-6" />
            </div>

            <h1
              className={`mt-5 text-2xl font-black leading-tight ${
                darkMode ? "text-white" : "text-[#14271a]"
              }`}
            >
              {t.notLoggedIn}
            </h1>

            <p
              className={`mt-2 text-sm leading-7 ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              {t.notLoggedDescription}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-black text-white transition hover:bg-emerald-600"
              >
                {t.login}
              </Link>

              <Link
                href="/register"
                className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-black transition ${
                  darkMode
                    ? "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                    : "border-emerald-950/10 bg-white text-slate-700 hover:bg-emerald-50"
                }`}
              >
                {t.register}
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  /* =====================================================
     USER DATA
  ===================================================== */

  const username =
    profile?.username ||
    profile?.full_name ||
    user.user_metadata?.username ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    (isEnglish ? "User" : "ผู้ใช้งาน");

  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || "";

  const email = user.email || "-";

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString(
        isEnglish ? "en-GB" : "th-TH-u-ca-gregory",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      )
    : "-";

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="page overflow-x-hidden">
      <Navbar />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative isolate overflow-hidden">
        {/* FOREST */}

        <div
          className="absolute inset-0 -z-30 bg-cover bg-center"
          style={{
            backgroundImage: `url("${FOREST_IMAGE}")`,
          }}
        />

        {/* OVERLAY */}

        <div
          className={`absolute inset-0 -z-20 ${
            darkMode
              ? "bg-[linear-gradient(90deg,rgba(2,9,5,.95),rgba(3,14,7,.72))]"
              : "bg-[linear-gradient(90deg,rgba(240,247,238,.96),rgba(236,245,234,.72))]"
          }`}
        />

        {/* BOTTOM FADE */}

        <div
          className={`absolute inset-x-0 bottom-0 -z-10 h-24 ${
            darkMode
              ? "bg-gradient-to-t from-[#07100b]"
              : "bg-gradient-to-t from-[#f1f6f1]"
          } to-transparent`}
        />

        <div className="container">
          <div className="py-7 sm:py-10 lg:py-12">
            <div className="max-w-3xl">
              {/* BADGE */}

              <div
                className={`inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 backdrop-blur-xl ${
                  darkMode
                    ? "border-emerald-300/20 bg-black/20 text-emerald-200"
                    : "border-emerald-950/10 bg-white/60 text-emerald-900"
                }`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    darkMode ? "bg-emerald-400" : "bg-emerald-700"
                  }`}
                />

                <span className="text-[9px] font-black tracking-[0.2em]">
                  {t.eyebrow}
                </span>
              </div>

              {/* TEXT */}

              <div className="mt-4 flex max-w-3xl flex-col gap-2.5 sm:mt-5 sm:gap-3">
                <p
                  className={`text-[13px] font-bold leading-6 sm:text-sm sm:leading-6 ${
                    darkMode ? "text-emerald-300" : "text-emerald-800"
                  }`}
                >
                  {t.welcome}, {username}
                </p>

                <h1
                  className={`font-black ${
                    isEnglish
                      ? "text-[2rem] leading-[1.12] tracking-[-0.04em] sm:text-4xl sm:leading-[1.12] lg:text-5xl"
                      : "text-[2.05rem] leading-[1.28] tracking-[-0.025em] sm:text-[2.8rem] sm:leading-[1.24] lg:text-[3.4rem] lg:leading-[1.2]"
                  } ${darkMode ? "text-white" : "text-[#102218]"}`}
                >
                  {t.title}
                </h1>

                <p
                  className={`max-w-2xl text-[13px] font-medium leading-6 sm:text-[15px] sm:leading-7 ${
                    darkMode ? "text-[#bdccc1]" : "text-[#4d6354]"
                  }`}
                >
                  {t.subtitle}
                </p>
              </div>
            </div>

            {/* =================================================
                STATS
            ================================================= */}

            <div className="mt-6 grid grid-cols-3 gap-2.5 sm:mt-7 sm:gap-4 lg:max-w-[840px] lg:gap-5">
              <StatCard
                darkMode={darkMode}
                icon={<LeafIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                label={t.totalPlants}
                value={stats.plants}
              />

              <StatCard
                darkMode={darkMode}
                icon={<PinIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                label={t.provinces}
                value={stats.provinces}
              />

              <StatCard
                darkMode={darkMode}
                icon={<BranchIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                label={t.families}
                value={stats.families}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          BODY
      ===================================================== */}

      <section className="container py-5 sm:py-8 lg:py-10">
        <div className="space-y-5 lg:space-y-6">
          {/* =================================================
              PROFILE
          ================================================= */}

          <section
            className={`relative overflow-hidden rounded-[22px] border p-4 shadow-lg sm:p-6 ${
              darkMode
                ? "border-white/10 bg-[#0a1710]"
                : "border-emerald-950/[0.08] bg-white/90"
            }`}
          >
            {/* SUBTLE GLOW */}

            <div
              className={`pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full blur-3xl ${
                darkMode ? "bg-emerald-400/[0.04]" : "bg-emerald-700/[0.035]"
              }`}
            />

            <div className="relative">
              {/* TOP AREA */}

              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                {/* USER */}

                <div className="flex min-w-0 items-center gap-3.5 sm:gap-5">
                  <ProfileAvatar
                    avatarUrl={avatarUrl}
                    username={username}
                    darkMode={darkMode}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[9px] font-black tracking-[0.18em] ${
                        darkMode ? "text-emerald-400" : "text-emerald-700"
                      }`}
                    >
                      {t.profileLabel}
                    </p>

                    <h2
                      className={`mt-1 truncate text-[1.65rem] font-black leading-[1.18] tracking-tight sm:text-3xl ${
                        darkMode ? "text-white" : "text-[#14271a]"
                      }`}
                    >
                      {username}
                    </h2>

                    <p
                      className={`mt-1 truncate text-[12px] leading-5 sm:text-sm ${
                        darkMode ? "text-gray-400" : "text-slate-500"
                      }`}
                    >
                      {email}
                    </p>

                    <div className="mt-2.5">
                      <StatusBadge
                        darkMode={darkMode}
                        verified={Boolean(user.email_confirmed_at)}
                        text={
                          user.email_confirmed_at ? t.verified : t.unverified
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="grid grid-cols-2 gap-2.5 lg:w-[360px] lg:shrink-0">
                  <Link
                    href="/account/edit"
                    className={`group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-[12px] font-bold transition sm:text-sm ${
                      darkMode
                        ? "border-white/10 bg-white/[0.045] text-gray-100 hover:border-emerald-400/20 hover:bg-white/[0.08]"
                        : "border-emerald-950/10 bg-[#f8faf7] text-slate-700 hover:border-emerald-700/20 hover:bg-emerald-50"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${
                        darkMode
                          ? "bg-white/[0.05] text-emerald-300 group-hover:bg-emerald-400/10"
                          : "bg-emerald-800/[0.07] text-emerald-800 group-hover:bg-emerald-100"
                      }`}
                    >
                      <EditIcon className="h-3.5 w-3.5" />
                    </span>

                    <span className="truncate">{t.editProfile}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={`group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-[12px] font-bold transition sm:text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                      darkMode
                        ? "border-red-400/10 bg-red-400/[0.055] text-red-300 hover:border-red-400/20 hover:bg-red-400/[0.1]"
                        : "border-red-100 bg-red-50/80 text-red-700 hover:border-red-200 hover:bg-red-100"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        darkMode ? "bg-red-400/[0.08]" : "bg-red-100"
                      }`}
                    >
                      <LogoutIcon className="h-3.5 w-3.5" />
                    </span>

                    <span className="truncate">
                      {loggingOut ? t.loggingOut : t.logout}
                    </span>
                  </button>
                </div>
              </div>

              {/* MEMBER SINCE */}

              <div
                className={`mt-4 flex items-center gap-3 border-t pt-4 ${
                  darkMode ? "border-white/[0.08]" : "border-emerald-950/[0.07]"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    darkMode
                      ? "bg-emerald-400/[0.08] text-emerald-300"
                      : "bg-emerald-800/[0.06] text-emerald-700"
                  }`}
                >
                  <CalendarIcon className="h-4 w-4" />
                </div>

                <div className="flex min-w-0 items-baseline gap-2">
                  <span
                    className={`shrink-0 text-[10px] font-bold ${
                      darkMode ? "text-gray-500" : "text-slate-400"
                    }`}
                  >
                    {t.memberSince}
                  </span>

                  <span
                    className={`truncate text-[12px] font-bold sm:text-sm ${
                      darkMode ? "text-gray-200" : "text-slate-700"
                    }`}
                  >
                    {joinedDate}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              MY PLANTS
          ================================================= */}

          <section
            className={`rounded-[22px] border p-4 shadow-lg sm:p-6 lg:p-7 ${
              darkMode
                ? "border-white/10 bg-[#0a1710]"
                : "border-emerald-950/[0.08] bg-white/90"
            }`}
          >
            {/* HEADER */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p
                  className={`text-[9px] font-black tracking-[0.18em] ${
                    darkMode ? "text-emerald-400" : "text-emerald-700"
                  }`}
                >
                  {t.myPlantsLabel}
                </p>

                <h2
                  className={`mt-1.5 text-[1.75rem] font-black leading-[1.25] tracking-tight sm:text-3xl ${
                    darkMode ? "text-white" : "text-[#14271a]"
                  }`}
                >
                  {t.myPlants}
                </h2>

                <p
                  className={`mt-1.5 text-[12px] leading-5 sm:text-sm sm:leading-6 ${
                    darkMode ? "text-gray-400" : "text-slate-500"
                  }`}
                >
                  {t.myPlantsDescription}
                </p>
              </div>

              {/* COLLECTION ACTIONS */}

              <div className="grid grid-cols-2 gap-2 sm:w-auto">
                <Link
                  href="/account/plants"
                  className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-[11px] font-bold transition sm:text-[12px] ${
                    darkMode
                      ? "border-white/10 bg-white/[0.035] text-gray-200 hover:bg-white/[0.08]"
                      : "border-emerald-950/10 bg-[#f7faf6] text-slate-700 hover:bg-emerald-50"
                  }`}
                >
                  <CollectionIcon className="h-4 w-4" />

                  <span className="truncate">{t.managePlants}</span>
                </Link>

                <Link
                  href="/account/plants/new"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 text-[11px] font-black text-white transition hover:bg-emerald-600 sm:text-[12px]"
                >
                  <PlusIcon className="h-4 w-4" />

                  <span className="truncate">{t.addPlant}</span>
                </Link>
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div
                className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${
                  darkMode
                    ? "border-red-400/15 bg-red-400/[0.06] text-red-200"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />

                <div>
                  <p className="text-sm leading-6">{error}</p>

                  <button
                    type="button"
                    onClick={() => fetchMyPlants(user.id)}
                    className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-bold text-white"
                  >
                    <RefreshIcon className="h-3.5 w-3.5" />

                    {t.retry}
                  </button>
                </div>
              </div>
            )}

            {/* LOADING */}

            {plantsLoading && (
              <div className="grid min-h-[180px] place-items-center">
                <div className="text-center">
                  <LoadingIcon
                    className={`mx-auto h-7 w-7 animate-spin ${
                      darkMode ? "text-emerald-300" : "text-emerald-700"
                    }`}
                  />

                  <p
                    className={`mt-3 text-xs ${
                      darkMode ? "text-gray-400" : "text-slate-500"
                    }`}
                  >
                    {t.loadingPlants}
                  </p>
                </div>
              </div>
            )}

            {/* EMPTY */}

            {!plantsLoading && !error && plants.length === 0 && (
              <div
                className={`mt-5 rounded-[18px] border border-dashed px-5 py-10 text-center ${
                  darkMode
                    ? "border-white/15 bg-white/[0.02]"
                    : "border-emerald-950/10 bg-[#f7faf6]"
                }`}
              >
                <LeafIcon
                  className={`mx-auto h-9 w-9 ${
                    darkMode ? "text-emerald-300" : "text-emerald-700"
                  }`}
                />

                <h3
                  className={`mt-4 text-lg font-black ${
                    darkMode ? "text-white" : "text-[#14271a]"
                  }`}
                >
                  {t.noPlants}
                </h3>

                <p
                  className={`mx-auto mt-2 max-w-sm text-xs leading-6 ${
                    darkMode ? "text-gray-400" : "text-slate-500"
                  }`}
                >
                  {t.noPlantsDescription}
                </p>

                <Link
                  href="/account/plants/new"
                  className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-xs font-black text-white transition hover:bg-emerald-600"
                >
                  <PlusIcon className="h-4 w-4" />

                  {t.addPlant}
                </Link>
              </div>
            )}

            {/* =================================================
                MOBILE GRID
                2 ต่อแถว / สูงสุด 4 block
            ================================================= */}

            {!plantsLoading && !error && plants.length > 0 && (
              <>
                <div className="mt-5 grid grid-cols-2 gap-3 md:hidden">
                  {mobilePreview.items.map((plant) => (
                    <MyPlantCard
                      key={plant.id || plant.plant_id}
                      plant={plant}
                      darkMode={darkMode}
                      t={t}
                      mobile
                    />
                  ))}

                  {mobilePreview.remaining > 0 && (
                    <MorePlantsCard
                      count={mobilePreview.remaining}
                      darkMode={darkMode}
                      t={t}
                      mobile
                    />
                  )}
                </div>

                {/* =================================================
                    DESKTOP GRID
                    3 ต่อแถว / สูงสุด 6 block
                ================================================= */}

                <div className="mt-6 hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
                  {desktopPreview.items.map((plant) => (
                    <MyPlantCard
                      key={plant.id || plant.plant_id}
                      plant={plant}
                      darkMode={darkMode}
                      t={t}
                    />
                  ))}

                  {desktopPreview.remaining > 0 && (
                    <MorePlantsCard
                      count={desktopPreview.remaining}
                      darkMode={darkMode}
                      t={t}
                    />
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   PROFILE AVATAR
========================================================= */

function ProfileAvatar({ avatarUrl, username, darkMode }) {
  const [imageError, setImageError] = useState(false);

  const showImage = avatarUrl && !imageError;

  const initial =
    String(username || "V")
      .trim()
      .charAt(0)
      .toUpperCase() || "V";

  return (
    <div
      className={`h-[66px] w-[66px] shrink-0 overflow-hidden rounded-[18px] border sm:h-20 sm:w-20 sm:rounded-[22px] ${
        darkMode
          ? "border-white/10 bg-emerald-400/10"
          : "border-emerald-950/10 bg-emerald-800/10"
      }`}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={username}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center text-xl font-black sm:text-2xl ${
            darkMode ? "text-emerald-300" : "text-emerald-800"
          }`}
        >
          {initial}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ darkMode, verified, text }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
        verified
          ? darkMode
            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
          : darkMode
            ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
            : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          verified ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />

      {text}
    </span>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ darkMode, icon, label, value }) {
  return (
    <div
      className={`group min-w-0 rounded-[18px] border px-2 py-4 text-center backdrop-blur-xl transition duration-300 sm:min-h-[170px] sm:rounded-[28px] sm:px-5 sm:py-5 lg:min-h-[185px] lg:px-6 lg:py-6 lg:hover:-translate-y-1 ${
        darkMode
          ? "border-white/10 bg-black/25 shadow-[0_14px_38px_rgba(0,0,0,0.18)]"
          : "border-white/80 bg-white/80 shadow-[0_14px_40px_rgba(28,65,38,0.08)]"
      }`}
    >
      <div className="flex h-full flex-col items-center justify-center">
        {/* ICON */}

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] sm:h-14 sm:w-14 sm:rounded-[17px] lg:h-16 lg:w-16 lg:rounded-[20px] ${
            darkMode
              ? "bg-emerald-400/10 text-emerald-300"
              : "bg-[#eaf3ee] text-emerald-700"
          }`}
        >
          {icon}
        </div>

        {/* NUMBER */}

        <p
          className={`mt-2.5 text-[28px] font-black leading-none tracking-[-0.04em] sm:mt-3 sm:text-[42px] lg:text-[48px] ${
            darkMode ? "text-white" : "text-[#123d24]"
          }`}
        >
          {value}
        </p>

        {/* LABEL */}

        <p
          className={`mt-1.5 max-w-full truncate text-[9px] font-bold leading-4 sm:mt-2 sm:text-[12px] lg:text-[13px] ${
            darkMode ? "text-gray-400" : "text-[#61718a]"
          }`}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PLANT CARD
========================================================= */

function MyPlantCard({ plant, darkMode, t, mobile = false }) {
  const plantId = plant.id || plant.plant_id;

  const image = plant.image_url || "";

  const name = plant.common_name || plant.botanical_name || t.unknownPlant;

  const botanicalName = plant.botanical_name || "";

  const family = plant.family || "";

  const province = plant.province || "";

  const specimen = plant.specimen_number || "";

  return (
    <article
      className={`group min-w-0 overflow-hidden rounded-[17px] border transition duration-300 ${
        darkMode
          ? "border-white/10 bg-[#08140d] hover:border-emerald-400/20"
          : "border-emerald-950/[0.09] bg-white hover:border-emerald-700/20"
      }`}
    >
      {/* IMAGE */}

      <Link href={plantId ? `/plants/${plantId}` : "/plants"} className="block">
        <div
          className={`relative overflow-hidden ${
            mobile ? "aspect-[1.25/1]" : "aspect-[1.55/1]"
          }`}
        >
          {image ? (
            <img
              src={image}
              alt={name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center ${
                darkMode ? "bg-[#102218]" : "bg-[#edf5ed]"
              }`}
            >
              <LeafIcon
                className={`h-9 w-9 ${
                  darkMode ? "text-emerald-400/35" : "text-emerald-800/25"
                }`}
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/5" />

          {botanicalName && (
            <p className="absolute inset-x-3 bottom-2.5 truncate text-[10px] font-semibold italic text-emerald-100 sm:text-xs">
              {botanicalName}
            </p>
          )}
        </div>
      </Link>

      {/* BODY */}

      <div className={mobile ? "p-3" : "p-4"}>
        <h3
          className={`line-clamp-2 font-black ${
            mobile
              ? "min-h-[38px] text-[15px] leading-[19px]"
              : "min-h-[44px] text-lg leading-[22px]"
          } ${darkMode ? "text-white" : "text-[#14271a]"}`}
        >
          {name}
        </h3>

        {/* MOBILE META */}

        {mobile ? (
          <div className="mt-2.5 space-y-1.5">
            {family && (
              <MiniMeta darkMode={darkMode} label={t.family} value={family} />
            )}

            {province && (
              <MiniMeta
                darkMode={darkMode}
                label={t.province}
                value={province}
              />
            )}
          </div>
        ) : (
          /* DESKTOP META */

          <div className="mt-3 grid grid-cols-2 gap-2">
            {family && (
              <MiniMeta darkMode={darkMode} label={t.family} value={family} />
            )}

            {province && (
              <MiniMeta
                darkMode={darkMode}
                label={t.province}
                value={province}
              />
            )}

            {specimen && (
              <div className="col-span-2">
                <MiniMeta
                  darkMode={darkMode}
                  label={t.specimen}
                  value={specimen}
                />
              </div>
            )}
          </div>
        )}

        {/* ACTION */}

        {plantId && (
          <div
            className={`mt-3 grid grid-cols-2 gap-1.5 border-t pt-3 ${
              darkMode ? "border-white/[0.08]" : "border-emerald-950/[0.07]"
            }`}
          >
            <Link
              href={`/plants/${plantId}`}
              className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-2 text-[10px] font-bold transition sm:text-[11px] ${
                darkMode
                  ? "border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/[0.07]"
                  : "border-emerald-950/[0.08] bg-[#f7faf6] text-slate-700 hover:bg-emerald-50"
              }`}
            >
              <EyeIcon className="h-3.5 w-3.5" />

              {t.view}
            </Link>

            <Link
              href={`/account/plants/${plantId}/edit`}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-2 text-[10px] font-black text-white transition hover:bg-emerald-600 sm:text-[11px]"
            >
              <EditIcon className="h-3.5 w-3.5" />

              {t.edit}
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

/* =========================================================
   MINI META
========================================================= */

function MiniMeta({ darkMode, label, value }) {
  return (
    <div className="min-w-0">
      <p
        className={`truncate text-[8px] font-bold uppercase tracking-[0.06em] ${
          darkMode ? "text-gray-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-0.5 truncate text-[10px] font-bold leading-4 sm:text-[11px] ${
          darkMode ? "text-gray-300" : "text-slate-700"
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   MORE PLANTS CARD
========================================================= */

function MorePlantsCard({ count, darkMode, t, mobile = false }) {
  return (
    <Link
      href="/account/plants"
      className={`flex min-w-0 flex-col items-center justify-center rounded-[17px] border text-center transition duration-300 ${
        mobile ? "min-h-[250px] p-3" : "min-h-[330px] p-5"
      } ${
        darkMode
          ? "border-white/10 bg-[#08140d] hover:border-emerald-400/20"
          : "border-emerald-950/[0.09] bg-[#f8fbf7] hover:border-emerald-700/20"
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-full font-black ${
          mobile ? "h-14 w-14 text-xl" : "h-20 w-20 text-3xl"
        } ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-100 text-emerald-800"
        }`}
      >
        +{count}
      </div>

      <p
        className={`mt-3 font-black leading-5 ${
          mobile ? "text-[12px]" : "text-base"
        } ${darkMode ? "text-white" : "text-[#14271a]"}`}
      >
        {t.morePlants}
      </p>

      <p
        className={`mt-1 text-[10px] ${
          darkMode ? "text-gray-500" : "text-slate-500"
        }`}
      >
        {t.showAll}
      </p>
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

function BranchIcon({ className = "" }) {
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
      <path d="M12 20V6" />

      <path d="M12 9 7 5" />

      <path d="M12 13l5-4" />

      <path d="M7 5 5 3" />

      <path d="M17 9l2-2" />
    </svg>
  );
}

function PinIcon({ className = "" }) {
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
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle cx="12" cy="10" r="2.5" />
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

function CalendarIcon({ className = "" }) {
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
      <rect x="3" y="5" width="18" height="16" rx="2" />

      <path d="M8 3v4" />

      <path d="M16 3v4" />

      <path d="M3 10h18" />
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
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />

      <path d="M8 7h8" />

      <path d="M8 11h8" />

      <path d="M8 15h5" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />

      <path d="M5 12h14" />
    </svg>
  );
}

function EditIcon({ className = "" }) {
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
      <path d="M12 20h9" />

      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
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

function RefreshIcon({ className = "" }) {
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
      <path d="M20 11a8.1 8.1 0 0 0-14.9-3.9L3 10" />

      <path d="M3 4v6h6" />

      <path d="M4 13a8.1 8.1 0 0 0 14.9 3.9L21 14" />

      <path d="M21 20v-6h-6" />
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
