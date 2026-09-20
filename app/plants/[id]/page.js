"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   UUID
========================================================= */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function PlantDetailPage() {
  const params = useParams();

  const plantId = params?.id;

  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const [plant, setPlant] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      back: "กลับไปยังคลังพรรณไม้",

      loading: "กำลังเปิดข้อมูลตัวอย่างพรรณไม้",

      errorTitle: "ไม่สามารถเปิดข้อมูลพรรณไม้ได้",

      invalidId: "รหัสตัวอย่างพรรณไม้ไม่ถูกต้อง",

      notFound: "ไม่พบข้อมูลตัวอย่างพรรณไม้นี้",

      retry: "ลองอีกครั้ง",

      specimenLabel: "BOTANICAL SPECIMEN",

      specimen: "ข้อมูลตัวอย่างพรรณไม้",

      scientific: "ชื่อวิทยาศาสตร์",

      common: "ชื่อพรรณไม้",

      family: "วงศ์",

      province: "จังหวัด",

      district: "อำเภอ",

      location: "สถานที่เก็บตัวอย่าง",

      elevation: "ระดับความสูง",

      collectionDate: "วันที่เก็บตัวอย่าง",

      habitat: "ลักษณะถิ่นอาศัย",

      collectedBy: "ผู้เก็บตัวอย่าง",

      specimenNumber: "หมายเลขตัวอย่าง",

      duplicates: "จำนวนสำเนา",

      notes: "หมายเหตุ",

      image: "ภาพตัวอย่างพรรณไม้",

      record: "SPECIMEN RECORD",

      recordTitle: "รายละเอียดตัวอย่าง",

      fieldInfo: "FIELD INFORMATION",

      fieldTitle: "ข้อมูลพื้นที่และการเก็บตัวอย่าง",

      notesLabel: "OBSERVATION",

      notesTitle: "บันทึกและรายละเอียดเพิ่มเติม",

      noData: "ไม่มีข้อมูล",

      archived: "Digital Herbarium Record",

      exploreMore: "สำรวจพรรณไม้อื่น",

      collection: "Virtual Herbarium Collection",

      footer: "ธรรมชาติ...คือห้องเรียนที่ดีที่สุด",
    },

    EN: {
      back: "Back to Plant Collection",

      loading: "Opening specimen record",

      errorTitle: "Unable to open plant information",

      invalidId: "The specimen identifier is invalid.",

      notFound: "This plant specimen could not be found.",

      retry: "Try Again",

      specimenLabel: "BOTANICAL SPECIMEN",

      specimen: "Specimen Information",

      scientific: "Scientific name",

      common: "Common name",

      family: "Family",

      province: "Province",

      district: "District",

      location: "Collection location",

      elevation: "Elevation",

      collectionDate: "Collection date",

      habitat: "Habitat",

      collectedBy: "Collected by",

      specimenNumber: "Specimen number",

      duplicates: "Duplicates",

      notes: "Notes",

      image: "Specimen image",

      record: "SPECIMEN RECORD",

      recordTitle: "Specimen details",

      fieldInfo: "FIELD INFORMATION",

      fieldTitle: "Collection and location data",

      notesLabel: "OBSERVATION",

      notesTitle: "Notes and observations",

      noData: "No information",

      archived: "Digital Herbarium Record",

      exploreMore: "Explore More Plants",

      collection: "Virtual Herbarium Collection",

      footer: "Nature is the greatest classroom.",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     FETCH
  ===================================================== */

  async function fetchPlant() {
    if (!plantId) {
      return;
    }

    setLoading(true);
    setError("");

    /*
     * ป้องกัน route ที่ไม่ใช่ UUID
     * ไม่ให้ถูกส่งไป Supabase
     */

    if (!UUID_PATTERN.test(String(plantId))) {
      setPlant(null);
      setError(t.invalidId);
      setLoading(false);

      return;
    }

    try {
      const { data, error } = await supabase
        .from("plants")
        .select(
          `
          id,
          plant_id,
          family,
          common_name,
          botanical_name,
          province,
          district,
          location,
          elevation,
          collection_date,
          habitat,
          notes,
          collected_by,
          specimen_number,
          duplicates,
          created_at,
          image_url
        `,
        )
        .eq("id", plantId)
        .maybeSingle();

      if (error) {
        console.error("Fetch plant error:", error);

        throw error;
      }

      if (!data) {
        setPlant(null);
        setError(t.notFound);

        return;
      }

      setPlant(data);
    } catch (err) {
      console.error("Load plant failed:", err);

      setPlant(null);

      setError(err?.message || t.errorTitle);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlant();
  }, [plantId]);

  /* =====================================================
     HELPERS
  ===================================================== */

  function hasValue(value) {
    return !(
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    );
  }

  function displayValue(value) {
    return hasValue(value) ? value : t.noData;
  }

  function formatDate(date) {
    if (!hasValue(date)) {
      return t.noData;
    }

    try {
      /*
       * เพิ่มเวลา 00:00:00
       * เพื่อไม่ให้วันที่เลื่อนจาก timezone
       */

      const parsed = new Date(`${date}T00:00:00`);

      if (Number.isNaN(parsed.getTime())) {
        return date;
      }

      return new Intl.DateTimeFormat(
        isEnglish ? "en-GB" : "th-TH-u-ca-gregory",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        },
      ).format(parsed);
    } catch {
      return date;
    }
  }

  function getFullLocation() {
    if (!plant) {
      return "";
    }

    return [plant.location, plant.district, plant.province]
      .filter(Boolean)
      .join(", ");
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="page">
        <Navbar />

        <section className="relative flex min-h-[calc(100svh-78px)] items-center justify-center overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div
              className={`absolute left-1/2 top-[-220px] h-[600px] w-[900px] -translate-x-1/2 rounded-full blur-3xl ${
                darkMode ? "bg-emerald-500/[0.07]" : "bg-emerald-800/[0.06]"
              }`}
            />
          </div>

          <div className="relative text-center">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${
                darkMode
                  ? "border-emerald-400/15 bg-emerald-400/[0.06]"
                  : "border-emerald-800/10 bg-emerald-800/[0.06]"
              }`}
            >
              <div
                className={`h-7 w-7 animate-spin rounded-full border-2 border-t-transparent ${
                  darkMode ? "border-emerald-300" : "border-emerald-700"
                }`}
              />
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
     ERROR
  ===================================================== */

  if (error || !plant) {
    return (
      <main className="page">
        <Navbar />

        <section className="relative flex min-h-[calc(100svh-78px)] items-center justify-center overflow-hidden px-5 py-16">
          <div
            className={`absolute left-1/2 top-[-200px] h-[600px] w-[850px] -translate-x-1/2 rounded-full blur-3xl ${
              darkMode ? "bg-emerald-500/[0.05]" : "bg-emerald-800/[0.05]"
            }`}
          />

          <div
            className={`relative w-full max-w-lg rounded-[2rem] border p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10 ${
              darkMode
                ? "border-white/10 bg-[#0a1710]/90 shadow-black/30"
                : "border-emerald-950/10 bg-white/90 shadow-emerald-950/10"
            }`}
          >
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
                darkMode
                  ? "bg-red-400/10 text-red-300"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <AlertIcon className="h-6 w-6" />
            </div>

            <h1
              className={`mt-6 text-2xl font-black ${
                darkMode ? "text-white" : "text-[#14271a]"
              }`}
            >
              {t.errorTitle}
            </h1>

            <p
              className={`mt-3 text-sm leading-7 ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              {error}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={fetchPlant}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                {t.retry}
              </button>

              <Link
                href="/plants"
                className={`inline-flex min-h-12 items-center justify-center rounded-xl border px-5 text-sm font-bold transition ${
                  darkMode
                    ? "border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/[0.08]"
                    : "border-emerald-950/10 bg-white text-slate-700 hover:bg-emerald-50"
                }`}
              >
                {t.back}
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
    <main className="page overflow-x-hidden">
      <Navbar />

      {/* =====================================================
          SPECIMEN HERO
      ===================================================== */}

      <section className="relative isolate min-h-[365px] overflow-hidden sm:min-h-[430px] lg:min-h-[390px]">
        {/* IMAGE */}

        {plant.image_url ? (
          <div
            className="absolute inset-0 -z-30 scale-105 bg-cover bg-center"
            style={{
              backgroundImage: `url("${plant.image_url}")`,
            }}
          />
        ) : (
          <div
            className={`absolute inset-0 -z-30 ${
              darkMode
                ? "bg-[radial-gradient(circle_at_70%_30%,rgba(44,135,72,0.22),transparent_32%),linear-gradient(135deg,#061009,#0c2114)]"
                : "bg-[radial-gradient(circle_at_70%_30%,rgba(47,125,70,0.14),transparent_32%),linear-gradient(135deg,#e9f2e8,#f5f8f2)]"
            }`}
          />
        )}

        {/* BLUR */}

        {plant.image_url && (
          <div className="absolute inset-0 -z-20 backdrop-blur-[1.5px]" />
        )}

        {/* THEME OVERLAY */}

        <div
          className={`absolute inset-0 -z-10 ${
            darkMode
              ? "bg-[linear-gradient(90deg,rgba(2,9,5,0.98)_0%,rgba(3,13,7,0.91)_48%,rgba(3,12,7,0.67)_100%)]"
              : "bg-[linear-gradient(90deg,rgba(239,247,237,0.98)_0%,rgba(239,247,237,0.91)_50%,rgba(236,246,234,0.72)_100%)]"
          }`}
        />

        {/* BOTTOM FADE */}

        <div
          className={`absolute inset-x-0 bottom-0 -z-10 h-36 ${
            darkMode
              ? "bg-gradient-to-t from-[#07100b] to-transparent"
              : "bg-gradient-to-t from-[#f1f6f1] to-transparent"
          }`}
        />

        {/* PARTICLES */}

        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="forest-particle left-[12%] top-[38%]" />

          <div className="forest-particle right-[24%] top-[28%] [animation-delay:-3s]" />

          <div className="forest-particle right-[9%] top-[62%] [animation-delay:-5s]" />
        </div>

        {/* CONTENT */}

        <div className="container">
          <div className="flex min-h-[365px] items-end justify-start py-8 text-left sm:min-h-[430px] sm:items-center sm:py-12 lg:min-h-[390px] lg:py-9">
            <div className="w-full max-w-4xl text-left page-enter">
              {/* BACK + BADGE */}

              <div className="flex flex-wrap items-center justify-start gap-2.5 sm:gap-3">
                <Link
                  href="/plants"
                  className={`inline-flex min-h-9 items-center justify-center rounded-xl border px-3 text-[11px] font-bold backdrop-blur-xl transition sm:min-h-10 sm:px-4 sm:text-xs ${
                    darkMode
                      ? "border-white/10 bg-black/25 text-gray-300 hover:bg-white/[0.08] hover:text-white"
                      : "border-emerald-950/10 bg-white/55 text-emerald-900 hover:bg-white/85"
                  }`}
                >
                  {t.back}
                </Link>

                <div
                  className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 backdrop-blur-xl sm:min-h-10 sm:gap-3 sm:px-4 ${
                    darkMode
                      ? "border-emerald-300/20 bg-black/25 text-emerald-200"
                      : "border-emerald-950/15 bg-white/60 text-emerald-900"
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      darkMode
                        ? "bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.9)]"
                        : "bg-emerald-700"
                    }`}
                  />

                  <span className="text-[8px] font-black tracking-[0.16em] sm:text-[10px] sm:tracking-[0.2em]">
                    {t.specimenLabel}
                  </span>
                </div>
              </div>

              {/* COMMON NAME */}

              <h1
                className={`mt-5 max-w-4xl break-words text-left text-[2rem] font-black leading-[1.08] tracking-[-0.045em] sm:mt-7 sm:text-5xl lg:text-6xl ${
                  darkMode ? "text-white" : "text-[#102218]"
                }`}
              >
                {displayValue(plant.common_name)}
              </h1>

              {/* BOTANICAL NAME */}

              <p
                className={`mt-2.5 break-words text-left text-base font-semibold italic sm:mt-3 sm:text-xl ${
                  darkMode ? "text-emerald-300" : "text-emerald-800"
                }`}
              >
                {displayValue(plant.botanical_name)}
              </p>

              {/* =================================================
                  SHORT META
              ================================================= */}

              <div className="mt-5 w-full sm:mt-6">
                {/* MOBILE */}

                <div className="sm:hidden">
                  {/* FIRST ROW: FAMILY + LOCATION */}

                  <div className="flex min-w-0 items-start justify-start gap-2">
                    {hasValue(plant.family) && (
                      <div className="max-w-[42%] shrink-0">
                        <HeroMeta
                          darkMode={darkMode}
                          icon={<BranchIcon className="h-3.5 w-3.5" />}
                          value={plant.family}
                          compact
                        />
                      </div>
                    )}

                    {getFullLocation() && (
                      <div className="min-w-0 flex-1">
                        <HeroMeta
                          darkMode={darkMode}
                          icon={<PinIcon className="h-3.5 w-3.5" />}
                          value={getFullLocation()}
                          flexible
                        />
                      </div>
                    )}
                  </div>

                  {/* SECOND ROW: DATE */}

                  {hasValue(plant.collection_date) && (
                    <div className="mt-2 flex justify-start">
                      <HeroMeta
                        darkMode={darkMode}
                        icon={<CalendarIcon className="h-3.5 w-3.5" />}
                        value={formatDate(plant.collection_date)}
                        compact
                      />
                    </div>
                  )}
                </div>

                {/* TABLET / DESKTOP */}

                <div className="hidden flex-wrap items-center justify-start gap-2.5 sm:flex">
                  {hasValue(plant.family) && (
                    <HeroMeta
                      darkMode={darkMode}
                      icon={<BranchIcon className="h-3.5 w-3.5" />}
                      value={plant.family}
                    />
                  )}

                  {getFullLocation() && (
                    <HeroMeta
                      darkMode={darkMode}
                      icon={<PinIcon className="h-3.5 w-3.5" />}
                      value={getFullLocation()}
                    />
                  )}

                  {hasValue(plant.collection_date) && (
                    <HeroMeta
                      darkMode={darkMode}
                      icon={<CalendarIcon className="h-3.5 w-3.5" />}
                      value={formatDate(plant.collection_date)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN SPECIMEN AREA
      ===================================================== */}

      <section className="relative">
        <div className="container pb-10 pt-6 sm:pb-14 sm:pt-8 lg:pb-16 lg:pt-6">
          <div className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.06fr)_minmax(340px,0.94fr)] lg:gap-4">
            {/* =================================================
                IMAGE CARD
            ================================================= */}

            <section
              className={`overflow-hidden rounded-[1.45rem] border text-left sm:rounded-[1.8rem] lg:sticky lg:top-24 ${
                darkMode
                  ? "border-white/10 bg-[#0a1710]"
                  : "border-emerald-950/10 bg-white"
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/11] lg:aspect-[4/3]">
                {plant.image_url ? (
                  <>
                    <img
                      src={plant.image_url}
                      alt={
                        plant.common_name ||
                        plant.botanical_name ||
                        "Plant specimen"
                      }
                      className="h-full w-full object-cover transition duration-700 hover:scale-[1.02]"
                    />

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#020b05]/35 to-transparent" />
                  </>
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center ${
                      darkMode
                        ? "bg-[radial-gradient(circle_at_center,rgba(52,140,78,0.16),transparent_65%),#102218]"
                        : "bg-[radial-gradient(circle_at_center,rgba(30,110,62,0.12),transparent_65%),#edf5ed]"
                    }`}
                  >
                    <div className="text-center">
                      <LeafIcon
                        className={`mx-auto h-14 w-14 sm:h-20 sm:w-20 ${
                          darkMode
                            ? "text-emerald-400/35"
                            : "text-emerald-800/25"
                        }`}
                      />

                      <p
                        className={`mt-3 text-xs sm:mt-4 sm:text-sm ${
                          darkMode ? "text-gray-500" : "text-slate-400"
                        }`}
                      >
                        {t.noData}
                      </p>
                    </div>
                  </div>
                )}

                <div className="absolute left-3 top-3 sm:left-5 sm:top-5">
                  <span className="inline-flex rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[7px] font-black tracking-[0.16em] text-white backdrop-blur-xl sm:px-3 sm:py-1.5 sm:text-[9px] sm:tracking-[0.18em]">
                    SPECIMEN IMAGE
                  </span>
                </div>
              </div>

              <div className="p-4 text-left sm:p-6">
                <p
                  className={`text-left text-[8px] font-black uppercase tracking-[0.16em] sm:text-[10px] sm:tracking-[0.18em] ${
                    darkMode ? "text-emerald-400" : "text-emerald-700"
                  }`}
                >
                  {t.image}
                </p>

                <div className="mt-2 flex flex-col items-start gap-1 text-left sm:mt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                  <div className="min-w-0 text-left">
                    <h2
                      className={`truncate text-left text-base font-black sm:text-xl ${
                        darkMode ? "text-white" : "text-[#173321]"
                      }`}
                    >
                      {displayValue(plant.common_name)}
                    </h2>

                    {hasValue(plant.botanical_name) && (
                      <p
                        className={`mt-0.5 truncate text-left text-xs italic sm:mt-1 sm:text-sm ${
                          darkMode ? "text-gray-400" : "text-slate-500"
                        }`}
                      >
                        {plant.botanical_name}
                      </p>
                    )}
                  </div>

                  <span
                    className={`mt-1 text-left text-[8px] font-bold uppercase tracking-[0.1em] sm:mt-0 sm:text-[10px] sm:tracking-[0.12em] ${
                      darkMode ? "text-gray-600" : "text-slate-400"
                    }`}
                  >
                    {t.archived}
                  </span>
                </div>
              </div>
            </section>

            {/* =================================================
                RECORD CARD
            ================================================= */}

            <section
              className={`rounded-[1.45rem] border p-4 text-left sm:rounded-[1.8rem] sm:p-6 ${
                darkMode
                  ? "border-white/10 bg-[#0a1710]"
                  : "border-emerald-950/10 bg-white"
              }`}
            >
              <SectionHeading
                darkMode={darkMode}
                label={t.record}
                title={t.recordTitle}
                icon={<DocumentIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
              />

              <dl className="mt-4 text-left sm:mt-5">
                <InfoRow
                  label={t.common}
                  value={plant.common_name}
                  darkMode={darkMode}
                  fallback={t.noData}
                />

                <InfoRow
                  label={t.scientific}
                  value={plant.botanical_name}
                  darkMode={darkMode}
                  fallback={t.noData}
                  italic
                />

                <InfoRow
                  label={t.family}
                  value={plant.family}
                  darkMode={darkMode}
                  fallback={t.noData}
                />

                <InfoRow
                  label={t.specimenNumber}
                  value={plant.specimen_number}
                  darkMode={darkMode}
                  fallback={t.noData}
                />

                <InfoRow
                  label={t.collectedBy}
                  value={plant.collected_by}
                  darkMode={darkMode}
                  fallback={t.noData}
                />

                <InfoRow
                  label={t.duplicates}
                  value={plant.duplicates}
                  darkMode={darkMode}
                  fallback={t.noData}
                  last
                />
              </dl>
            </section>
          </div>

          {/* =================================================
              FIELD INFORMATION
          ================================================= */}

          <section
            className={`mt-4 rounded-[1.45rem] border p-4 text-left sm:mt-5 sm:rounded-[1.8rem] sm:p-6 ${
              darkMode
                ? "border-white/10 bg-[#0a1710]"
                : "border-emerald-950/10 bg-white"
            }`}
          >
            <SectionHeading
              darkMode={darkMode}
              label={t.fieldInfo}
              title={t.fieldTitle}
              icon={<PinIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
            />

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3 lg:grid-cols-3 lg:gap-4">
              <FieldCard
                darkMode={darkMode}
                icon={<PinIcon className="h-4 w-4" />}
                label={t.province}
                value={displayValue(plant.province)}
              />

              <FieldCard
                darkMode={darkMode}
                icon={<MapIcon className="h-4 w-4" />}
                label={t.district}
                value={displayValue(plant.district)}
              />

              <FieldCard
                darkMode={darkMode}
                icon={<LocationIcon className="h-4 w-4" />}
                label={t.location}
                value={displayValue(plant.location)}
                wide
              />

              <FieldCard
                darkMode={darkMode}
                icon={<MountainIcon className="h-4 w-4" />}
                label={t.elevation}
                value={displayValue(plant.elevation)}
              />

              <FieldCard
                darkMode={darkMode}
                icon={<CalendarIcon className="h-4 w-4" />}
                label={t.collectionDate}
                value={formatDate(plant.collection_date)}
              />

              <FieldCard
                darkMode={darkMode}
                icon={<ForestIcon className="h-4 w-4" />}
                label={t.habitat}
                value={displayValue(plant.habitat)}
                wide
              />
            </div>
          </section>

          {/* =================================================
              NOTES + ACTION
          ================================================= */}

          <div className="mt-4 grid gap-4 sm:mt-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">
            <section
              className={`relative overflow-hidden rounded-[1.45rem] border p-4 text-left sm:rounded-[1.8rem] sm:p-6 ${
                darkMode
                  ? "border-white/10 bg-[#0a1710]"
                  : "border-emerald-950/10 bg-white"
              }`}
            >
              <div
                className={`pointer-events-none absolute right-[-100px] top-[-100px] h-72 w-72 rounded-full blur-3xl ${
                  darkMode ? "bg-emerald-400/[0.045]" : "bg-emerald-800/[0.05]"
                }`}
              />

              <div className="relative text-left">
                <SectionHeading
                  darkMode={darkMode}
                  label={t.notesLabel}
                  title={t.notesTitle}
                  icon={<NoteIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                />

                <div
                  className={`mt-4 rounded-xl border p-4 text-left sm:mt-5 sm:rounded-2xl sm:p-5 ${
                    darkMode
                      ? "border-white/[0.07] bg-white/[0.025]"
                      : "border-emerald-950/[0.07] bg-[#f7faf6]"
                  }`}
                >
                  {hasValue(plant.notes) ? (
                    <p
                      className={`whitespace-pre-wrap break-words text-left text-sm leading-7 sm:text-base sm:leading-8 ${
                        darkMode ? "text-gray-300" : "text-slate-600"
                      }`}
                    >
                      {plant.notes}
                    </p>
                  ) : (
                    <p
                      className={`text-left text-sm ${
                        darkMode ? "text-gray-600" : "text-slate-400"
                      }`}
                    >
                      {t.noData}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* =================================================
                BOTTOM ACTION
            ================================================= */}

            <aside
              className={`flex flex-col items-stretch justify-between rounded-[1.45rem] border p-4 text-left sm:rounded-[1.8rem] sm:p-5 ${
                darkMode
                  ? "border-white/10 bg-white/[0.025]"
                  : "border-emerald-950/10 bg-white/65"
              }`}
            >
              <div className="flex items-center justify-start gap-3 text-left">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-emerald-800/10 text-emerald-800"
                  }`}
                >
                  <LeafIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0 text-left">
                  <p
                    className={`truncate text-left text-sm font-black ${
                      darkMode ? "text-white" : "text-[#173321]"
                    }`}
                  >
                    {t.collection}
                  </p>

                  <p
                    className={`mt-0.5 text-left text-xs ${
                      darkMode ? "text-gray-500" : "text-slate-500"
                    }`}
                  >
                    Digital Plant Collection
                  </p>
                </div>
              </div>

              <Link
                href="/plants"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                {t.exploreMore}
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        className={`border-t ${
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
   HERO META
========================================================= */

function HeroMeta({
  darkMode,
  icon,
  value,
  compact = false,
  flexible = false,
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-[11px] backdrop-blur-xl sm:w-fit sm:max-w-full sm:rounded-full sm:text-sm ${
        compact ? "w-fit max-w-full" : flexible ? "w-full" : "w-fit max-w-full"
      } ${
        darkMode
          ? "border-white/10 bg-black/20 text-gray-300"
          : "border-emerald-950/10 bg-white/55 text-[#465f4d]"
      }`}
    >
      <span
        className={`shrink-0 ${
          darkMode ? "text-emerald-300" : "text-emerald-800"
        }`}
      >
        {icon}
      </span>

      <span
        className={`min-w-0 text-left ${
          flexible ? "truncate" : "truncate sm:whitespace-nowrap"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({ darkMode, label, title, icon }) {
  return (
    <div className="flex items-start justify-start gap-3 text-left sm:gap-4">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/10 text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 text-left">
        <p
          className={`text-left text-[8px] font-black uppercase tracking-[0.16em] sm:text-[9px] sm:tracking-[0.18em] ${
            darkMode ? "text-emerald-400" : "text-emerald-700"
          }`}
        >
          {label}
        </p>

        <h2
          className={`mt-0.5 text-left text-base font-black leading-6 sm:mt-1 sm:text-xl ${
            darkMode ? "text-white" : "text-[#173321]"
          }`}
        >
          {title}
        </h2>
      </div>
    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
  darkMode,
  fallback,
  italic = false,
  last = false,
}) {
  const empty =
    value === null || value === undefined || String(value).trim() === "";

  return (
    <div
      className={`grid gap-0.5 py-3 text-left sm:grid-cols-[145px_1fr] sm:gap-4 sm:py-3.5 ${
        !last
          ? darkMode
            ? "border-b border-white/[0.07]"
            : "border-b border-emerald-950/[0.07]"
          : ""
      }`}
    >
      <dt
        className={`text-left text-[10px] font-bold sm:text-xs ${
          darkMode ? "text-gray-500" : "text-slate-500"
        }`}
      >
        {label}
      </dt>

      <dd
        className={`break-words text-left text-[13px] font-semibold leading-5 sm:text-sm ${
          empty
            ? darkMode
              ? "text-gray-600"
              : "text-slate-400"
            : darkMode
              ? "text-gray-200"
              : "text-slate-800"
        } ${italic && !empty ? "italic" : ""}`}
      >
        {empty ? fallback : value}
      </dd>
    </div>
  );
}

/* =========================================================
   FIELD CARD
========================================================= */

function FieldCard({ darkMode, icon, label, value, wide = false }) {
  return (
    <div
      className={`min-w-0 rounded-xl border p-3 text-left transition duration-300 sm:rounded-2xl sm:p-4 lg:hover:-translate-y-1 ${
        wide ? "col-span-2 lg:col-span-1" : ""
      } ${
        darkMode
          ? "border-white/[0.08] bg-white/[0.025] hover:border-emerald-400/20"
          : "border-emerald-950/[0.08] bg-[#f7faf6] hover:border-emerald-700/20"
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/[0.08] text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <p
        className={`mt-2.5 text-left text-[8px] font-bold uppercase tracking-[0.08em] sm:mt-3 sm:text-[9px] sm:tracking-[0.1em] ${
          darkMode ? "text-gray-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-0.5 break-words text-left text-xs font-bold leading-5 sm:mt-1 sm:text-sm sm:leading-6 ${
          darkMode ? "text-gray-200" : "text-slate-800"
        }`}
      >
        {value}
      </p>
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

      <path d="M16 3v4" />

      <path d="M8 3v4" />

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

function MapIcon({ className = "" }) {
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
      <path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3Z" />

      <path d="M8 3v15" />

      <path d="M16 6v15" />
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

      <path d="M12 2v2" />

      <path d="M12 20v2" />

      <path d="M2 12h2" />

      <path d="M20 12h2" />
    </svg>
  );
}

function MountainIcon({ className = "" }) {
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
      <path d="m3 20 7-12 4 7 2-3 5 8Z" />

      <path d="m8.5 10.5 1.5 1.5 1.5-1.5" />
    </svg>
  );
}

function ForestIcon({ className = "" }) {
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
      <path d="m7 3-4 7h3l-4 6h10l-4-6h3L7 3Z" />

      <path d="M7 16v5" />

      <path d="m17 6-3 5h2l-3 5h8l-3-5h2l-3-5Z" />

      <path d="M17 16v5" />
    </svg>
  );
}

function NoteIcon({ className = "" }) {
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
      <path d="M5 3h14a2 2 0 0 1 2 2v11l-5 5H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />

      <path d="M16 21v-5h5" />

      <path d="M8 8h8" />

      <path d="M8 12h6" />
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
