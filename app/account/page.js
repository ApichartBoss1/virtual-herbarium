"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   FOREST BACKGROUND
========================================================= */

const FOREST_IMAGE =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=88";

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
        "จัดการข้อมูลบัญชี ตัวอย่างพรรณไม้ และบันทึกที่คุณเพิ่มเข้าสู่ Virtual Herbarium",

      welcome: "ยินดีต้อนรับกลับ",

      dashboard: "แดชบอร์ดส่วนตัว",

      addPlant: "เพิ่มข้อมูลพรรณไม้",

      managePlants: "จัดการพรรณไม้ทั้งหมด",

      accountInfo: "ข้อมูลบัญชี",

      profileLabel: "PROFILE",

      username: "ชื่อผู้ใช้",

      email: "อีเมล",

      memberSince: "เป็นสมาชิกตั้งแต่",

      verified: "ยืนยันอีเมลแล้ว",

      unverified: "ยังไม่ได้ยืนยันอีเมล",

      editProfile: "แก้ไขข้อมูลบัญชี",

      logout: "ออกจากระบบ",

      loggingOut: "กำลังออกจากระบบ...",

      myPlants: "พรรณไม้ของฉัน",

      myPlantsLabel: "MY COLLECTION",

      myPlantsDescription:
        "ตัวอย่างพรรณไม้ทั้งหมดที่คุณเป็นผู้เพิ่มเข้าสู่คลัง Virtual Herbarium",

      totalPlants: "ตัวอย่างทั้งหมด",

      families: "วงศ์พืช",

      provinces: "จังหวัด",

      records: "รายการ",

      familyUnit: "วงศ์",

      provinceUnit: "จังหวัด",

      edit: "แก้ไข",

      view: "ดูรายละเอียด",

      noPlants: "ยังไม่มีข้อมูลพรรณไม้",

      noPlantsDescription:
        "เริ่มต้นสร้างคลังพรรณไม้ส่วนตัวของคุณด้วยการเพิ่มตัวอย่างแรก",

      loading: "กำลังเปิดพื้นที่ส่วนตัวของคุณ...",

      loadingPlants: "กำลังโหลดพรรณไม้ของคุณ...",

      family: "วงศ์",

      province: "จังหวัด",

      location: "สถานที่",

      collectedBy: "ผู้เก็บตัวอย่าง",

      specimen: "หมายเลขตัวอย่าง",

      accountSecurity: "ความปลอดภัยของบัญชี",

      securityLabel: "ACCOUNT SECURITY",

      securityDescription: "ดูแลการเข้าถึงบัญชีและรหัสผ่านของคุณ",

      changePassword: "เปลี่ยนรหัสผ่าน",

      login: "เข้าสู่ระบบ",

      register: "สมัครสมาชิก",

      notLoggedIn: "กรุณาเข้าสู่ระบบ",

      notLoggedDescription:
        "เข้าสู่ระบบเพื่อเปิดพื้นที่ส่วนตัวและจัดการคลังพรรณไม้ของคุณ",

      loadError: "ไม่สามารถโหลดข้อมูลพรรณไม้ได้",

      retry: "ลองอีกครั้ง",

      unknownPlant: "ไม่ระบุชื่อพรรณไม้",

      collection: "Digital Herbarium Collection",
    },

    EN: {
      eyebrow: "PERSONAL HERBARIUM",

      title: "My Botanical Space",

      subtitle:
        "Manage your account, plant specimens and botanical records contributed to the Virtual Herbarium.",

      welcome: "Welcome back",

      dashboard: "Personal Dashboard",

      addPlant: "Add Plant Record",

      managePlants: "Manage All Plants",

      accountInfo: "Account Information",

      profileLabel: "PROFILE",

      username: "Username",

      email: "Email",

      memberSince: "Member since",

      verified: "Email verified",

      unverified: "Email not verified",

      editProfile: "Edit Profile",

      logout: "Sign Out",

      loggingOut: "Signing out...",

      myPlants: "My Plants",

      myPlantsLabel: "MY COLLECTION",

      myPlantsDescription:
        "Plant specimens and botanical records that you have contributed to the Virtual Herbarium.",

      totalPlants: "Total Specimens",

      families: "Plant Families",

      provinces: "Provinces",

      records: "records",

      familyUnit: "families",

      provinceUnit: "provinces",

      edit: "Edit",

      view: "View Details",

      noPlants: "No plant records yet",

      noPlantsDescription:
        "Begin your personal herbarium by adding your first plant specimen.",

      loading: "Opening your botanical workspace...",

      loadingPlants: "Loading your plant records...",

      family: "Family",

      province: "Province",

      location: "Location",

      collectedBy: "Collected by",

      specimen: "Specimen number",

      accountSecurity: "Account Security",

      securityLabel: "ACCOUNT SECURITY",

      securityDescription: "Manage access to your account and password.",

      changePassword: "Change Password",

      login: "Login",

      register: "Register",

      notLoggedIn: "You are not signed in",

      notLoggedDescription:
        "Sign in to open your personal workspace and manage your plant collection.",

      loadError: "Unable to load your plants.",

      retry: "Try Again",

      unknownPlant: "Unnamed Plant",

      collection: "Digital Herbarium Collection",
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

        /*
         * ไม่หยุดหน้า Account
         * หาก profiles ไม่มีหรือมีปัญหา
         * จะใช้ข้อมูลจาก Supabase Auth แทน
         */

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
        console.error("Fetch my plants error:", error);

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
     INITIAL ACCOUNT LOAD
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

        if (!mounted) {
          return;
        }

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
      if (!mounted) {
        return;
      }

      const currentUser = session?.user || null;

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setPlants([]);

        return;
      }

      const profileData = await fetchProfile(currentUser);

      if (!mounted) {
        return;
      }

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
    if (loggingOut) {
      return;
    }

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
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="page">
        <Navbar />

        <section className="relative flex min-h-[calc(100svh-78px)] items-center justify-center overflow-hidden">
          <div
            className={`pointer-events-none absolute left-1/2 top-[-220px] h-[650px] w-[900px] -translate-x-1/2 rounded-full blur-3xl ${
              darkMode ? "bg-emerald-500/[0.07]" : "bg-emerald-800/[0.06]"
            }`}
          />

          <div className="relative text-center">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${
                darkMode
                  ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300"
                  : "border-emerald-800/10 bg-emerald-800/[0.06] text-emerald-800"
              }`}
            >
              <LoadingIcon className="h-7 w-7 animate-spin" />
            </div>

            <p
              className={`mt-5 text-sm font-semibold ${
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
      <main className="page overflow-hidden">
        <Navbar />

        <section className="relative isolate flex min-h-[calc(100svh-78px)] items-center justify-center overflow-hidden px-5 py-16">
          <div
            className="absolute inset-0 -z-30 bg-cover bg-center"
            style={{
              backgroundImage: `url("${FOREST_IMAGE}")`,
            }}
          />

          <div
            className={`absolute inset-0 -z-20 ${
              darkMode
                ? "bg-[linear-gradient(90deg,rgba(2,9,5,0.94),rgba(3,14,7,0.78))]"
                : "bg-[linear-gradient(90deg,rgba(238,246,236,0.94),rgba(236,245,234,0.78))]"
            }`}
          />

          <div
            className={`relative w-full max-w-lg rounded-[2rem] border p-8 text-center shadow-2xl backdrop-blur-2xl sm:p-10 ${
              darkMode
                ? "border-white/10 bg-[#07130c]/82 shadow-black/40"
                : "border-white/60 bg-white/80 shadow-emerald-950/15"
            }`}
          >
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
                darkMode
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "bg-emerald-800/10 text-emerald-800"
              }`}
            >
              <UserIcon className="h-7 w-7" />
            </div>

            <p
              className={`mt-6 text-[10px] font-black tracking-[0.18em] ${
                darkMode ? "text-emerald-400" : "text-emerald-700"
              }`}
            >
              PERSONAL HERBARIUM
            </p>

            <h1
              className={`mt-3 text-2xl font-black tracking-tight sm:text-3xl ${
                darkMode ? "text-white" : "text-[#14271a]"
              }`}
            >
              {t.notLoggedIn}
            </h1>

            <p
              className={`mx-auto mt-3 max-w-md text-sm leading-7 ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              {t.notLoggedDescription}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-600"
              >
                {t.login}
              </Link>

              <Link
                href="/register"
                className={`inline-flex min-h-12 items-center justify-center rounded-xl border px-6 text-sm font-black transition ${
                  darkMode
                    ? "border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.09]"
                    : "border-emerald-950/10 bg-white/80 text-slate-700 hover:bg-white"
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
    <main className="page overflow-hidden">
      <Navbar />

      {/* =====================================================
          FOREST DASHBOARD HERO
      ===================================================== */}

      <section className="relative isolate overflow-hidden">
        {/* IMAGE */}

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
              ? "bg-[linear-gradient(90deg,rgba(2,9,5,0.97)_0%,rgba(3,14,7,0.88)_52%,rgba(3,14,7,0.65)_100%)]"
              : "bg-[linear-gradient(90deg,rgba(238,246,236,0.97)_0%,rgba(238,246,236,0.90)_52%,rgba(235,244,233,0.73)_100%)]"
          }`}
        />

        {/* BOTTOM */}

        <div
          className={`absolute inset-x-0 bottom-0 -z-10 h-32 ${
            darkMode
              ? "bg-gradient-to-t from-[#07100b] to-transparent"
              : "bg-gradient-to-t from-[#f1f6f1] to-transparent"
          }`}
        />

        {/* LIGHT */}

        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className={`absolute -top-52 right-[10%] h-[700px] w-28 rotate-[24deg] blur-3xl ${
              darkMode
                ? "bg-gradient-to-b from-emerald-100/10 to-transparent"
                : "bg-gradient-to-b from-white/60 to-transparent"
            }`}
          />

          <div className="forest-particle left-[15%] top-[35%]" />

          <div className="forest-particle right-[22%] top-[28%] [animation-delay:-3s]" />

          <div className="forest-particle right-[8%] top-[64%] [animation-delay:-5s]" />
        </div>

        <div className="container">
          <div className="py-14 sm:py-18 lg:py-20">
            {/* TOP */}

            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl page-enter">
                <div
                  className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 backdrop-blur-xl ${
                    darkMode
                      ? "border-emerald-300/20 bg-black/20 text-emerald-200"
                      : "border-emerald-950/15 bg-white/55 text-emerald-900"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      darkMode
                        ? "bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.9)]"
                        : "bg-emerald-700"
                    }`}
                  />

                  <span className="text-[10px] font-black tracking-[0.22em]">
                    {t.eyebrow}
                  </span>
                </div>

                <p
                  className={`mt-7 text-sm font-bold ${
                    darkMode ? "text-emerald-300" : "text-emerald-800"
                  }`}
                >
                  {t.welcome}, {username}
                </p>

                <h1
                  className={`mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-6xl ${
                    darkMode ? "text-white" : "text-[#102218]"
                  }`}
                >
                  {t.title}
                </h1>

                <p
                  className={`mt-5 max-w-2xl text-base leading-8 ${
                    darkMode ? "text-[#bdccc1]" : "text-[#475f4e]"
                  }`}
                >
                  {t.subtitle}
                </p>
              </div>

              {/* ACTIONS */}

              <div className="flex flex-col gap-3 sm:flex-row lg:pb-1">
                <Link
                  href="/account/plants"
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-bold backdrop-blur-xl transition hover:-translate-y-0.5 ${
                    darkMode
                      ? "border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.11]"
                      : "border-emerald-950/15 bg-white/55 text-emerald-950 hover:bg-white"
                  }`}
                >
                  <CollectionIcon className="h-5 w-5" />

                  {t.managePlants}
                </Link>

                <Link
                  href="/account/plants/new"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(6,78,45,0.30)] transition hover:-translate-y-0.5 hover:bg-emerald-600"
                >
                  <PlusIcon className="h-5 w-5" />

                  {t.addPlant}
                </Link>
              </div>
            </div>

            {/* STATS */}

            <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:max-w-4xl">
              <StatCard
                darkMode={darkMode}
                icon={<LeafIcon className="h-5 w-5" />}
                label={t.totalPlants}
                value={stats.plants}
                suffix={t.records}
              />

              <StatCard
                darkMode={darkMode}
                icon={<BranchIcon className="h-5 w-5" />}
                label={t.families}
                value={stats.families}
                suffix={t.familyUnit}
              />

              <StatCard
                darkMode={darkMode}
                icon={<PinIcon className="h-5 w-5" />}
                label={t.provinces}
                value={stats.provinces}
                suffix={t.provinceUnit}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      <section className="container py-10 sm:py-14">
        <div className="space-y-6">
          {/* =================================================
              ACCOUNT PROFILE
          ================================================= */}

          <section
            className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-xl sm:p-8 ${
              darkMode
                ? "border-white/10 bg-[#0a1710] shadow-black/20"
                : "border-emerald-950/10 bg-white/85 shadow-emerald-950/10"
            }`}
          >
            <div
              className={`absolute inset-x-14 top-0 h-px ${
                darkMode
                  ? "bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
                  : "bg-gradient-to-r from-transparent via-emerald-700/25 to-transparent"
              }`}
            />

            <div
              className={`pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full blur-3xl ${
                darkMode ? "bg-emerald-400/[0.045]" : "bg-emerald-800/[0.05]"
              }`}
            />

            <div className="relative">
              <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
                {/* USER */}

                <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                  <ProfileAvatar
                    avatarUrl={avatarUrl}
                    username={username}
                    darkMode={darkMode}
                  />

                  <div className="min-w-0">
                    <p
                      className={`text-[9px] font-black tracking-[0.18em] ${
                        darkMode ? "text-emerald-400" : "text-emerald-700"
                      }`}
                    >
                      {t.profileLabel}
                    </p>

                    <h2
                      className={`mt-2 truncate text-2xl font-black tracking-tight sm:text-3xl ${
                        darkMode ? "text-white" : "text-[#14271a]"
                      }`}
                    >
                      {username}
                    </h2>

                    <p
                      className={`mt-1 truncate text-sm ${
                        darkMode ? "text-gray-400" : "text-slate-500"
                      }`}
                    >
                      {email}
                    </p>

                    <div className="mt-3">
                      {user.email_confirmed_at ? (
                        <StatusBadge
                          darkMode={darkMode}
                          verified
                          text={t.verified}
                        />
                      ) : (
                        <StatusBadge darkMode={darkMode} text={t.unverified} />
                      )}
                    </div>
                  </div>
                </div>

                {/* BUTTONS */}

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/account/edit"
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-bold transition ${
                      darkMode
                        ? "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                        : "border-emerald-950/10 bg-[#f7faf6] text-slate-700 hover:bg-emerald-50"
                    }`}
                  >
                    <EditIcon className="h-4 w-4" />

                    {t.editProfile}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      darkMode
                        ? "bg-red-400/[0.08] text-red-300 hover:bg-red-400/[0.13]"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    <LogoutIcon className="h-4 w-4" />

                    {loggingOut ? t.loggingOut : t.logout}
                  </button>
                </div>
              </div>

              {/* INFO */}

              <div
                className={`mt-8 grid gap-4 border-t pt-8 md:grid-cols-3 ${
                  darkMode ? "border-white/10" : "border-emerald-950/10"
                }`}
              >
                <InfoBox
                  darkMode={darkMode}
                  icon={<UserIcon className="h-5 w-5" />}
                  label={t.username}
                  value={username}
                />

                <InfoBox
                  darkMode={darkMode}
                  icon={<MailIcon className="h-5 w-5" />}
                  label={t.email}
                  value={email}
                />

                <InfoBox
                  darkMode={darkMode}
                  icon={<CalendarIcon className="h-5 w-5" />}
                  label={t.memberSince}
                  value={joinedDate}
                />
              </div>
            </div>
          </section>

          {/* =================================================
              MY PLANTS
          ================================================= */}

          <section
            className={`rounded-[2rem] border p-6 shadow-xl sm:p-8 ${
              darkMode
                ? "border-white/10 bg-[#0a1710] shadow-black/20"
                : "border-emerald-950/10 bg-white/85 shadow-emerald-950/10"
            }`}
          >
            {/* HEADER */}

            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p
                  className={`text-[9px] font-black tracking-[0.18em] ${
                    darkMode ? "text-emerald-400" : "text-emerald-700"
                  }`}
                >
                  {t.myPlantsLabel}
                </p>

                <h2
                  className={`mt-2 text-2xl font-black tracking-tight sm:text-3xl ${
                    darkMode ? "text-white" : "text-[#14271a]"
                  }`}
                >
                  {t.myPlants}
                </h2>

                <p
                  className={`mt-3 text-sm leading-7 ${
                    darkMode ? "text-gray-400" : "text-slate-500"
                  }`}
                >
                  {t.myPlantsDescription}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/account/plants"
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-bold transition ${
                    darkMode
                      ? "border-white/10 bg-white/[0.035] text-gray-200 hover:bg-white/[0.08]"
                      : "border-emerald-950/10 bg-[#f7faf6] text-slate-700 hover:bg-emerald-50"
                  }`}
                >
                  <CollectionIcon className="h-4 w-4" />

                  {t.managePlants}
                </Link>

                <Link
                  href="/account/plants/new"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-600"
                >
                  <PlusIcon className="h-4 w-4" />

                  {t.addPlant}
                </Link>
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div
                className={`mt-7 rounded-2xl border p-5 ${
                  darkMode
                    ? "border-red-400/15 bg-red-400/[0.06]"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertIcon
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      darkMode ? "text-red-300" : "text-red-700"
                    }`}
                  />

                  <div>
                    <p
                      className={`text-sm font-semibold leading-6 ${
                        darkMode ? "text-red-200" : "text-red-700"
                      }`}
                    >
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={() => fetchMyPlants(user.id)}
                      className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700"
                    >
                      <RefreshIcon className="h-4 w-4" />

                      {t.retry}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* LOADING */}

            {plantsLoading && (
              <div className="grid min-h-[320px] place-items-center">
                <div className="text-center">
                  <LoadingIcon
                    className={`mx-auto h-8 w-8 animate-spin ${
                      darkMode ? "text-emerald-300" : "text-emerald-700"
                    }`}
                  />

                  <p
                    className={`mt-5 text-sm ${
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
                className={`mt-8 rounded-[1.7rem] border border-dashed px-6 py-16 text-center ${
                  darkMode
                    ? "border-white/15 bg-white/[0.02]"
                    : "border-emerald-950/10 bg-[#f7faf6]"
                }`}
              >
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
                    darkMode
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-emerald-800/10 text-emerald-800"
                  }`}
                >
                  <LeafIcon className="h-8 w-8" />
                </div>

                <h3
                  className={`mt-6 text-xl font-black ${
                    darkMode ? "text-white" : "text-[#14271a]"
                  }`}
                >
                  {t.noPlants}
                </h3>

                <p
                  className={`mx-auto mt-3 max-w-md text-sm leading-7 ${
                    darkMode ? "text-gray-400" : "text-slate-500"
                  }`}
                >
                  {t.noPlantsDescription}
                </p>

                <Link
                  href="/account/plants/new"
                  className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-600"
                >
                  <PlusIcon className="h-4 w-4" />

                  {t.addPlant}
                </Link>
              </div>
            )}

            {/* PLANT GRID */}

            {!plantsLoading && !error && plants.length > 0 && (
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {plants.map((plant) => (
                  <MyPlantCard
                    key={plant.id || plant.plant_id}
                    plant={plant}
                    isEnglish={isEnglish}
                    darkMode={darkMode}
                    t={t}
                  />
                ))}
              </div>
            )}
          </section>

          {/* =================================================
              SECURITY
          ================================================= */}

          <section
            className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-xl sm:p-8 ${
              darkMode
                ? "border-white/10 bg-[#0a1710] shadow-black/20"
                : "border-emerald-950/10 bg-white/85 shadow-emerald-950/10"
            }`}
          >
            <div
              className={`pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl ${
                darkMode ? "bg-emerald-400/[0.045]" : "bg-emerald-800/[0.05]"
              }`}
            />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-emerald-800/10 text-emerald-800"
                  }`}
                >
                  <ShieldIcon className="h-5 w-5" />
                </div>

                <div>
                  <p
                    className={`text-[9px] font-black tracking-[0.16em] ${
                      darkMode ? "text-emerald-400" : "text-emerald-700"
                    }`}
                  >
                    {t.securityLabel}
                  </p>

                  <h2
                    className={`mt-1 text-xl font-black ${
                      darkMode ? "text-white" : "text-[#14271a]"
                    }`}
                  >
                    {t.accountSecurity}
                  </h2>

                  <p
                    className={`mt-2 text-sm ${
                      darkMode ? "text-gray-400" : "text-slate-500"
                    }`}
                  >
                    {t.securityDescription}
                  </p>
                </div>
              </div>

              <Link
                href="/forgot-password"
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-bold transition ${
                  darkMode
                    ? "border-white/10 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]"
                    : "border-emerald-950/10 bg-[#f7faf6] text-slate-700 hover:bg-emerald-50"
                }`}
              >
                <KeyIcon className="h-4 w-4" />

                {t.changePassword}
              </Link>
            </div>
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
      className={`h-24 w-24 shrink-0 overflow-hidden rounded-[1.7rem] border ${
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
          className={`flex h-full w-full items-center justify-center text-3xl font-black ${
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

function StatusBadge({ darkMode, verified = false, text }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
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
        className={`h-1.5 w-1.5 rounded-full ${
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

function StatCard({ darkMode, icon, label, value, suffix }) {
  return (
    <div
      className={`rounded-2xl border p-4 backdrop-blur-xl transition duration-300 hover:-translate-y-1 ${
        darkMode
          ? "border-white/10 bg-black/20"
          : "border-emerald-950/10 bg-white/55"
      }`}
    >
      <div className="flex items-center gap-4">
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
            className={`text-[10px] font-bold ${
              darkMode ? "text-gray-400" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <div className="mt-0.5 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                darkMode ? "text-white" : "text-[#173321]"
              }`}
            >
              {value}
            </span>

            <span
              className={`text-[10px] ${
                darkMode ? "text-gray-500" : "text-slate-400"
              }`}
            >
              {suffix}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({ darkMode, icon, label, value }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        darkMode
          ? "border-white/[0.08] bg-white/[0.025]"
          : "border-emerald-950/[0.08] bg-[#f7faf6]"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/[0.08] text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <p
        className={`mt-4 text-[9px] font-bold uppercase tracking-[0.12em] ${
          darkMode ? "text-gray-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-bold leading-6 ${
          darkMode ? "text-gray-200" : "text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   MY PLANT CARD
========================================================= */

function MyPlantCard({ plant, isEnglish, darkMode, t }) {
  const plantId = plant.id || plant.plant_id;

  const image = plant.image_url || "";

  const name = plant.common_name || plant.botanical_name || t.unknownPlant;

  const botanicalName = plant.botanical_name || "";

  const family = plant.family || "";

  const province = plant.province || "";

  const location = plant.location || "";

  const collectedBy = plant.collected_by || "";

  const specimen = plant.specimen_number || "";

  return (
    <article
      className={`group relative overflow-hidden rounded-[1.7rem] border transition duration-300 hover:-translate-y-1.5 ${
        darkMode
          ? "border-white/10 bg-[#08140d] hover:border-emerald-400/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.32)]"
          : "border-emerald-950/10 bg-white hover:border-emerald-700/20 hover:shadow-[0_20px_45px_rgba(25,55,34,0.12)]"
      }`}
    >
      {/* IMAGE */}

      <div className="relative aspect-[1.45/1] overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.055]"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center ${
              darkMode
                ? "bg-[radial-gradient(circle_at_center,rgba(52,140,78,0.16),transparent_65%),#102218]"
                : "bg-[radial-gradient(circle_at_center,rgba(30,110,62,0.12),transparent_65%),#edf5ed]"
            }`}
          >
            <LeafIcon
              className={`h-16 w-16 ${
                darkMode ? "text-emerald-400/35" : "text-emerald-800/25"
              }`}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#020b05]/80 via-transparent to-black/10" />

        <div className="absolute left-4 top-4">
          <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[9px] font-black tracking-[0.15em] text-white backdrop-blur-xl">
            MY SPECIMEN
          </span>
        </div>

        {botanicalName && (
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="truncate text-sm font-semibold italic text-emerald-200">
              {botanicalName}
            </p>
          </div>
        )}
      </div>

      {/* CONTENT */}

      <div className="p-5">
        <h3
          className={`line-clamp-2 text-xl font-black leading-7 ${
            darkMode ? "text-white" : "text-[#14271a]"
          }`}
        >
          {name}
        </h3>

        {family && (
          <div className="mt-3">
            <span
              className={`inline-flex max-w-full truncate rounded-full border px-3 py-1.5 text-[10px] font-bold ${
                darkMode
                  ? "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {isEnglish ? `Family: ${family}` : `วงศ์: ${family}`}
            </span>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {province && (
            <DetailLine
              darkMode={darkMode}
              icon={<PinIcon className="h-4 w-4" />}
              label={t.province}
              value={province}
            />
          )}

          {location && (
            <DetailLine
              darkMode={darkMode}
              icon={<LocationIcon className="h-4 w-4" />}
              label={t.location}
              value={location}
            />
          )}

          {collectedBy && (
            <DetailLine
              darkMode={darkMode}
              icon={<UserIcon className="h-4 w-4" />}
              label={t.collectedBy}
              value={collectedBy}
            />
          )}

          {specimen && (
            <DetailLine
              darkMode={darkMode}
              icon={<DocumentIcon className="h-4 w-4" />}
              label={t.specimen}
              value={specimen}
            />
          )}
        </div>

        {/* ACTIONS */}

        <div
          className={`mt-6 grid grid-cols-2 gap-2 border-t pt-5 ${
            darkMode ? "border-white/10" : "border-emerald-950/10"
          }`}
        >
          {plantId ? (
            <Link
              href={`/plants/${plantId}`}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${
                darkMode
                  ? "border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/[0.08]"
                  : "border-emerald-950/10 bg-[#f7faf6] text-slate-700 hover:bg-emerald-50"
              }`}
            >
              <EyeIcon className="h-4 w-4" />

              {t.view}
            </Link>
          ) : (
            <span />
          )}

          {plantId && (
            <Link
              href={`/account/plants/${plantId}/edit`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 text-sm font-black text-white transition hover:bg-emerald-600"
            >
              <EditIcon className="h-4 w-4" />

              {t.edit}
            </Link>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent transition-all duration-500 group-hover:w-3/4" />
    </article>
  );
}

/* =========================================================
   DETAIL LINE
========================================================= */

function DetailLine({ darkMode, icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          darkMode
            ? "bg-white/[0.04] text-emerald-300"
            : "bg-emerald-800/[0.07] text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className={`text-[9px] font-bold uppercase tracking-[0.1em] ${
            darkMode ? "text-gray-500" : "text-slate-400"
          }`}
        >
          {label}
        </p>

        <p
          className={`mt-0.5 truncate text-xs font-semibold ${
            darkMode ? "text-gray-300" : "text-slate-700"
          }`}
          title={value}
        >
          {value}
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

function LocationIcon({ className = "" }) {
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
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" />
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

function KeyIcon({ className = "" }) {
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
      <circle cx="8" cy="12" r="4" />

      <path d="M12 12h9" />
      <path d="M18 12v3" />
      <path d="M15 12v2" />
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
