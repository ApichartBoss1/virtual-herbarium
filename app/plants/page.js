"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   BACKGROUND
========================================================= */

const FOREST_HERO =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=88";

/* =========================================================
   PAGE
========================================================= */

export default function PlantsPage() {
  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const [plants, setPlants] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [familyFilter, setFamilyFilter] = useState("");

  const [provinceFilter, setProvinceFilter] = useState("");

  const [districtFilter, setDistrictFilter] = useState("");

  const [sort, setSort] = useState("newest");

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [portalReady, setPortalReady] = useState(false);

  /* =====================================================
     PAGINATION STATE
     MOBILE = 10
     DESKTOP / TABLET = 12
  ===================================================== */

  const [currentPage, setCurrentPage] = useState(1);

  const [isDesktop, setIsDesktop] = useState(false);

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "BOTANICAL COLLECTION",

      titleTop: "สำรวจความหลากหลาย",

      titleHighlight: "ของพรรณไม้",

      mobileTitle: "คลังพรรณไม้",

      subtitle:
        "ค้นหาตัวอย่างพรรณไม้พร้อมข้อมูลชื่อวิทยาศาสตร์ วงศ์ พื้นที่พบ และรายละเอียดการเก็บตัวอย่าง",

      specimens: "ตัวอย่างทั้งหมด",

      provinces: "จังหวัด",

      families: "วงศ์พืช",

      records: "รายการ",

      provinceUnit: "จังหวัด",

      familyUnit: "วงศ์",

      searchLabel: "ค้นหาในคลัง",

      searchDescription: "ค้นหาและกรองข้อมูลตัวอย่างพรรณไม้",

      search: "ค้นหาชื่อพืช ชื่อวิทยาศาสตร์ วงศ์ หรือสถานที่...",

      mobileSearch: "ค้นหาพรรณไม้...",

      refresh: "โหลดข้อมูลใหม่",

      filters: "ตัวกรอง",

      filterTitle: "ตัวกรองพรรณไม้",

      filterDescription: "เลือกข้อมูลเพื่อค้นหาพรรณไม้ที่ต้องการ",

      activeFilters: "ตัวกรองที่ใช้งาน",

      familyFilter: "วงศ์พืช",

      provinceFilter: "จังหวัด",

      districtFilter: "อำเภอ",

      sortFilter: "เรียงลำดับ",

      allFamilies: "ทุกวงศ์",

      allProvinces: "ทุกจังหวัด",

      allDistricts: "ทุกอำเภอ",

      collectionLabel: "HERBARIUM RECORDS",

      collection: "รายการพรรณไม้",

      found: "พบ",

      result: "รายการ",

      newest: "ล่าสุด",

      oldest: "เก่าสุด",

      nameAZ: "ชื่อ A-Z",

      nameZA: "ชื่อ Z-A",

      specimen: "SPECIMEN",

      family: "วงศ์",

      location: "สถานที่",

      collector: "ผู้เก็บตัวอย่าง",

      specimenNumber: "หมายเลขตัวอย่าง",

      viewDetails: "ดูข้อมูล",

      noData: "ยังไม่มีข้อมูลพรรณไม้",

      noDataDescription:
        "เมื่อมีการเพิ่มตัวอย่างพรรณไม้ ข้อมูลจะปรากฏในคลังนี้",

      noSearch: "ไม่พบพรรณไม้ที่ตรงกับการค้นหา",

      noSearchDescription: "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองบางรายการ",

      clearFilters: "ล้างตัวกรอง",

      applyFilters: "แสดงผล",

      closeFilters: "ปิดตัวกรอง",

      loadError: "ไม่สามารถโหลดข้อมูลพรรณไม้ได้",

      retry: "ลองอีกครั้ง",

      unknown: "ไม่ระบุ",

      footer: "ธรรมชาติ...คือห้องเรียนที่ดีที่สุด",

      /* PAGINATION */

      page: "หน้า",

      pageOf: "จาก",

      previousPage: "หน้าก่อนหน้า",

      nextPage: "หน้าถัดไป",
    },

    EN: {
      eyebrow: "BOTANICAL COLLECTION",

      titleTop: "Explore the diversity",

      titleHighlight: "of plant life",

      mobileTitle: "Plant Collection",

      subtitle:
        "Discover specimens together with scientific names, families, locations and collection information.",

      specimens: "Total Specimens",

      provinces: "Provinces",

      families: "Plant Families",

      records: "records",

      provinceUnit: "provinces",

      familyUnit: "families",

      searchLabel: "Search the collection",

      searchDescription: "Search and refine specimen records",

      search: "Search name, scientific name, family or location...",

      mobileSearch: "Search plants...",

      refresh: "Refresh Collection",

      filters: "Filters",

      filterTitle: "Plant Filters",

      filterDescription: "Choose filters to refine the plant collection",

      activeFilters: "Active filters",

      familyFilter: "Plant Family",

      provinceFilter: "Province",

      districtFilter: "District",

      sortFilter: "Sort",

      allFamilies: "All Families",

      allProvinces: "All Provinces",

      allDistricts: "All Districts",

      collectionLabel: "HERBARIUM RECORDS",

      collection: "Plant Collection",

      found: "Found",

      result: "records",

      newest: "Newest first",

      oldest: "Oldest first",

      nameAZ: "Name A-Z",

      nameZA: "Name Z-A",

      specimen: "SPECIMEN",

      family: "Family",

      location: "Location",

      collector: "Collector",

      specimenNumber: "Specimen No.",

      viewDetails: "View",

      noData: "No plant records yet",

      noDataDescription:
        "Plant specimens will appear here once they have been added to the herbarium.",

      noSearch: "No plants match your search",

      noSearchDescription: "Try another keyword or remove some filters.",

      clearFilters: "Clear Filters",

      applyFilters: "Show Results",

      closeFilters: "Close filters",

      loadError: "Unable to load plant data",

      retry: "Try Again",

      unknown: "Unknown",

      footer: "Nature is the greatest classroom.",

      /* PAGINATION */

      page: "Page",

      pageOf: "of",

      previousPage: "Previous page",

      nextPage: "Next page",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     PORTAL
  ===================================================== */

  useEffect(() => {
    setPortalReady(true);
  }, []);

  /* =====================================================
     PAGINATION RESPONSIVE SIZE

     MOBILE    = 10 records
     >= 768px = 12 records
  ===================================================== */

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)");

    function updateDeviceSize() {
      setIsDesktop(mediaQuery.matches);
    }

    updateDeviceSize();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateDeviceSize);
    } else {
      mediaQuery.addListener(updateDeviceSize);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateDeviceSize);
      } else {
        mediaQuery.removeListener(updateDeviceSize);
      }
    };
  }, []);

  /* =====================================================
     MOBILE SHEET BODY LOCK
  ===================================================== */

  useEffect(() => {
    if (!mobileFilterOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileFilterOpen]);

  /* =====================================================
     ESC CLOSE
  ===================================================== */

  useEffect(() => {
    if (!mobileFilterOpen) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMobileFilterOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileFilterOpen]);

  /* =====================================================
     FETCH
  ===================================================== */

  async function fetchPlants() {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("plants")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setPlants(data || []);
    } catch (err) {
      console.error("Fetch plants failed:", err);

      setPlants([]);

      setError(err?.message || t.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlants();
  }, []);

  /* =====================================================
     FILTER OPTIONS
  ===================================================== */

  const families = useMemo(() => {
    return [
      ...new Set(plants.map((plant) => plant.family).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "th"));
  }, [plants]);

  const provinces = useMemo(() => {
    return [
      ...new Set(plants.map((plant) => plant.province).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "th"));
  }, [plants]);

  const districts = useMemo(() => {
    const source = provinceFilter
      ? plants.filter((plant) => plant.province === provinceFilter)
      : plants;

    return [
      ...new Set(source.map((plant) => plant.district).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "th"));
  }, [plants, provinceFilter]);

  useEffect(() => {
    if (!districtFilter) {
      return;
    }

    if (!districts.includes(districtFilter)) {
      setDistrictFilter("");
    }
  }, [provinceFilter, districtFilter, districts]);

  /* =====================================================
     FILTER + SORT
  ===================================================== */

  const filteredPlants = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = plants.filter((plant) => {
      const searchableText = [
        plant.common_name,
        plant.family,
        plant.botanical_name,
        plant.province,
        plant.district,
        plant.location,
        plant.habitat,
        plant.notes,
        plant.collected_by,
        plant.specimen_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);

      const matchesFamily = !familyFilter || plant.family === familyFilter;

      const matchesProvince =
        !provinceFilter || plant.province === provinceFilter;

      const matchesDistrict =
        !districtFilter || plant.district === districtFilter;

      return (
        matchesSearch && matchesFamily && matchesProvince && matchesDistrict
      );
    });

    result.sort((a, b) => {
      if (sort === "nameAZ") {
        return (a.common_name || a.botanical_name || "").localeCompare(
          b.common_name || b.botanical_name || "",
          "th",
        );
      }

      if (sort === "nameZA") {
        return (b.common_name || b.botanical_name || "").localeCompare(
          a.common_name || a.botanical_name || "",
          "th",
        );
      }

      if (sort === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }

      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return result;
  }, [plants, search, familyFilter, provinceFilter, districtFilter, sort]);

  /* =====================================================
     PAGINATION
  ===================================================== */

  const pageSize = isDesktop ? 12 : 10;

  const totalPages = Math.max(1, Math.ceil(filteredPlants.length / pageSize));

  const paginatedPlants = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;

    const endIndex = startIndex + pageSize;

    return filteredPlants.slice(startIndex, endIndex);
  }, [filteredPlants, currentPage, pageSize]);

  /* =====================================================
     RESET PAGE WHEN FILTER / SEARCH / SORT CHANGES
  ===================================================== */

  useEffect(() => {
    setCurrentPage(1);
  }, [search, familyFilter, provinceFilter, districtFilter, sort, pageSize]);

  /* =====================================================
     KEEP CURRENT PAGE VALID
  ===================================================== */

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* =====================================================
     CHANGE PAGE
  ===================================================== */

  function handlePageChange(page) {
    const nextPage = Math.min(Math.max(page, 1), totalPages);

    if (nextPage === currentPage) {
      return;
    }

    setCurrentPage(nextPage);

    window.requestAnimationFrame(() => {
      document.getElementById("plant-collection")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  /* =====================================================
     STATS
  ===================================================== */

  const stats = useMemo(() => {
    const provinceCount = new Set(
      plants.map((plant) => plant.province).filter(Boolean),
    ).size;

    const familyCount = new Set(
      plants.map((plant) => plant.family).filter(Boolean),
    ).size;

    return {
      specimens: plants.length,

      provinces: provinceCount,

      families: familyCount,
    };
  }, [plants]);

  /* =====================================================
     HELPERS
  ===================================================== */

  function getPlantName(plant) {
    return plant.common_name || plant.botanical_name || t.unknown;
  }

  function getLocation(plant) {
    return [plant.location, plant.district, plant.province]
      .filter(Boolean)
      .join(", ");
  }

  function clearFilters() {
    setSearch("");
    setFamilyFilter("");
    setProvinceFilter("");
    setDistrictFilter("");
    setSort("newest");
  }

  const hasActiveFilters = Boolean(
    search.trim() ||
    familyFilter ||
    provinceFilter ||
    districtFilter ||
    sort !== "newest",
  );

  const mobileFilterCount = [
    familyFilter,
    provinceFilter,
    districtFilter,
    sort !== "newest" ? sort : "",
  ].filter(Boolean).length;

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="page overflow-x-hidden">
      <Navbar />

      {/* =====================================================
          MOBILE HERO
      ===================================================== */}

      <section className="relative isolate overflow-hidden border-b border-white/10 md:hidden">
        <div
          className="absolute inset-0 -z-30 bg-cover bg-center"
          style={{
            backgroundImage: `url("${FOREST_HERO}")`,
          }}
        />

        <div
          className={`absolute inset-0 -z-20 ${
            darkMode
              ? "bg-[linear-gradient(180deg,rgba(2,10,5,0.89)_0%,rgba(3,16,8,0.87)_58%,#07100b_100%)]"
              : "bg-[linear-gradient(180deg,rgba(240,247,238,0.90)_0%,rgba(238,246,236,0.90)_58%,#f1f6f1_100%)]"
          }`}
        />

        <div className="container pb-5 pt-5">
          {/* TITLE */}

          <div className="min-w-0">
            <p
              className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                darkMode ? "text-emerald-400" : "text-emerald-700"
              }`}
            >
              {t.eyebrow}
            </p>

            <h1
              className={`mt-1.5 text-[1.9rem] font-black leading-[1.08] tracking-[-0.045em] ${
                darkMode ? "text-white" : "text-[#102218]"
              }`}
            >
              {t.mobileTitle}
            </h1>

            <p
              className={`mt-2 max-w-[350px] text-[11px] leading-5 ${
                darkMode ? "text-white/60" : "text-[#506257]"
              }`}
            >
              {t.subtitle}
            </p>
          </div>

          {/* =================================================
              MOBILE STAT CARDS
          ================================================= */}

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <MobileStat
              darkMode={darkMode}
              icon={<LeafIcon className="h-[17px] w-[17px]" />}
              value={stats.specimens}
              label={t.specimens}
            />

            <MobileStat
              darkMode={darkMode}
              icon={<PinIcon className="h-[17px] w-[17px]" />}
              value={stats.provinces}
              label={t.provinces}
            />

            <MobileStat
              darkMode={darkMode}
              icon={<BranchIcon className="h-[17px] w-[17px]" />}
              value={stats.families}
              label={t.families}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          DESKTOP HERO
      ===================================================== */}

      <section className="relative isolate hidden overflow-hidden border-b border-white/10 md:block">
        <div
          className="absolute inset-0 -z-30 bg-cover bg-center"
          style={{
            backgroundImage: `url("${FOREST_HERO}")`,
          }}
        />

        <div
          className={`absolute inset-0 -z-20 ${
            darkMode
              ? "bg-[linear-gradient(90deg,rgba(2,10,5,0.94)_0%,rgba(3,16,8,0.82)_52%,rgba(3,14,7,0.56)_100%)]"
              : "bg-[linear-gradient(90deg,rgba(240,247,238,0.96)_0%,rgba(238,246,236,0.88)_52%,rgba(235,244,233,0.64)_100%)]"
          }`}
        />

        <div
          className={`absolute inset-0 -z-10 ${
            darkMode
              ? "bg-[linear-gradient(180deg,transparent_45%,#07100b_100%)]"
              : "bg-[linear-gradient(180deg,transparent_45%,#f1f6f1_100%)]"
          }`}
        />

        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className={`absolute -top-48 right-[10%] h-[600px] w-24 rotate-[22deg] blur-3xl ${
              darkMode
                ? "bg-gradient-to-b from-emerald-50/10 to-transparent"
                : "bg-gradient-to-b from-white/60 to-transparent"
            }`}
          />

          <div className="forest-particle left-[18%] top-[35%]" />

          <div className="forest-particle right-[20%] top-[30%] [animation-delay:-3s]" />

          <div className="forest-particle right-[8%] top-[65%] [animation-delay:-5s]" />
        </div>

        <div className="container">
          <div className="py-16 lg:py-20">
            <div className="max-w-4xl page-enter">
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

                <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]">
                  {t.eyebrow}
                </span>
              </div>

              <h1
                className={`mt-7 max-w-4xl text-6xl font-black leading-[1.04] tracking-[-0.045em] lg:text-7xl ${
                  darkMode ? "text-white" : "text-[#102218]"
                }`}
              >
                {t.titleTop}

                <span
                  className={`mt-1 block ${
                    darkMode
                      ? "bg-gradient-to-r from-emerald-200 via-emerald-400 to-lime-200 bg-clip-text text-transparent"
                      : "bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-800 bg-clip-text text-transparent"
                  }`}
                >
                  {t.titleHighlight}
                </span>
              </h1>

              <p
                className={`mt-6 max-w-3xl text-lg leading-8 ${
                  darkMode ? "text-[#cad7cd]" : "text-[#425b49]"
                }`}
              >
                {t.subtitle}
              </p>
            </div>

            {/* =================================================
                DESKTOP STAT CARDS
            ================================================= */}

            <div className="mt-9 grid max-w-[880px] grid-cols-3 gap-3.5">
              <StatCard
                darkMode={darkMode}
                icon={<LeafIcon className="h-5 w-5" />}
                label={t.specimens}
                value={stats.specimens}
                suffix={t.records}
              />

              <StatCard
                darkMode={darkMode}
                icon={<PinIcon className="h-5 w-5" />}
                label={t.provinces}
                value={stats.provinces}
                suffix={t.provinceUnit}
              />

              <StatCard
                darkMode={darkMode}
                icon={<BranchIcon className="h-5 w-5" />}
                label={t.families}
                value={stats.families}
                suffix={t.familyUnit}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          COLLECTION
      ===================================================== */}

      <section className="relative">
        <div className="container pb-7 pt-4 md:py-12">
          {/* =================================================
              MOBILE SEARCH
          ================================================= */}

          <div className="md:hidden">
            <div className="grid grid-cols-[minmax(0,1fr)_46px_46px] gap-2">
              {/* SEARCH */}

              <div className="relative">
                <SearchIcon
                  className={`absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 ${
                    darkMode ? "text-gray-500" : "text-slate-400"
                  }`}
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t.mobileSearch}
                  className={`h-12 w-full rounded-[15px] border pl-10 pr-3 text-[13px] outline-none transition ${
                    darkMode
                      ? "border-white/10 bg-[#0a1710]/92 text-white placeholder:text-gray-600 focus:border-emerald-400/40"
                      : "border-emerald-950/10 bg-white/90 text-slate-900 placeholder:text-slate-400 focus:border-emerald-700/35"
                  }`}
                />
              </div>

              {/* FILTER */}

              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                aria-label={t.filters}
                className={`relative flex h-12 w-[46px] items-center justify-center rounded-[15px] border transition active:scale-95 ${
                  darkMode
                    ? "border-white/10 bg-[#0a1710]/92 text-gray-200"
                    : "border-emerald-950/10 bg-white/90 text-slate-700"
                }`}
              >
                <FilterIcon className="h-[19px] w-[19px]" />

                {mobileFilterCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[8px] font-black text-white shadow-md">
                    {mobileFilterCount}
                  </span>
                )}
              </button>

              {/* REFRESH */}

              <button
                type="button"
                onClick={fetchPlants}
                disabled={loading}
                aria-label={t.refresh}
                className={`flex h-12 w-[46px] items-center justify-center rounded-[15px] border transition active:scale-95 disabled:opacity-50 ${
                  darkMode
                    ? "border-white/10 bg-[#0a1710]/92 text-gray-200"
                    : "border-emerald-950/10 bg-white/90 text-slate-700"
                }`}
              >
                <RefreshIcon
                  className={`h-[18px] w-[18px] ${
                    loading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>

            {hasActiveFilters && (
              <div className="mt-2.5 flex items-center justify-between gap-3 px-0.5">
                <p
                  className={`min-w-0 truncate text-[10px] ${
                    darkMode ? "text-white/45" : "text-slate-500"
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

                <button
                  type="button"
                  onClick={clearFilters}
                  className={`shrink-0 text-[10px] font-black ${
                    darkMode ? "text-emerald-300" : "text-emerald-700"
                  }`}
                >
                  {t.clearFilters}
                </button>
              </div>
            )}
          </div>

          {/* =================================================
              DESKTOP SEARCH + FILTER
          ================================================= */}

          <div
            className={`relative hidden rounded-[28px] border p-5 shadow-[0_20px_55px_rgba(0,0,0,0.08)] backdrop-blur-2xl md:block lg:p-6 ${
              darkMode
                ? "border-white/10 bg-[#0a1710]/90 shadow-black/20"
                : "border-emerald-950/[0.09] bg-white/88 shadow-emerald-950/[0.08]"
            }`}
          >
            <div
              className={`absolute inset-x-10 top-0 h-px ${
                darkMode
                  ? "bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
                  : "bg-gradient-to-r from-transparent via-emerald-700/25 to-transparent"
              }`}
            />

            {/* HEADER */}

            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${
                    darkMode
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-emerald-800/[0.08] text-emerald-700"
                  }`}
                >
                  <SearchIcon className="h-[18px] w-[18px]" />
                </div>

                <div>
                  <p
                    className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                      darkMode ? "text-emerald-400" : "text-emerald-700"
                    }`}
                  >
                    {t.searchLabel}
                  </p>

                  <p
                    className={`mt-1 text-xs ${
                      darkMode ? "text-gray-500" : "text-slate-500"
                    }`}
                  >
                    {t.searchDescription}
                  </p>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={`inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 text-[11px] font-bold transition ${
                    darkMode
                      ? "border-white/[0.08] bg-white/[0.035] text-gray-300 hover:bg-white/[0.07]"
                      : "border-emerald-950/[0.08] bg-white text-slate-600 hover:bg-emerald-50"
                  }`}
                >
                  <CloseCircleIcon className="h-4 w-4" />

                  {t.clearFilters}
                </button>
              )}
            </div>

            {/* SEARCH ROW */}

            <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-3">
              <div className="relative">
                <SearchIcon
                  className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                    darkMode ? "text-gray-500" : "text-slate-400"
                  }`}
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t.search}
                  className={`h-[52px] w-full rounded-[16px] border pl-12 pr-4 text-sm outline-none transition ${
                    darkMode
                      ? "border-white/[0.09] bg-black/20 text-white placeholder:text-gray-600 focus:border-emerald-400/40 focus:bg-black/30"
                      : "border-emerald-950/[0.09] bg-[#f8fbf7] text-slate-900 placeholder:text-slate-400 focus:border-emerald-700/35 focus:bg-white"
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={fetchPlants}
                disabled={loading}
                className={`inline-flex h-[52px] min-w-[170px] items-center justify-center gap-2 rounded-[16px] border px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  darkMode
                    ? "border-white/[0.09] bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]"
                    : "border-emerald-950/[0.09] bg-white text-slate-700 hover:bg-emerald-50"
                }`}
              >
                <RefreshIcon
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />

                {t.refresh}
              </button>
            </div>

            {/* FILTERS */}

            <div
              className={`mt-4 rounded-[20px] border p-4 ${
                darkMode
                  ? "border-white/[0.065] bg-black/10"
                  : "border-emerald-950/[0.06] bg-[#f8fbf7]/85"
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <FilterIcon
                  className={`h-4 w-4 ${
                    darkMode ? "text-emerald-300" : "text-emerald-700"
                  }`}
                />

                <p
                  className={`text-[10px] font-black uppercase tracking-[0.12em] ${
                    darkMode ? "text-white/55" : "text-slate-600"
                  }`}
                >
                  {t.filters}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <DesktopFilterField label={t.familyFilter} darkMode={darkMode}>
                  <FilterDropdown
                    darkMode={darkMode}
                    value={familyFilter}
                    onChange={setFamilyFilter}
                    options={families}
                    placeholder={t.allFamilies}
                  />
                </DesktopFilterField>

                <DesktopFilterField
                  label={t.provinceFilter}
                  darkMode={darkMode}
                >
                  <FilterDropdown
                    darkMode={darkMode}
                    value={provinceFilter}
                    onChange={(value) => {
                      setProvinceFilter(value);

                      setDistrictFilter("");
                    }}
                    options={provinces}
                    placeholder={t.allProvinces}
                  />
                </DesktopFilterField>

                <DesktopFilterField
                  label={t.districtFilter}
                  darkMode={darkMode}
                >
                  <FilterDropdown
                    darkMode={darkMode}
                    value={districtFilter}
                    onChange={setDistrictFilter}
                    options={districts}
                    placeholder={t.allDistricts}
                  />
                </DesktopFilterField>

                <DesktopFilterField label={t.sortFilter} darkMode={darkMode}>
                  <FilterDropdown
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
                    placeholder={t.newest}
                  />
                </DesktopFilterField>
              </div>
            </div>
          </div>

          {/* =================================================
              COLLECTION HEADER
          ================================================= */}

          <div
            id="plant-collection"
            className="mt-5 flex scroll-mt-[100px] items-end justify-between gap-3 md:mt-12"
          >
            <div>
              <p
                className={`text-[8px] font-black uppercase tracking-[0.18em] md:text-[10px] md:tracking-[0.2em] ${
                  darkMode ? "text-emerald-400" : "text-emerald-700"
                }`}
              >
                {t.collectionLabel}
              </p>

              <h2
                className={`mt-1 text-lg font-black tracking-tight md:mt-2 md:text-3xl ${
                  darkMode ? "text-white" : "text-[#13251a]"
                }`}
              >
                {t.collection}
              </h2>

              <p
                className={`mt-1 text-[10px] md:mt-2 md:text-sm ${
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

            <div
              className={`hidden items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold md:flex ${
                darkMode
                  ? "border-white/10 bg-white/[0.025] text-gray-400"
                  : "border-emerald-950/10 bg-white/70 text-slate-500"
              }`}
            >
              <LeafIcon className="h-4 w-4" />
              Virtual Herbarium
            </div>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className={`mt-6 rounded-[1.4rem] border p-5 text-center md:mt-8 md:p-7 ${
                darkMode
                  ? "border-red-400/15 bg-red-500/[0.05]"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div
                className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl ${
                  darkMode
                    ? "bg-red-400/10 text-red-300"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <AlertIcon className="h-5 w-5" />
              </div>

              <h3
                className={`mt-4 font-black ${
                  darkMode ? "text-red-200" : "text-red-800"
                }`}
              >
                {t.loadError}
              </h3>

              <p
                className={`mx-auto mt-2 max-w-xl text-xs md:text-sm ${
                  darkMode ? "text-red-300/70" : "text-red-600"
                }`}
              >
                {error}
              </p>

              <button
                type="button"
                onClick={fetchPlants}
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white"
              >
                <RefreshIcon className="h-4 w-4" />

                {t.retry}
              </button>
            </div>
          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && !error && (
            <div className="mt-4 grid grid-cols-2 gap-2.5 md:mt-8 md:gap-5 lg:grid-cols-3">
              {Array.from({
                length: 6,
              }).map((_, index) => (
                <SkeletonCard key={index} darkMode={darkMode} />
              ))}
            </div>
          )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading && !error && filteredPlants.length === 0 && (
            <div
              className={`mt-5 rounded-[1.5rem] border px-5 py-12 text-center md:mt-8 md:rounded-[2rem] md:px-6 md:py-20 ${
                darkMode
                  ? "border-white/10 bg-[#0a1710]"
                  : "border-emerald-950/10 bg-white/80"
              }`}
            >
              <div
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
                  darkMode
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-emerald-800/10 text-emerald-800"
                }`}
              >
                <LeafIcon className="h-7 w-7" />
              </div>

              <h3
                className={`mt-4 text-lg font-black md:text-xl ${
                  darkMode ? "text-white" : "text-[#173321]"
                }`}
              >
                {plants.length === 0 ? t.noData : t.noSearch}
              </h3>

              <p
                className={`mx-auto mt-2 max-w-lg text-xs leading-6 md:mt-3 md:text-sm md:leading-7 ${
                  darkMode ? "text-gray-400" : "text-slate-500"
                }`}
              >
                {plants.length === 0
                  ? t.noDataDescription
                  : t.noSearchDescription}
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={`mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border px-4 text-xs font-bold ${
                    darkMode
                      ? "border-white/10 bg-white/[0.04] text-white"
                      : "border-emerald-950/10 bg-white text-slate-700"
                  }`}
                >
                  {t.clearFilters}
                </button>
              )}
            </div>
          )}

          {/* =================================================
              PLANT GRID
          ================================================= */}

          {!loading && !error && filteredPlants.length > 0 && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2.5 md:mt-8 md:gap-5 lg:grid-cols-3">
                {paginatedPlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    darkMode={darkMode}
                    t={t}
                    getPlantName={getPlantName}
                    getLocation={getLocation}
                  />
                ))}
              </div>

              {/* =============================================
                  PAGINATION
              ============================================= */}

              {totalPages > 1 && (
                <Pagination
                  darkMode={darkMode}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  t={t}
                />
              )}
            </>
          )}
        </div>
      </section>

      {/* =====================================================
          DESKTOP FOOTER
      ===================================================== */}

      <footer
        className={`mt-8 border-t ${
          darkMode ? "border-white/15" : "border-emerald-950/15"
        }`}
      >
        <div
          className={`container flex flex-col items-center gap-2 py-5 text-center text-[10px] md:flex-row md:justify-between md:text-left md:text-xs ${
            darkMode ? "text-white/60" : "text-emerald-950/70"
          }`}
        >
          <p>© 2026 Virtual Herbarium. All rights reserved.</p>

          <div className="flex items-center gap-2">
            <LeafIcon className="h-3.5 w-3.5 text-emerald-400" />

            <span>{t.footer}</span>
          </div>
        </div>
      </footer>

      {/* =====================================================
          MOBILE FILTER BOTTOM SHEET
      ===================================================== */}

      {portalReady &&
        mobileFilterOpen &&
        createPortal(
          <div className="fixed inset-0 z-[160] md:hidden">
            {/* BACKDROP */}

            <button
              type="button"
              aria-label={t.closeFilters}
              onClick={() => setMobileFilterOpen(false)}
              className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-[3px]"
            />

            {/* SHEET */}

            <div
              className={`absolute inset-x-0 bottom-0 flex max-h-[82dvh] flex-col overflow-hidden rounded-t-[30px] border-t shadow-[0_-24px_70px_rgba(0,0,0,0.28)] ${
                darkMode
                  ? "border-white/10 bg-[#08140d] text-white"
                  : "border-emerald-950/10 bg-[#f4f8f2] text-[#173321]"
              }`}
            >
              {/* HANDLE */}

              <div className="shrink-0 pt-2.5">
                <div
                  className={`mx-auto h-1 w-10 rounded-full ${
                    darkMode ? "bg-white/20" : "bg-emerald-950/15"
                  }`}
                />
              </div>

              {/* HEADER */}

              <div
                className={`flex shrink-0 items-start justify-between gap-4 border-b px-5 pb-4 pt-3 ${
                  darkMode ? "border-white/[0.07]" : "border-emerald-950/[0.07]"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${
                      darkMode
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-emerald-800/[0.08] text-emerald-700"
                    }`}
                  >
                    <FilterIcon className="h-[18px] w-[18px]" />
                  </div>

                  <div className="min-w-0">
                    <h2
                      className={`text-[17px] font-black leading-tight ${
                        darkMode ? "text-white" : "text-[#173321]"
                      }`}
                    >
                      {t.filterTitle}
                    </h2>

                    <p
                      className={`mt-1 text-[10px] leading-4 ${
                        darkMode ? "text-white/45" : "text-slate-500"
                      }`}
                    >
                      {t.filterDescription}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  aria-label={t.closeFilters}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border transition active:scale-95 ${
                    darkMode
                      ? "border-white/10 bg-white/[0.04] text-white"
                      : "border-emerald-950/10 bg-white/80 text-slate-700"
                  }`}
                >
                  <CloseIcon className="h-[18px] w-[18px]" />
                </button>
              </div>

              {/* ACTIVE FILTER */}

              {mobileFilterCount > 0 && (
                <div className="shrink-0 px-5 pt-3">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-black ${
                      darkMode
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-emerald-800/[0.08] text-emerald-700"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {mobileFilterCount} {t.activeFilters}
                  </div>
                </div>
              )}

              {/* FILTER CONTENT */}

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                <div
                  className={`rounded-[20px] border p-3 ${
                    darkMode
                      ? "border-white/[0.07] bg-white/[0.025]"
                      : "border-emerald-950/[0.07] bg-white/70"
                  }`}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <MobileFilterField
                      label={t.familyFilter}
                      darkMode={darkMode}
                    >
                      <FilterDropdown
                        darkMode={darkMode}
                        value={familyFilter}
                        onChange={setFamilyFilter}
                        options={families}
                        placeholder={t.allFamilies}
                        mobile
                      />
                    </MobileFilterField>

                    <MobileFilterField
                      label={t.provinceFilter}
                      darkMode={darkMode}
                    >
                      <FilterDropdown
                        darkMode={darkMode}
                        value={provinceFilter}
                        onChange={(value) => {
                          setProvinceFilter(value);

                          setDistrictFilter("");
                        }}
                        options={provinces}
                        placeholder={t.allProvinces}
                        mobile
                      />
                    </MobileFilterField>

                    <MobileFilterField
                      label={t.districtFilter}
                      darkMode={darkMode}
                    >
                      <FilterDropdown
                        darkMode={darkMode}
                        value={districtFilter}
                        onChange={setDistrictFilter}
                        options={districts}
                        placeholder={t.allDistricts}
                        mobile
                      />
                    </MobileFilterField>

                    <MobileFilterField label={t.sortFilter} darkMode={darkMode}>
                      <FilterDropdown
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
                        placeholder={t.newest}
                        mobile
                      />
                    </MobileFilterField>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}

              <div
                className={`shrink-0 border-t px-6 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl ${
                  darkMode
                    ? "border-white/[0.07] bg-[#08140d]/96"
                    : "border-emerald-950/[0.07] bg-[#f4f8f2]/96"
                }`}
              >
                <div className="grid grid-cols-[0.9fr_1.1fr] gap-3">
                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className={`flex min-h-[52px] items-center justify-center gap-2 rounded-[16px] border px-3 text-[11px] font-black transition active:scale-[0.98] disabled:opacity-40 ${
                      darkMode
                        ? "border-white/10 bg-white/[0.04] text-gray-200"
                        : "border-emerald-950/[0.09] bg-white text-slate-700 shadow-[0_4px_18px_rgba(25,55,34,0.05)]"
                    }`}
                  >
                    <CloseCircleIcon className="h-4 w-4 shrink-0" />

                    <span className="truncate">{t.clearFilters}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="flex min-h-[52px] items-center justify-center gap-2 rounded-[16px] bg-emerald-700 px-3 text-[11px] font-black text-white shadow-[0_10px_28px_rgba(16,120,65,0.24)] transition active:scale-[0.98]"
                  >
                    <SearchIcon className="h-4 w-4 shrink-0" />

                    <span className="truncate">{t.applyFilters}</span>

                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-white/15 px-1.5 text-[9px]">
                      {filteredPlants.length}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </main>
  );
}

/* =========================================================
   PAGINATION
========================================================= */

function Pagination({ darkMode, currentPage, totalPages, onPageChange, t }) {
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-7 flex flex-col items-center gap-2.5 md:mt-10"
    >
      <div
        className={`inline-flex max-w-full items-center gap-1.5 rounded-[18px] border p-1.5 backdrop-blur-xl md:gap-2 md:rounded-[20px] md:p-2 ${
          darkMode
            ? "border-white/10 bg-[#0a1710]/88 shadow-[0_14px_38px_rgba(0,0,0,0.18)]"
            : "border-emerald-950/[0.09] bg-white/88 shadow-[0_12px_32px_rgba(25,55,34,0.07)]"
        }`}
      >
        {/* PREVIOUS */}

        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label={t.previousPage}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 md:h-11 md:w-11 ${
            darkMode
              ? "border-white/[0.09] bg-white/[0.035] text-white hover:bg-white/[0.08]"
              : "border-emerald-950/[0.09] bg-white text-emerald-900 hover:bg-emerald-50"
          }`}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {/* PAGE NUMBERS */}

        <div className="flex min-w-0 items-center gap-1">
          {visiblePages.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className={`flex h-10 min-w-[22px] items-center justify-center text-[11px] font-bold md:h-11 md:min-w-7 md:text-xs ${
                    darkMode ? "text-white/35" : "text-slate-400"
                  }`}
                >
                  •••
                </span>
              );
            }

            const active = page === currentPage;

            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={active ? "page" : undefined}
                className={`flex h-10 min-w-10 items-center justify-center rounded-[12px] px-2 text-[11px] font-black transition active:scale-95 md:h-11 md:min-w-11 md:text-sm ${
                  active
                    ? "bg-emerald-700 text-white shadow-[0_8px_20px_rgba(4,120,87,0.28)]"
                    : darkMode
                      ? "text-white/65 hover:bg-white/[0.06] hover:text-white"
                      : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* NEXT */}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label={t.nextPage}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 md:h-11 md:w-11 ${
            darkMode
              ? "border-white/[0.09] bg-white/[0.035] text-white hover:bg-white/[0.08]"
              : "border-emerald-950/[0.09] bg-white text-emerald-900 hover:bg-emerald-50"
          }`}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* PAGE INFO */}

      <p
        className={`text-[10px] font-semibold md:text-xs ${
          darkMode ? "text-white/45" : "text-slate-500"
        }`}
      >
        {t.page}{" "}
        <span
          className={`font-black ${
            darkMode ? "text-white/75" : "text-emerald-800"
          }`}
        >
          {currentPage}
        </span>{" "}
        {t.pageOf}{" "}
        <span
          className={`font-black ${
            darkMode ? "text-white/75" : "text-emerald-800"
          }`}
        >
          {totalPages}
        </span>
      </p>
    </nav>
  );
}

/* =========================================================
   PAGINATION HELPER
========================================================= */

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from(
      {
        length: totalPages,
      },
      (_, index) => index + 1,
    );
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage, "...", totalPages];
}

/* =========================================================
   MOBILE STAT
========================================================= */

function MobileStat({ darkMode, icon, value, label }) {
  return (
    <div
      className={`relative flex min-h-[96px] min-w-0 flex-col items-center justify-center overflow-hidden rounded-[18px] border px-2.5 py-3 text-center backdrop-blur-xl ${
        darkMode
          ? "border-white/[0.08] bg-[#0a1710]/72 shadow-[0_10px_28px_rgba(0,0,0,0.14)]"
          : "border-emerald-950/[0.08] bg-white/76 shadow-[0_10px_26px_rgba(25,55,34,0.055)]"
      }`}
    >
      {/* GLOW */}

      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl ${
          darkMode ? "bg-emerald-400/[0.06]" : "bg-emerald-600/[0.055]"
        }`}
      />

      {/* ICON */}

      <div
        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/10"
            : "bg-emerald-800/[0.075] text-emerald-700 ring-1 ring-emerald-900/[0.04]"
        }`}
      >
        {icon}
      </div>

      {/* NUMBER */}

      <span
        className={`relative mt-1.5 text-[25px] font-black leading-none tracking-[-0.05em] ${
          darkMode ? "text-white" : "text-[#173321]"
        }`}
      >
        {value}
      </span>

      {/* LABEL */}

      <p
        className={`relative mt-1.5 max-w-full text-[8.5px] font-extrabold leading-[1.25] ${
          darkMode ? "text-white/52" : "text-[#66778c]"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

/* =========================================================
   DESKTOP STAT
========================================================= */

function StatCard({ darkMode, icon, label, value, suffix }) {
  return (
    <div
      className={`relative flex min-h-[92px] items-center overflow-hidden rounded-[18px] border px-4 py-4 backdrop-blur-xl transition duration-300 hover:-translate-y-1 ${
        darkMode
          ? "border-white/[0.09] bg-black/20 shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
          : "border-emerald-950/[0.08] bg-white/70 shadow-[0_10px_28px_rgba(25,55,34,0.05)]"
      }`}
    >
      {/* GLOW */}

      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${
          darkMode ? "bg-emerald-400/[0.05]" : "bg-emerald-600/[0.045]"
        }`}
      />

      {/* ICON */}

      <div
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/10"
            : "bg-emerald-800/[0.075] text-emerald-700 ring-1 ring-emerald-900/[0.04]"
        }`}
      >
        {icon}
      </div>

      {/* CONTENT */}

      <div className="relative ml-4 min-w-0 flex-1">
        <p
          className={`truncate text-[9px] font-extrabold uppercase tracking-[0.08em] ${
            darkMode ? "text-white/42" : "text-slate-500"
          }`}
        >
          {label}
        </p>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span
            className={`text-[28px] font-black leading-none tracking-[-0.05em] ${
              darkMode ? "text-white" : "text-[#173321]"
            }`}
          >
            {value}
          </span>

          <span
            className={`text-[9px] font-semibold ${
              darkMode ? "text-white/32" : "text-slate-400"
            }`}
          >
            {suffix}
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DESKTOP FILTER FIELD
========================================================= */

function DesktopFilterField({ label, darkMode, children }) {
  return (
    <div className="min-w-0">
      <p
        className={`mb-1.5 px-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${
          darkMode ? "text-white/45" : "text-slate-500"
        }`}
      >
        {label}
      </p>

      {children}
    </div>
  );
}

/* =========================================================
   MOBILE FILTER FIELD
========================================================= */

function MobileFilterField({ label, darkMode, children }) {
  return (
    <div className="min-w-0">
      <p
        className={`mb-1.5 flex items-center gap-1.5 px-0.5 text-[9px] font-black ${
          darkMode ? "text-white/55" : "text-slate-600"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            darkMode ? "bg-emerald-400" : "bg-emerald-700"
          }`}
        />

        <span className="truncate">{label}</span>
      </p>

      {children}
    </div>
  );
}

/* =========================================================
   CUSTOM FILTER DROPDOWN
========================================================= */

function FilterDropdown({
  darkMode,
  value,
  onChange,
  options,
  placeholder,
  labels = {},
  mobile = false,
}) {
  const [open, setOpen] = useState(false);

  const [menuPosition, setMenuPosition] = useState(null);

  const buttonRef = useRef(null);

  const menuRef = useRef(null);

  const selectedLabel = value ? labels[value] || value : placeholder;

  /* =====================================================
     POSITION
  ===================================================== */

  function updateMenuPosition() {
    const button = buttonRef.current;

    if (!button || typeof window === "undefined") {
      return;
    }

    const rect = button.getBoundingClientRect();

    const margin = 8;

    const desiredWidth = mobile
      ? Math.max(rect.width, 220)
      : Math.max(rect.width, 230);

    const width = Math.min(desiredWidth, window.innerWidth - 16);

    let left = rect.left;

    if (left + width > window.innerWidth - 8) {
      left = window.innerWidth - width - 8;
    }

    if (left < 8) {
      left = 8;
    }

    const spaceBelow = window.innerHeight - rect.bottom - margin;

    const spaceAbove = rect.top - margin;

    const openUpward = spaceBelow < 190 && spaceAbove > spaceBelow;

    const availableSpace = openUpward ? spaceAbove : spaceBelow;

    const maxHeight = Math.max(140, Math.min(260, availableSpace - 6));

    if (openUpward) {
      setMenuPosition({
        left,
        width,
        bottom: window.innerHeight - rect.top + margin,
        top: "auto",
        maxHeight,
      });

      return;
    }

    setMenuPosition({
      left,
      width,
      top: rect.bottom + margin,
      bottom: "auto",
      maxHeight,
    });
  }

  /* =====================================================
     OPEN EFFECTS
  ===================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    updateMenuPosition();

    function handleResize() {
      updateMenuPosition();
    }

    function handleScroll() {
      updateMenuPosition();
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handlePointerDown(event) {
      const button = buttonRef.current;

      const menu = menuRef.current;

      if (button?.contains(event.target)) {
        return;
      }

      if (menu?.contains(event.target)) {
        return;
      }

      setOpen(false);
    }

    window.addEventListener("resize", handleResize);

    window.addEventListener("scroll", handleScroll, true);

    window.addEventListener("keydown", handleKeyDown);

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("resize", handleResize);

      window.removeEventListener("scroll", handleScroll, true);

      window.removeEventListener("keydown", handleKeyDown);

      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  function handleSelect(option) {
    onChange(option);

    setOpen(false);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 border text-left font-bold outline-none transition ${
          mobile
            ? "h-[46px] rounded-[13px] px-3 text-[11px]"
            : "h-[48px] rounded-[14px] px-3.5 text-[12px] lg:text-sm"
        } ${
          open
            ? darkMode
              ? "border-emerald-400/45 bg-[#0d1d13] text-white ring-2 ring-emerald-400/10"
              : "border-emerald-700/40 bg-white text-slate-800 ring-2 ring-emerald-700/10"
            : darkMode
              ? "border-white/[0.08] bg-[#0c1b12] text-gray-200"
              : "border-emerald-950/[0.09] bg-white text-slate-700 shadow-[0_3px_14px_rgba(25,55,34,0.035)]"
        }`}
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>

        <span
          className={`flex shrink-0 items-center justify-center rounded-[9px] transition ${
            mobile ? "h-6 w-6" : "h-7 w-7"
          } ${
            darkMode
              ? "bg-white/[0.04] text-white/45"
              : "bg-emerald-950/[0.035] text-slate-400"
          }`}
        >
          <ChevronDownIcon
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {open &&
        menuPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",

              left: menuPosition.left,

              width: menuPosition.width,

              top: menuPosition.top,

              bottom: menuPosition.bottom,

              maxHeight: menuPosition.maxHeight,

              zIndex: 260,
            }}
            className={`overflow-y-auto rounded-[16px] border p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.20)] backdrop-blur-2xl ${
              darkMode
                ? "border-white/10 bg-[#0b1810]/[0.98]"
                : "border-emerald-950/10 bg-white/[0.98]"
            }`}
          >
            <DropdownOption
              darkMode={darkMode}
              active={!value}
              label={placeholder}
              onClick={() => handleSelect("")}
            />

            {options.map((option) => (
              <DropdownOption
                key={option}
                darkMode={darkMode}
                active={value === option}
                label={labels[option] || option}
                onClick={() => handleSelect(option)}
              />
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

/* =========================================================
   DROPDOWN OPTION
========================================================= */

function DropdownOption({ darkMode, active, label, onClick }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={`flex min-h-[42px] w-full items-center justify-between gap-3 rounded-[11px] px-3 text-left text-[12px] font-bold transition ${
        active
          ? darkMode
            ? "bg-emerald-400/12 text-emerald-300"
            : "bg-emerald-700/[0.09] text-emerald-800"
          : darkMode
            ? "text-gray-300 hover:bg-white/[0.05] hover:text-white"
            : "text-slate-700 hover:bg-emerald-950/[0.04]"
      }`}
    >
      <span className="min-w-0 break-words">{label}</span>

      {active && (
        <CheckIcon
          className={`h-4 w-4 shrink-0 ${
            darkMode ? "text-emerald-300" : "text-emerald-700"
          }`}
        />
      )}
    </button>
  );
}

/* =========================================================
   PLANT CARD
========================================================= */

function PlantCard({ plant, darkMode, t, getPlantName, getLocation }) {
  const image = plant.image_url || "";

  return (
    <article
      className={`group relative min-w-0 overflow-hidden rounded-[1rem] border transition duration-300 md:rounded-[1.7rem] md:hover:-translate-y-1.5 ${
        darkMode
          ? "border-white/10 bg-[#0a1710] shadow-[0_8px_22px_rgba(0,0,0,0.18)] md:shadow-[0_16px_45px_rgba(0,0,0,0.22)] md:hover:border-emerald-400/25"
          : "border-emerald-950/10 bg-white/90 shadow-[0_7px_20px_rgba(25,55,34,0.07)] md:shadow-[0_14px_35px_rgba(25,55,34,0.08)] md:hover:border-emerald-700/20"
      }`}
    >
      <Link href={`/plants/${plant.id}`} className="block">
        <div className="relative h-[108px] overflow-hidden min-[390px]:h-[122px] md:h-auto md:aspect-[1.45/1]">
          {image ? (
            <img
              src={image}
              alt={getPlantName(plant)}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 md:group-hover:scale-[1.055]"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center ${
                darkMode
                  ? "bg-[radial-gradient(circle_at_center,rgba(52,140,78,0.18),transparent_70%),#102218]"
                  : "bg-[radial-gradient(circle_at_center,rgba(30,110,62,0.12),transparent_70%),#edf5ed]"
              }`}
            >
              <LeafIcon
                className={`h-8 w-8 md:h-16 md:w-16 ${
                  darkMode ? "text-emerald-400/40" : "text-emerald-800/30"
                }`}
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#020b05]/90 via-transparent to-black/10" />

          <div className="absolute left-2 top-2 md:left-4 md:top-4">
            <span className="inline-flex rounded-full border border-white/15 bg-black/35 px-1.5 py-0.5 text-[6px] font-black tracking-[0.1em] text-white backdrop-blur-xl min-[390px]:text-[7px] md:px-3 md:py-1.5 md:text-[9px] md:tracking-[0.16em]">
              {t.specimen}
            </span>
          </div>

          {plant.botanical_name && (
            <div className="absolute inset-x-0 bottom-0 p-2 md:p-5">
              <p className="truncate text-[9px] font-semibold italic text-emerald-200 min-[390px]:text-[10px] md:text-sm">
                {plant.botanical_name}
              </p>
            </div>
          )}
        </div>
      </Link>

      <div className="p-2.5 md:p-5">
        <Link href={`/plants/${plant.id}`}>
          <h3
            className={`truncate text-[13px] font-black leading-5 tracking-tight min-[390px]:text-sm md:text-xl ${
              darkMode ? "text-white" : "text-[#14271a]"
            }`}
          >
            {getPlantName(plant)}
          </h3>
        </Link>

        <div className="mt-2 grid grid-cols-1 gap-1.5 md:mt-4 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
          {plant.family && (
            <InformationRow
              darkMode={darkMode}
              icon={<BranchIcon className="h-3 w-3 md:h-4 md:w-4" />}
              label={t.family}
              value={plant.family}
            />
          )}

          <InformationRow
            darkMode={darkMode}
            icon={<PinIcon className="h-3 w-3 md:h-4 md:w-4" />}
            label={t.location}
            value={getLocation(plant) || t.unknown}
          />

          {plant.collected_by && (
            <div className="hidden md:block">
              <InformationRow
                darkMode={darkMode}
                icon={<UserIcon className="h-4 w-4" />}
                label={t.collector}
                value={plant.collected_by}
              />
            </div>
          )}

          {plant.specimen_number && (
            <div className="hidden md:block">
              <InformationRow
                darkMode={darkMode}
                icon={<DocumentIcon className="h-4 w-4" />}
                label={t.specimenNumber}
                value={plant.specimen_number}
              />
            </div>
          )}
        </div>

        <div
          className={`my-2.5 h-px md:my-5 ${
            darkMode ? "bg-white/10" : "bg-emerald-950/10"
          }`}
        />

        <Link
          href={`/plants/${plant.id}`}
          className={`group/button flex min-h-[34px] w-full items-center justify-between rounded-lg border px-2.5 text-[9px] font-bold transition min-[390px]:text-[10px] md:min-h-11 md:rounded-xl md:px-4 md:text-sm ${
            darkMode
              ? "border-white/10 bg-white/[0.025] text-gray-200 md:hover:border-emerald-400/25 md:hover:bg-emerald-400/[0.07] md:hover:text-emerald-200"
              : "border-emerald-950/10 bg-[#f7faf6] text-slate-700 md:hover:border-emerald-700/20 md:hover:bg-emerald-50 md:hover:text-emerald-800"
          }`}
        >
          <span className="flex min-w-0 items-center gap-1.5 md:gap-2">
            <DocumentIcon className="h-3 w-3 shrink-0 md:h-4 md:w-4" />

            <span className="truncate">{t.viewDetails}</span>
          </span>

          <ChevronRightIcon className="h-3 w-3 shrink-0 md:h-4 md:w-4" />
        </Link>
      </div>
    </article>
  );
}

/* =========================================================
   INFORMATION ROW
========================================================= */

function InformationRow({ darkMode, icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-1.5 md:gap-3">
      <div
        className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md md:h-8 md:w-8 md:rounded-lg ${
          darkMode
            ? "bg-white/[0.04] text-emerald-300"
            : "bg-emerald-800/[0.07] text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className={`truncate text-[6.5px] font-bold uppercase tracking-[0.06em] md:text-[9px] md:tracking-[0.12em] ${
            darkMode ? "text-gray-500" : "text-slate-400"
          }`}
        >
          {label}
        </p>

        <p
          className={`mt-0.5 truncate text-[8.5px] font-semibold min-[390px]:text-[9px] md:text-xs ${
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
   SKELETON
========================================================= */

function SkeletonCard({ darkMode }) {
  return (
    <div
      className={`overflow-hidden rounded-[1rem] border md:rounded-[1.7rem] ${
        darkMode
          ? "border-white/10 bg-[#0a1710]"
          : "border-emerald-950/10 bg-white"
      }`}
    >
      <div
        className={`h-[108px] animate-pulse min-[390px]:h-[122px] md:h-auto md:aspect-[1.45/1] ${
          darkMode ? "bg-white/[0.05]" : "bg-emerald-950/[0.05]"
        }`}
      />

      <div className="space-y-2 p-2.5 md:space-y-4 md:p-5">
        <div
          className={`h-4 w-2/3 animate-pulse rounded-md md:h-5 ${
            darkMode ? "bg-white/[0.08]" : "bg-emerald-950/[0.07]"
          }`}
        />

        <div className="space-y-1.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {Array.from({
            length: 2,
          }).map((_, index) => (
            <div
              key={index}
              className={`h-6 animate-pulse rounded-md md:h-9 ${
                darkMode ? "bg-white/[0.05]" : "bg-emerald-950/[0.04]"
              }`}
            />
          ))}
        </div>

        <div
          className={`h-[34px] animate-pulse rounded-lg md:h-11 ${
            darkMode ? "bg-white/[0.08]" : "bg-emerald-950/[0.06]"
          }`}
        />
      </div>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

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

function FilterIcon({ className = "" }) {
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
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11a8 8 0 0 0-14.9-3.9L3 10" />

      <path d="M3 4v6h6" />

      <path d="M4 13a8 8 0 0 0 14.9 3.9L21 14" />

      <path d="M21 20v-6h-6" />
    </svg>
  );
}

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

/* =========================================================
   PAGINATION LEFT
========================================================= */

function ChevronLeftIcon({ className = "" }) {
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CloseCircleIcon({ className = "" }) {
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

      <path d="m9 9 6 6" />

      <path d="m15 9-6 6" />
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function CheckIcon({ className = "" }) {
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
      <path d="m5 12 4 4L19 6" />
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
      <path d="M12 3 2.5 20h19Z" />
      <path d="M12 9v5" />
      <path d="M12 17.5h.01" />
    </svg>
  );
}
