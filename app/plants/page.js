"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

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

  const text = {
    TH: {
      badge: "คลังพรรณไม้",
      title: "สำรวจพรรณไม้",
      subtitle:
        "สำรวจข้อมูลพรรณไม้ที่ถูกรวบรวมและจัดเก็บไว้ในฐานข้อมูล Virtual Herbarium",

      specimens: "ตัวอย่างพืช",
      provinces: "จังหวัด",
      families: "วงศ์พืช",
      items: "รายการ",

      search: "ค้นหาชื่อพืช วงศ์ สถานที่...",
      refresh: "รีเฟรช",

      allFamilies: "ทุกวงศ์",
      allProvinces: "ทุกจังหวัด",
      allDistricts: "ทุกอำเภอ",

      collection: "รายการพรรณไม้",
      found: "พบ",
      result: "รายการ",

      newest: "ล่าสุด",
      oldest: "เก่าสุด",
      nameAZ: "ชื่อ A-Z",
      nameZA: "ชื่อ Z-A",

      specimen: "ตัวอย่างพืช",
      family: "วงศ์",
      location: "สถานที่",
      viewDetails: "ดูรายละเอียด",

      noData: "ยังไม่มีข้อมูลพรรณไม้",
      noSearch: "ไม่พบพรรณไม้ที่ตรงกับการค้นหา",

      loadError: "ไม่สามารถโหลดข้อมูลพืชได้",
      retry: "ลองอีกครั้ง",

      unknown: "ไม่ระบุ",
    },

    EN: {
      badge: "PLANT COLLECTION",
      title: "Explore Plants",
      subtitle:
        "Explore plant specimens collected and preserved in the Virtual Herbarium database.",

      specimens: "Total Specimens",
      provinces: "Provinces",
      families: "Families",
      items: "items",

      search: "Search plant name, family, location...",
      refresh: "Refresh",

      allFamilies: "All Families",
      allProvinces: "All Provinces",
      allDistricts: "All Districts",

      collection: "Plant Collection",
      found: "Found",
      result: "items",

      newest: "Newest first",
      oldest: "Oldest first",
      nameAZ: "Name A-Z",
      nameZA: "Name Z-A",

      specimen: "Specimen",
      family: "Family",
      location: "Location",
      viewDetails: "View details",

      noData: "No plant data available",
      noSearch: "No plants match your search",

      loadError: "Unable to load plant data",
      retry: "Try again",

      unknown: "Unknown",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  async function fetchPlants() {
    setLoading(true);
    setError("");

    try {
      /*
       * สำคัญ:
       * ไม่เรียก status เพราะใน database ของคุณไม่มี column นี้
       */
      const { data, error } = await supabase
        .from("plants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch plants error:", error);
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

  const families = useMemo(() => {
    return [
      ...new Set(plants.map((plant) => plant.family).filter(Boolean)),
    ].sort();
  }, [plants]);

  const provinces = useMemo(() => {
    return [
      ...new Set(plants.map((plant) => plant.province).filter(Boolean)),
    ].sort();
  }, [plants]);

  const districts = useMemo(() => {
    return [
      ...new Set(plants.map((plant) => plant.district).filter(Boolean)),
    ].sort();
  }, [plants]);

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

  const stats = useMemo(() => {
    const provinceCount = new Set(plants.map((p) => p.province).filter(Boolean))
      .size;

    const familyCount = new Set(plants.map((p) => p.family).filter(Boolean))
      .size;

    return {
      specimens: plants.length,
      provinces: provinceCount,
      families: familyCount,
    };
  }, [plants]);

  function getPlantName(plant) {
    return plant.common_name || plant.botanical_name || t.unknown;
  }

  function getLocation(plant) {
    return [plant.location, plant.district, plant.province]
      .filter(Boolean)
      .join(", ");
  }

  function getImage(plant) {
    return plant.image_url || "";
  }

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-[#06100c] text-white" : "bg-[#f5faf7] text-[#17211c]"
      }`}
    >
      <Navbar />

      {/* =====================================================
          HERO
      ====================================================== */}

      <section
        className={`relative overflow-hidden border-b ${
          darkMode
            ? "border-white/10 bg-[#07150f]"
            : "border-emerald-100 bg-white"
        }`}
      >
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className={`absolute right-[-10%] top-[-30%] h-[520px] w-[720px] rounded-full blur-3xl ${
              darkMode ? "bg-emerald-900/30" : "bg-emerald-100/70"
            }`}
          />

          <div
            className={`absolute left-[-15%] bottom-[-50%] h-[500px] w-[650px] rounded-full blur-3xl ${
              darkMode ? "bg-green-950/40" : "bg-green-100/40"
            }`}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div
              className={`mb-5 inline-flex rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                darkMode
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {t.badge}
            </div>

            <h1
              className={`text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl ${
                darkMode ? "text-white" : "text-[#142019]"
              }`}
            >
              {t.title}
            </h1>

            <p
              className={`mt-5 max-w-2xl text-base leading-7 sm:text-lg ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {t.subtitle}
            </p>
          </div>

          {/* Statistics */}
          <div className="mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            <StatCard
              darkMode={darkMode}
              label={t.specimens}
              value={stats.specimens}
              suffix={t.items}
              icon="leaf"
            />

            <StatCard
              darkMode={darkMode}
              label={t.provinces}
              value={stats.provinces}
              suffix={isEnglish ? "provinces" : "จังหวัด"}
              icon="pin"
            />

            <StatCard
              darkMode={darkMode}
              label={t.families}
              value={stats.families}
              suffix={isEnglish ? "families" : "วงศ์"}
              icon="branch"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        {/* SEARCH PANEL */}

        <div
          className={`rounded-3xl border p-4 shadow-xl ${
            darkMode
              ? "border-white/10 bg-[#0b1712] shadow-black/20"
              : "border-emerald-100 bg-white shadow-emerald-950/10"
          }`}
        >
          <div className="flex flex-col gap-3 lg:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <SearchIcon />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.search}
                className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition ${
                  darkMode
                    ? "border-white/10 bg-[#07100c] text-white placeholder:text-gray-500 focus:border-emerald-500/50"
                    : "border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white"
                }`}
              />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchPlants}
              disabled={loading}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-6 text-sm font-semibold transition disabled:opacity-50 ${
                darkMode
                  ? "border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/[0.08]"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <RefreshIcon />
              {t.refresh}
            </button>
          </div>

          {/* Filters */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              onChange={setProvinceFilter}
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

        {/* COLLECTION HEADER */}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              className={`text-xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {t.collection}
            </h2>

            <p
              className={`mt-1 text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {t.found} {filteredPlants.length} {t.result}
            </p>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div
            className={`mt-6 rounded-2xl border p-6 text-center ${
              darkMode
                ? "border-red-900/50 bg-red-950/20"
                : "border-red-200 bg-red-50"
            }`}
          >
            <p
              className={`font-semibold ${
                darkMode ? "text-red-300" : "text-red-700"
              }`}
            >
              {t.loadError}
            </p>

            <p
              className={`mt-2 text-sm ${
                darkMode ? "text-red-400" : "text-red-600"
              }`}
            >
              {error}
            </p>

            <button
              type="button"
              onClick={fetchPlants}
              className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              {t.retry}
            </button>
          </div>
        )}

        {/* LOADING */}

        {loading && !error && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} darkMode={darkMode} />
            ))}
          </div>
        )}

        {/* EMPTY */}

        {!loading && !error && filteredPlants.length === 0 && (
          <div
            className={`mt-8 rounded-3xl border px-6 py-20 text-center ${
              darkMode
                ? "border-white/10 bg-[#0b1712]"
                : "border-gray-200 bg-white"
            }`}
          >
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
                darkMode ? "bg-emerald-500/10" : "bg-emerald-50"
              }`}
            >
              <LeafIcon />
            </div>

            <h3
              className={`mt-5 text-lg font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {plants.length === 0 ? t.noData : t.noSearch}
            </h3>
          </div>
        )}

        {/* PLANT CARDS */}

        {!loading && !error && filteredPlants.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                darkMode={darkMode}
                isEnglish={isEnglish}
                t={t}
                getPlantName={getPlantName}
                getLocation={getLocation}
                getImage={getImage}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({ darkMode, label, value, suffix, icon }) {
  return (
    <div
      className={`rounded-2xl border p-5 backdrop-blur-sm ${
        darkMode
          ? "border-white/10 bg-white/[0.03]"
          : "border-emerald-100 bg-white/70"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            darkMode
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {icon === "pin" ? (
            <PinIcon />
          ) : icon === "branch" ? (
            <BranchIcon />
          ) : (
            <LeafIcon />
          )}
        </div>

        <div>
          <p
            className={`text-xs font-medium ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {label}
          </p>

          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {value}
            </span>

            <span
              className={`text-xs ${
                darkMode ? "text-gray-500" : "text-gray-400"
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

/* ============================================================
   FILTER
============================================================ */

function FilterSelect({
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
        className={`h-11 w-full appearance-none rounded-xl border px-4 pr-10 text-sm outline-none transition ${
          darkMode
            ? "border-white/10 bg-[#07100c] text-gray-200 focus:border-emerald-500/50"
            : "border-gray-200 bg-gray-50 text-gray-700 focus:border-emerald-400 focus:bg-white"
        }`}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] || option}
          </option>
        ))}
      </select>

      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
        <ChevronIcon />
      </div>
    </div>
  );
}

/* ============================================================
   PLANT CARD
============================================================ */

function PlantCard({
  plant,
  darkMode,
  isEnglish,
  t,
  getPlantName,
  getLocation,
  getImage,
}) {
  const image = getImage(plant);

  return (
    <article
      className={`group overflow-hidden rounded-3xl border transition duration-300 hover:-translate-y-1 ${
        darkMode
          ? "border-white/10 bg-[#0d1913] hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-black/30"
          : "border-gray-200 bg-white hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-900/10"
      }`}
    >
      {/* IMAGE */}

      <div className="relative aspect-[1.45/1] overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={getPlantName(plant)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center ${
              darkMode ? "bg-[#14251b]" : "bg-emerald-50"
            }`}
          >
            <LeafIcon large />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${
              darkMode
                ? "border-emerald-300/20 bg-[#07100c]/80 text-emerald-300"
                : "border-emerald-200 bg-white/90 text-emerald-700"
            }`}
          >
            {t.specimen}
          </span>
        </div>
      </div>

      {/* CONTENT */}

      <div className="p-5">
        <h3
          className={`text-lg font-bold ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {getPlantName(plant)}
        </h3>

        {plant.botanical_name && (
          <p
            className={`mt-1 text-sm italic ${
              darkMode ? "text-emerald-400" : "text-emerald-600"
            }`}
          >
            {plant.botanical_name}
          </p>
        )}

        {plant.family && (
          <p
            className={`mt-3 text-xs ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {t.family}: {plant.family}
          </p>
        )}

        <div
          className={`mt-4 flex items-start gap-2 border-t pt-4 text-sm ${
            darkMode
              ? "border-white/10 text-gray-400"
              : "border-gray-100 text-gray-500"
          }`}
        >
          <PinIcon small />

          <span className="line-clamp-2">
            {getLocation(plant) || t.unknown}
          </span>
        </div>

        <Link
          href={`/plants/${plant.id}`}
          className={`mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
            darkMode
              ? "border-white/10 text-gray-200 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
              : "border-gray-200 text-gray-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          }`}
        >
          <DocumentIcon />
          {t.viewDetails}
        </Link>
      </div>
    </article>
  );
}

/* ============================================================
   SKELETON
============================================================ */

function SkeletonCard({ darkMode }) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border ${
        darkMode ? "border-white/10 bg-[#0d1913]" : "border-gray-200 bg-white"
      }`}
    >
      <div
        className={`aspect-[1.45/1] animate-pulse ${
          darkMode ? "bg-white/5" : "bg-gray-100"
        }`}
      />

      <div className="space-y-3 p-5">
        <div
          className={`h-5 w-2/3 animate-pulse rounded ${
            darkMode ? "bg-white/10" : "bg-gray-100"
          }`}
        />

        <div
          className={`h-4 w-1/2 animate-pulse rounded ${
            darkMode ? "bg-white/10" : "bg-gray-100"
          }`}
        />

        <div
          className={`h-10 animate-pulse rounded-xl ${
            darkMode ? "bg-white/10" : "bg-gray-100"
          }`}
        />
      </div>
    </div>
  );
}

/* ============================================================
   ICONS
============================================================ */

function SearchIcon() {
  return (
    <svg
      className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20 11a8.1 8.1 0 0 0-14.9-3.9L3 10" />
      <path d="M3 4v6h6" />
      <path d="M4 13a8.1 8.1 0 0 0 14.9 3.9L21 14" />
      <path d="M21 20v-6h-6" />
    </svg>
  );
}

function LeafIcon({ large = false }) {
  return (
    <svg
      className={large ? "h-16 w-16" : "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M20 4C10 4 5 8 5 15c0 2.8 2 5 5 5 7 0 10-5 10-16Z" />
      <path d="M4 20c4-5 7-7 13-10" />
    </svg>
  );
}

function PinIcon({ small = false }) {
  return (
    <svg
      className={small ? "mt-0.5 h-4 w-4 shrink-0" : "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M12 20V6" />
      <path d="M12 9 7 5" />
      <path d="M12 13l5-4" />
      <path d="M7 5 5 3" />
      <path d="M17 9l2-2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="h-4 w-4 text-gray-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}
