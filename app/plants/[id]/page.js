"use client";

import Link from "next/link";

import { useEffect, useRef, useState } from "react";

import { useParams } from "next/navigation";

import Navbar from "@/components/Navbar";

import { supabase } from "@/lib/supabase";

import { useSiteSettings } from "@/components/SiteSettingsContext";
import "leaflet/dist/leaflet.css";

/* =========================================================

   UUID

========================================================= */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* =========================================================

   PAGE

========================================================= */

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

  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  const [imageFailed, setImageFailed] = useState(false);

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

      scientific: "ชื่อทางวิทยาศาสตร์",

      common: "ชื่อพรรณไม้",

      family: "วงศ์",

      province: "จังหวัด",

      district: "อำเภอ",

      placeName: "ชื่อสถานที่",

      subdistrict: "ตำบล / แขวง",

      postcode: "รหัสไปรษณีย์",

      location: "สถานที่เก็บตัวอย่าง",

      elevation: "ระดับความสูง",

      mapTitle: "ตำแหน่งบนแผนที่",

      mapDescription: "ตำแหน่งที่บันทึกไว้ของตัวอย่างพรรณไม้",

      coordinates: "พิกัด",

      dmsCoordinates: "พิกัดแบบ DMS",

      latitude: "ละติจูด",

      longitude: "ลองจิจูด",

      noCoordinates: "รายการนี้ยังไม่มีข้อมูลพิกัด",

      mapHint: "แผนที่แสดงตำแหน่งที่บันทึกไว้ หมุดไม่สามารถลากเพื่อแก้ไขได้",

      meters: "ม.",

      collectionDate: "วันที่เก็บตัวอย่าง",

      habitat: "ลักษณะถิ่นอาศัย",

      collectedBy: "ผู้เก็บตัวอย่าง",

      specimenNumber: "หมายเลขตัวอย่าง",

      duplicates: "จำนวนสำเนา",

      notes: "หมายเหตุ",

      image: "ภาพตัวอย่างพรรณไม้",

      imageHint: "แตะรูปเพื่อดูภาพเต็ม",

      imageViewer: "ภาพตัวอย่าง",

      closeImage: "ปิดภาพ",

      record: "SPECIMEN RECORD",

      recordTitle: "รายละเอียดตัวอย่าง",

      recordId: "รหัสรายการ",

      databaseId: "หมายเลขฐานข้อมูล",

      addedDate: "เพิ่มเข้าคลัง",

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

      scientific: "Botanical name",

      common: "Common name",

      family: "Family",

      province: "Province",

      district: "District",

      placeName: "Place name",

      subdistrict: "Subdistrict",

      postcode: "Postcode",

      location: "Collection location",

      elevation: "Elevation",

      mapTitle: "Map Location",

      mapDescription: "Saved collection point for this plant specimen",

      coordinates: "Coordinates",

      dmsCoordinates: "DMS Coordinates",

      latitude: "Latitude",

      longitude: "Longitude",

      noCoordinates: "No coordinates are saved for this record.",

      mapHint:
        "The map shows the saved collection point. The marker cannot be dragged to edit it.",

      meters: "m",

      collectionDate: "Collection date",

      habitat: "Habitat",

      collectedBy: "Collected by",

      specimenNumber: "Specimen number",

      duplicates: "Duplicates",

      notes: "Notes",

      image: "Specimen image",

      imageHint: "Tap image to view full size",

      imageViewer: "Specimen Image",

      closeImage: "Close image",

      record: "SPECIMEN RECORD",

      recordTitle: "Specimen details",

      recordId: "Record ID",

      databaseId: "Database number",

      addedDate: "Added to collection",

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
    if (!plantId) return;

    setLoading(true);

    setError("");

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
          common_name_th,
          common_name_en,
          botanical_name,
          place_name_th,
          place_name_en,
          province,
          province_th,
          province_en,
          district,
          district_th,
          district_en,
          subdistrict,
          subdistrict_th,
          subdistrict_en,
          postcode,
          location,
          address_th,
          address_en,
          latitude,
          longitude,
          elevation,
          collection_date,
          habitat,
          habitat_th,
          habitat_en,
          notes,
          notes_th,
          notes_en,
          collected_by,
          collected_by_th,
          collected_by_en,
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

     RESET IMAGE STATE

  ===================================================== */

  useEffect(() => {
    setImageFailed(false);

    setImageViewerOpen(false);
  }, [plant?.image_url]);

  /* =====================================================

     IMAGE VIEWER BODY LOCK

  ===================================================== */

  useEffect(() => {
    if (!imageViewerOpen) {
      return;
    }

    const previousOverflow = document.body.style.getPropertyValue("overflow");

    const previousOverflowPriority =
      document.body.style.getPropertyPriority("overflow");

    document.body.style.setProperty("overflow", "hidden", "important");

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setImageViewerOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (previousOverflow) {
        document.body.style.setProperty(
          "overflow",
          previousOverflow,
          previousOverflowPriority,
        );
      } else {
        document.body.style.removeProperty("overflow");
      }

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imageViewerOpen]);

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

  function localizedValue(thValue, enValue, legacyValue = "") {
    if (isEnglish) {
      return (
        [enValue, thValue, legacyValue].find((value) => hasValue(value)) || ""
      );
    }

    return (
      [thValue, enValue, legacyValue].find((value) => hasValue(value)) || ""
    );
  }

  function formatDate(date) {
    if (!hasValue(date)) {
      return t.noData;
    }

    try {
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

  function formatCreatedDate(date) {
    if (!hasValue(date)) {
      return t.noData;
    }

    try {
      const parsed = new Date(date);

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
    if (!plant) return "";

    const location = localizedValue(
      plant.address_th,
      plant.address_en,
      plant.location,
    );

    const district = localizedValue(
      plant.district_th,
      plant.district_en,
      plant.district,
    );

    const province = localizedValue(
      plant.province_th,
      plant.province_en,
      plant.province,
    );

    return [location, district, province].filter(Boolean).join(", ");
  }

  /* =====================================================

     LOADING

  ===================================================== */

  if (loading) {
    return (
      <main className="page">
        <Navbar />

        <section className="relative flex min-h-[72dvh] items-center justify-center px-5">
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${
              darkMode ? "bg-emerald-500/[0.06]" : "bg-emerald-700/[0.05]"
            }`}
          />

          <div className="relative text-center">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] border md:h-16 md:w-16 md:rounded-2xl ${
                darkMode
                  ? "border-emerald-400/15 bg-emerald-400/[0.06]"
                  : "border-emerald-800/10 bg-emerald-800/[0.06]"
              }`}
            >
              <div
                className={`h-6 w-6 animate-spin rounded-full border-2 border-t-transparent md:h-7 md:w-7 ${
                  darkMode ? "border-emerald-300" : "border-emerald-700"
                }`}
              />
            </div>

            <p
              className={`mt-4 text-xs font-semibold md:mt-5 md:text-sm ${
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

        <section className="container flex min-h-[72dvh] items-center justify-center py-8 md:py-16">
          <div
            className={`w-full max-w-lg rounded-[22px] border p-6 text-center shadow-xl backdrop-blur-xl md:rounded-[2rem] md:p-10 ${
              darkMode
                ? "border-white/10 bg-[#0a1710]/92"
                : "border-emerald-950/10 bg-white/92"
            }`}
          >
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-[15px] md:h-14 md:w-14 md:rounded-2xl ${
                darkMode
                  ? "bg-red-400/10 text-red-300"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <AlertIcon className="h-5 w-5 md:h-6 md:w-6" />
            </div>

            <h1
              className={`mt-5 text-xl font-black md:mt-6 md:text-2xl ${
                darkMode ? "text-white" : "text-[#14271a]"
              }`}
            >
              {t.errorTitle}
            </h1>

            <p
              className={`mt-2.5 text-xs leading-6 md:mt-3 md:text-sm md:leading-7 ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              {error}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2 md:mt-7 md:flex md:justify-center md:gap-3">
              <button
                type="button"
                onClick={fetchPlant}
                className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-emerald-700 px-4 text-xs font-black text-white transition active:scale-[0.98] md:rounded-xl md:px-5 md:text-sm md:hover:bg-emerald-600"
              >
                {t.retry}
              </button>

              <Link
                href="/plants"
                className={`inline-flex min-h-12 items-center justify-center rounded-[14px] border px-4 text-xs font-black transition md:rounded-xl md:px-5 md:text-sm ${
                  darkMode
                    ? "border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/[0.07]"
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

  const localizedCommonName = localizedValue(
    plant.common_name_th,
    plant.common_name_en,
    plant.common_name,
  );

  const localizedPlaceName = localizedValue(
    plant.place_name_th,
    plant.place_name_en,
  );

  const localizedProvince = localizedValue(
    plant.province_th,
    plant.province_en,
    plant.province,
  );

  const localizedDistrict = localizedValue(
    plant.district_th,
    plant.district_en,
    plant.district,
  );

  const localizedLocation = localizedValue(
    plant.address_th,
    plant.address_en,
    plant.location,
  );

  const localizedHabitat = localizedValue(
    plant.habitat_th,
    plant.habitat_en,
    plant.habitat,
  );

  const localizedNotes = localizedValue(
    plant.notes_th,
    plant.notes_en,
    plant.notes,
  );

  const localizedCollectedBy = localizedValue(
    plant.collected_by_th,
    plant.collected_by_en,
    plant.collected_by,
  );

  const hasImage = Boolean(plant.image_url) && !imageFailed;

  /* =====================================================

     PAGE

  ===================================================== */

  return (
    <main className="page overflow-x-hidden">
      <Navbar />

      {/* =====================================================

          MOBILE HERO

      ===================================================== */}

      <section className="md:hidden">
        {/* =================================================

            FULL SPECIMEN IMAGE

        ================================================= */}

        <div
          className={`relative h-[56dvh] min-h-[410px] max-h-[640px] w-full overflow-hidden ${
            darkMode ? "bg-[#030a06]" : "bg-[#e8f0e6]"
          }`}
        >
          {hasImage ? (
            <button
              type="button"
              onClick={() => setImageViewerOpen(true)}
              aria-label={t.imageHint}
              className="absolute inset-0 block h-full w-full cursor-zoom-in"
            >
              {/* BLURRED BACKDROP */}

              <img
                src={plant.image_url}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-[1.16] object-cover opacity-45 blur-2xl"
              />

              <div
                className={`absolute inset-0 ${
                  darkMode ? "bg-black/32" : "bg-white/12"
                }`}
              />

              {/* FULL ORIGINAL IMAGE */}

              <img
                src={plant.image_url}
                alt={
                  localizedCommonName ||
                  plant.botanical_name ||
                  "Plant specimen"
                }
                onError={() => setImageFailed(true)}
                className="relative z-10 h-full w-full object-contain"
              />
            </button>
          ) : (
            <ImageFallback darkMode={darkMode} text={t.noData} />
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-black/25 via-black/5 to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-36 bg-gradient-to-t from-black/75 via-black/22 to-transparent" />

          {/* SPECIMEN BADGE */}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-4">
            <div className="flex items-end justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[9px] font-black tracking-[0.14em] text-emerald-200 backdrop-blur-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_9px_rgba(74,222,128,0.85)]" />

                {t.specimenLabel}
              </div>

              {hasImage && (
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[9px] font-bold text-white/85 backdrop-blur-xl">
                  <ExpandIcon className="h-3 w-3" />

                  {t.imageHint}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =================================================

            PLANT IDENTITY

        ================================================= */}

        <div className="container pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={`text-[9px] font-black uppercase tracking-[0.18em] ${
                  darkMode ? "text-emerald-400" : "text-emerald-700"
                }`}
              >
                {t.specimen}
              </p>

              <h1
                className={`mt-2 break-words text-[2.05rem] font-black leading-[1.08] tracking-[-0.045em] min-[390px]:text-[2.2rem] ${
                  darkMode ? "text-white" : "text-[#102218]"
                }`}
              >
                {displayValue(localizedCommonName)}
              </h1>

              <p
                className={`mt-2.5 break-words text-[15px] font-semibold italic leading-6 ${
                  darkMode ? "text-emerald-300" : "text-emerald-800"
                }`}
              >
                {displayValue(plant.botanical_name)}
              </p>
            </div>

            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border ${
                darkMode
                  ? "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300"
                  : "border-emerald-800/10 bg-emerald-800/[0.07] text-emerald-800"
              }`}
            >
              <LeafIcon className="h-[22px] w-[22px]" />
            </div>
          </div>

          {/* QUICK META */}

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <MobileQuickMeta
              darkMode={darkMode}
              icon={<BranchIcon className="h-4 w-4" />}
              label={t.family}
              value={displayValue(plant.family)}
            />

            <MobileQuickMeta
              darkMode={darkMode}
              icon={<CalendarIcon className="h-4 w-4" />}
              label={t.collectionDate}
              value={formatDate(plant.collection_date)}
            />

            <div className="col-span-2">
              <MobileQuickMeta
                darkMode={darkMode}
                icon={<PinIcon className="h-4 w-4" />}
                label={t.location}
                value={getFullLocation() || t.noData}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================

          DESKTOP CINEMATIC HERO

      ===================================================== */}

      <section className="relative isolate hidden min-h-[410px] overflow-hidden md:block">
        {hasImage ? (
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

        {hasImage && (
          <div className="absolute inset-0 -z-20 backdrop-blur-[2px]" />
        )}

        <div
          className={`absolute inset-0 -z-10 ${
            darkMode
              ? "bg-[linear-gradient(90deg,rgba(2,9,5,0.98)_0%,rgba(3,13,7,0.91)_48%,rgba(3,12,7,0.67)_100%)]"
              : "bg-[linear-gradient(90deg,rgba(239,247,237,0.98)_0%,rgba(239,247,237,0.91)_50%,rgba(236,246,234,0.72)_100%)]"
          }`}
        />

        <div
          className={`absolute inset-x-0 bottom-0 -z-10 h-40 ${
            darkMode
              ? "bg-gradient-to-t from-[#07100b] to-transparent"
              : "bg-gradient-to-t from-[#f1f6f1] to-transparent"
          }`}
        />

        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="forest-particle left-[12%] top-[38%]" />

          <div className="forest-particle right-[24%] top-[28%] [animation-delay:-3s]" />

          <div className="forest-particle right-[9%] top-[62%] [animation-delay:-5s]" />
        </div>

        <div className="container">
          <div className="flex min-h-[410px] items-center py-10 lg:py-12">
            <div className="w-full max-w-4xl page-enter">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/plants"
                  className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-[13px] font-bold backdrop-blur-xl transition ${
                    darkMode
                      ? "border-white/10 bg-black/25 text-gray-300 hover:bg-white/[0.08] hover:text-white"
                      : "border-emerald-950/10 bg-white/55 text-emerald-900 hover:bg-white/85"
                  }`}
                >
                  <ArrowLeftIcon className="h-4 w-4" />

                  {t.back}
                </Link>

                <div
                  className={`inline-flex min-h-10 items-center gap-3 rounded-full border px-4 backdrop-blur-xl ${
                    darkMode
                      ? "border-emerald-300/20 bg-black/25 text-emerald-200"
                      : "border-emerald-950/15 bg-white/60 text-emerald-900"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      darkMode
                        ? "bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.9)]"
                        : "bg-emerald-700"
                    }`}
                  />

                  <span className="text-[11px] font-black tracking-[0.2em]">
                    {t.specimenLabel}
                  </span>
                </div>
              </div>

              <h1
                className={`mt-7 max-w-4xl break-words text-5xl font-black leading-[1.06] tracking-[-0.045em] lg:text-6xl xl:text-[4.25rem] ${
                  darkMode ? "text-white" : "text-[#102218]"
                }`}
              >
                {displayValue(localizedCommonName)}
              </h1>

              <p
                className={`mt-3.5 break-words text-[1.35rem] font-semibold italic lg:text-[1.5rem] ${
                  darkMode ? "text-emerald-300" : "text-emerald-800"
                }`}
              >
                {displayValue(plant.botanical_name)}
              </p>

              <div className="mt-7 flex flex-wrap gap-2.5">
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
      </section>

      {/* =====================================================

          MAIN CONTENT

      ===================================================== */}

      <section className="relative">
        <div className="container pb-8 pt-5 md:pb-14 md:pt-9 lg:pb-16 lg:pt-8">
          {/* =================================================

              DESKTOP IMAGE + RECORD

          ================================================= */}

          <div className="hidden items-start gap-5 md:grid lg:grid-cols-[minmax(0,1.04fr)_minmax(380px,0.96fr)] lg:gap-6">
            {/* IMAGE CARD */}

            <section
              className={`overflow-hidden rounded-[1.8rem] border shadow-[0_18px_50px_rgba(0,0,0,0.08)] lg:sticky lg:top-[96px] ${
                darkMode
                  ? "border-white/10 bg-[#0a1710]"
                  : "border-emerald-950/10 bg-white"
              }`}
            >
              <div
                className={`relative aspect-[4/3] overflow-hidden lg:aspect-[1.18/1] ${
                  darkMode ? "bg-[#061009]" : "bg-[#e8f1e7]"
                }`}
              >
                {hasImage ? (
                  <button
                    type="button"
                    onClick={() => setImageViewerOpen(true)}
                    className="absolute inset-0 block h-full w-full cursor-zoom-in"
                    aria-label={t.imageHint}
                  >
                    <img
                      src={plant.image_url}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
                    />

                    <div
                      className={`absolute inset-0 ${
                        darkMode ? "bg-black/28" : "bg-white/12"
                      }`}
                    />

                    <img
                      src={plant.image_url}
                      alt={
                        localizedCommonName ||
                        plant.botanical_name ||
                        "Plant specimen"
                      }
                      onError={() => setImageFailed(true)}
                      className="relative z-10 h-full w-full object-contain transition duration-500 hover:scale-[1.015]"
                    />
                  </button>
                ) : (
                  <ImageFallback darkMode={darkMode} text={t.noData} />
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="pointer-events-none absolute left-5 top-5 z-30">
                  <span className="inline-flex rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[9px] font-black tracking-[0.18em] text-white backdrop-blur-xl">
                    SPECIMEN IMAGE
                  </span>
                </div>

                {hasImage && (
                  <div className="pointer-events-none absolute bottom-5 right-5 z-30 flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-[9px] font-bold text-white backdrop-blur-xl">
                    <ExpandIcon className="h-3.5 w-3.5" />

                    {t.imageHint}
                  </div>
                )}
              </div>

              <div className="p-6 lg:p-7">
                <p
                  className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                    darkMode ? "text-emerald-400" : "text-emerald-700"
                  }`}
                >
                  {t.image}
                </p>

                <div className="mt-3 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <h2
                      className={`truncate text-[1.35rem] font-black lg:text-[1.5rem] ${
                        darkMode ? "text-white" : "text-[#173321]"
                      }`}
                    >
                      {displayValue(localizedCommonName)}
                    </h2>

                    {hasValue(plant.botanical_name) && (
                      <p
                        className={`mt-1.5 truncate text-[15px] italic ${
                          darkMode ? "text-gray-400" : "text-slate-500"
                        }`}
                      >
                        {plant.botanical_name}
                      </p>
                    )}
                  </div>

                  <span
                    className={`shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] ${
                      darkMode ? "text-gray-600" : "text-slate-400"
                    }`}
                  >
                    {t.archived}
                  </span>
                </div>
              </div>
            </section>

            <RecordCard
              plant={plant}
              darkMode={darkMode}
              t={t}
              formatCreatedDate={formatCreatedDate}
              commonName={localizedCommonName}
              collectedBy={localizedCollectedBy}
            />
          </div>

          {/* =================================================

              MOBILE RECORD

          ================================================= */}

          <div className="md:hidden">
            <RecordCard
              plant={plant}
              darkMode={darkMode}
              t={t}
              formatCreatedDate={formatCreatedDate}
              commonName={localizedCommonName}
              collectedBy={localizedCollectedBy}
            />
          </div>

          {/* =================================================

    FIELD INFORMATION

================================================= */}

          <section
            className={`mt-5 rounded-[20px] border p-4 md:mt-6 md:rounded-[1.8rem] md:p-6 lg:p-7 ${
              darkMode
                ? "border-white/10 bg-[#0a1710]"
                : "border-emerald-950/10 bg-white"
            }`}
          >
            <SectionHeading
              darkMode={darkMode}
              label={t.fieldInfo}
              title={t.fieldTitle}
              icon={<PinIcon className="h-4 w-4 md:h-5 md:w-5" />}
            />

            <div className="mt-5 grid grid-cols-2 gap-2.5 md:mt-6 md:gap-3.5 lg:grid-cols-3 lg:gap-4">
              {/* จังหวัด */}

              <FieldCard
                darkMode={darkMode}
                icon={<PinIcon className="h-4 w-4" />}
                label={t.province}
                value={displayValue(localizedProvince)}
              />

              {/* อำเภอ */}

              <FieldCard
                darkMode={darkMode}
                icon={<MapIcon className="h-4 w-4" />}
                label={t.district}
                value={displayValue(localizedDistrict)}
              />

              {/* ชื่อสถานที่ */}

              <FieldCard
                darkMode={darkMode}
                icon={<LocationIcon className="h-4 w-4" />}
                label={t.placeName}
                value={displayValue(localizedPlaceName)}
              />

              {/* สถานที่เก็บตัวอย่าง */}

              <FieldCard
                darkMode={darkMode}
                icon={<LocationIcon className="h-4 w-4" />}
                label={t.location}
                value={displayValue(localizedLocation)}
                wide
              />

              {/* ระดับความสูง */}

              <FieldCard
                darkMode={darkMode}
                icon={<MountainIcon className="h-4 w-4" />}
                label={t.elevation}
                value={displayValue(plant.elevation)}
              />

              {/* วันที่เก็บ */}

              <FieldCard
                darkMode={darkMode}
                icon={<CalendarIcon className="h-4 w-4" />}
                label={t.collectionDate}
                value={formatDate(plant.collection_date)}
              />

              {/* ถิ่นอาศัย */}

              <FieldCard
                darkMode={darkMode}
                icon={<ForestIcon className="h-4 w-4" />}
                label={t.habitat}
                value={displayValue(localizedHabitat)}
                wide
              />
            </div>

            <ReadOnlyLocationMap plant={plant} darkMode={darkMode} t={t} />
          </section>

          {/* =================================================

              NOTES + COLLECTION

          ================================================= */}

          <div className="mt-5 grid gap-4 md:mt-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-5">
            <section
              className={`relative overflow-hidden rounded-[20px] border p-4 md:rounded-[1.8rem] md:p-6 lg:p-7 ${
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

              <div className="relative">
                <SectionHeading
                  darkMode={darkMode}
                  label={t.notesLabel}
                  title={t.notesTitle}
                  icon={<NoteIcon className="h-4 w-4 md:h-5 md:w-5" />}
                />

                <div
                  className={`mt-4 rounded-[14px] border p-3.5 md:mt-5 md:rounded-2xl md:p-5 ${
                    darkMode
                      ? "border-white/[0.07] bg-white/[0.025]"
                      : "border-emerald-950/[0.07] bg-[#f7faf6]"
                  }`}
                >
                  {hasValue(localizedNotes) ? (
                    <p
                      className={`whitespace-pre-wrap break-words text-[13px] font-medium leading-6 md:text-[15px] md:leading-7 lg:text-base lg:leading-8 ${
                        darkMode ? "text-gray-200" : "text-slate-600"
                      }`}
                    >
                      {localizedNotes}
                    </p>
                  ) : (
                    <p
                      className={`text-xs md:text-sm ${
                        darkMode ? "text-gray-600" : "text-slate-400"
                      }`}
                    >
                      {t.noData}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <aside
              className={`flex flex-col justify-between rounded-[20px] border p-4 md:rounded-[1.8rem] md:p-6 ${
                darkMode
                  ? "border-white/10 bg-white/[0.025]"
                  : "border-emerald-950/10 bg-white/65"
              }`}
            >
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      darkMode
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-emerald-800/10 text-emerald-800"
                    }`}
                  >
                    <LeafIcon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`truncate text-[15px] font-black md:text-base ${
                        darkMode ? "text-white" : "text-[#173321]"
                      }`}
                    >
                      {t.collection}
                    </p>

                    <p
                      className={`mt-1 text-[11px] md:text-xs ${
                        darkMode ? "text-gray-400" : "text-slate-500"
                      }`}
                    >
                      Digital Plant Collection
                    </p>
                  </div>
                </div>

                <p
                  className={`mt-4 text-[12px] leading-6 md:text-[13px] ${
                    darkMode ? "text-gray-400" : "text-slate-500"
                  }`}
                >
                  {t.archived}
                </p>
              </div>

              <Link
                href="/plants"
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-emerald-700 px-5 text-xs font-black text-white shadow-[0_10px_26px_rgba(16,120,65,0.20)] transition active:scale-[0.98] md:min-h-11 md:rounded-xl md:text-sm md:hover:bg-emerald-600"
              >
                <LeafIcon className="h-4 w-4" />

                {t.exploreMore}
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {/* =====================================================

          DESKTOP FOOTER

      ===================================================== */}

      <footer
        className={`border-t ${
          darkMode ? "border-white/15" : "border-emerald-950/15"
        }`}
      >
        <div className="container">
          <div
            className={`flex flex-col items-center gap-2 py-5 text-center text-[10px] md:flex-row md:justify-between md:text-left md:text-xs ${
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

      {/* =====================================================

          FULLSCREEN IMAGE VIEWER

      ===================================================== */}

      {imageViewerOpen && hasImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.imageViewer}
          className="fixed inset-0 z-[220] flex flex-col bg-black"
        >
          <div className="relative z-30 flex shrink-0 items-center justify-between border-b border-white/10 bg-black/70 px-3 pb-3 pt-[calc(12px+env(safe-area-inset-top))] backdrop-blur-xl md:px-5 md:py-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">
                {displayValue(localizedCommonName)}
              </p>

              {hasValue(plant.botanical_name) && (
                <p className="mt-0.5 truncate text-[10px] italic text-white/50 md:text-xs">
                  {plant.botanical_name}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setImageViewerOpen(false)}
              aria-label={t.closeImage}
              className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/15 bg-white/10 text-white backdrop-blur-xl transition active:scale-95 md:hover:bg-white/15"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            <img
              src={plant.image_url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-3xl"
            />

            <div className="absolute inset-0 bg-black/40" />

            <img
              src={plant.image_url}
              alt={
                localizedCommonName || plant.botanical_name || "Plant specimen"
              }
              className="relative z-10 max-h-full max-w-full object-contain p-2 md:p-6"
            />
          </div>

          <div className="relative z-30 shrink-0 border-t border-white/10 bg-black/70 px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3 text-center backdrop-blur-xl">
            <p className="text-[9px] font-black tracking-[0.16em] text-emerald-300">
              {t.specimenLabel}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================

   READ ONLY LOCATION MAP

========================================================= */

function ReadOnlyLocationMap({ plant, darkMode, t }) {
  const mapContainerRef = useRef(null);

  const mapRef = useRef(null);

  const latitude = toCoordinateNumber(plant?.latitude);

  const longitude = toCoordinateNumber(plant?.longitude);

  const hasCoordinates = latitude !== null && longitude !== null;

  useEffect(() => {
    let active = true;

    async function createMap() {
      if (!hasCoordinates || !mapContainerRef.current || mapRef.current) {
        return;
      }

      try {
        const leafletModule = await import("leaflet");

        if (!active || !mapContainerRef.current) {
          return;
        }

        const L = leafletModule.default || leafletModule;

        const map = L.map(mapContainerRef.current, {
          zoomControl: true,

          attributionControl: true,

          scrollWheelZoom: false,

          doubleClickZoom: true,

          dragging: true,

          touchZoom: true,

          boxZoom: false,

          keyboard: false,

          preferCanvas: true,
        }).setView([latitude, longitude], 16);

        L.tileLayer(
          process.env.NEXT_PUBLIC_MAP_TILE_URL ||
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,

            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
          },
        ).addTo(map);

        const markerIcon = L.divIcon({
          className: "",

          html: `
              <div style="
                width:38px;
                height:38px;
                border-radius:14px 14px 14px 4px;
                transform:rotate(-45deg);
                background:#047857;
                border:4px solid rgba(255,255,255,.96);
                box-shadow:0 8px 20px rgba(0,0,0,.28);
                display:flex;
                align-items:center;
                justify-content:center;
              ">
                <div style="
                  width:10px;
                  height:10px;
                  border-radius:999px;
                  background:white;
                "></div>
              </div>
            `,

          iconSize: [38, 38],

          iconAnchor: [19, 36],
        });

        L.marker([latitude, longitude], {
          draggable: false,

          keyboard: false,

          icon: markerIcon,
        }).addTo(map);

        mapRef.current = map;

        window.setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 120);
      } catch (error) {
        console.error("Read-only map error:", error);
      }
    }

    createMap();

    return () => {
      active = false;

      if (mapRef.current) {
        mapRef.current.remove();

        mapRef.current = null;
      }
    };
  }, [hasCoordinates, latitude, longitude]);

  const latitudeDms = hasCoordinates ? decimalToDms(latitude, true) : "";

  const longitudeDms = hasCoordinates ? decimalToDms(longitude, false) : "";

  const elevationNumber = toApproxNumberOrNull(plant?.elevation);

  return (
    <div
      className={`mt-5 overflow-hidden rounded-[16px] border md:mt-6 md:rounded-[22px] ${
        darkMode
          ? "border-white/[0.08] bg-black/15"
          : "border-emerald-950/[0.08] bg-[#f7faf6]"
      }`}
    >
      <div className="p-4 md:p-5 lg:p-6">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] md:h-11 md:w-11 ${
              darkMode
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-emerald-800/[0.08] text-emerald-800"
            }`}
          >
            <LocationIcon className="h-[18px] w-[18px] md:h-5 md:w-5" />
          </div>

          <div className="min-w-0">
            <p
              className={`text-[9px] font-black uppercase tracking-[0.16em] md:text-[10px] ${
                darkMode ? "text-emerald-400" : "text-emerald-700"
              }`}
            >
              {t.coordinates}
            </p>

            <h3
              className={`mt-1 text-[16px] font-black leading-6 md:text-[18px] ${
                darkMode ? "text-white" : "text-[#173321]"
              }`}
            >
              {t.mapTitle}
            </h3>

            <p
              className={`mt-1 text-[11px] leading-5 md:text-xs md:leading-6 ${
                darkMode ? "text-gray-500" : "text-slate-500"
              }`}
            >
              {t.mapDescription}
            </p>
          </div>
        </div>
      </div>

      {hasCoordinates ? (
        <>
          <div
            className={`border-y ${
              darkMode ? "border-white/[0.08]" : "border-emerald-950/[0.08]"
            }`}
          >
            <div
              ref={mapContainerRef}
              className={`h-[230px] w-full sm:h-[270px] md:h-[310px] lg:h-[350px] ${
                darkMode
                  ? "brightness-[0.78] contrast-[1.04] saturate-[0.82]"
                  : ""
              }`}
              aria-label={t.mapTitle}
            />

            <div
              className={`flex items-start gap-2 px-4 py-2.5 text-[10px] leading-5 md:px-5 md:text-[11px] ${
                darkMode
                  ? "bg-black/20 text-gray-500"
                  : "bg-white/70 text-slate-500"
              }`}
            >
              <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />

              <span>{t.mapHint}</span>
            </div>
          </div>

          <div className="p-4 md:p-5 lg:p-6">
            <div className="grid grid-cols-2 gap-2.5 md:gap-3.5">
              <CoordinateDisplay
                darkMode={darkMode}
                label={t.latitude}
                value={latitude.toFixed(7)}
              />

              <CoordinateDisplay
                darkMode={darkMode}
                label={t.longitude}
                value={longitude.toFixed(7)}
              />
            </div>

            <div className="mt-4">
              <p
                className={`text-[9px] font-black uppercase tracking-[0.15em] md:text-[10px] ${
                  darkMode ? "text-emerald-400" : "text-emerald-700"
                }`}
              >
                {t.dmsCoordinates}
              </p>

              <div className="mt-2 grid grid-cols-2 gap-2.5 md:gap-3.5">
                <CoordinateDisplay
                  darkMode={darkMode}
                  label={t.latitude}
                  value={latitudeDms}
                />

                <CoordinateDisplay
                  darkMode={darkMode}
                  label={t.longitude}
                  value={longitudeDms}
                />
              </div>
            </div>

            {elevationNumber !== null && (
              <div
                className={`mt-4 rounded-[14px] border px-3.5 py-3 md:px-4 ${
                  darkMode
                    ? "border-white/[0.08] bg-white/[0.025]"
                    : "border-emerald-950/[0.07] bg-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MountainIcon
                    className={`h-4 w-4 shrink-0 ${
                      darkMode ? "text-emerald-300" : "text-emerald-700"
                    }`}
                  />

                  <div className="min-w-0">
                    <p
                      className={`text-[9px] font-bold md:text-[10px] ${
                        darkMode ? "text-gray-500" : "text-slate-400"
                      }`}
                    >
                      {t.elevation}
                    </p>

                    <p
                      className={`mt-0.5 text-[13px] font-black md:text-sm ${
                        darkMode ? "text-white" : "text-[#173321]"
                      }`}
                    >
                      {Math.round(elevationNumber)} {t.meters}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="px-4 pb-4 md:px-5 md:pb-5 lg:px-6 lg:pb-6">
          <div
            className={`flex min-h-[120px] items-center justify-center rounded-[14px] border border-dashed px-5 text-center md:min-h-[140px] md:rounded-[18px] ${
              darkMode
                ? "border-white/10 bg-white/[0.02] text-gray-500"
                : "border-emerald-950/10 bg-white/60 text-slate-400"
            }`}
          >
            <div>
              <LocationIcon className="mx-auto h-5 w-5" />

              <p className="mt-2 text-[11px] font-semibold leading-5 md:text-xs">
                {t.noCoordinates}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CoordinateDisplay({ darkMode, label, value }) {
  return (
    <div
      className={`min-w-0 rounded-[14px] border px-3 py-3 md:px-4 md:py-3.5 ${
        darkMode
          ? "border-white/[0.08] bg-white/[0.025]"
          : "border-emerald-950/[0.07] bg-white"
      }`}
    >
      <p
        className={`text-[9px] font-bold leading-4 md:text-[10px] ${
          darkMode ? "text-gray-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11px] font-black leading-5 min-[390px]:text-[12px] md:text-[13px] ${
          darkMode ? "text-gray-100" : "text-slate-700"
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function toCoordinateNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

function toApproxNumberOrNull(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const match = String(value)
    .replace(/,/g, "")
    .match(/-?\d+(?:\.\d+)?/);

  if (!match) {
    return null;
  }

  const number = Number(match[0]);

  return Number.isFinite(number) ? number : null;
}

function decimalToDms(value, isLatitude) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  const absolute = Math.abs(number);

  const degrees = Math.floor(absolute);

  const minutesFloat = (absolute - degrees) * 60;

  const minutes = Math.floor(minutesFloat);

  const seconds = ((minutesFloat - minutes) * 60).toFixed(1);

  const direction = isLatitude
    ? number >= 0
      ? "N"
      : "S"
    : number >= 0
      ? "E"
      : "W";

  return `${degrees}°${minutes}'${seconds}"${direction}`;
}

function InfoIcon({ className = "" }) {
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

      <path d="M12 11v5" />

      <path d="M12 8h.01" />
    </svg>
  );
}

/* =========================================================

   RECORD CARD

========================================================= */

function RecordCard({
  plant,
  darkMode,
  t,
  formatCreatedDate,
  commonName,
  collectedBy,
}) {
  return (
    <section
      className={`rounded-[20px] border p-4 md:rounded-[1.8rem] md:p-6 lg:p-7 ${
        darkMode
          ? "border-white/10 bg-[#0a1710]"
          : "border-emerald-950/10 bg-white"
      }`}
    >
      <SectionHeading
        darkMode={darkMode}
        label={t.record}
        title={t.recordTitle}
        icon={<DocumentIcon className="h-4 w-4 md:h-5 md:w-5" />}
      />

      <dl className="mt-4 md:mt-6">
        <InfoRow
          label={t.common}
          value={commonName}
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
          value={collectedBy}
          darkMode={darkMode}
          fallback={t.noData}
        />

        <InfoRow
          label={t.duplicates}
          value={plant.duplicates}
          darkMode={darkMode}
          fallback={t.noData}
        />

        <InfoRow
          label={t.databaseId}
          value={plant.plant_id}
          darkMode={darkMode}
          fallback={t.noData}
        />

        <InfoRow
          label={t.addedDate}
          value={formatCreatedDate(plant.created_at)}
          darkMode={darkMode}
          fallback={t.noData}
          last
        />
      </dl>
    </section>
  );
}

/* =========================================================

   IMAGE FALLBACK

========================================================= */

function ImageFallback({ darkMode, text }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${
        darkMode
          ? "bg-[radial-gradient(circle_at_center,rgba(52,140,78,0.18),transparent_65%),#102218]"
          : "bg-[radial-gradient(circle_at_center,rgba(30,110,62,0.12),transparent_65%),#edf5ed]"
      }`}
    >
      <div className="text-center">
        <LeafIcon
          className={`mx-auto h-16 w-16 md:h-20 md:w-20 ${
            darkMode ? "text-emerald-400/35" : "text-emerald-800/25"
          }`}
        />

        <p
          className={`mt-3 text-xs md:text-sm ${
            darkMode ? "text-gray-600" : "text-slate-400"
          }`}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

/* =========================================================

   MOBILE QUICK META

========================================================= */

function MobileQuickMeta({ darkMode, icon, label, value }) {
  return (
    <div
      className={`flex min-h-[72px] min-w-0 items-center gap-3 rounded-[16px] border p-3.5 ${
        darkMode
          ? "border-white/10 bg-[#0a1710]/85"
          : "border-emerald-950/10 bg-white/80"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/10 text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className={`truncate text-[8.5px] font-black uppercase tracking-[0.08em] ${
            darkMode ? "text-white/58" : "text-slate-500"
          }`}
        >
          {label}
        </p>

        <p
          className={`mt-1 line-clamp-2 text-[11.5px] font-bold leading-[1.45] min-[390px]:text-[12px] ${
            darkMode ? "text-gray-100" : "text-slate-800"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================

   HERO META

========================================================= */

function HeroMeta({ darkMode, icon, value }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2.5 rounded-full border px-3.5 py-2.5 text-[13px] font-semibold backdrop-blur-xl lg:text-sm ${
        darkMode
          ? "border-white/10 bg-black/25 text-gray-200"
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

      <span className="min-w-0 truncate">{value}</span>
    </div>
  );
}

/* =========================================================

   SECTION HEADING

========================================================= */

function SectionHeading({ darkMode, label, title, icon }) {
  return (
    <div className="flex items-start gap-3.5 md:gap-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] md:h-11 md:w-11 md:rounded-xl ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/10 text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className={`text-[8px] font-black uppercase tracking-[0.14em] md:text-[10px] md:tracking-[0.18em] ${
            darkMode ? "text-emerald-400" : "text-emerald-700"
          }`}
        >
          {label}
        </p>

        <h2
          className={`mt-1 text-[16px] font-black leading-5 md:text-[1.35rem] md:leading-7 ${
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
      className={`grid gap-1 py-3 md:grid-cols-[155px_1fr] md:gap-5 md:py-4 ${
        !last
          ? darkMode
            ? "border-b border-white/[0.07]"
            : "border-b border-emerald-950/[0.07]"
          : ""
      }`}
    >
      <dt
        className={`text-[10px] font-bold md:text-[13px] ${
          darkMode ? "text-gray-400" : "text-slate-500"
        }`}
      >
        {label}
      </dt>

      <dd
        className={`break-words text-[13px] font-semibold leading-5 md:text-[15px] md:leading-6 ${
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
      className={`min-h-[116px] min-w-0 rounded-[15px] border p-3.5 transition duration-300 md:min-h-[132px] md:rounded-2xl md:p-[18px] lg:min-h-[142px] lg:p-5 lg:hover:-translate-y-1 ${
        wide ? "col-span-2 lg:col-span-1" : ""
      } ${
        darkMode
          ? "border-white/[0.08] bg-white/[0.025] lg:hover:border-emerald-400/20"
          : "border-emerald-950/[0.08] bg-[#f7faf6] lg:hover:border-emerald-700/20"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-[10px] md:h-10 md:w-10 md:rounded-xl ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/[0.08] text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <p
        className={`mt-3 text-[8.5px] font-bold uppercase tracking-[0.08em] md:mt-3.5 md:text-[10px] md:tracking-[0.1em] ${
          darkMode ? "text-gray-400" : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 break-words text-[11.5px] font-bold leading-[1.45] md:text-[14px] md:leading-6 lg:text-[15px] ${
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
      <path d="M19 12H5" />

      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

function ExpandIcon({ className = "" }) {
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
      <path d="M8 3H3v5" />

      <path d="m3 3 6 6" />

      <path d="M16 3h5v5" />

      <path d="m21 3-6 6" />

      <path d="M8 21H3v-5" />

      <path d="m3 21 6-6" />

      <path d="M16 21h5v-5" />

      <path d="m21 21-6-6" />
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
