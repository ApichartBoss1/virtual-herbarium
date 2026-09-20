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

export default function MyPlantsPage() {
  const router = useRouter();

  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const [user, setUser] = useState(null);

  const [plants, setPlants] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [familyFilter, setFamilyFilter] = useState("");

  const [provinceFilter, setProvinceFilter] = useState("");

  const [sort, setSort] = useState("newest");

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "MY BOTANICAL COLLECTION",

      title: "คลังพรรณไม้ของฉัน",

      subtitle:
        "จัดการตัวอย่างพรรณไม้ที่คุณเพิ่มเข้าสู่ Virtual Herbarium ค้นหา ตรวจสอบ และกลับมาแก้ไขข้อมูลได้จากพื้นที่เดียว",

      backAccount: "กลับไปหน้าบัญชี",

      addPlant: "เพิ่มข้อมูลพรรณไม้",

      totalPlants: "ตัวอย่างทั้งหมด",

      families: "วงศ์พืช",

      provinces: "จังหวัด",

      records: "รายการ",

      familyUnit: "วงศ์",

      provinceUnit: "จังหวัด",

      searchLabel: "ค้นหาในคลังของฉัน",

      searchPlaceholder: "ค้นหาชื่อพรรณไม้ ชื่อวิทยาศาสตร์ วงศ์ หรือสถานที่...",

      allFamilies: "ทุกวงศ์",

      allProvinces: "ทุกจังหวัด",

      newest: "เพิ่มล่าสุด",

      oldest: "เพิ่มเก่าสุด",

      nameAZ: "ชื่อ A-Z",

      nameZA: "ชื่อ Z-A",

      clear: "ล้างตัวกรอง",

      refresh: "โหลดใหม่",

      collectionLabel: "MY SPECIMENS",

      collectionTitle: "รายการตัวอย่างพรรณไม้",

      found: "พบ",

      result: "รายการ",

      family: "วงศ์",

      location: "สถานที่",

      province: "จังหวัด",

      collector: "ผู้เก็บตัวอย่าง",

      specimen: "หมายเลขตัวอย่าง",

      view: "ดูรายละเอียด",

      edit: "แก้ไข",

      noPlants: "ยังไม่มีข้อมูลพรรณไม้",

      noPlantsDescription:
        "เริ่มสร้างคลังพรรณไม้ส่วนตัวของคุณด้วยการเพิ่มตัวอย่างแรก",

      noResults: "ไม่พบข้อมูลที่ตรงกับการค้นหา",

      noResultsDescription: "ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองบางรายการ",

      loading: "กำลังเปิดคลังพรรณไม้ของคุณ...",

      loadError: "ไม่สามารถโหลดข้อมูลพรรณไม้ได้",

      retry: "ลองอีกครั้ง",

      loginRequired: "กรุณาเข้าสู่ระบบ",

      loginDescription: "เข้าสู่ระบบเพื่อจัดการคลังพรรณไม้ส่วนตัวของคุณ",

      login: "เข้าสู่ระบบ",

      register: "สมัครสมาชิก",

      unknownPlant: "ไม่ระบุชื่อพรรณไม้",

      specimenBadge: "MY SPECIMEN",
    },

    EN: {
      eyebrow: "MY BOTANICAL COLLECTION",

      title: "My Plant Collection",

      subtitle:
        "Manage the plant specimens you have contributed to the Virtual Herbarium. Search, review and return to edit your records from one place.",

      backAccount: "Back to Account",

      addPlant: "Add Plant Record",

      totalPlants: "Total Specimens",

      families: "Plant Families",

      provinces: "Provinces",

      records: "records",

      familyUnit: "families",

      provinceUnit: "provinces",

      searchLabel: "Search My Collection",

      searchPlaceholder:
        "Search plant name, scientific name, family or location...",

      allFamilies: "All Families",

      allProvinces: "All Provinces",

      newest: "Newest First",

      oldest: "Oldest First",

      nameAZ: "Name A-Z",

      nameZA: "Name Z-A",

      clear: "Clear Filters",

      refresh: "Refresh",

      collectionLabel: "MY SPECIMENS",

      collectionTitle: "Plant Records",

      found: "Found",

      result: "records",

      family: "Family",

      location: "Location",

      province: "Province",

      collector: "Collected by",

      specimen: "Specimen number",

      view: "View Details",

      edit: "Edit",

      noPlants: "No plant records yet",

      noPlantsDescription:
        "Begin your personal herbarium by adding your first plant specimen.",

      noResults: "No matching plant records",

      noResultsDescription:
        "Try another search term or remove some active filters.",

      loading: "Opening your plant collection...",

      loadError: "Unable to load your plant records",

      retry: "Try Again",

      loginRequired: "Please sign in",

      loginDescription: "Sign in to manage your personal plant collection.",

      login: "Login",

      register: "Register",

      unknownPlant: "Unnamed Plant",

      specimenBadge: "MY SPECIMEN",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     FETCH PLANTS
  ===================================================== */

  async function fetchPlants(userId, showRefresh = false) {
    if (!userId) {
      return;
    }

    if (showRefresh) {
      setRefreshing(true);
    }

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
      if (showRefresh) {
        setRefreshing(false);
      }
    }
  }

  /* =====================================================
     LOAD USER
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

        if (!mounted) {
          return;
        }

        if (userError) {
          throw userError;
        }

        if (!currentUser) {
          setUser(null);
          setPlants([]);

          return;
        }

        setUser(currentUser);

        await fetchPlants(currentUser.id);
      } catch (err) {
        console.error("Load collection error:", err);

        if (!mounted) {
          return;
        }

        setError(err?.message || t.loadError);
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

      if (currentUser) {
        await fetchPlants(currentUser.id);
      } else {
        setPlants([]);
      }
    });

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, [isEnglish]);

  /* =====================================================
     FILTER OPTIONS
  ===================================================== */

  const families = useMemo(() => {
    return [
      ...new Set(plants.map((plant) => plant.family).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, isEnglish ? "en" : "th"));
  }, [plants, isEnglish]);

  const provinces = useMemo(() => {
    return [
      ...new Set(plants.map((plant) => plant.province).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, isEnglish ? "en" : "th"));
  }, [plants, isEnglish]);

  /* =====================================================
     FILTER + SORT
  ===================================================== */

  const filteredPlants = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = plants.filter((plant) => {
      const searchable = [
        plant.common_name,
        plant.botanical_name,
        plant.family,
        plant.province,
        plant.district,
        plant.location,
        plant.habitat,
        plant.collected_by,
        plant.specimen_number,
        plant.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchable.includes(keyword);

      const matchesFamily = !familyFilter || plant.family === familyFilter;

      const matchesProvince =
        !provinceFilter || plant.province === provinceFilter;

      return matchesSearch && matchesFamily && matchesProvince;
    });

    result.sort((a, b) => {
      if (sort === "nameAZ") {
        return (a.common_name || a.botanical_name || "").localeCompare(
          b.common_name || b.botanical_name || "",
          isEnglish ? "en" : "th",
        );
      }

      if (sort === "nameZA") {
        return (b.common_name || b.botanical_name || "").localeCompare(
          a.common_name || a.botanical_name || "",
          isEnglish ? "en" : "th",
        );
      }

      if (sort === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }

      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return result;
  }, [plants, search, familyFilter, provinceFilter, sort, isEnglish]);

  /* =====================================================
     STATS
  ===================================================== */

  const stats = useMemo(() => {
    return {
      plants: plants.length,

      families: new Set(plants.map((plant) => plant.family).filter(Boolean))
        .size,

      provinces: new Set(plants.map((plant) => plant.province).filter(Boolean))
        .size,
    };
  }, [plants]);

  /* =====================================================
     FILTER HELPERS
  ===================================================== */

  const hasFilters = Boolean(
    search.trim() || familyFilter || provinceFilter || sort !== "newest",
  );

  function clearFilters() {
    setSearch("");
    setFamilyFilter("");
    setProvinceFilter("");
    setSort("newest");
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="page">
        <Navbar />

        <section className="relative flex min-h-[calc(100svh-78px)] items-center justify-center overflow-hidden">
          <div
            className={`absolute left-1/2 top-[-220px] h-[650px] w-[900px] -translate-x-1/2 rounded-full blur-3xl ${
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
                ? "bg-[linear-gradient(90deg,rgba(2,9,5,0.95),rgba(3,14,7,0.80))]"
                : "bg-[linear-gradient(90deg,rgba(238,246,236,0.95),rgba(236,245,234,0.80))]"
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
              <CollectionIcon className="h-7 w-7" />
            </div>

            <h1
              className={`mt-6 text-2xl font-black ${
                darkMode ? "text-white" : "text-[#14271a]"
              }`}
            >
              {t.loginRequired}
            </h1>

            <p
              className={`mx-auto mt-3 max-w-md text-sm leading-7 ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              {t.loginDescription}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-600"
              >
                {t.login}
              </Link>

              <Link
                href="/register"
                className={`inline-flex min-h-12 items-center justify-center rounded-xl border px-5 text-sm font-bold transition ${
                  darkMode
                    ? "border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.09]"
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
     PAGE
  ===================================================== */

  return (
    <main className="page overflow-hidden">
      <Navbar />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-30 bg-cover bg-center"
          style={{
            backgroundImage: `url("${FOREST_IMAGE}")`,
          }}
        />

        <div
          className={`absolute inset-0 -z-20 ${
            darkMode
              ? "bg-[linear-gradient(90deg,rgba(2,9,5,0.97)_0%,rgba(3,14,7,0.89)_52%,rgba(3,14,7,0.66)_100%)]"
              : "bg-[linear-gradient(90deg,rgba(238,246,236,0.97)_0%,rgba(238,246,236,0.91)_52%,rgba(235,244,233,0.74)_100%)]"
          }`}
        />

        <div
          className={`absolute inset-x-0 bottom-0 -z-10 h-32 ${
            darkMode
              ? "bg-gradient-to-t from-[#07100b] to-transparent"
              : "bg-gradient-to-t from-[#f1f6f1] to-transparent"
          }`}
        />

        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className={`absolute -top-52 right-[10%] h-[700px] w-28 rotate-[24deg] blur-3xl ${
              darkMode
                ? "bg-gradient-to-b from-emerald-100/10 to-transparent"
                : "bg-gradient-to-b from-white/60 to-transparent"
            }`}
          />

          <div className="forest-particle left-[12%] top-[35%]" />

          <div className="forest-particle right-[22%] top-[30%] [animation-delay:-3s]" />

          <div className="forest-particle right-[8%] top-[66%] [animation-delay:-5s]" />
        </div>

        <div className="container">
          <div className="py-14 sm:py-16 lg:py-20">
            {/* BACK */}

            <Link
              href="/account"
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold backdrop-blur-xl transition ${
                darkMode
                  ? "border-white/10 bg-black/20 text-gray-300 hover:bg-white/[0.08] hover:text-white"
                  : "border-emerald-950/10 bg-white/55 text-emerald-900 hover:bg-white/80"
              }`}
            >
              <ArrowLeftIcon className="h-4 w-4" />

              {t.backAccount}
            </Link>

            {/* TITLE */}

            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
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

                <h1
                  className={`mt-6 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-6xl ${
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

              <Link
                href="/account/plants/new"
                className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-emerald-700 px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(6,78,45,0.30)] transition hover:-translate-y-0.5 hover:bg-emerald-600 lg:self-auto"
              >
                <PlusIcon className="h-5 w-5" />

                {t.addPlant}
              </Link>
            </div>

            {/* STATS */}

            <div className="mt-10 grid max-w-4xl gap-3 sm:grid-cols-3">
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
          CONTENT
      ===================================================== */}

      <section className="container py-10 sm:py-14">
        {/* =================================================
            SEARCH
        ================================================= */}

        <div
          className={`relative overflow-hidden rounded-[1.8rem] border p-5 shadow-xl sm:p-6 ${
            darkMode
              ? "border-white/10 bg-[#0a1710] shadow-black/20"
              : "border-emerald-950/10 bg-white/85 shadow-emerald-950/10"
          }`}
        >
          <div
            className={`absolute inset-x-12 top-0 h-px ${
              darkMode
                ? "bg-gradient-to-r from-transparent via-emerald-400/45 to-transparent"
                : "bg-gradient-to-r from-transparent via-emerald-700/25 to-transparent"
            }`}
          />

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className={`text-[9px] font-black tracking-[0.17em] ${
                  darkMode ? "text-emerald-400" : "text-emerald-700"
                }`}
              >
                COLLECTION TOOLS
              </p>

              <h2
                className={`mt-2 text-xl font-black ${
                  darkMode ? "text-white" : "text-[#14271a]"
                }`}
              >
                {t.searchLabel}
              </h2>
            </div>

            <div className="flex gap-2">
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition ${
                    darkMode
                      ? "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.08]"
                      : "border-emerald-950/10 bg-white text-slate-600 hover:bg-emerald-50"
                  }`}
                >
                  <CloseIcon className="h-4 w-4" />

                  {t.clear}
                </button>
              )}

              <button
                type="button"
                onClick={() => fetchPlants(user.id, true)}
                disabled={refreshing}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition disabled:opacity-50 ${
                  darkMode
                    ? "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.08]"
                    : "border-emerald-950/10 bg-white text-slate-600 hover:bg-emerald-50"
                }`}
              >
                <RefreshIcon
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />

                {t.refresh}
              </button>
            </div>
          </div>

          {/* SEARCH INPUT */}

          <div className="mt-6">
            <div className="relative">
              <SearchIcon
                className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                  darkMode ? "text-gray-500" : "text-slate-400"
                }`}
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`h-[52px] w-full rounded-xl border pl-12 pr-4 text-sm outline-none transition ${
                  darkMode
                    ? "border-white/10 bg-black/20 text-white placeholder:text-gray-600 focus:border-emerald-400/45 focus:bg-black/30 focus:ring-4 focus:ring-emerald-400/[0.06]"
                    : "border-emerald-950/10 bg-[#f7faf6] text-slate-900 placeholder:text-slate-400 focus:border-emerald-700/35 focus:bg-white focus:ring-4 focus:ring-emerald-700/[0.06]"
                }`}
              />
            </div>
          </div>

          {/* FILTERS */}

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField
              darkMode={darkMode}
              value={familyFilter}
              onChange={setFamilyFilter}
              placeholder={t.allFamilies}
              options={families}
            />

            <SelectField
              darkMode={darkMode}
              value={provinceFilter}
              onChange={setProvinceFilter}
              placeholder={t.allProvinces}
              options={provinces}
            />

            <SelectField
              darkMode={darkMode}
              value={sort}
              onChange={setSort}
              options={["newest", "oldest", "nameAZ", "nameZA"]}
              labels={{
                newest: t.newest,

                oldest: t.oldest,

                nameAZ: t.nameAZ,

                nameZA: t.nameZA,
              }}
            />
          </div>
        </div>

        {/* =================================================
            COLLECTION HEADER
        ================================================= */}

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className={`text-[9px] font-black tracking-[0.18em] ${
                darkMode ? "text-emerald-400" : "text-emerald-700"
              }`}
            >
              {t.collectionLabel}
            </p>

            <h2
              className={`mt-2 text-2xl font-black tracking-tight sm:text-3xl ${
                darkMode ? "text-white" : "text-[#14271a]"
              }`}
            >
              {t.collectionTitle}
            </h2>

            <p
              className={`mt-2 text-sm ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              {t.found}{" "}
              <span
                className={`font-black ${
                  darkMode ? "text-emerald-300" : "text-emerald-700"
                }`}
              >
                {filteredPlants.length}
              </span>{" "}
              {t.result}
            </p>
          </div>

          <Link
            href="/account/plants/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-600"
          >
            <PlusIcon className="h-4 w-4" />

            {t.addPlant}
          </Link>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

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
                  onClick={() => fetchPlants(user.id, true)}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  <RefreshIcon className="h-4 w-4" />

                  {t.retry}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!error && plants.length === 0 && (
          <div
            className={`mt-8 rounded-[2rem] border border-dashed px-6 py-16 text-center ${
              darkMode
                ? "border-white/15 bg-white/[0.02]"
                : "border-emerald-950/10 bg-white/70"
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
              className={`mx-auto mt-3 max-w-lg text-sm leading-7 ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              {t.noPlantsDescription}
            </p>

            <Link
              href="/account/plants/new"
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-600"
            >
              <PlusIcon className="h-4 w-4" />

              {t.addPlant}
            </Link>
          </div>
        )}

        {/* =================================================
            NO FILTER RESULTS
        ================================================= */}

        {!error && plants.length > 0 && filteredPlants.length === 0 && (
          <div
            className={`mt-8 rounded-[2rem] border px-6 py-16 text-center ${
              darkMode
                ? "border-white/10 bg-[#0a1710]"
                : "border-emerald-950/10 bg-white/80"
            }`}
          >
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
                darkMode
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "bg-emerald-800/10 text-emerald-800"
              }`}
            >
              <SearchIcon className="h-7 w-7" />
            </div>

            <h3
              className={`mt-6 text-xl font-black ${
                darkMode ? "text-white" : "text-[#14271a]"
              }`}
            >
              {t.noResults}
            </h3>

            <p
              className={`mx-auto mt-3 max-w-lg text-sm leading-7 ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              {t.noResultsDescription}
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className={`mt-6 inline-flex min-h-11 items-center rounded-xl border px-5 text-sm font-bold transition ${
                darkMode
                  ? "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  : "border-emerald-950/10 bg-white text-slate-700 hover:bg-emerald-50"
              }`}
            >
              {t.clear}
            </button>
          </div>
        )}

        {/* =================================================
            GRID
        ================================================= */}

        {!error && filteredPlants.length > 0 && (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlants.map((plant) => (
              <PlantCard
                key={plant.id || plant.plant_id}
                plant={plant}
                darkMode={darkMode}
                t={t}
                isEnglish={isEnglish}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/* =========================================================
   PLANT CARD
========================================================= */

function PlantCard({ plant, darkMode, t, isEnglish }) {
  /*
   * ใช้ id ซึ่งเป็น UUID สำหรับ route
   * ไม่ใช้ plant_id เป็น fallback
   * เพื่อป้องกัน route UUID ผิดรูปแบบ
   */

  const plantId = plant.id || null;

  const image = plant.image_url || "";

  const name = plant.common_name || plant.botanical_name || t.unknownPlant;

  const botanicalName = plant.botanical_name || "";

  const family = plant.family || "";

  const location = [plant.location, plant.district, plant.province]
    .filter(Boolean)
    .join(", ");

  return (
    <article
      className={`group relative overflow-hidden rounded-[1.7rem] border transition duration-300 hover:-translate-y-1.5 ${
        darkMode
          ? "border-white/10 bg-[#08140d] hover:border-emerald-400/25 hover:shadow-[0_22px_55px_rgba(0,0,0,0.32)]"
          : "border-emerald-950/10 bg-white hover:border-emerald-700/20 hover:shadow-[0_22px_50px_rgba(25,55,34,0.12)]"
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

        <div className="absolute inset-0 bg-gradient-to-t from-[#020b05]/85 via-transparent to-black/10" />

        <div className="absolute left-4 top-4">
          <span className="inline-flex rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[9px] font-black tracking-[0.15em] text-white backdrop-blur-xl">
            {t.specimenBadge}
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
          {location && (
            <DetailRow
              darkMode={darkMode}
              icon={<PinIcon className="h-4 w-4" />}
              label={t.location}
              value={location}
            />
          )}

          {plant.collected_by && (
            <DetailRow
              darkMode={darkMode}
              icon={<UserIcon className="h-4 w-4" />}
              label={t.collector}
              value={plant.collected_by}
            />
          )}

          {plant.specimen_number && (
            <DetailRow
              darkMode={darkMode}
              icon={<DocumentIcon className="h-4 w-4" />}
              label={t.specimen}
              value={plant.specimen_number}
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

          {plantId ? (
            <Link
              href={`/account/plants/${plantId}/edit`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 text-sm font-black text-white transition hover:bg-emerald-600"
            >
              <EditIcon className="h-4 w-4" />

              {t.edit}
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent transition-all duration-500 group-hover:w-3/4" />
    </article>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({ darkMode, icon, label, value }) {
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
   SELECT
========================================================= */

function SelectField({
  darkMode,
  value,
  onChange,
  options,
  placeholder,
  labels = {},
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 w-full appearance-none rounded-xl border px-4 pr-10 text-sm font-medium outline-none transition ${
          darkMode
            ? "border-white/10 bg-black/20 text-gray-200 focus:border-emerald-400/40"
            : "border-emerald-950/10 bg-[#f7faf6] text-slate-700 focus:border-emerald-700/35 focus:bg-white"
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}

        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] || option}
          </option>
        ))}
      </select>

      <ChevronDownIcon
        className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 ${
          darkMode ? "text-gray-500" : "text-slate-400"
        }`}
      />
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

function SearchIcon({ className = "" }) {
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
      <circle cx="11" cy="11" r="7" />

      <path d="m20 20-4-4" />
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
      <path d="m7 7 10 10" />
      <path d="M17 7 7 17" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h10" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m7 10 5 5 5-5" />
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
