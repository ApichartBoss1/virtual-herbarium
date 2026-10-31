"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";

import { QR_OPTIONS } from "@/components/PlantQR";
import { getPlantUrl } from "@/lib/siteUrl";

/* =========================================================
   PRINT LABEL (ป้ายพิมพ์ติดตัวอย่างจริง)
   - ป้ายแนวนอนขนาดจริงตาม LABEL_WIDTH_MM × LABEL_HEIGHT_MM
   - ดำบนขาวเสมอ แม้เปิดในโหมดมืด, เส้นประรอบป้ายคือเส้นตัด
   - ข้อความซ้าย, QR คอลัมน์ขวาชิดล่าง (สร้างแบบเดียวกับ PlantQR)
   - ฟิลด์ที่ว่างจะไม่แสดงทั้งบรรทัด, ไม่ตัดข้อความทิ้ง
   - ข้อความล้น: ลดตัวอักษร locality ก่อน ถ้ายังล้นแจ้งผ่าน onFitChange
   ไฟล์ PDF (lib/labelPdf.js) ใช้ขนาด ข้อความ และฟิลด์ชุดเดียวกันจากไฟล์นี้
========================================================= */

/* ขนาดป้าย แก้ที่นี่ที่เดียว (หน้า labels ใช้ค่านี้จัดหน้า A4) */
export const LABEL_WIDTH_MM = 90;
export const LABEL_HEIGHT_MM = 60;

/* QR ห้ามเล็กกว่า 18 มม. เพื่อให้สแกนได้ */
export const QR_SIZE_MM = 20;

/* locality ยาว ลดได้ถึง 6.5pt (ฟิลด์ปกติ 7.5pt) */
export const LOCALITY_COMPACT_PT = 6.5;

/* นับว่าล้นถ้าเหลือพื้นที่ใต้ข้อความน้อยกว่านี้ (มม.)
   เผื่อข้อความใน PDF ที่อยู่ต่ำกว่าบนจอ 0.3–0.5 มม. */
const FIT_MARGIN_MM = 1;

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

function PrintLabel({
  plant,
  language,
  overflowing = false,
  onQrDone,
  onFitChange,
}) {
  const t = language === "EN" ? COPY.EN : COPY.TH;

  /* { url, svg } หรือ { failed: true } */
  const [qr, setQr] = useState(null);

  const headerRef = useRef(null);
  const textRef = useRef(null);
  const localityRef = useRef(null);

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

  /* วัดหลัง render: ล้น → ลด locality → ยังล้น → แจ้งหน้า labels
     วัดซ้ำเมื่อฟอนต์โหลดเสร็จ เพราะความกว้างตัวอักษรเปลี่ยน */
  useLayoutEffect(() => {
    let active = true;

    function measure() {
      const text = textRef.current;
      const header = headerRef.current;
      const locality = localityRef.current;

      if (!active || !text || !header) return;

      /* px ต่อ มม. จากความกว้างจริงของป้าย (ถูกต้องแม้ซูมหน้าจอ) */
      const pxPerMm = text.closest("article").offsetWidth / LABEL_WIDTH_MM;

      const isOverflowing = () => {
        const content = text.lastElementChild || text;

        const spaceLeft =
          text.getBoundingClientRect().bottom -
          content.getBoundingClientRect().bottom;

        return (
          spaceLeft < FIT_MARGIN_MM * pxPerMm ||
          header.scrollWidth > header.clientWidth + 1
        );
      };

      if (locality) {
        locality.style.fontSize = "";

        if (isOverflowing()) {
          locality.style.fontSize = `${LOCALITY_COMPACT_PT}pt`;
        }
      }

      /* ส่งด้วยว่าลด locality หรือไม่ เพื่อให้ PDF ใช้ขนาดเดียวกัน */
      onFitChange?.(
        plantId,
        isOverflowing(),
        Boolean(locality?.style.fontSize),
      );
    }

    measure();

    document.fonts?.ready.then(measure);

    return () => {
      active = false;
    };
  }, [plant, language, plantId, onFitChange]);

  const { institution, pnuNo, botanicalName, lines } = getLabelContent(
    plant,
    language,
  );

  return (
    <article
      data-label-id={plantId}
      data-overflow={overflowing ? "true" : undefined}
      style={{ width: `${LABEL_WIDTH_MM}mm`, height: `${LABEL_HEIGHT_MM}mm` }}
      className={`herbarium-print-label flex flex-col overflow-hidden border border-dashed border-black bg-white px-[3.5mm] py-[3mm] font-sans text-black [break-inside:avoid] ${
        overflowing
          ? "outline-[3px] outline-offset-2 outline-red-600 outline-solid print:outline-none"
          : ""
      }`}
    >
      <p
        ref={headerRef}
        className="shrink-0 overflow-hidden whitespace-nowrap border-b border-black pb-[1.2mm] text-center text-[7pt] font-semibold leading-tight"
      >
        {institution}
      </p>

      <div className="mt-[1.8mm] flex min-h-0 flex-1 gap-[3mm]">
        <div ref={textRef} className="min-w-0 flex-1 overflow-hidden">
          {pnuNo && (
            <p className="font-mono text-[9pt] font-medium leading-none tracking-[0.02em]">
              PNU {pnuNo}
            </p>
          )}

          {botanicalName && (
            <p className="mt-[1.2mm] break-words font-serif text-[10.5pt] italic leading-[1.15]">
              {botanicalName}
            </p>
          )}

          <dl className="mt-[1.2mm] space-y-[0.4mm] text-[7.5pt] leading-[1.3]">
            {lines.map((line) => (
              <LabelLine
                key={line.key}
                label={line.label}
                value={line.value}
                valueClassName={line.mono ? "font-mono text-[7pt]" : ""}
                lineRef={line.key === "locality" ? localityRef : undefined}
              />
            ))}
          </dl>
        </div>

        <div
          style={{ width: `${QR_SIZE_MM}mm` }}
          className="flex shrink-0 flex-col items-center justify-end"
        >
          <div
            style={{ width: `${QR_SIZE_MM}mm`, height: `${QR_SIZE_MM}mm` }}
            className="bg-white"
          >
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

          {pnuNo && (
            <p className="mt-[0.8mm] font-mono text-[7pt] leading-none">
              PNU {pnuNo}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export default memo(PrintLabel);

function LabelLine({ label, value, valueClassName = "", lineRef }) {
  return (
    <div ref={lineRef} className="break-words">
      <dt className="inline font-semibold">{label}:</dt>{" "}
      <dd className={`inline ${valueClassName}`}>{value}</dd>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

/* ข้อความบนป้าย ใช้ทั้งป้ายบนหน้าจอและไฟล์ PDF
   lines มีเฉพาะฟิลด์ที่มีค่า (ฟิลด์ว่างไม่แสดงทั้งบรรทัด)
   พิกัดและความสูงพิมพ์รูปแบบเดียวกันทุกรายการ ไม่ว่า coordinate_source จะเป็นอะไร
   (คำว่า "โดยประมาณ" แสดงเฉพาะบนเว็บ ไม่พิมพ์บนป้าย) */
export function getLabelContent(plant, language) {
  const t = language === "EN" ? COPY.EN : COPY.TH;

  const collectorName = textOf(plant.collected_by);
  const collectorNo = textOf(plant.collector_no);
  const collector = [collectorName, collectorNo && `${t.number} ${collectorNo}`]
    .filter(Boolean)
    .join(" ");

  const lines = [
    { key: "family", label: t.family, value: textOf(plant.family) },
    { key: "locality", label: t.locality, value: textOf(plant.locality) },
    {
      key: "coordinates",
      label: t.coordinates,
      value: formatCoordinates(plant.latitude, plant.longitude),
      mono: true,
    },
    {
      key: "elevation",
      label: t.elevation,
      value: formatElevation(plant.elevation),
    },
    { key: "collector", label: t.collector, value: collector },
  ].filter((line) => line.value);

  return {
    institution: t.institution,
    pnuNo: textOf(plant.pnu_no),
    botanicalName: textOf(plant.botanical_name),
    lines,
  };
}

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
