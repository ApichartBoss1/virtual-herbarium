"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

const FOREST_IMAGE =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=88";

export default function MyPlantsPage() {
  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const [user, setUser] = useState(null);
  const [plants, setPlants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [sort, setSort] = useState("newest");

  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "MY BOTANICAL COLLECTION",

      title: "คลังพรรณไม้ของฉัน",

      subtitle:
        "ค้นหา ตรวจสอบ และจัดการตัวอย่างพรรณไม้ที่คุณเพิ่มเข้าสู่ Virtual Herbarium ได้จากพื้นที่เดียว",

      backAccount: "กลับไปหน้าบัญชี",

      searchTitle: "ค้นหาและกรองข้อมูล",

      searchPlaceholder: "ค้นหาชื่อพรรณไม้ ชื่อวิทยาศาสตร์ วงศ์ หรือสถานที่...",

      allFamilies: "ทุกวงศ์",
      allProvinces: "ทุกจังหวัด",

      newest: "เพิ่มล่าสุด",
      oldest: "เพิ่มเก่าสุด",
      nameAZ: "ชื่อ A-Z",
      nameZA: "ชื่อ Z-A",

      clear: "ล้างตัวกรอง",

      collectionLabel: "MY SPECIMENS",
      collectionTitle: "รายการพรรณไม้",

      addPlant: "เพิ่มข้อมูลพรรณไม้",
      addMobile: "เพิ่มพรรณไม้",

      total: "ทั้งหมด",
      result: "รายการ",

      location: "สถานที่",
      collector: "ผู้เก็บตัวอย่าง",
      specimen: "หมายเลขตัวอย่าง",

      view: "รายละเอียด",
      viewShort: "ดู",
      edit: "แก้ไข",

      noPlants: "ยังไม่มีข้อมูลพรรณไม้",

      noPlantsDescription:
        "เมื่อคุณเพิ่มตัวอย่างพรรณไม้ ข้อมูลจะปรากฏในพื้นที่นี้",

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

      previous: "ก่อนหน้า",
      next: "ถัดไป",
      page: "หน้า",
      of: "จาก",
    },

    EN: {
      eyebrow: "MY BOTANICAL COLLECTION",

      title: "My Plant Collection",

      subtitle:
        "Search, review and manage the plant specimens you have contributed to the Virtual Herbarium from one organized space.",

      backAccount: "Back to Account",

      searchTitle: "Search & Filter",

      searchPlaceholder: "Search plant, scientific name, family or location...",

      allFamilies: "All Families",
      allProvinces: "All Provinces",

      newest: "Newest First",
      oldest: "Oldest First",
      nameAZ: "Name A-Z",
      nameZA: "Name Z-A",

      clear: "Clear Filters",

      collectionLabel: "MY SPECIMENS",
      collectionTitle: "Plant Records",

      addPlant: "Add Plant Record",
      addMobile: "Add Plant",

      total: "Total",
      result: "records",

      location: "Location",
      collector: "Collected by",
      specimen: "Specimen number",

      view: "Details",
      viewShort: "View",
      edit: "Edit",

      noPlants: "No plant records yet",

      noPlantsDescription:
        "Your plant specimens will appear here after you add them.",

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

      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     RESPONSIVE PAGE SIZE
     MOBILE = 10
     TABLET / DESKTOP = 12
  ===================================================== */

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");

    const updateViewport = () => {
      setIsMobile(media.matches);
    };

    updateViewport();

    media.addEventListener?.("change", updateViewport);

    return () => {
      media.removeEventListener?.("change", updateViewport);
    };
  }, []);

  /* =====================================================
     FETCH PLANTS
  ===================================================== */

  async function fetchPlants(userId) {
    if (!userId) return;

    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("plants")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        });

      if (fetchError) {
        throw fetchError;
      }

      setPlants(data || []);
    } catch (err) {
      console.error("Fetch my plants error:", err);

      setPlants([]);

      setError(err?.message || t.loadError);
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

        if (!mounted) return;

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

        if (!mounted) return;

        setError(err?.message || t.loadError);
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
      const aName = a.common_name || a.botanical_name || "";

      const bName = b.common_name || b.botanical_name || "";

      if (sort === "nameAZ") {
        return aName.localeCompare(bName, isEnglish ? "en" : "th");
      }

      if (sort === "nameZA") {
        return bName.localeCompare(aName, isEnglish ? "en" : "th");
      }

      if (sort === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }

      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return result;
  }, [plants, search, familyFilter, provinceFilter, sort, isEnglish]);

  /* =====================================================
     PAGINATION
  ===================================================== */

  const itemsPerPage = isMobile ? 10 : 12;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPlants.length / itemsPerPage),
  );

  const paginatedPlants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;

    return filteredPlants.slice(start, start + itemsPerPage);
  }, [filteredPlants, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, familyFilter, provinceFilter, sort, isMobile]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);

    requestAnimationFrame(() => {
      document.getElementById("my-specimens")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

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

    setCurrentPage(1);
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main
        className={`page min-h-screen overflow-x-hidden ${
          darkMode ? "bg-[#07100b] text-white" : "bg-[#f2f7f2] text-slate-900"
        }`}
      >
        <Navbar />

        <section className="flex min-h-[65dvh] items-center justify-center px-5">
          <div className="text-center">
            <LoadingIcon
              className={`mx-auto h-7 w-7 animate-spin ${
                darkMode ? "text-emerald-300" : "text-emerald-700"
              }`}
            />

            <p
              className={`mt-4 text-[13px] font-medium ${
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
      <main className="page min-h-screen overflow-x-hidden">
        <Navbar />

        <section className="relative isolate flex min-h-[calc(100dvh-58px)] items-center justify-center overflow-hidden px-4 py-10 md:min-h-[calc(100dvh-78px)]">
          <div
            className="absolute inset-0 -z-30 bg-cover bg-center"
            style={{
              backgroundImage: `url("${FOREST_IMAGE}")`,
            }}
          />

          <div
            className={`absolute inset-0 -z-20 ${
              darkMode
                ? "bg-[linear-gradient(90deg,rgba(2,9,5,.95),rgba(3,14,7,.82))]"
                : "bg-[linear-gradient(90deg,rgba(239,247,237,.96),rgba(237,246,235,.86))]"
            }`}
          />

          <div
            className={`w-full max-w-md rounded-[24px] border p-6 text-center shadow-xl backdrop-blur-2xl sm:p-8 ${
              darkMode
                ? "border-white/10 bg-[#07130c]/85"
                : "border-white/70 bg-white/85"
            }`}
          >
            <CollectionIcon
              className={`mx-auto h-8 w-8 ${
                darkMode ? "text-emerald-300" : "text-emerald-700"
              }`}
            />

            <h1 className="mt-5 text-xl font-black">{t.loginRequired}</h1>

            <p
              className={`mt-2 text-[13px] leading-6 ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              {t.loginDescription}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 text-sm font-black text-white"
              >
                {t.login}
              </Link>

              <Link
                href="/register"
                className={`inline-flex min-h-11 items-center justify-center rounded-xl border text-sm font-bold ${
                  darkMode
                    ? "border-white/10 bg-white/[0.04]"
                    : "border-emerald-950/10 bg-white"
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
    <main
      className={`page min-h-screen overflow-x-hidden ${
        darkMode ? "bg-[#07100b] text-white" : "bg-[#f2f7f2] text-slate-900"
      }`}
    >
      <Navbar />

      {/* =================================================
          HERO
      ================================================= */}

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
              ? "bg-[linear-gradient(90deg,rgba(2,9,5,.97)_0%,rgba(3,14,7,.90)_62%,rgba(3,14,7,.72)_100%)]"
              : "bg-[linear-gradient(90deg,rgba(240,247,239,.97)_0%,rgba(239,246,237,.94)_62%,rgba(237,245,235,.82)_100%)]"
          }`}
        />

        <div
          className={`absolute inset-x-0 bottom-0 -z-10 h-16 ${
            darkMode
              ? "bg-gradient-to-t from-[#07100b] to-transparent"
              : "bg-gradient-to-t from-[#f2f7f2] to-transparent"
          }`}
        />

        <div className="container">
          <div className="py-6 sm:py-8 lg:py-9">
            {/* DESKTOP BACK */}

            <Link
              href="/account"
              className={`hidden min-h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold backdrop-blur-xl transition md:inline-flex ${
                darkMode
                  ? "border-white/10 bg-black/20 text-gray-300 hover:bg-white/[0.08]"
                  : "border-emerald-950/10 bg-white/65 text-emerald-900 hover:bg-white"
              }`}
            >
              <ArrowLeftIcon className="h-4 w-4" />

              {t.backAccount}
            </Link>

            {/* TITLE */}

            <div className="max-w-3xl md:mt-5">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 backdrop-blur-xl ${
                  darkMode
                    ? "border-emerald-300/20 bg-black/20 text-emerald-200"
                    : "border-emerald-950/15 bg-white/60 text-emerald-900"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    darkMode ? "bg-emerald-400" : "bg-emerald-700"
                  }`}
                />

                <span className="text-[8px] font-black tracking-[0.18em] sm:text-[9px]">
                  {t.eyebrow}
                </span>
              </div>

              <h1
                className={`mt-3 font-black tracking-[-0.04em] ${
                  isEnglish
                    ? "text-[2rem] leading-[1.12] sm:text-[2.6rem]"
                    : "text-[2rem] leading-[1.25] sm:text-[2.7rem]"
                } ${darkMode ? "text-white" : "text-[#102218]"}`}
              >
                {t.title}
              </h1>

              <p
                className={`mt-3 max-w-2xl text-[13px] leading-[1.8] sm:text-[14px] sm:leading-7 ${
                  darkMode ? "text-[#bdccc1]" : "text-[#526858]"
                }`}
              >
                {t.subtitle}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="container pb-[calc(106px+env(safe-area-inset-bottom))] pt-5 sm:pb-12 sm:pt-7 lg:pt-8">
        {/* =================================================
            SEARCH
        ================================================= */}

        <section
          className={`rounded-[20px] border p-4 shadow-sm sm:p-5 ${
            darkMode
              ? "border-white/[0.08] bg-[#0a1710]"
              : "border-emerald-950/[0.07] bg-white"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              className={`text-[17px] font-black sm:text-lg ${
                darkMode ? "text-white" : "text-[#14271a]"
              }`}
            >
              {t.searchTitle}
            </h2>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition sm:text-xs ${
                  darkMode
                    ? "bg-white/[0.05] text-gray-300"
                    : "bg-emerald-50 text-emerald-800"
                }`}
              >
                {t.clear}
              </button>
            )}
          </div>

          {/* SEARCH INPUT */}

          <div className="relative mt-4">
            <SearchIcon
              className={`pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 ${
                darkMode ? "text-gray-500" : "text-slate-400"
              }`}
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.searchPlaceholder}
              className={`h-[48px] w-full rounded-[14px] border pl-11 pr-4 text-[13px] outline-none transition sm:text-sm ${
                darkMode
                  ? "border-white/10 bg-black/20 text-white placeholder:text-gray-600 focus:border-emerald-400/40"
                  : "border-emerald-950/10 bg-[#f8faf7] text-slate-900 placeholder:text-slate-400 focus:border-emerald-700/35 focus:bg-white"
              }`}
            />
          </div>

          {/* FILTERS */}

          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3">
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

            <div className="col-span-2 md:col-span-1">
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
        </section>

        {/* =================================================
            SPECIMENS
        ================================================= */}

        <section
          id="my-specimens"
          className={`mt-5 scroll-mt-24 rounded-[22px] border p-4 shadow-sm sm:mt-6 sm:p-5 lg:p-6 ${
            darkMode
              ? "border-white/[0.08] bg-[#09150f]"
              : "border-emerald-950/[0.07] bg-white/90"
          }`}
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <div
            className={`flex items-start justify-between gap-4 border-b pb-4 sm:items-center sm:pb-5 ${
              darkMode ? "border-white/[0.08]" : "border-emerald-950/[0.08]"
            }`}
          >
            {/* LEFT */}

            <div className="min-w-0 flex-1">
              <p
                className={`text-[8px] font-black tracking-[0.19em] sm:text-[9px] ${
                  darkMode ? "text-emerald-400" : "text-emerald-700"
                }`}
              >
                {t.collectionLabel}
              </p>

              <div className="mt-1.5">
                <h2
                  className={`font-black tracking-[-0.025em] ${
                    isEnglish
                      ? "text-xl leading-7 sm:text-2xl"
                      : "text-[1.4rem] leading-[1.35] sm:text-[1.7rem]"
                  } ${darkMode ? "text-white" : "text-[#14271a]"}`}
                >
                  {t.collectionTitle}
                </h2>

                <p
                  className={`mt-1.5 text-[10px] leading-5 sm:text-xs ${
                    darkMode ? "text-gray-500" : "text-slate-500"
                  }`}
                >
                  {t.total}{" "}
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
            </div>

            {/* =================================================
                ADD PLANT BUTTON
            ================================================= */}

            <Link
              href="/account/plants/new"
              aria-label={t.addPlant}
              className="group inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[#087f5b] px-3 py-2 text-white shadow-[0_8px_22px_rgba(5,110,78,0.24)] ring-1 ring-emerald-950/5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#067354] hover:shadow-[0_11px_26px_rgba(5,110,78,0.28)] active:translate-y-0 active:scale-[0.98] sm:min-h-[46px] sm:gap-2.5 sm:px-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-white/15 text-white transition group-hover:bg-white/20 sm:h-8 sm:w-8">
                <PlusIcon className="h-4 w-4 sm:h-[17px] sm:w-[17px]" />
              </span>

              <span className="whitespace-nowrap text-[11px] font-black leading-none text-white sm:text-[12px]">
                <span className="sm:hidden">{t.addMobile}</span>

                <span className="hidden sm:inline">{t.addPlant}</span>
              </span>
            </Link>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className={`mt-4 rounded-[16px] border p-4 ${
                darkMode
                  ? "border-red-400/15 bg-red-400/[0.06]"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertIcon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    darkMode ? "text-red-300" : "text-red-700"
                  }`}
                />

                <div>
                  <p
                    className={`text-[12px] leading-5 ${
                      darkMode ? "text-red-200" : "text-red-700"
                    }`}
                  >
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={() => fetchPlants(user.id)}
                    className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-[11px] font-bold text-white"
                  >
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
            <div className="py-10 text-center sm:py-12">
              <div
                className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl ${
                  darkMode
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <LeafIcon className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-base font-black">{t.noPlants}</h3>

              <p
                className={`mx-auto mt-2 max-w-md text-[12px] leading-6 ${
                  darkMode ? "text-gray-400" : "text-slate-500"
                }`}
              >
                {t.noPlantsDescription}
              </p>
            </div>
          )}

          {/* =================================================
              NO RESULTS
          ================================================= */}

          {!error && plants.length > 0 && filteredPlants.length === 0 && (
            <div className="py-10 text-center sm:py-12">
              <SearchIcon
                className={`mx-auto h-7 w-7 ${
                  darkMode ? "text-emerald-300" : "text-emerald-700"
                }`}
              />

              <h3 className="mt-4 text-base font-black">{t.noResults}</h3>

              <p
                className={`mx-auto mt-2 max-w-md text-[12px] leading-6 ${
                  darkMode ? "text-gray-400" : "text-slate-500"
                }`}
              >
                {t.noResultsDescription}
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className={`mt-4 rounded-xl border px-4 py-2.5 text-xs font-bold ${
                  darkMode
                    ? "border-white/10 bg-white/[0.04]"
                    : "border-emerald-950/10 bg-white"
                }`}
              >
                {t.clear}
              </button>
            </div>
          )}

          {/* =================================================
              PLANT GRID

              PHONE = 2 CARDS / ROW
              DESKTOP = 3 CARDS / ROW
          ================================================= */}

          {!error && paginatedPlants.length > 0 && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {paginatedPlants.map((plant) => (
                  <PlantCard
                    key={plant.id || plant.plant_id}
                    plant={plant}
                    darkMode={darkMode}
                    t={t}
                    isEnglish={isEnglish}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  darkMode={darkMode}
                  t={t}
                />
              )}
            </>
          )}
        </section>
      </section>
    </main>
  );
}

/* =========================================================
   PLANT CARD
========================================================= */

function PlantCard({ plant, darkMode, t, isEnglish }) {
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
      className={`group flex min-w-0 flex-col overflow-hidden rounded-[16px] border transition duration-300 sm:rounded-[20px] ${
        darkMode
          ? "border-white/[0.09] bg-[#07120c] hover:border-emerald-400/25"
          : "border-emerald-950/[0.09] bg-white hover:border-emerald-700/20 hover:shadow-[0_12px_28px_rgba(25,55,34,0.08)]"
      }`}
    >
      {/* IMAGE */}

      <div className="relative aspect-[4/3] overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 sm:group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center ${
              darkMode ? "bg-[#102218]" : "bg-[#edf5ed]"
            }`}
          >
            <LeafIcon
              className={`h-8 w-8 sm:h-11 sm:w-11 ${
                darkMode ? "text-emerald-400/35" : "text-emerald-800/25"
              }`}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#06100a]/80 via-transparent to-transparent" />

        {/* BADGE */}

        <span className="absolute left-2 top-2 rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[6px] font-black tracking-[0.1em] text-white backdrop-blur-md sm:left-3 sm:top-3 sm:px-3 sm:text-[8px]">
          {t.specimenBadge}
        </span>

        {/* BOTANICAL NAME */}

        {botanicalName && (
          <p className="absolute bottom-2 left-2.5 right-2.5 truncate text-[9px] font-semibold italic text-emerald-200 sm:bottom-3 sm:left-3 sm:right-3 sm:text-[11px]">
            {botanicalName}
          </p>
        )}
      </div>

      {/* CONTENT */}

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3
          className={`line-clamp-2 font-black ${
            isEnglish
              ? "text-[13px] leading-[1.4] sm:text-base"
              : "text-[14px] leading-[1.5] sm:text-[17px]"
          } ${darkMode ? "text-white" : "text-[#14271a]"}`}
        >
          {name}
        </h3>

        {/* FAMILY */}

        {family && (
          <span
            className={`mt-2.5 inline-flex w-fit max-w-full truncate rounded-full border px-2 py-1 text-[8px] font-bold sm:px-2.5 sm:text-[9px] ${
              darkMode
                ? "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {isEnglish ? `Family: ${family}` : `วงศ์: ${family}`}
          </span>
        )}

        {/* MOBILE DETAILS */}

        <div className="mt-3 space-y-2 md:hidden">
          {plant.province && (
            <CompactDetail
              darkMode={darkMode}
              icon={<PinIcon className="h-3.5 w-3.5" />}
              value={plant.province}
            />
          )}

          {plant.specimen_number && (
            <CompactDetail
              darkMode={darkMode}
              icon={<DocumentIcon className="h-3.5 w-3.5" />}
              value={plant.specimen_number}
            />
          )}
        </div>

        {/* TABLET / DESKTOP DETAILS */}

        <div className="mt-4 hidden space-y-3 md:block">
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
          className={`mt-auto grid grid-cols-2 gap-2 border-t pt-3 md:mt-5 ${
            darkMode ? "border-white/[0.08]" : "border-emerald-950/[0.08]"
          }`}
        >
          {plantId ? (
            <Link
              href={`/plants/${plantId}`}
              className={`inline-flex min-h-[36px] min-w-0 items-center justify-center gap-1 rounded-[10px] border px-1 text-[9px] font-bold transition sm:min-h-10 sm:gap-1.5 sm:px-2 sm:text-[11px] ${
                darkMode
                  ? "border-white/10 bg-white/[0.03] text-gray-200"
                  : "border-emerald-950/10 bg-[#f8faf7] text-slate-700"
              }`}
            >
              <EyeIcon className="h-3.5 w-3.5 shrink-0" />

              <span className="truncate sm:hidden">{t.viewShort}</span>

              <span className="hidden truncate sm:inline">{t.view}</span>
            </Link>
          ) : (
            <span />
          )}

          {plantId ? (
            <Link
              href={`/account/plants/${plantId}/edit`}
              className="inline-flex min-h-[36px] min-w-0 items-center justify-center gap-1 rounded-[10px] bg-emerald-700 px-1 text-[9px] font-black text-white transition hover:bg-emerald-600 sm:min-h-10 sm:gap-1.5 sm:px-2 sm:text-[11px]"
            >
              <EditIcon className="h-3.5 w-3.5 shrink-0" />

              <span className="truncate">{t.edit}</span>
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   PAGINATION
========================================================= */

function Pagination({ currentPage, totalPages, onPageChange, darkMode, t }) {
  const pages = getPageItems(currentPage, totalPages);

  return (
    <div
      className={`mt-5 border-t pt-4 sm:mt-6 sm:pt-5 ${
        darkMode ? "border-white/[0.08]" : "border-emerald-950/[0.08]"
      }`}
    >
      {/* MOBILE */}

      <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 sm:hidden">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label={t.previous}
          className={`flex h-11 items-center justify-center rounded-xl border transition disabled:opacity-35 ${
            darkMode
              ? "border-white/10 bg-white/[0.03] text-gray-200"
              : "border-emerald-950/10 bg-white text-slate-700"
          }`}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <div
          className={`text-center text-[11px] font-semibold ${
            darkMode ? "text-gray-400" : "text-slate-500"
          }`}
        >
          {t.page}{" "}
          <span
            className={`font-black ${
              darkMode ? "text-white" : "text-[#173321]"
            }`}
          >
            {currentPage}
          </span>{" "}
          {t.of} {totalPages}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label={t.next}
          className={`flex h-11 items-center justify-center rounded-xl border transition disabled:opacity-35 ${
            darkMode
              ? "border-white/10 bg-white/[0.03] text-gray-200"
              : "border-emerald-950/10 bg-white text-slate-700"
          }`}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* TABLET / DESKTOP */}

      <div className="hidden items-center justify-between gap-4 sm:flex">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition disabled:opacity-35 ${
            darkMode
              ? "border-white/10 bg-white/[0.03] text-gray-300"
              : "border-emerald-950/10 bg-white text-slate-600"
          }`}
        >
          <ChevronLeftIcon className="h-4 w-4" />

          {t.previous}
        </button>

        <div className="flex items-center justify-center gap-1.5">
          {pages.map((item, index) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                aria-current={currentPage === item ? "page" : undefined}
                onClick={() => onPageChange(item)}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-black transition ${
                  currentPage === item
                    ? "bg-emerald-700 text-white shadow-sm"
                    : darkMode
                      ? "text-gray-400 hover:bg-white/[0.06] hover:text-white"
                      : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
              >
                {item}
              </button>
            ) : (
              <span
                key={`${item}-${index}`}
                className={`px-1 text-xs ${
                  darkMode ? "text-gray-600" : "text-slate-400"
                }`}
              >
                …
              </span>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition disabled:opacity-35 ${
            darkMode
              ? "border-white/10 bg-white/[0.03] text-gray-300"
              : "border-emerald-950/10 bg-white text-slate-600"
          }`}
        >
          {t.next}

          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE ITEMS
========================================================= */

function getPageItems(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from(
      {
        length: totalPages,
      },
      (_, index) => index + 1,
    );
  }

  const pages = [1];

  if (currentPage > 3) {
    pages.push("left");
  }

  const start = Math.max(2, currentPage - 1);

  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) {
    pages.push("right");
  }

  pages.push(totalPages);

  return pages;
}

/* =========================================================
   COMPACT DETAIL
========================================================= */

function CompactDetail({ darkMode, icon, value }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-1.5 text-[9px] font-semibold ${
        darkMode ? "text-gray-400" : "text-slate-500"
      }`}
    >
      <span
        className={`shrink-0 ${
          darkMode ? "text-emerald-300" : "text-emerald-700"
        }`}
      >
        {icon}
      </span>

      <span className="truncate" title={value}>
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({ darkMode, icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          darkMode
            ? "bg-white/[0.04] text-emerald-300"
            : "bg-emerald-800/[0.07] text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className={`text-[8px] font-bold tracking-[0.07em] ${
            darkMode ? "text-gray-500" : "text-slate-400"
          }`}
        >
          {label}
        </p>

        <p
          className={`mt-0.5 truncate text-[11px] font-semibold ${
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
   SELECT FIELD
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
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-[46px] w-full appearance-none truncate rounded-[14px] border pl-3 pr-9 text-[11px] font-semibold outline-none transition sm:pl-4 sm:text-xs ${
          darkMode
            ? "border-white/10 bg-black/20 text-gray-200 focus:border-emerald-400/40"
            : "border-emerald-950/10 bg-[#f8faf7] text-slate-700 focus:border-emerald-700/35 focus:bg-white"
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
        className={`pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
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

function ChevronLeftIcon({ className = "" }) {
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
    </svg>
  );
}

function ChevronRightIcon({ className = "" }) {
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
      <path d="m9 18 6-6-6-6" />
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
