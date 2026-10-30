"use client";

/* =========================================================
   GBIF PHOTO FALLBACK
   รูปตัวอย่างจาก GBIF สำหรับรายการที่ไม่มี image_url
   - ใช้เฉพาะหน้า public (/plants และ /plants/[id]) ห้ามใช้ในหน้าแรก หน้า admin และป้าย
   - รูปจากลิงก์ภายนอกเท่านั้น ไม่บันทึกรูปหรือลิงก์ลงฐานข้อมูล
   - ระหว่างโหลด ไม่มีรูป หรือรูปโหลดไม่ขึ้น → แสดง fallback (ภาพแทนที่เดิมของหน้า)

   variant "detail": ใช้ examplePhoto จาก /api/gbif/species (ผลเดียวกับ GbifSpeciesPanel
     ในหน้าเดียวกัน จึงไม่ยิงคำขอเพิ่ม) คลิกรูปเปิดหน้า occurrence บน GBIF และมีเครดิตใต้รูป
   variant "card": /api/gbif/photo เมื่อการ์ดเลื่อนมาใกล้จอ พร้อมกันไม่เกิน 4 คำขอ
     มีเฉพาะป้ายเล็ก (การ์ดอยู่ใน <Link> จึงไม่มีลิงก์ซ้อน)
     topLeft: ป้ายอื่นของการ์ดที่จะต่อใต้ป้าย GBIF
========================================================= */

import { useEffect, useRef, useState } from "react";

import { PhotoCredit } from "@/components/GbifSpeciesPanel";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import { loadExamplePhoto, loadSpeciesInfo } from "@/lib/gbifClient";

const COPY = {
  TH: {
    badge: "ภาพตัวอย่างจาก GBIF",
    notOurs: "ไม่ใช่ตัวอย่างของ herbarium นี้",
    openOccurrence: "เปิดหน้าบันทึกของรูปนี้บน GBIF (แท็บใหม่)",
    genus: "รูปของสกุลเดียวกัน",
  },
  EN: {
    badge: "Example photo via GBIF",
    notOurs: "Not a specimen from this herbarium",
    openOccurrence: "Open this photo's record on GBIF (new tab)",
    genus: "Photo of the same genus",
  },
};

/* โหลดล่วงหน้าเมื่อการ์ดอยู่ห่างจากขอบจอไม่เกินนี้ */
const CARD_ROOT_MARGIN = "200px 0px";

export default function GbifPhotoFallback({
  botanicalName,
  variant = "card",
  fallback = null,
  topLeft = null,
}) {
  const { language } = useSiteSettings();

  const t = language === "EN" ? COPY.EN : COPY.TH;

  const name = String(botanicalName ?? "").replace(/\s+/g, " ").trim();

  const isDetail = variant === "detail";

  const containerRef = useRef(null);

  /* การ์ด: เริ่มโหลดเมื่อเลื่อนมาใกล้จอ, detail: โหลดทันที */
  const [nearView, setNearView] = useState(false);

  /* { forName, photo } เมื่อโหลดเสร็จ */
  const [result, setResult] = useState(null);

  /* รูปของชื่อนี้: loaded = แสดงแล้ว, failed = โหลดไม่ขึ้น */
  const [imageState, setImageState] = useState({ src: null, status: "loading" });

  useEffect(() => {
    if (isDetail || nearView || !name) return;

    const element = containerRef.current;

    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearView(true);
          observer.disconnect();
        }
      },
      { rootMargin: CARD_ROOT_MARGIN },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [isDetail, nearView, name]);

  const shouldLoad = Boolean(name) && (isDetail || nearView);

  useEffect(() => {
    if (!shouldLoad) return;

    let active = true;

    const request = isDetail
      ? loadSpeciesInfo(name).then((data) => data?.examplePhoto || null)
      : loadExamplePhoto(name);

    request.then((photo) => {
      if (active) {
        setResult({ forName: name, photo });
      }
    });

    return () => {
      active = false;
    };
  }, [shouldLoad, isDetail, name]);

  const photo = result?.forName === name ? result.photo : null;

  const src = photo ? (isDetail ? photo.largeUrl || photo.thumbnailUrl : photo.thumbnailUrl) : null;

  const status = imageState.src === src ? imageState.status : "loading";

  const showPhoto = Boolean(src) && status !== "failed";

  const shown = showPhoto && status === "loaded";

  const image = showPhoto ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={() => setImageState({ src, status: "loaded" })}
      onError={() => setImageState({ src, status: "failed" })}
      className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
        isDetail ? "object-contain" : "object-cover"
      } ${shown ? "opacity-100" : "opacity-0"}`}
    />
  ) : null;

  const badge = shown ? (
    <span
      data-gbif-photo-badge
      className={`max-w-full truncate rounded-full bg-black/70 font-medium text-white shadow-sm backdrop-blur-sm ${
        isDetail
          ? "px-3 py-1 text-[11.5px]"
          : "px-2 py-0.5 text-[9.5px] md:px-2.5 md:text-[10.5px]"
      }`}
    >
      {t.badge}
    </span>
  ) : null;

  const corner =
    badge || topLeft ? (
      <div
        className={`pointer-events-none absolute flex max-w-[calc(100%-16px)] flex-col items-start gap-1 ${
          isDetail ? "left-3 top-3" : "left-2 top-2 md:left-3 md:top-3 md:max-w-[calc(100%-24px)]"
        }`}
      >
        {badge}
        {topLeft}
      </div>
    ) : null;

  if (!isDetail) {
    return (
      <div
        ref={containerRef}
        data-gbif-photo={shown ? "card" : undefined}
        className="relative h-full w-full"
      >
        {!shown && <div className="absolute inset-0">{fallback}</div>}

        {image}

        {corner}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-gbif-photo={shown ? "detail" : undefined}
      className="flex h-full w-full flex-col"
    >
      <div className="relative min-h-0 flex-1">
        {!shown && <div className="absolute inset-0">{fallback}</div>}

        {showPhoto && (
          <a
            href={photo.occurrenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.openOccurrence}
            title={t.openOccurrence}
            className="absolute inset-0 block"
          >
            {image}
          </a>
        )}

        {corner}
      </div>

      {shown && (
        <div
          data-gbif-photo-credit
          className="shrink-0 border-t border-rule bg-sheet px-3 py-2.5"
        >
          <p className="text-[12px] font-medium text-ochre">
            {t.notOurs}
            {photo.level === "genus" && (
              <span className="font-normal text-muted"> · {t.genus}</span>
            )}
          </p>

          <PhotoCredit photo={photo} />
        </div>
      )}
    </div>
  );
}
