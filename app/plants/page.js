"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

const FOREST_HERO =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=88";

export default function PlantsPage() {
  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [sort, setSort] = useState("newest");

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "BOTANICAL COLLECTION",

      titleTop: "สำรวจความหลากหลาย",
      titleHighlight: "ของพรรณไม้",

      subtitle:
        "ค้นหาตัวอย่างพรรณไม้จากคลัง Virtual Herbarium พร้อมข้อมูลชื่อวิทยาศาสตร์ วงศ์ พื้นที่พบ และรายละเอียดการเก็บตัวอย่าง",

      specimens: "ตัวอย่างทั้งหมด",
      provinces: "จังหวัด",
      families: "วงศ์พืช",

      records: "รายการ",
      provinceUnit: "จังหวัด",
      familyUnit: "วงศ์",

      searchLabel: "ค้นหาในคลัง",
      search: "ค้นหาชื่อพืช ชื่อวิทยาศาสตร์ วงศ์ หรือสถานที่...",

      refresh: "โหลดข้อมูลใหม่",

      filters: "ตัวกรอง",

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

      viewDetails: "ดูข้อมูลตัวอย่าง",

      noData: "ยังไม่มีข้อมูลพรรณไม้",

      noDataDescription:
        "เมื่อมีการเพิ่มตัวอย่างพรรณไม้ ข้อมูลจะปรากฏในคลังนี้",

      noSearch: "ไม่พบพรรณไม้ที่ตรงกับการค้นหา",

      noSearchDescription: "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองบางรายการ",

      clearFilters: "ล้างตัวกรอง",

      loadError: "ไม่สามารถโหลดข้อมูลพรรณไม้ได้",

      retry: "ลองอีกครั้ง",

      unknown: "ไม่ระบุ",

      footer: "ธรรมชาติ...คือห้องเรียนที่ดีที่สุด",

      home: "หน้าแรก",

      about: "เกี่ยวกับเรา",
    },

    EN: {
      eyebrow: "BOTANICAL COLLECTION",

      titleTop: "Explore the diversity",
      titleHighlight: "of plant life",

      subtitle:
        "Discover specimens in the Virtual Herbarium together with scientific names, families, locations and collection information.",

      specimens: "Total Specimens",
      provinces: "Provinces",
      families: "Plant Families",

      records: "records",
      provinceUnit: "provinces",
      familyUnit: "families",

      searchLabel: "Search the collection",

      search: "Search name, scientific name, family or location...",

      refresh: "Refresh Collection",

      filters: "Filters",

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

      viewDetails: "View Specimen",

      noData: "No plant records yet",

      noDataDescription:
        "Plant specimens will appear here once they have been added to the herbarium.",

      noSearch: "No plants match your search",

      noSearchDescription:
        "Try another keyword or remove some of the active filters.",

      clearFilters: "Clear Filters",

      loadError: "Unable to load plant data",

      retry: "Try Again",

      unknown: "Unknown",

      footer: "Nature is the greatest classroom.",

      home: "Home",

      about: "About",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     FETCH PLANTS
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

  /* =====================================================
     RESET DISTRICT
  ===================================================== */

  useEffect(() => {
    if (!districtFilter) {
      return;
    }

    if (!districts.includes(districtFilter)) {
      setDistrictFilter("");
    }
  }, [provinceFilter, districts, districtFilter]);

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

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="page overflow-x-hidden">
      <Navbar />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative isolate overflow-hidden border-b border-white/10">
        {/* BACKGROUND */}

        <div
          className="absolute inset-0 -z-30 bg-cover bg-center"
          style={{
            backgroundImage: `url("${FOREST_HERO}")`,
          }}
        />

        {/* OVERLAY */}

        <div
          className={`absolute inset-0 -z-20 ${
            darkMode
              ? "bg-[linear-gradient(90deg,rgba(2,10,5,0.94)_0%,rgba(3,16,8,0.82)_52%,rgba(3,14,7,0.56)_100%)]"
              : "bg-[linear-gradient(90deg,rgba(240,247,238,0.96)_0%,rgba(238,246,236,0.88)_52%,rgba(235,244,233,0.64)_100%)]"
          }`}
        />

        {/* LOWER FADE */}

        <div
          className={`absolute inset-0 -z-10 ${
            darkMode
              ? "bg-[linear-gradient(180deg,transparent_45%,#07100b_100%)]"
              : "bg-[linear-gradient(180deg,transparent_45%,#f1f6f1_100%)]"
          }`}
        />

        {/* LIGHT */}

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

        {/* CONTENT */}

        <div className="container">
          <div className="py-10 sm:py-16 lg:py-20">
            {/* TITLE */}

            <div className="max-w-4xl page-enter">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-xl sm:gap-3 sm:px-4 sm:py-2 ${
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

                <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] sm:text-[11px] sm:tracking-[0.22em]">
                  {t.eyebrow}
                </span>
              </div>

              <h1
                className={`mt-5 max-w-4xl text-[2.15rem] font-black leading-[1.04] tracking-[-0.045em] sm:mt-7 sm:text-6xl lg:text-7xl ${
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
                className={`mt-4 max-w-3xl text-sm leading-7 sm:mt-6 sm:text-lg sm:leading-8 ${
                  darkMode ? "text-[#cad7cd]" : "text-[#425b49]"
                }`}
              >
                {t.subtitle}
              </p>
            </div>

            {/* =================================================
                STATS
            ================================================= */}

            <div className="mt-7 grid max-w-4xl grid-cols-3 gap-2 sm:mt-10 sm:gap-3">
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
          SEARCH / FILTER
      ===================================================== */}

      <section className="relative">
        <div className="container py-7 sm:py-12">
          <div
            className={`relative overflow-hidden rounded-[1.35rem] border p-3 shadow-2xl backdrop-blur-2xl sm:rounded-[1.8rem] sm:p-5 ${
              darkMode
                ? "border-white/10 bg-[#0a1710]/90 shadow-black/25"
                : "border-emerald-950/10 bg-white/85 shadow-emerald-950/10"
            }`}
          >
            {/* TOP LINE */}

            <div
              className={`absolute inset-x-10 top-0 h-px ${
                darkMode
                  ? "bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
                  : "bg-gradient-to-r from-transparent via-emerald-700/25 to-transparent"
              }`}
            />

            {/* FILTER HEADER */}

            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
              <div>
                <p
                  className={`text-[9px] font-black uppercase tracking-[0.16em] sm:text-[10px] sm:tracking-[0.18em] ${
                    darkMode ? "text-emerald-400" : "text-emerald-700"
                  }`}
                >
                  {t.searchLabel}
                </p>

                <p
                  className={`mt-0.5 text-xs sm:mt-1 sm:text-sm ${
                    darkMode ? "text-gray-400" : "text-slate-500"
                  }`}
                >
                  {t.filters}
                </p>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-bold transition sm:gap-2 sm:rounded-xl sm:px-3 sm:text-xs ${
                    darkMode
                      ? "bg-white/[0.05] text-gray-300 hover:bg-white/[0.09] hover:text-white"
                      : "bg-emerald-950/[0.05] text-slate-600 hover:bg-emerald-950/[0.09]"
                  }`}
                >
                  <CloseCircleIcon className="h-4 w-4" />

                  {t.clearFilters}
                </button>
              )}
            </div>

            {/* SEARCH + REFRESH */}

            <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3">
              <div className="relative">
                <SearchIcon
                  className={`absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 sm:left-4 sm:h-5 sm:w-5 ${
                    darkMode ? "text-gray-500" : "text-slate-400"
                  }`}
                />

                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.search}
                  className={`h-11 w-full rounded-xl border pl-10 pr-3 text-[13px] outline-none transition sm:h-[52px] sm:rounded-2xl sm:pl-12 sm:pr-4 sm:text-sm ${
                    darkMode
                      ? "border-white/10 bg-black/20 text-white placeholder:text-gray-600 focus:border-emerald-400/40 focus:bg-black/30"
                      : "border-emerald-950/10 bg-[#f6faf5] text-slate-900 placeholder:text-slate-400 focus:border-emerald-700/35 focus:bg-white"
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={fetchPlants}
                disabled={loading}
                title={t.refresh}
                className={`inline-flex h-11 w-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 sm:h-[52px] sm:w-auto sm:rounded-2xl sm:px-5 ${
                  darkMode
                    ? "border-white/10 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]"
                    : "border-emerald-950/10 bg-white text-slate-700 hover:bg-emerald-950/[0.04]"
                }`}
              >
                <RefreshIcon
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />

                <span className="hidden sm:inline">{t.refresh}</span>
              </button>
            </div>

            {/* =================================================
                FILTER SELECTS
            ================================================= */}

            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-3 lg:grid-cols-4">
              <FilterSelect
                darkMode={darkMode}
                value={familyFilter}
                onChange={setFamilyFilter}
                options={families}
                placeholder={t.allFamilies}
              />

              <FilterSelect
                darkMode={darkMode}
                value={provinceFilter}
                onChange={(value) => {
                  setProvinceFilter(value);

                  setDistrictFilter("");
                }}
                options={provinces}
                placeholder={t.allProvinces}
              />

              <FilterSelect
                darkMode={darkMode}
                value={districtFilter}
                onChange={setDistrictFilter}
                options={districts}
                placeholder={t.allDistricts}
              />

              <FilterSelect
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
            </div>
          </div>

          {/* =================================================
              COLLECTION HEADER
          ================================================= */}

          <div className="mt-9 flex items-end justify-between gap-3 sm:mt-12">
            <div>
              <p
                className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                  darkMode ? "text-emerald-400" : "text-emerald-700"
                }`}
              >
                {t.collectionLabel}
              </p>

              <h2
                className={`mt-1.5 text-xl font-black tracking-tight sm:mt-2 sm:text-3xl ${
                  darkMode ? "text-white" : "text-[#13251a]"
                }`}
              >
                {t.collection}
              </h2>

              <p
                className={`mt-1.5 text-xs sm:mt-2 sm:text-sm ${
                  darkMode ? "text-gray-400" : "text-slate-500"
                }`}
              >
                {t.found}{" "}
                <span
                  className={`font-bold ${
                    darkMode ? "text-emerald-300" : "text-emerald-700"
                  }`}
                >
                  {filteredPlants.length}
                </span>{" "}
                {t.result}
              </p>
            </div>

            <div
              className={`hidden items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold sm:flex ${
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
              className={`mt-7 rounded-[1.5rem] border p-6 text-center sm:mt-8 sm:p-7 ${
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
                className={`mx-auto mt-2 max-w-xl text-sm ${
                  darkMode ? "text-red-300/70" : "text-red-600"
                }`}
              >
                {error}
              </p>

              <button
                type="button"
                onClick={fetchPlants}
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-600"
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
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-5 lg:grid-cols-3">
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
              className={`mt-7 rounded-[1.6rem] border px-5 py-14 text-center sm:mt-8 sm:rounded-[2rem] sm:px-6 sm:py-20 ${
                darkMode
                  ? "border-white/10 bg-[#0a1710]"
                  : "border-emerald-950/10 bg-white/80"
              }`}
            >
              <div
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl sm:h-16 sm:w-16 ${
                  darkMode
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-emerald-800/10 text-emerald-800"
                }`}
              >
                <LeafIcon className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>

              <h3
                className={`mt-4 text-lg font-black sm:mt-5 sm:text-xl ${
                  darkMode ? "text-white" : "text-[#173321]"
                }`}
              >
                {plants.length === 0 ? t.noData : t.noSearch}
              </h3>

              <p
                className={`mx-auto mt-2 max-w-lg text-sm leading-6 sm:mt-3 sm:leading-7 ${
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
                  className={`mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border px-4 text-xs font-bold transition sm:mt-6 sm:min-h-11 sm:px-5 sm:text-sm ${
                    darkMode
                      ? "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                      : "border-emerald-950/10 bg-white text-slate-700 hover:bg-emerald-50"
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
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-5 lg:grid-cols-3">
              {filteredPlants.map((plant) => (
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
          )}
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        className={`mt-8 border-t sm:mt-9 ${
          darkMode ? "border-white/15" : "border-emerald-950/15"
        }`}
      >
        <div className="container">
          <div
            className={`flex flex-col items-center gap-2 py-5 text-center text-[10px] sm:flex-row sm:justify-between sm:text-left sm:text-xs ${
              darkMode ? "text-white/60" : "text-emerald-950/70"
            }`}
          >
            <p>© 2026 Virtual Herbarium. All rights reserved.</p>

            <div className="flex items-center gap-2">
              <LeafIcon className="h-3.5 w-3.5 text-emerald-400" />

              <span>{t.footer}</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ darkMode, icon, label, value, suffix }) {
  return (
    <div
      className={`rounded-xl border p-2.5 text-center backdrop-blur-xl transition duration-300 hover:-translate-y-1 sm:rounded-2xl sm:p-4 sm:text-left ${
        darkMode
          ? "border-white/10 bg-black/20"
          : "border-emerald-950/10 bg-white/55"
      }`}
    >
      <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-4">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${
            darkMode
              ? "bg-emerald-400/10 text-emerald-300"
              : "bg-emerald-800/10 text-emerald-800"
          }`}
        >
          {icon}
        </div>

        <div>
          <p
            className={`line-clamp-1 text-[8px] font-bold sm:text-[11px] ${
              darkMode ? "text-gray-400" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <div className="mt-0.5 flex items-baseline justify-center gap-1 sm:justify-start sm:gap-2">
            <span
              className={`text-xl font-black sm:text-2xl ${
                darkMode ? "text-white" : "text-[#173321]"
              }`}
            >
              {value}
            </span>

            <span
              className={`hidden text-[9px] min-[360px]:inline sm:text-[10px] ${
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
   FILTER SELECT
========================================================= */

function FilterSelect({
  darkMode,
  value,
  onChange,
  options,
  placeholder,
  labels = {},
}) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);

  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const hasCustomLabels = Object.keys(labels).length > 0;

  const currentLabel = value ? labels[value] || value : placeholder;

  /*
    แสดงได้สูงสุด 10 แถว
    แต่ละแถวสูงประมาณ 42px
  */

  const visibleRows = 10;
  const rowHeight = 42;
  const menuPadding = 12;

  const maxMenuHeight = visibleRows * rowHeight + menuPadding;

  /* =====================================================
     POSITION
  ===================================================== */

  function calculateMenuPosition() {
    if (!triggerRef.current || typeof window === "undefined") {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();

    const viewportWidth = window.innerWidth;

    const viewportHeight = window.innerHeight;

    const edge = viewportWidth < 640 ? 10 : 16;

    /*
      ทำให้ dropdown ไม่แคบเกินไป
      แต่ไม่เกินขอบจอ
    */

    const width = Math.min(
      Math.max(rect.width, viewportWidth < 640 ? 220 : 240),
      viewportWidth - edge * 2,
    );

    let left = rect.left;

    if (left + width > viewportWidth - edge) {
      left = viewportWidth - width - edge;
    }

    if (left < edge) {
      left = edge;
    }

    const spaceBelow = viewportHeight - rect.bottom - edge;

    const spaceAbove = rect.top - edge;

    /*
      ถ้าด้านล่างเหลือน้อย
      และด้านบนมีพื้นที่มากกว่า
      ให้เปิดขึ้นบน
    */

    const openAbove =
      spaceBelow < Math.min(220, maxMenuHeight) && spaceAbove > spaceBelow;

    const availableSpace = openAbove ? spaceAbove - 8 : spaceBelow - 8;

    /*
      สูงสุด 10 รายการ
      แต่ถ้าจอเตี้ย จะลดความสูงตามพื้นที่จริง
    */

    const height = Math.min(maxMenuHeight, Math.max(126, availableSpace));

    const top = openAbove
      ? Math.max(edge, rect.top - height - 8)
      : rect.bottom + 8;

    setMenuPosition({
      top,
      left,
      width,
      height,
    });
  }

  /* =====================================================
     EVENTS
  ===================================================== */

  useEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    calculateMenuPosition();

    function handleOutside(event) {
      const clickedTrigger =
        triggerRef.current && triggerRef.current.contains(event.target);

      const clickedMenu =
        menuRef.current && menuRef.current.contains(event.target);

      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function updatePosition() {
      calculateMenuPosition();
    }

    document.addEventListener("pointerdown", handleOutside);

    document.addEventListener("keydown", handleEscape);

    window.addEventListener("resize", updatePosition);

    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);

      document.removeEventListener("keydown", handleEscape);

      window.removeEventListener("resize", updatePosition);

      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  /* =====================================================
     SELECT
  ===================================================== */

  function selectOption(option) {
    onChange(option);
    setOpen(false);
  }

  function toggleDropdown() {
    if (!open) {
      calculateMenuPosition();
    }

    setOpen((current) => !current);
  }

  /* =====================================================
     PORTAL DROPDOWN
  ===================================================== */

  const dropdown =
    open && menuPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",

              top: `${menuPosition.top}px`,

              left: `${menuPosition.left}px`,

              width: `${menuPosition.width}px`,

              maxHeight: `${menuPosition.height}px`,
            }}
            className={`z-[9999] overflow-hidden rounded-xl border shadow-[0_20px_55px_rgba(0,0,0,0.38)] backdrop-blur-2xl ${
              darkMode
                ? "border-white/10 bg-[#0a1710]/[0.98]"
                : "border-emerald-950/10 bg-white/[0.98]"
            }`}
          >
            {/* SCROLL AREA */}

            <div
              className="overflow-y-auto overscroll-contain p-1.5"
              style={{
                maxHeight: `${menuPosition.height}px`,

                WebkitOverflowScrolling: "touch",

                scrollbarWidth: "thin",
              }}
            >
              {/* ALL OPTION */}

              {!hasCustomLabels && (
                <button
                  type="button"
                  role="option"
                  aria-selected={value === ""}
                  onClick={() => selectOption("")}
                  className={`flex min-h-[42px] w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-xs font-semibold transition sm:text-sm ${
                    value === ""
                      ? darkMode
                        ? "bg-emerald-400/15 text-emerald-200"
                        : "bg-emerald-700/10 text-emerald-800"
                      : darkMode
                        ? "text-gray-300 hover:bg-white/[0.06] hover:text-white"
                        : "text-slate-700 hover:bg-emerald-950/[0.05] hover:text-emerald-900"
                  }`}
                >
                  <span className="min-w-0 truncate">{placeholder}</span>

                  {value === "" && <CheckIcon className="h-4 w-4 shrink-0" />}
                </button>
              )}

              {/* OPTIONS */}

              {options.map((option) => {
                const selected = value === option;

                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => selectOption(option)}
                    className={`flex min-h-[42px] w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-xs font-semibold transition sm:text-sm ${
                      selected
                        ? darkMode
                          ? "bg-emerald-400/15 text-emerald-200"
                          : "bg-emerald-700/10 text-emerald-800"
                        : darkMode
                          ? "text-gray-300 hover:bg-white/[0.06] hover:text-white"
                          : "text-slate-700 hover:bg-emerald-950/[0.05] hover:text-emerald-900"
                    }`}
                  >
                    <span className="min-w-0 truncate">
                      {labels[option] || option}
                    </span>

                    {selected && <CheckIcon className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>,

          document.body,
        )
      : null;

  /* =====================================================
     BUTTON
  ===================================================== */

  return (
    <>
      <div className="relative min-w-0">
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleDropdown}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border px-3 text-left text-xs font-medium outline-none transition sm:h-12 sm:px-4 sm:text-sm ${
            open
              ? darkMode
                ? "border-emerald-400/70 bg-black/30 shadow-[0_0_0_3px_rgba(52,211,153,0.12)]"
                : "border-emerald-600 bg-white shadow-[0_0_0_3px_rgba(5,150,105,0.10)]"
              : darkMode
                ? "border-white/10 bg-black/20 hover:border-white/20"
                : "border-emerald-950/10 bg-[#f6faf5] hover:border-emerald-800/20"
          } ${darkMode ? "text-gray-200" : "text-slate-700"}`}
        >
          <span className="min-w-0 truncate">{currentLabel}</span>

          <ChevronDownIcon
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 sm:h-4 sm:w-4 ${
              open ? "rotate-180" : ""
            } ${darkMode ? "text-gray-500" : "text-slate-400"}`}
          />
        </button>
      </div>

      {dropdown}
    </>
  );
}

/* =========================================================
   PLANT CARD
========================================================= */

function PlantCard({ plant, darkMode, t, getPlantName, getLocation }) {
  const image = plant.image_url || "";

  return (
    <article
      className={`group relative min-w-0 overflow-hidden rounded-[1rem] border transition duration-300 sm:rounded-[1.7rem] sm:hover:-translate-y-1.5 ${
        darkMode
          ? "border-white/10 bg-[#0a1710] shadow-[0_8px_22px_rgba(0,0,0,0.18)] sm:shadow-[0_16px_45px_rgba(0,0,0,0.22)] sm:hover:border-emerald-400/25 sm:hover:shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
          : "border-emerald-950/10 bg-white/90 shadow-[0_7px_20px_rgba(25,55,34,0.07)] sm:shadow-[0_14px_35px_rgba(25,55,34,0.08)] sm:hover:border-emerald-700/20 sm:hover:shadow-[0_24px_55px_rgba(25,55,34,0.14)]"
      }`}
    >
      {/* =================================================
          IMAGE
      ================================================= */}

      <div className="relative h-[105px] overflow-hidden min-[390px]:h-[118px] sm:h-auto sm:aspect-[1.45/1]">
        {image ? (
          <img
            src={image}
            alt={getPlantName(plant)}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 sm:group-hover:scale-[1.055]"
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
              className={`h-8 w-8 sm:h-16 sm:w-16 ${
                darkMode ? "text-emerald-400/40" : "text-emerald-800/30"
              }`}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#020b05]/88 via-transparent to-black/10" />

        {/* BADGE */}

        <div className="absolute left-2 top-2 sm:left-4 sm:top-4">
          <span className="inline-flex rounded-full border border-white/15 bg-black/35 px-1.5 py-0.5 text-[6px] font-black tracking-[0.1em] text-white backdrop-blur-xl min-[390px]:text-[7px] sm:px-3 sm:py-1.5 sm:text-[9px] sm:tracking-[0.16em]">
            {t.specimen}
          </span>
        </div>

        {/* SCIENTIFIC NAME */}

        {plant.botanical_name && (
          <div className="absolute inset-x-0 bottom-0 p-2 sm:p-5">
            <p className="truncate text-[9px] font-semibold italic text-emerald-200 min-[390px]:text-[10px] sm:text-sm">
              {plant.botanical_name}
            </p>
          </div>
        )}
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="p-2.5 sm:p-5">
        <h3
          className={`truncate text-[13px] font-black leading-5 tracking-tight min-[390px]:text-sm sm:text-xl ${
            darkMode ? "text-white" : "text-[#14271a]"
          }`}
        >
          {getPlantName(plant)}
        </h3>

        {/* =================================================
            INFO

            Mobile:
            - Family
            - Location

            Tablet/Desktop:
            - Family
            - Location
            - Collector
            - Specimen number
        ================================================= */}

        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:mt-4 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-3">
          {plant.family && (
            <InformationRow
              darkMode={darkMode}
              icon={<BranchIcon className="h-3 w-3 sm:h-4 sm:w-4" />}
              label={t.family}
              value={plant.family}
            />
          )}

          <InformationRow
            darkMode={darkMode}
            icon={<PinIcon className="h-3 w-3 sm:h-4 sm:w-4" />}
            label={t.location}
            value={getLocation(plant) || t.unknown}
          />

          {plant.collected_by && (
            <div className="hidden sm:block">
              <InformationRow
                darkMode={darkMode}
                icon={<UserIcon className="h-4 w-4" />}
                label={t.collector}
                value={plant.collected_by}
              />
            </div>
          )}

          {plant.specimen_number && (
            <div className="hidden sm:block">
              <InformationRow
                darkMode={darkMode}
                icon={<DocumentIcon className="h-4 w-4" />}
                label={t.specimenNumber}
                value={plant.specimen_number}
              />
            </div>
          )}
        </div>

        {/* DIVIDER */}

        <div
          className={`my-2.5 h-px sm:my-5 ${
            darkMode ? "bg-white/10" : "bg-emerald-950/10"
          }`}
        />

        {/* DETAILS */}

        <Link
          href={`/plants/${plant.id}`}
          className={`group/button flex min-h-[34px] w-full items-center justify-between rounded-lg border px-2.5 text-[9px] font-bold transition min-[390px]:text-[10px] sm:min-h-11 sm:rounded-xl sm:px-4 sm:text-sm ${
            darkMode
              ? "border-white/10 bg-white/[0.025] text-gray-200 hover:border-emerald-400/25 hover:bg-emerald-400/[0.07] hover:text-emerald-200"
              : "border-emerald-950/10 bg-[#f7faf6] text-slate-700 hover:border-emerald-700/20 hover:bg-emerald-50 hover:text-emerald-800"
          }`}
        >
          <span className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <DocumentIcon className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />

            <span className="truncate">{t.viewDetails}</span>
          </span>

          <ChevronRightIcon className="h-3 w-3 shrink-0 transition-transform group-hover/button:translate-x-0.5 sm:h-4 sm:w-4" />
        </Link>
      </div>

      <div className="absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent transition-all duration-500 group-hover:w-3/4" />
    </article>
  );
}

/* =========================================================
   INFORMATION ROW
========================================================= */

function InformationRow({ darkMode, icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-1.5 sm:gap-3">
      <div
        className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md sm:h-8 sm:w-8 sm:rounded-lg ${
          darkMode
            ? "bg-white/[0.04] text-emerald-300"
            : "bg-emerald-800/[0.07] text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className={`truncate text-[6.5px] font-bold uppercase tracking-[0.06em] sm:text-[9px] sm:tracking-[0.12em] ${
            darkMode ? "text-gray-500" : "text-slate-400"
          }`}
        >
          {label}
        </p>

        <p
          className={`mt-0.5 truncate text-[8.5px] font-semibold min-[390px]:text-[9px] sm:text-xs ${
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
      className={`overflow-hidden rounded-[1rem] border sm:rounded-[1.7rem] ${
        darkMode
          ? "border-white/10 bg-[#0a1710]"
          : "border-emerald-950/10 bg-white"
      }`}
    >
      <div
        className={`h-[105px] animate-pulse min-[390px]:h-[118px] sm:h-auto sm:aspect-[1.45/1] ${
          darkMode ? "bg-white/[0.05]" : "bg-emerald-950/[0.05]"
        }`}
      />

      <div className="space-y-2 p-2.5 sm:space-y-4 sm:p-5">
        <div
          className={`h-4 w-2/3 animate-pulse rounded-md sm:h-5 sm:rounded-lg ${
            darkMode ? "bg-white/[0.08]" : "bg-emerald-950/[0.07]"
          }`}
        />

        <div className="space-y-1.5 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
          {Array.from({
            length: 2,
          }).map((_, index) => (
            <div
              key={index}
              className={`h-6 animate-pulse rounded-md sm:h-9 sm:rounded-lg ${
                darkMode ? "bg-white/[0.05]" : "bg-emerald-950/[0.04]"
              }`}
            />
          ))}
        </div>

        <div
          className={`h-[34px] animate-pulse rounded-lg sm:h-11 sm:rounded-xl ${
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
