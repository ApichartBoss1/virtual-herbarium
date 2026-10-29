"use client";

import { memo, useEffect, useState } from "react";

import { QR_OPTIONS } from "@/components/PlantQR";
import { getPlantUrl } from "@/lib/siteUrl";

/* =========================================================
   HERBARIUM LABEL (พิมพ์ติดตัวอย่างจริง)
   - ขนาดจริง 91 × 133 มม. ดำบนขาวเสมอ แม้เปิดในโหมดมืด
   - เส้นประรอบป้ายคือเส้นตัด
   - QR มุมขวาล่าง 20 มม. สร้างแบบเดียวกับ PlantQR
   - ฟิลด์ที่ว่างจะไม่แสดงทั้งบรรทัด
========================================================= */

const COPY = {
  TH: {
    /* หัวป้าย แก้ข้อความได้ที่นี่ */
    institution: "Herbarium, Faculty of Science, Naresuan University",
    family: "วงศ์",
    locality: "สถานที่เก็บ",
    coordinates: "พิกัด",
    elevation: "ความสูง",
    collector: "ผู้เก็บ",
    number: "No.",
    qrLabel: (url) => `QR code ลิงก์ไปยัง ${url}`,
    qrError: "สร้าง QR ไม่สำเร็จ",
  },
  EN: {
    institution: "Herbarium, Faculty of Science, Naresuan University",
    family: "Family",
    locality: "Locality",
    coordinates: "Coordinates",
    elevation: "Elevation",
    collector: "Collector",
    number: "No.",
    qrLabel: (url) => `QR code linking to ${url}`,
    qrError: "QR code failed",
  },
};

function HerbariumLabel({ plant, language, onQrDone }) {
  const t = language === "EN" ? COPY.EN : COPY.TH;

  /* { url, svg } หรือ { failed: true } */
  const [qr, setQr] = useState(null);

  const plantId = plant.id;

  useEffect(() => {
    if (!plantId) return;

    let active = true;

    async function createQr() {
      try {
        const QRCode = await import("qrcode");

        const url = getPlantUrl(plantId);

        const svg = await QRCode.toString(url, { ...QR_OPTIONS, type: "svg" });

        if (active) {
          setQr({ url, svg });
          onQrDone?.(plantId, true);
        }
      } catch (err) {
        console.error("Create label QR code error:", err);

        if (active) {
          setQr({ failed: true });
          onQrDone?.(plantId, false);
        }
      }
    }

    createQr();

    return () => {
      active = false;
    };
  }, [plantId, onQrDone]);

  const pnuNo = textOf(plant.pnu_no);
  const botanicalName = textOf(plant.botanical_name);
  const family = textOf(plant.family);
  const locality = textOf(plant.locality);
  const coordinates = formatCoordinates(plant.latitude, plant.longitude);
  const elevation = formatElevation(plant.elevation);

  const collectorName = textOf(plant.collected_by);
  const collectorNo = textOf(plant.collector_no);
  const collector = [collectorName, collectorNo && `${t.number} ${collectorNo}`]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      data-label-id={plantId}
      className="herbarium-print-label flex h-[133mm] w-[91mm] flex-col overflow-hidden border border-dashed border-black bg-white p-[5mm] font-sans text-black [break-inside:avoid]"
    >
      <p className="border-b border-black pb-[2mm] text-center text-[8pt] font-semibold uppercase leading-snug tracking-[0.06em]">
        {t.institution}
      </p>

      {pnuNo && (
        <p className="mt-[3mm] font-mono text-[20pt] font-medium leading-none tracking-[0.02em]">
          PNU {pnuNo}
        </p>
      )}

      {botanicalName && (
        <p className="mt-[3mm] break-words font-serif text-[13pt] italic leading-tight">
          {botanicalName}
        </p>
      )}

      <dl className="mt-[3mm] space-y-[1.5mm] text-[9pt] leading-snug">
        {family && <LabelLine label={t.family} value={family} />}

        {locality && <LabelLine label={t.locality} value={locality} />}

        {coordinates && (
          <LabelLine label={t.coordinates} value={coordinates} mono />
        )}

        {elevation && <LabelLine label={t.elevation} value={elevation} />}
      </dl>

      <div className="mt-auto flex items-end justify-between gap-[3mm] border-t border-black pt-[2.5mm]">
        <div className="min-w-0 text-[9pt] leading-snug">
          {collector && (
            <dl>
              <LabelLine label={t.collector} value={collector} />
            </dl>
          )}
        </div>

        <div className="h-[20mm] w-[20mm] shrink-0 bg-white">
          {qr?.svg ? (
            <div
              role="img"
              aria-label={t.qrLabel(qr.url)}
              data-qr-url={qr.url}
              className="h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qr.svg }}
            />
          ) : qr?.failed ? (
            <p className="flex h-full w-full items-center justify-center border border-black text-center text-[7pt] leading-tight">
              {t.qrError}
            </p>
          ) : (
            <div aria-hidden="true" className="h-full w-full animate-pulse bg-neutral-200" />
          )}
        </div>
      </div>
    </article>
  );
}

export default memo(HerbariumLabel);

function LabelLine({ label, value, mono = false }) {
  return (
    <div className="flex min-w-0 gap-[2mm]">
      <dt className="shrink-0 font-semibold">{label}:</dt>
      <dd className={`min-w-0 break-words ${mono ? "font-mono text-[8.5pt]" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

/* ค่าว่าง / null / undefined → "" (กันคำว่า null ที่ติดมากับข้อมูลนำเข้า) */
function textOf(value) {
  if (value === null || value === undefined) return "";

  const text = String(value).trim();

  return /^(null|undefined)$/i.test(text) ? "" : text;
}

function toNumber(value) {
  const text = textOf(value);

  if (!text) return null;

  const number = Number(text);

  return Number.isFinite(number) ? number : null;
}

/* ทศนิยม 5 ตำแหน่ง เช่น 16.74512° N, 100.19234° E */
function formatCoordinates(latitude, longitude) {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);

  if (lat === null || lng === null) return "";

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return "";

  const latText = `${Math.abs(lat).toFixed(5)}° ${lat < 0 ? "S" : "N"}`;
  const lngText = `${Math.abs(lng).toFixed(5)}° ${lng < 0 ? "W" : "E"}`;

  return `${latText}, ${lngText}`;
}

/* ตัวเลขล้วน → เติมหน่วย m, ข้อความอื่นแสดงตามที่บันทึกไว้ */
function formatElevation(value) {
  const number = toNumber(value);

  if (number !== null) return `${number} m`;

  return textOf(value);
}
