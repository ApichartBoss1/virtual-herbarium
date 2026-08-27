"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

export default function AccountPage() {
  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [plants, setPlants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [plantsLoading, setPlantsLoading] = useState(false);

  const [error, setError] = useState("");

  const text = {
    TH: {
      title: "บัญชีของฉัน",
      subtitle: "จัดการข้อมูลบัญชีและพรรณไม้ที่คุณเพิ่มไว้",

      accountInfo: "ข้อมูลบัญชี",
      username: "ชื่อผู้ใช้",
      email: "อีเมล",
      memberSince: "เป็นสมาชิกตั้งแต่",
      verified: "ยืนยันอีเมลแล้ว",
      unverified: "ยังไม่ได้ยืนยันอีเมล",

      myPlants: "พรรณไม้ของฉัน",
      myPlantsDescription:
        "ข้อมูลพรรณไม้ทั้งหมดที่คุณเพิ่มเข้าสู่ Virtual Herbarium",

      addPlant: "เพิ่มข้อมูลพรรณไม้",
      edit: "แก้ไขข้อมูล",
      view: "ดูรายละเอียด",

      noPlants: "ยังไม่มีข้อมูลพรรณไม้",
      noPlantsDescription: "เริ่มต้นเพิ่มข้อมูลพรรณไม้ของคุณเข้าสู่คลังข้อมูล",

      loading: "กำลังโหลดข้อมูล...",
      loadingPlants: "กำลังโหลดข้อมูลพรรณไม้...",

      family: "วงศ์",
      province: "จังหวัด",
      location: "สถานที่",
      collectedBy: "ผู้เก็บตัวอย่าง",
      specimen: "หมายเลขตัวอย่าง",

      accountSecurity: "ความปลอดภัยของบัญชี",
      changePassword: "เปลี่ยนรหัสผ่าน",

      logout: "ออกจากระบบ",

      login: "เข้าสู่ระบบ",
      register: "สมัครสมาชิก",

      loadError: "ไม่สามารถโหลดข้อมูลพรรณไม้ได้",
      retry: "ลองอีกครั้ง",
    },

    EN: {
      title: "My Account",
      subtitle: "Manage your account and plant records.",

      accountInfo: "Account Information",
      username: "Username",
      email: "Email",
      memberSince: "Member since",
      verified: "Email verified",
      unverified: "Email not verified",

      myPlants: "My Plants",
      myPlantsDescription:
        "Plant records that you have added to the Virtual Herbarium.",

      addPlant: "Add Plant",
      edit: "Edit",
      view: "View Details",

      noPlants: "No plants yet",
      noPlantsDescription: "Start by adding your first plant record.",

      loading: "Loading...",
      loadingPlants: "Loading plants...",

      family: "Family",
      province: "Province",
      location: "Location",
      collectedBy: "Collected by",
      specimen: "Specimen number",

      accountSecurity: "Account Security",
      changePassword: "Change Password",

      logout: "Sign Out",

      login: "Login",
      register: "Register",

      loadError: "Unable to load your plants.",
      retry: "Try Again",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!mounted) return;

        if (!user) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(user);

        // ==========================================
        // LOAD PROFILE
        // ==========================================

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) return;

        if (profileError) {
          console.error("Load profile error:", profileError);

          // ไม่หยุดหน้า Account
          // ถ้าตารางมีปัญหาให้ใช้ข้อมูลจาก Auth ต่อ
          setProfile(null);
        } else {
          setProfile(profileData || null);
        }

        // ==========================================
        // LOAD PLANTS
        // ==========================================

        await fetchMyPlants(user.id);
      } catch (err) {
        console.error("Account loading error:", err);

        if (mounted) {
          setError(
            err?.message ||
              (isEnglish
                ? "Unable to load account."
                : "ไม่สามารถโหลดข้อมูลบัญชีได้"),
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const currentUser = session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        // ==========================================
        // RELOAD PROFILE
        // ==========================================

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (!profileError) {
          setProfile(profileData || null);
        }

        await fetchMyPlants(currentUser.id);
      } else {
        setProfile(null);
        setPlants([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isEnglish]);

  // =====================================================
  // FETCH MY PLANTS
  // =====================================================

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

      setError(
        err?.message ||
          (isEnglish
            ? "Unable to load your plants."
            : "ไม่สามารถโหลดข้อมูลพรรณไม้ของคุณได้"),
      );
    } finally {
      setPlantsLoading(false);
    }
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);

      setError(
        err?.message ||
          (isEnglish ? "Unable to sign out." : "ไม่สามารถออกจากระบบได้"),
      );
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main
        className={`min-h-screen transition-colors duration-300 ${
          darkMode ? "bg-[#07100c] text-white" : "bg-[#f6faf8] text-gray-950"
        }`}
      >
        <Navbar />

        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-5">
          <div className="text-center">
            <div
              className={`mx-auto h-11 w-11 animate-spin rounded-full border-[3px] ${
                darkMode
                  ? "border-white/10 border-t-emerald-400"
                  : "border-emerald-100 border-t-emerald-600"
              }`}
            />

            <p
              className={`mt-5 text-sm font-medium ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {t.loading}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // NOT LOGGED IN
  // =====================================================

  if (!user) {
    return (
      <main
        className={`min-h-screen transition-colors duration-300 ${
          darkMode ? "bg-[#07100c] text-white" : "bg-[#f6faf8] text-gray-950"
        }`}
      >
        <Navbar />

        <section className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-5 py-12">
          <div
            className={`w-full rounded-[2rem] border p-8 text-center shadow-2xl sm:p-12 ${
              darkMode
                ? "border-white/10 bg-[#0c1712]"
                : "border-emerald-100 bg-white"
            }`}
          >
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-sm font-black ${
                darkMode
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              VH
            </div>

            <h1 className="mt-7 text-2xl font-black tracking-tight sm:text-3xl">
              {isEnglish ? "You are not signed in" : "กรุณาเข้าสู่ระบบ"}
            </h1>

            <p
              className={`mx-auto mt-3 max-w-md text-sm leading-7 ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {isEnglish
                ? "Sign in to manage your plant collection."
                : "เข้าสู่ระบบเพื่อจัดการข้อมูลพรรณไม้ของคุณ"}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                {t.login}
              </Link>

              <Link
                href="/register"
                className={`inline-flex min-h-12 items-center justify-center rounded-xl border px-6 py-3 text-sm font-bold transition ${
                  darkMode
                    ? "border-white/15 bg-white/[0.05] text-white hover:bg-white/[0.09]"
                    : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
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

  // =====================================================
  // USER DATA
  // =====================================================

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
        isEnglish ? "en-US" : "th-TH",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      )
    : "-";

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-[#07100c] text-white" : "bg-[#f6faf8] text-gray-950"
      }`}
    >
      <Navbar />

      {/* PAGE HEADER */}

      <section
        className={`border-b ${
          darkMode
            ? "border-white/10 bg-[#09150f]"
            : "border-emerald-100 bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span
                className={`inline-flex rounded-full border px-4 py-2 text-xs font-bold tracking-wide ${
                  darkMode
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                Virtual Herbarium
              </span>

              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                {t.title}
              </h1>

              <p
                className={`mt-4 max-w-2xl text-sm leading-7 sm:text-base ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {t.subtitle}
              </p>
            </div>

            <Link
              href="/account/plants/new"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
            >
              <span className="mr-2 text-xl leading-none">+</span>
              {t.addPlant}
            </Link>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="space-y-7">
          {/* ACCOUNT INFORMATION */}

          <section
            className={`overflow-hidden rounded-[1.75rem] border shadow-lg ${
              darkMode
                ? "border-white/10 bg-[#0c1712]"
                : "border-emerald-100 bg-white"
            }`}
          >
            <div className="h-1 bg-emerald-600" />

            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-5">
                  {/* ======================================
                      PROFILE IMAGE
                  ====================================== */}

                  <div
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-3xl ${
                      darkMode ? "bg-emerald-500/15" : "bg-emerald-50"
                    }`}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={username}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center text-2xl font-black ${
                          darkMode ? "text-emerald-300" : "text-emerald-700"
                        }`}
                      >
                        VH
                      </div>
                    )}
                  </div>

                  {/* USER INFO */}

                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-black tracking-tight">
                      {username}
                    </h2>

                    <p
                      className={`mt-1 truncate text-sm font-medium ${
                        darkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {email}
                    </p>

                    <div className="mt-3">
                      {user.email_confirmed_at ? (
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${
                            darkMode
                              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {t.verified}
                        </span>
                      ) : (
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${
                            darkMode
                              ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                              : "border-yellow-200 bg-yellow-50 text-yellow-700"
                          }`}
                        >
                          {t.unverified}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:w-auto">
                  <Link
                    href="/account/edit"
                    className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-5 py-3 text-sm font-bold transition ${
                      darkMode
                        ? "border-white/15 bg-white/[0.05] text-white hover:bg-white/[0.09]"
                        : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {isEnglish ? "Edit Profile" : "แก้ไขข้อมูลบัญชี"}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition ${
                      darkMode
                        ? "bg-red-500/10 text-red-300 hover:bg-red-500/20"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    {t.logout}
                  </button>
                </div>
              </div>

              {/* ACCOUNT DETAILS */}

              <div className="mt-8 grid gap-4 border-t border-gray-200 pt-8 md:grid-cols-3 dark:border-white/10">
                <InfoBox
                  label={t.username}
                  value={username}
                  darkMode={darkMode}
                />

                <InfoBox label={t.email} value={email} darkMode={darkMode} />

                <InfoBox
                  label={t.memberSince}
                  value={joinedDate}
                  darkMode={darkMode}
                />
              </div>
            </div>
          </section>

          {/* MY PLANTS */}

          <section
            className={`rounded-[1.75rem] border p-6 shadow-lg sm:p-8 ${
              darkMode
                ? "border-white/10 bg-[#0c1712]"
                : "border-emerald-100 bg-white"
            }`}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-8 w-1 rounded-full bg-emerald-600" />

                  <h2 className="text-2xl font-black tracking-tight">
                    {t.myPlants}
                  </h2>
                </div>

                <p
                  className={`mt-3 max-w-2xl text-sm leading-7 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {t.myPlantsDescription}
                </p>
              </div>

              <Link
                href="/account/plants/new"
                className="inline-flex min-h-11 w-fit items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/10 transition hover:bg-emerald-700"
              >
                <span className="mr-2 text-xl leading-none">+</span>
                {t.addPlant}
              </Link>
            </div>

            {error && (
              <div
                className={`mt-7 rounded-2xl border p-5 ${
                  darkMode
                    ? "border-red-400/20 bg-red-500/10 text-red-200"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <p className="text-sm font-semibold leading-6">{error}</p>

                <button
                  type="button"
                  onClick={() => fetchMyPlants(user.id)}
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  {t.retry}
                </button>
              </div>
            )}

            {plantsLoading && (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-center">
                  <div
                    className={`mx-auto h-11 w-11 animate-spin rounded-full border-[3px] ${
                      darkMode
                        ? "border-white/10 border-t-emerald-400"
                        : "border-emerald-100 border-t-emerald-600"
                    }`}
                  />

                  <p
                    className={`mt-5 text-sm font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {t.loadingPlants}
                  </p>
                </div>
              </div>
            )}

            {!plantsLoading && plants.length === 0 && !error && (
              <div
                className={`mt-8 rounded-3xl border border-dashed p-10 text-center sm:p-14 ${
                  darkMode
                    ? "border-white/15 bg-white/[0.025]"
                    : "border-gray-200 bg-gray-50/70"
                }`}
              >
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-sm font-black ${
                    darkMode
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  VH
                </div>

                <h3 className="mt-6 text-xl font-black">{t.noPlants}</h3>

                <p
                  className={`mx-auto mt-3 max-w-md text-sm leading-7 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {t.noPlantsDescription}
                </p>

                <Link
                  href="/account/plants/new"
                  className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700"
                >
                  <span className="mr-2 text-xl leading-none">+</span>
                  {t.addPlant}
                </Link>
              </div>
            )}

            {!plantsLoading && plants.length > 0 && (
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

          {/* SECURITY */}

          <section
            className={`rounded-[1.75rem] border p-6 shadow-lg sm:p-8 ${
              darkMode
                ? "border-white/10 bg-[#0c1712]"
                : "border-emerald-100 bg-white"
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">{t.accountSecurity}</h2>

                <p
                  className={`mt-2 text-sm leading-6 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {isEnglish
                    ? "Keep your account secure."
                    : "จัดการความปลอดภัยของบัญชี"}
                </p>
              </div>

              <Link
                href="/forgot-password"
                className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-5 py-3 text-sm font-bold transition ${
                  darkMode
                    ? "border-white/15 bg-white/[0.05] text-white hover:bg-white/[0.09]"
                    : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                }`}
              >
                {t.changePassword}
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

/* =====================================================
   MY PLANT CARD
===================================================== */

function MyPlantCard({ plant, isEnglish, darkMode, t }) {
  const plantId = plant.id || plant.plant_id;

  const image = plant.image_url || "";

  const name =
    plant.common_name || (isEnglish ? "Unnamed Plant" : "ไม่ระบุชื่อพรรณไม้");

  const botanicalName = plant.botanical_name || "";
  const family = plant.family || "";
  const province = plant.province || "";
  const location = plant.location || "";
  const collectedBy = plant.collected_by || "";
  const specimen = plant.specimen_number || "";

  return (
    <article
      className={`group overflow-hidden rounded-2xl border transition duration-300 ${
        darkMode
          ? "border-white/10 bg-[#0a1410] hover:border-emerald-400/30 hover:bg-[#0d1a14]"
          : "border-gray-200 bg-white hover:border-emerald-200 hover:shadow-xl"
      }`}
    >
      <div
        className={`relative aspect-[4/3] overflow-hidden ${
          darkMode ? "bg-[#102019]" : "bg-emerald-50"
        }`}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div
              className={`text-center ${
                darkMode ? "text-emerald-300" : "text-emerald-700"
              }`}
            >
              <div className="text-3xl font-black">VH</div>

              <p
                className={`mt-2 text-xs font-medium ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Virtual Herbarium
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3
          className={`line-clamp-2 text-lg font-black leading-7 ${
            darkMode ? "text-white" : "text-gray-950"
          }`}
        >
          {name}
        </h3>

        {botanicalName && (
          <p
            className={`mt-1 line-clamp-1 text-sm italic leading-6 ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {botanicalName}
          </p>
        )}

        {family && (
          <div className="mt-4">
            <span
              className={`inline-flex max-w-full rounded-full border px-3 py-1.5 text-xs font-bold ${
                darkMode
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {isEnglish ? `Family: ${family}` : `วงศ์: ${family}`}
            </span>
          </div>
        )}

        <div className="mt-5 space-y-2.5">
          {province && (
            <DetailLine
              label={t.province}
              value={province}
              darkMode={darkMode}
            />
          )}

          {location && (
            <DetailLine
              label={t.location}
              value={location}
              darkMode={darkMode}
            />
          )}

          {collectedBy && (
            <DetailLine
              label={t.collectedBy}
              value={collectedBy}
              darkMode={darkMode}
            />
          )}

          {specimen && (
            <DetailLine
              label={t.specimen}
              value={specimen}
              darkMode={darkMode}
            />
          )}
        </div>

        <div
          className={`mt-6 grid grid-cols-2 gap-2 border-t pt-5 ${
            darkMode ? "border-white/10" : "border-gray-200"
          }`}
        >
          {plantId ? (
            <Link
              href={`/plants/${plantId}`}
              className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-3 py-2.5 text-center text-sm font-bold transition ${
                darkMode
                  ? "border-white/15 bg-white/[0.05] text-white hover:bg-white/[0.10]"
                  : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              {t.view}
            </Link>
          ) : (
            <span />
          )}

          {plantId && (
            <Link
              href={`/account/plants/${plantId}/edit`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-3 py-2.5 text-center text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              {t.edit}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/* =====================================================
   DETAIL LINE
===================================================== */

function DetailLine({ label, value, darkMode }) {
  return (
    <div className="flex items-start gap-2 text-sm leading-6">
      <span
        className={`shrink-0 font-semibold ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {label}:
      </span>

      <span
        className={`min-w-0 line-clamp-1 break-words font-medium ${
          darkMode ? "text-gray-100" : "text-gray-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* =====================================================
   INFO BOX
===================================================== */

function InfoBox({ label, value, darkMode }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        darkMode
          ? "border-white/10 bg-white/[0.035]"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <p
        className={`text-xs font-bold tracking-wide ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-2 break-words text-sm font-bold leading-6 ${
          darkMode ? "text-white" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
