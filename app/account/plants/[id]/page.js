"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useLeafletMap } from "@/lib/useLeafletMap";
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

export default function AccountPlantDetailPage() {
  const params = useParams();
  const plantId = params?.id;

  const { language } = useSiteSettings();
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
      back: "กลับไปยังพรรณไม้ของฉัน",
      loading: "กำลังเปิดข้อมูลตัวอย่างพรรณไม้",
      errorTitle: "ไม่สามารถเปิดข้อมูลพรรณไม้ได้",
      invalidId: "รหัสตัวอย่างพรรณไม้ไม่ถูกต้อง",
      notFound: "ไม่พบข้อมูลตัวอย่างพรรณไม้นี้",
      retry: "ลองอีกครั้ง",

      specimenLabel: "ตัวอย่างพรรณไม้",
      specimen: "ข้อมูลตัวอย่างพรรณไม้",

      scientific: "ชื่อทางวิทยาศาสตร์",
      pnuNo: "หมายเลข PNU",
      artificialGroup: "กลุ่มพรรณไม้",
      family: "วงศ์",

      collectedBy: "ผู้เก็บตัวอย่าง",
      collectorNo: "หมายเลขผู้เก็บตัวอย่าง",

      locality: "สถานที่ / อุทยานแห่งชาติ / จังหวัด",
      latitude: "ละติจูด",
      longitude: "ลองจิจูด",
      elevation: "ระดับความสูง",

      mapTitle: "ตำแหน่งบนแผนที่",
      mapDescription: "ตำแหน่งพิกัดที่บันทึกไว้ของตัวอย่างพรรณไม้",
      coordinates: "พิกัด",
      dmsCoordinates: "พิกัดแบบองศา ลิปดา พิลิปดา (DMS)",
      noCoordinates: "รายการนี้ยังไม่มีข้อมูลพิกัด",
      mapHint: "แผนที่แสดงตำแหน่งจากละติจูดและลองจิจูดที่บันทึกไว้",
      mapPinLabel: "ตำแหน่งนี้",
      meters: "ม.",

      image: "ภาพตัวอย่างพรรณไม้",
      imageHint: "แตะรูปเพื่อดูภาพเต็ม",
      imageViewer: "ภาพตัวอย่าง",
      closeImage: "ปิดภาพ",

      record: "ระเบียนตัวอย่างพรรณไม้",
      recordTitle: "ข้อมูลพรรณไม้",

      fieldInfo: "ข้อมูลสถานที่เก็บตัวอย่าง",
      fieldTitle: "สถานที่และพิกัด",

      collectorLabel: "ข้อมูลการเก็บตัวอย่าง",
      collectorTitle: "ข้อมูลผู้เก็บตัวอย่าง",

      noData: "ไม่มีข้อมูล",
      archived: "ระเบียนพรรณไม้ดิจิทัล",

      exploreMore: "สำรวจพรรณไม้อื่น",
      collection: "คลังพรรณไม้เสมือน",
      collectionSubtitle: "คลังข้อมูลพรรณไม้ดิจิทัล",
      imageBadge: "ภาพตัวอย่างพรรณไม้",

      copyright: "© 2026 Virtual Herbarium สงวนลิขสิทธิ์ทั้งหมด",
      footer: "ธรรมชาติ...คือห้องเรียนที่ดีที่สุด",

      recorded: "วันที่บันทึก",
      notes: "บันทึกเพิ่มเติม",
      cite: "อ้างอิงระเบียนนี้",
      copy: "คัดลอก",
      copied: "คัดลอกแล้ว",
      edit: "แก้ไขข้อมูล",

      loadFailed: "เกิดข้อผิดพลาดในการโหลดข้อมูลพรรณไม้",
    },

    EN: {
      back: "Back to My Plant Collection",
      loading: "Opening specimen record",
      errorTitle: "Unable to open plant information",
      invalidId: "The specimen identifier is invalid.",
      notFound: "This plant specimen could not be found.",
      retry: "Try Again",

      specimenLabel: "BOTANICAL SPECIMEN",
      specimen: "Specimen Information",

      scientific: "Botanical Name",
      pnuNo: "PNU No.",
      artificialGroup: "Artificial Group",
      family: "Family",

      collectedBy: "Collector",
      collectorNo: "Collector No.",

      locality: "Locality / NP / Province",
      latitude: "Latitude",
      longitude: "Longitude",
      elevation: "Elevation",

      mapTitle: "Map Location",
      mapDescription: "Saved coordinate location for this plant specimen",
      coordinates: "Coordinates",
      dmsCoordinates: "DMS Coordinates",
      noCoordinates: "No coordinates are saved for this record.",
      mapHint:
        "The map shows the position from the saved latitude and longitude.",
      mapPinLabel: "This location",
      meters: "m",

      image: "Specimen image",
      imageHint: "Tap image to view full size",
      imageViewer: "Specimen Image",
      closeImage: "Close image",

      record: "SPECIMEN RECORD",
      recordTitle: "Plant information",

      fieldInfo: "FIELD INFORMATION",
      fieldTitle: "Location and coordinates",

      collectorLabel: "COLLECTION INFORMATION",
      collectorTitle: "Collector information",

      noData: "No information",
      archived: "Digital Herbarium Record",

      exploreMore: "Explore More Plants",
      collection: "Virtual Herbarium Collection",
      collectionSubtitle: "Digital Plant Collection",
      imageBadge: "SPECIMEN IMAGE",

      copyright: "© 2026 Virtual Herbarium. All rights reserved.",
      footer: "Nature is the greatest classroom.",

      recorded: "Recorded",
      notes: "Notes",
      cite: "Cite this record",
      copy: "Copy",
      copied: "Copied",
      edit: "Edit record",

      loadFailed: "Unable to load this plant record.",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     FETCH - ACCOUNT ONLY
  ===================================================== */

  async function fetchPlant() {
    if (!plantId) return;

    setLoading(true);
    setError("");

    if (!plantId) {
      setPlant(null);
      setError("invalidId");
      setLoading(false);
      return;
    }

    try {
      /* ================================================
         FETCH PLANT (ADMIN เห็นได้ทุกรายการ)
         สิทธิ์ admin ตรวจแล้วที่ app/account/layout.js
      ================================================ */

      const { data, error: fetchError } = await supabase
        .from("plants")
        .select("*")
        .eq("id", plantId)
        .maybeSingle();

      if (fetchError) {
        console.log("PLANT ID =", plantId);

        console.log("ERROR DETAIL =", JSON.stringify(fetchError, null, 2));

        throw fetchError;
      }

      if (!data) {
        setPlant(null);
        setError("notFound");
        return;
      }

      setPlant(data);
    } catch (err) {
      console.error("Load account plant failed:", JSON.stringify(err, null, 2));

      console.log("CURRENT PLANT ID:", plantId);

      setPlant(null);
      setError("loadFailed");
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

  /* รูปเปลี่ยน → ล้างสถานะรูปเสีย/ตัวดูรูประหว่าง render (แทนการ setState ใน effect) */
  const imageUrl = plant?.image_url;

  const [imageStateFor, setImageStateFor] = useState(imageUrl);

  if (imageStateFor !== imageUrl) {
    setImageStateFor(imageUrl);
    setImageFailed(false);
    setImageViewerOpen(false);
  }

  /* =====================================================
     IMAGE VIEWER BODY LOCK
  ===================================================== */

  useEffect(() => {
    if (!imageViewerOpen) return;

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

  const displayName = hasValue(plant?.botanical_name)
    ? plant.botanical_name
    : hasValue(plant?.pnu_no)
      ? `PNU ${plant.pnu_no}`
      : t.noData;

  const hasImage = Boolean(plant?.image_url) && !imageFailed;

  const plantNo = hasValue(plant?.pnu_no) ? `PNU ${plant.pnu_no}` : "";

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="page flex min-h-[100dvh] flex-col">
        <Navbar />

        <section
          className="vh-container flex-1 pb-16 pt-6 md:pt-10"
          aria-busy="true"
        >
          <div className="vh-skeleton h-3 w-40 rounded" />

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:gap-12">
            <div className="vh-sheet p-3 md:p-4">
              <div className="vh-skeleton h-[min(62dvh,520px)] min-h-[320px] rounded-[3px]" />
            </div>

            <div>
              <div className="vh-skeleton h-3 w-24 rounded" />
              <div className="vh-skeleton mt-4 h-10 w-4/5 rounded" />
              <div className="vh-skeleton mt-3 h-4 w-1/2 rounded" />

              <div className="vh-label-card mt-8 space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="vh-skeleton h-4 rounded" />
                ))}
              </div>
            </div>
          </div>

          <p className="vh-eyebrow mt-8 text-center">{t.loading}</p>
        </section>
      </main>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error || !plant) {
    return (
      <main className="page flex min-h-[100dvh] flex-col">
        <Navbar />

        <section className="vh-container flex flex-1 items-center justify-center py-12 md:py-20">
          <div className="vh-panel w-full max-w-lg p-7 text-center md:p-10">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-clay-soft text-clay">
              <AlertIcon className="h-5 w-5" />
            </span>

            <h1 className="vh-display mt-5 text-[1.6rem] md:text-[1.9rem]">
              {t.errorTitle}
            </h1>

            <p className="mt-3 font-serif text-[15px] italic leading-7 text-muted">
              {t[error] || error}
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={fetchPlant}
                className="vh-btn vh-btn-primary"
              >
                {t.retry}
              </button>

              <Link href={"/account/plants"} className="vh-btn vh-btn-outline">
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
    <main className="page flex min-h-[100dvh] flex-col overflow-x-hidden">
      <Navbar />

      <div className="vh-container flex-1 pb-16 pt-5 md:pb-20 md:pt-9">
        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted"
        >
          <Link
            href={"/account/plants"}
            className="group inline-flex items-center gap-1.5 transition hover:text-ink"
          >
            <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {t.back}
          </Link>

          {plantNo && (
            <>
              <span aria-hidden="true" className="text-faint">
                /
              </span>

              <span className="vh-catalog">{plantNo}</span>
            </>
          )}
        </nav>

        {/* =================================================
            HERBARIUM SHEET: IMAGE + LABEL
        ================================================= */}

        <div className="mt-6 grid items-start gap-8 md:mt-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:gap-12">
          {/* IMAGE */}

          <figure className="page-enter lg:sticky lg:top-24">
            <div className="vh-sheet p-3 md:p-4">
              <div className="flex items-center justify-between gap-3 px-1 pb-3">
                <span className="vh-eyebrow flex min-w-0 items-center gap-2 !text-[10px]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-moss" />
                  <span className="truncate">{t.imageBadge}</span>
                </span>

                {plantNo && (
                  <span className="vh-catalog shrink-0">{plantNo}</span>
                )}
              </div>

              <div className="relative h-[min(68dvh,560px)] min-h-[320px] overflow-hidden rounded-[3px] bg-paper-deep lg:h-[calc(100dvh-220px)] lg:max-h-[860px] lg:min-h-[460px]">
                {hasImage ? (
                  <button
                    type="button"
                    onClick={() => setImageViewerOpen(true)}
                    aria-label={t.imageHint}
                    className="group absolute inset-0 block h-full w-full cursor-zoom-in"
                  >
                    <img
                      src={plant.image_url}
                      alt={displayName}
                      onError={() => setImageFailed(true)}
                      className="h-full w-full object-contain transition duration-700 group-hover:scale-[1.02]"
                    />

                    <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] text-white/90 backdrop-blur-sm">
                      <ExpandIcon className="h-3.5 w-3.5" />
                      {t.imageHint}
                    </span>
                  </button>
                ) : (
                  <ImageFallback text={t.noData} />
                )}
              </div>

              <figcaption className="flex items-center justify-between gap-3 px-1 pb-1 pt-3">
                <span className="vh-binomial min-w-0 truncate text-[14px] text-ink-soft">
                  {displayName}
                </span>

                <span className="shrink-0 text-[11px] text-faint">{t.archived}</span>
              </figcaption>
            </div>
          </figure>

          {/* LABEL */}

          <HerbariumLabel
            plant={plant}
            t={t}
            isEnglish={isEnglish}
            displayName={displayName}
            plantNo={plantNo}
            displayValue={displayValue}
            actions={
              <div className="mt-8 flex flex-wrap gap-3 border-t border-rule pt-6">
                <Link
                  href={`/account/plants/${plantId}/edit`}
                  className="vh-btn vh-btn-outline vh-btn-sm"
                >
                  <EditIcon className="h-4 w-4" />
                  {t.edit}
                </Link>
              </div>
            }
          />
        </div>

        {/* =================================================
            FIELD INFORMATION + MAP
        ================================================= */}

        <section className="mt-16 md:mt-20">
          <SectionHeading eyebrow={t.fieldInfo} title={t.fieldTitle} />

          <div className="vh-panel mt-7 overflow-hidden">
            <dl className="grid gap-1 border-b border-rule p-5 sm:grid-cols-[200px_1fr] sm:gap-6 md:p-6">
              <dt className="vh-eyebrow flex items-center gap-2 !text-[10px]">
                <LocationIcon className="h-4 w-4 shrink-0 text-ochre" />
                {t.locality}
              </dt>

              <dd className="break-words font-serif text-[1.15rem] leading-snug text-ink">
                {displayValue(plant.locality)}
              </dd>
            </dl>

            <ReadOnlyLocationMap plant={plant} t={t} />
          </div>
        </section>

        {/* =================================================
            COLLECTION
        ================================================= */}

        <section className="mt-12 flex flex-col gap-5 border-t border-rule pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rule-strong text-moss">
              <LeafIcon className="h-[18px] w-[18px]" />
            </span>

            <div className="min-w-0">
              <p className="font-serif text-[1.1rem] leading-tight text-ink">
                {t.collection}
              </p>

              <p className="mt-1 text-[13px] text-muted">
                {t.collectionSubtitle}
              </p>
            </div>
          </div>

          <Link href={"/account/plants"} className="vh-btn vh-btn-outline group">
            {t.exploreMore}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </section>
      </div>

      <footer className="border-t border-rule">
        <div className="vh-container flex flex-col items-center gap-2 py-5 text-center text-[12px] text-faint md:flex-row md:justify-between md:text-left">
          <p>{t.copyright}</p>

          <p className="flex items-center gap-2 font-serif italic">
            <LeafIcon className="h-3.5 w-3.5 text-moss" />
            {t.footer}
          </p>
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
          <div className="relative z-30 flex shrink-0 items-center justify-between border-b border-white/10 bg-black/80 px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))] md:px-6 md:py-4">
            <div className="min-w-0">
              <p className="vh-binomial truncate text-[1.05rem] text-white">
                {displayName}
              </p>

              {hasValue(plant.pnu_no) && (
                <p className="mt-0.5 truncate font-mono text-[11px] tracking-[0.04em] text-white/55">
                  PNU {plant.pnu_no}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setImageViewerOpen(false)}
              aria-label={t.closeImage}
              className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 active:scale-95"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            <img
              src={plant.image_url}
              alt={displayName}
              className="relative z-10 max-h-full max-w-full bg-transparent object-contain p-2 md:p-6"
            />
          </div>

          <div className="relative z-30 shrink-0 border-t border-white/10 bg-black/80 px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3 text-center">
            <p className="font-mono text-[10px] uppercase text-white/60">
              {t.specimenLabel}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   HERBARIUM LABEL
   Family, binomial, common names and the collection data
========================================================= */

function HerbariumLabel({
  plant,
  t,
  isEnglish,
  displayName,
  plantNo,
  displayValue,
  actions,
}) {
  const commonNames = [
    plant.common_name_th,
    plant.common_name_en,
  ].filter((value) => isFilled(value));

  const notes = localizedValue(isEnglish, plant.notes_th, plant.notes_en, plant.notes);

  const collector = isFilled(plant.collected_by)
    ? plant.collected_by
    : localizedValue(isEnglish, plant.collected_by_th, plant.collected_by_en);

  const latitude = toCoordinateNumber(plant.latitude);
  const longitude = toCoordinateNumber(plant.longitude);
  const hasCoordinates = latitude !== null && longitude !== null;

  const elevationNumber = toApproxNumberOrNull(plant.elevation);

  const recordedDate = formatRecordDate(plant.created_at, isEnglish);

  const citation = [
    isFilled(plant.botanical_name) ? plant.botanical_name.trim() : "",
    plantNo,
    "Virtual Herbarium",
  ]
    .map((part) => part.replace(/\.+$/, ""))
    .filter(Boolean)
    .join(". ")
    .concat(".");

  return (
    <article className="page-enter min-w-0 [animation-delay:80ms]">
      <p className="vh-eyebrow flex items-center gap-3">
        <span className="h-px w-6 bg-ochre" />
        {t.specimen}
      </p>

      {isFilled(plant.family) && (
        <p className="vh-family mt-5 !text-[12px]">{plant.family}</p>
      )}

      <h1 className="vh-binomial mt-2 break-words text-[2.3rem] leading-[1.05] text-ink min-[390px]:text-[2.5rem] md:text-[3rem] xl:text-[3.4rem]">
        {displayName}
      </h1>

      {commonNames.length > 0 && (
        <p className="mt-3 font-serif text-[1.15rem] leading-snug text-ink-soft">
          {commonNames.join(" · ")}
        </p>
      )}

      {isFilled(plant.artificial_group) && (
        <p className="mt-4">
          <span className="vh-tag vh-tag-moss">{plant.artificial_group}</span>
        </p>
      )}

      {/* LABEL CARD */}

      <div className="vh-label-card mt-8 !px-5 !py-5 md:!px-6">
        <div className="flex items-center justify-between gap-3 border-b border-rule-strong pb-3">
          <span className="vh-eyebrow !text-[10px]">{t.record}</span>

          <span className="truncate text-[11px] text-faint">{t.archived}</span>
        </div>

        <dl className="text-[14px]">
          <LabelRow label={t.pnuNo}>
            <span className="font-mono text-ink">
              {displayValue(plant.pnu_no)}
            </span>
          </LabelRow>

          <LabelRow label={t.scientific}>
            {isFilled(plant.botanical_name) ? (
              <span className="vh-binomial text-[16px] text-ink">
                {plant.botanical_name}
              </span>
            ) : (
              <EmptyValue text={t.noData} />
            )}
          </LabelRow>

          <LabelRow label={t.family}>
            {isFilled(plant.family) ? (
              <span className="text-ink">{plant.family}</span>
            ) : (
              <EmptyValue text={t.noData} />
            )}
          </LabelRow>

          <LabelRow label={t.artificialGroup}>
            {isFilled(plant.artificial_group) ? (
              plant.artificial_group
            ) : (
              <EmptyValue text={t.noData} />
            )}
          </LabelRow>

          <LabelRow label={t.collectedBy}>
            {isFilled(collector) ? collector : <EmptyValue text={t.noData} />}
          </LabelRow>

          <LabelRow label={t.collectorNo}>
            {isFilled(plant.collector_no) ? (
              <span className="font-mono">{plant.collector_no}</span>
            ) : (
              <EmptyValue text={t.noData} />
            )}
          </LabelRow>

          <LabelRow label={t.locality}>
            {isFilled(plant.locality) ? (
              plant.locality
            ) : (
              <EmptyValue text={t.noData} />
            )}
          </LabelRow>

          <LabelRow label={t.coordinates}>
            {hasCoordinates ? (
              <span className="font-mono text-[13px] tabular-nums">
                {formatHemisphere(latitude, true)}
                <span className="text-faint">, </span>
                {formatHemisphere(longitude, false)}
              </span>
            ) : (
              <EmptyValue text={t.noData} />
            )}
          </LabelRow>

          <LabelRow label={t.elevation}>
            {elevationNumber !== null ? (
              <span className="font-mono text-[13px] tabular-nums">
                {Math.round(elevationNumber).toLocaleString()} {t.meters}
              </span>
            ) : (
              <EmptyValue text={t.noData} />
            )}
          </LabelRow>

          {recordedDate && (
            <LabelRow label={t.recorded} last>
              <span className="font-mono text-[13px] tabular-nums">
                {recordedDate}
              </span>
            </LabelRow>
          )}
        </dl>
      </div>

      {/* CITATION */}

      <CiteLine citation={citation} t={t} />

      {/* NOTES */}

      {notes && (
        <section className="mt-8">
          <h2 className="vh-eyebrow">{t.notes}</h2>

          <p className="vh-prose mt-3 whitespace-pre-line">{notes}</p>
        </section>
      )}

      {actions}
    </article>
  );
}

/* =========================================================
   LABEL ROW
========================================================= */

function LabelRow({ label, children, last = false }) {
  return (
    <div
      className={`grid grid-cols-[minmax(96px,38%)_1fr] gap-4 py-2.5 ${
        last ? "" : "border-b border-dashed border-rule-strong"
      }`}
    >
      <dt className="pt-px text-[12.5px] leading-6 text-faint">{label}</dt>

      <dd className="min-w-0 break-words leading-6 text-ink-soft">
        {children}
      </dd>
    </div>
  );
}

function EmptyValue({ text }) {
  return <span className="font-serif italic text-faint">{text}</span>;
}

/* =========================================================
   CITE THIS RECORD
========================================================= */

function CiteLine({ citation, t }) {
  const [copied, setCopied] = useState(false);

  async function copyCitation() {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Copy citation failed:", error);
    }
  }

  return (
    <div className="mt-5 flex items-start gap-3 border-l-2 border-ochre pl-4">
      <div className="min-w-0 flex-1">
        <p className="vh-eyebrow !text-[10px]">{t.cite}</p>

        <p className="mt-1.5 break-words font-mono text-[12px] leading-5 text-ink-soft">
          {citation}
        </p>
      </div>

      <button
        type="button"
        onClick={copyCitation}
        className="vh-btn vh-btn-ghost vh-btn-sm shrink-0"
        aria-live="polite"
      >
        {copied ? (
          <CheckIcon className="h-4 w-4 text-moss" />
        ) : (
          <CopyIcon className="h-4 w-4" />
        )}
        {copied ? t.copied : t.copy}
      </button>
    </div>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({ eyebrow, title }) {
  return (
    <div>
      <p className="vh-eyebrow flex items-center gap-3">
        <span className="h-px w-6 bg-ochre" />
        {eyebrow}
      </p>

      <h2 className="vh-display mt-3 text-[1.9rem] md:text-[2.4rem]">
        {title}
      </h2>
    </div>
  );
}

/* =========================================================
   READ ONLY LOCATION MAP
========================================================= */

function ReadOnlyLocationMap({ plant, t }) {
  const mapContainerRef = useRef(null);

  const latitude = toCoordinateNumber(plant?.latitude);
  const longitude = toCoordinateNumber(plant?.longitude);

  const hasCoordinates = latitude !== null && longitude !== null;

  const markerRef = useRef(null);

  const { map } = useLeafletMap(mapContainerRef, {
    enabled: hasCoordinates,

    options: {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
      doubleClickZoom: true,
      dragging: true,
      touchZoom: true,
      boxZoom: false,
      keyboard: false,
      preferCanvas: true,
    },

    setup: (L, createdMap) => {
      createdMap.setView([latitude, longitude], 16);

      L.tileLayer(
        process.env.NEXT_PUBLIC_MAP_TILE_URL ||
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        },
      ).addTo(createdMap);

      /* =============================================
         MINIMAL MARKER (uses design tokens)
      ============================================= */

      const markerIcon = L.divIcon({
        className: "",

        html: `
          <div style="
            width:18px;
            height:18px;
            border-radius:999px;
            background:var(--moss);
            border:3px solid var(--sheet-raised);
            box-shadow:
              0 3px 10px rgba(0,0,0,.24),
              0 0 0 4px var(--moss-soft);
          "></div>
        `,

        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -12],
      });

      const marker = L.marker([latitude, longitude], {
        draggable: false,
        keyboard: false,
        icon: markerIcon,
      }).addTo(createdMap);

      marker.bindTooltip(t.mapPinLabel, {
        direction: "top",
        offset: [0, -10],
        opacity: 0.95,
      });

      markerRef.current = marker;
    },
  });

  /* เปลี่ยนพิกัดหรือภาษาโดยไม่ต้องสร้างแผนที่ใหม่ */
  useEffect(() => {
    const marker = markerRef.current;

    if (!map || !marker || !hasCoordinates) {
      return;
    }

    marker.setLatLng([latitude, longitude]);

    marker.setTooltipContent(t.mapPinLabel);

    map.setView([latitude, longitude], map.getZoom(), { animate: false });
  }, [map, hasCoordinates, latitude, longitude, t.mapPinLabel]);

  const latitudeDms = hasCoordinates ? decimalToDms(latitude, true) : "";

  const longitudeDms = hasCoordinates ? decimalToDms(longitude, false) : "";

  const elevationNumber = toApproxNumberOrNull(plant?.elevation);

  if (!hasCoordinates) {
    return (
      <div className="p-5 md:p-6">
        <div className="flex min-h-[140px] flex-col items-center justify-center rounded-[4px] border border-dashed border-rule-strong bg-paper-deep/50 px-5 text-center">
          <LocationIcon className="h-5 w-5 text-faint" />

          <p className="mt-3 font-serif text-[15px] italic text-muted">
            {t.noCoordinates}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pb-3 pt-5 md:px-6">
        <h3 className="font-serif text-[1.2rem] text-ink">{t.mapTitle}</h3>

        <p className="text-[13px] text-muted">{t.mapDescription}</p>
      </div>

      <div className="border-y border-rule">
        <div
          ref={mapContainerRef}
          className="relative z-0 h-[260px] w-full sm:h-[300px] md:h-[360px] lg:h-[400px] dark:brightness-[0.78] dark:contrast-[1.04] dark:saturate-[0.82]"
          aria-label={t.mapTitle}
        />

        {/* MONO COORDINATE CAPTION */}

        <div className="flex flex-col gap-1 border-t border-rule bg-paper-deep/60 px-5 py-2.5 md:flex-row md:items-center md:justify-between md:px-6">
          <p className="font-mono text-[12px] tabular-nums text-ink-soft">
            {formatHemisphere(latitude, true, 7)}
            <span className="text-faint"> · </span>
            {formatHemisphere(longitude, false, 7)}
          </p>

          <p className="flex items-center gap-1.5 text-[11.5px] text-faint">
            <InfoIcon className="h-3.5 w-3.5 shrink-0" />
            {t.mapHint}
          </p>
        </div>
      </div>

      {/* COORDINATES BELOW MAP */}

      <dl className="grid grid-cols-2 gap-px bg-rule md:grid-cols-4">
        <CoordinateDisplay label={t.latitude} value={latitude.toFixed(7)} />

        <CoordinateDisplay label={t.longitude} value={longitude.toFixed(7)} />

        <CoordinateDisplay
          label={`${t.latitude} · DMS`}
          value={latitudeDms}
          title={t.dmsCoordinates}
        />

        <CoordinateDisplay
          label={`${t.longitude} · DMS`}
          value={longitudeDms}
          title={t.dmsCoordinates}
        />
      </dl>

      {/* ELEVATION BELOW MAP */}

      {elevationNumber !== null && (
        <div className="flex items-center gap-3 border-t border-rule px-5 py-4 md:px-6">
          <MountainIcon className="h-4 w-4 shrink-0 text-ochre" />

          <span className="text-[13px] text-faint">{t.elevation}</span>

          <span className="ml-auto font-mono text-[13px] tabular-nums text-ink">
            {Math.round(elevationNumber)} {t.meters}
          </span>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COORDINATE DISPLAY
========================================================= */

function CoordinateDisplay({ label, value, title }) {
  return (
    <div className="min-w-0 bg-sheet px-5 py-3.5 md:px-6" title={title}>
      <dt className="text-[12px] text-faint">{label}</dt>

      <dd
        className="mt-1 truncate font-mono text-[12.5px] tabular-nums text-ink md:text-[13px]"
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function isFilled(value) {
  return !(
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  );
}

function localizedValue(isEnglish, th, en, legacy) {
  const values = isEnglish ? [en, th, legacy] : [th, en, legacy];

  const found = values.find((value) => isFilled(value));

  return found ? String(found).trim() : "";
}

function formatHemisphere(value, isLatitude, digits = 5) {
  const direction = isLatitude
    ? value >= 0
      ? "N"
      : "S"
    : value >= 0
      ? "E"
      : "W";

  return `${Math.abs(value).toFixed(digits)}° ${direction}`;
}

function formatRecordDate(value, isEnglish) {
  if (!isFilled(value)) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(isEnglish ? "en-GB" : "th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* =========================================================
   COORDINATE HELPERS
========================================================= */

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

/* =========================================================
   IMAGE FALLBACK
========================================================= */

function ImageFallback({ text }) {
  return (
    <div className="vh-grid-paper flex h-full w-full items-center justify-center">
      <div className="text-center">
        <LeafIcon className="mx-auto h-14 w-14 text-faint md:h-16 md:w-16" />

        <p className="mt-3 font-serif text-[15px] italic text-muted">{text}</p>
      </div>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

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

function LeafIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 4C10 4 5 8 5 15c0 2.8 2 5 5 5 7 0 10-5 10-16Z" />
      <path d="M4 20c4-5 7-7 13-10" />
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

function ArrowRightIcon({ className = "" }) {
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
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
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
      <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

function CopyIcon({ className = "" }) {
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
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
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
