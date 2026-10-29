"use client";

import { useEffect, useRef, useState } from "react";

import { getPlantUrl } from "@/lib/siteUrl";

/* =========================================================
   PLANT QR
   QR ลิงก์ไปหน้ารายละเอียด public: ${getSiteUrl()}/plants/<id>
   - สีดำบนพื้นขาวเสมอ (ทั้งโหมดสว่างและมืด) เพื่อให้สแกนได้
   - โหลด qrcode เฉพาะเมื่อแสดงคอมโพเนนต์นี้
========================================================= */

const QR_OPTIONS = {
  errorCorrectionLevel: "M",
  margin: 1,
  color: { dark: "#000000", light: "#ffffff" },
};

const PNG_SIZE = 1024;

const COPIED_RESET_MS = 2000;

const COPY = {
  TH: {
    title: "QR code ของตัวอย่างนี้",
    description: "สแกนเพื่อเปิดหน้านี้ หรือพิมพ์ติดกับตัวอย่างพรรณไม้",
    qrLabel: (url) => `QR code ลิงก์ไปยัง ${url}`,
    download: "ดาวน์โหลด PNG",
    copy: "คัดลอกลิงก์",
    copied: "คัดลอกแล้ว",
    copyFailed: "คัดลอกไม่สำเร็จ",
    error: "สร้าง QR code ไม่สำเร็จ",
  },
  EN: {
    title: "QR code for this specimen",
    description: "Scan to open this page, or print it for the specimen sheet.",
    qrLabel: (url) => `QR code linking to ${url}`,
    download: "Download PNG",
    copy: "Copy link",
    copied: "Copied",
    copyFailed: "Copy failed",
    error: "Unable to create the QR code",
  },
};

export default function PlantQR({ plantId, pnuNo, language }) {
  const t = language === "EN" ? COPY.EN : COPY.TH;

  /* { url, svg } หลังสร้างเสร็จ (สร้างฝั่ง browser เพราะอาจใช้ window.location.origin) */
  const [qr, setQr] = useState(null);

  const [failed, setFailed] = useState(false);

  const [copyState, setCopyState] = useState("idle");

  const [downloading, setDownloading] = useState(false);

  const copyTimerRef = useRef(null);

  const pnuLabel = pnuNo !== null && pnuNo !== undefined && pnuNo !== "" ? String(pnuNo) : "";

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
          setFailed(false);
        }
      } catch (err) {
        console.error("Create QR code error:", err);

        if (active) {
          setFailed(true);
        }
      }
    }

    createQr();

    return () => {
      active = false;
    };
  }, [plantId]);

  useEffect(() => () => window.clearTimeout(copyTimerRef.current), []);

  async function handleDownload() {
    if (!qr || downloading) return;

    setDownloading(true);

    try {
      const QRCode = await import("qrcode");

      /* PNG พื้นขาวทึบเสมอ แม้หน้าเว็บอยู่ในโหมดมืด */
      const dataUrl = await QRCode.toDataURL(qr.url, {
        ...QR_OPTIONS,
        type: "image/png",
        width: PNG_SIZE,
      });

      const link = document.createElement("a");

      link.href = dataUrl;

      link.download = `PNU-${pnuLabel || plantId}.png`;

      document.body.appendChild(link);

      link.click();

      link.remove();
    } catch (err) {
      console.error("Download QR code error:", err);
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopy() {
    if (!qr) return;

    let ok = false;

    try {
      await navigator.clipboard.writeText(qr.url);

      ok = true;
    } catch {
      ok = copyWithTextarea(qr.url);
    }

    setCopyState(ok ? "copied" : "failed");

    window.clearTimeout(copyTimerRef.current);

    copyTimerRef.current = window.setTimeout(() => setCopyState("idle"), COPIED_RESET_MS);
  }

  return (
    <section className="mt-8 border-t border-rule pt-6">
      <h2 className="vh-eyebrow">{t.title}</h2>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* QR: ดำบนขาวเสมอ ไม่ใช้สีจาก theme */}
        <figure className="w-[148px] shrink-0 rounded-[6px] border border-rule bg-white p-2.5 shadow-sheet">
          {qr ? (
            <div
              role="img"
              aria-label={t.qrLabel(qr.url)}
              data-qr-url={qr.url}
              className="aspect-square w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qr.svg }}
            />
          ) : (
            <div
              aria-hidden="true"
              className={`aspect-square w-full rounded-[3px] ${failed ? "bg-neutral-100" : "animate-pulse bg-neutral-200"}`}
            />
          )}

          <figcaption className="mt-2 text-center font-mono text-[12px] tracking-[0.06em] text-black">
            PNU {pnuLabel || "—"}
          </figcaption>
        </figure>

        <div className="min-w-0">
          <p className="text-[13px] leading-6 text-muted">
            {failed ? t.error : t.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!qr || downloading}
              className="vh-btn vh-btn-outline vh-btn-sm"
            >
              <DownloadIcon className="h-4 w-4" />
              {t.download}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!qr}
              aria-live="polite"
              className="vh-btn vh-btn-outline vh-btn-sm"
            >
              {copyState === "copied" ? (
                <CheckIcon className="h-4 w-4 text-moss" />
              ) : (
                <LinkIcon className="h-4 w-4" />
              )}

              {copyState === "copied"
                ? t.copied
                : copyState === "failed"
                  ? t.copyFailed
                  : t.copy}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* clipboard API ใช้ไม่ได้ (เช่นเปิดผ่าน http ที่ไม่ใช่ localhost) */
function copyWithTextarea(text) {
  try {
    const textarea = document.createElement("textarea");

    textarea.value = text;

    textarea.setAttribute("readonly", "");

    textarea.style.position = "fixed";

    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.select();

    const ok = document.execCommand("copy");

    textarea.remove();

    return ok;
  } catch {
    return false;
  }
}

/* =========================================================
   ICONS
========================================================= */

function DownloadIcon({ className = "" }) {
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
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function LinkIcon({ className = "" }) {
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
      <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
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
      <path d="m5 12 4.5 4.5L19 7" />
    </svg>
  );
}
