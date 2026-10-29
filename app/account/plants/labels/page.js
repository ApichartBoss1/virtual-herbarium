"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import HerbariumLabel, {
  LABEL_HEIGHT_MM,
  LABEL_WIDTH_MM,
} from "@/components/HerbariumLabel";
import Navbar from "@/components/Navbar";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import { readLabelSelection } from "@/lib/labelSelection";
import {
  MAX_LABELS,
  fetchLabelPlantsByIds,
  fetchLabelPlantsByPnuRange,
} from "@/lib/plantQueries";

/* =========================================================
   PRINTABLE LABELS
   เลือกตามช่วง PNU หรือรายการที่เลือกในหน้า /account/plants
   พิมพ์ด้วย CSS @media print (A4, 8 ป้ายหรือ 1 ป้ายต่อหน้า)
========================================================= */

/* 8 ป้าย = 2 คอลัมน์ × 4 แถว */
const LAYOUTS = {
  eight: 8,
  one: 1,
};

/* ช่องว่างระหว่างป้าย (มม.) */
const LABEL_GAP_MM = 5;

/* ขนาดป้ายมาจาก HerbariumLabel ที่เดียว
   ตอนพิมพ์ซ่อนทุกอย่างนอกพื้นที่ป้าย (navbar, footer, พื้นหลัง 3D, แถบล่างมือถือ, ปุ่ม) */
const PRINT_CSS = `
@page { size: A4; margin: 10mm; }

.vh-label-page {
  grid-template-columns: ${LABEL_WIDTH_MM}mm;
  gap: ${LABEL_GAP_MM}mm;
}

@media (min-width: 1024px) {
  .vh-label-page[data-layout="eight"] {
    grid-template-columns: repeat(2, ${LABEL_WIDTH_MM}mm);
  }

  .vh-label-page[data-layout="eight"] > [data-print-hide] {
    grid-column: 1 / -1;
  }
}

@media print {
  html, body {
    background: #fff !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  body::before,
  body > :not(main),
  main > :not(.vh-label-print),
  .vh-label-print button,
  .vh-label-print [data-print-hide] {
    display: none !important;
  }

  main.page {
    min-height: 0 !important;
  }

  .vh-label-print {
    width: auto !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    animation: none !important;
  }

  .vh-label-pages {
    display: block !important;
    margin: 0 !important;
  }

  .vh-label-page {
    display: grid !important;
    grid-template-columns: repeat(2, ${LABEL_WIDTH_MM}mm) !important;
    grid-auto-rows: ${LABEL_HEIGHT_MM}mm;
    gap: ${LABEL_GAP_MM}mm !important;
    justify-content: center;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    background: none !important;
    box-shadow: none !important;
    break-after: page;
  }

  .vh-label-page[data-layout="one"] {
    grid-template-columns: ${LABEL_WIDTH_MM}mm !important;
  }

  .vh-label-page:last-child {
    break-after: auto;
  }

  .herbarium-print-label {
    break-inside: avoid;
    outline: none !important;
  }
}
`;

const text = {
  TH: {
    eyebrow: "SPECIMEN LABELS",
    title: "พิมพ์ป้ายพร้อม QR",
    subtitle:
      "พิมพ์ป้ายสำหรับติดตัวอย่างพรรณไม้จริง สแกน QR เพื่อเปิดหน้ารายละเอียดของตัวอย่าง",
    back: "กลับไปหน้าจัดการพรรณไม้",

    sourceRange: "ช่วง PNU",
    sourceSelection: "รายการที่เลือก",

    rangeFrom: "PNU จาก",
    rangeTo: "ถึง",
    rangeSubmit: "แสดงป้าย",
    rangeHint: `ไม่เกิน ${MAX_LABELS} เลขต่อครั้ง`,
    rangeInvalid: "กรอกเลข PNU เป็นจำนวนเต็มบวกทั้งสองช่อง",
    rangeReversed: "เลขเริ่มต้นต้องไม่มากกว่าเลขสิ้นสุด",
    rangeTooMany: (count) =>
      `ช่วงนี้มี ${count} เลข เกินกำหนด ${MAX_LABELS} ป้ายต่อครั้ง กรุณาแบ่งช่วงให้เล็กลง`,

    selectionEmpty: "ยังไม่ได้เลือกรายการ เลือกพรรณไม้จากหน้าจัดการพรรณไม้ก่อน",
    selectionTooMany: (count) =>
      `เลือกไว้ ${count} รายการ เกินกำหนด ${MAX_LABELS} ป้ายต่อครั้ง กรุณาลดจำนวนที่เลือก`,
    selectionCount: (count) => `เลือกไว้ ${count} รายการ`,
    goSelect: "ไปเลือกรายการ",

    layout: "รูปแบบ",
    layoutEight: "8 ป้ายต่อหน้า A4 (2×4)",
    layoutOne: "1 ป้ายต่อหน้า",

    loading: "กำลังดึงข้อมูล...",
    loadError: "ไม่สามารถดึงข้อมูลพรรณไม้ได้",
    retry: "ลองอีกครั้ง",

    labelCount: (count) => `${count} ป้าย`,
    pageCount: (count) => `${count} หน้า`,
    noLabels: "ไม่พบพรรณไม้ในช่วงที่เลือก",
    missingPnu: (count) => `ไม่พบในระบบ ${count} เลข:`,
    missingIds: (count) =>
      `ไม่พบ ${count} รายการที่เลือกไว้ (อาจถูกลบไปแล้ว)`,

    qrProgress: (done, total) => `กำลังสร้าง QR ${done}/${total}`,
    qrReady: "QR พร้อมทุกป้าย",
    qrFailed: (count) =>
      `สร้าง QR ไม่สำเร็จ ${count} ป้าย โหลดหน้าใหม่แล้วลองอีกครั้ง`,

    overflow: (list) => `ป้ายต่อไปนี้ข้อความล้น: ${list}`,
    overflowHint:
      "ข้อความส่วนที่ล้นจะไม่ปรากฏบนป้าย (ขอบแดงแสดงเฉพาะบนหน้าจอ) ยังพิมพ์ได้ตามปกติ",

    print: "พิมพ์",
    page: "หน้า",
  },

  EN: {
    eyebrow: "SPECIMEN LABELS",
    title: "Print Labels with QR",
    subtitle:
      "Print labels for physical specimens. Scan the QR code to open the specimen page.",
    back: "Back to Plant Collection",

    sourceRange: "PNU range",
    sourceSelection: "Selected records",

    rangeFrom: "PNU from",
    rangeTo: "to",
    rangeSubmit: "Show labels",
    rangeHint: `Up to ${MAX_LABELS} numbers at a time`,
    rangeInvalid: "Enter positive whole PNU numbers in both fields",
    rangeReversed: "The first number must not be greater than the last",
    rangeTooMany: (count) =>
      `This range has ${count} numbers, over the limit of ${MAX_LABELS} labels. Please use a smaller range.`,

    selectionEmpty:
      "Nothing is selected yet. Select plants on the collection page first.",
    selectionTooMany: (count) =>
      `${count} records are selected, over the limit of ${MAX_LABELS} labels. Please select fewer.`,
    selectionCount: (count) => `${count} selected`,
    goSelect: "Select records",

    layout: "Layout",
    layoutEight: "8 labels per A4 page (2×4)",
    layoutOne: "1 label per page",

    loading: "Loading records...",
    loadError: "Unable to load plant records",
    retry: "Try Again",

    labelCount: (count) => `${count} ${count === 1 ? "label" : "labels"}`,
    pageCount: (count) => `${count} ${count === 1 ? "page" : "pages"}`,
    noLabels: "No plants found for this selection",
    missingPnu: (count) =>
      `${count} ${count === 1 ? "number was" : "numbers were"} not found:`,
    missingIds: (count) =>
      `${count} selected ${count === 1 ? "record was" : "records were"} not found (they may have been deleted)`,

    qrProgress: (done, total) => `Creating QR codes ${done}/${total}`,
    qrReady: "All QR codes are ready",
    qrFailed: (count) =>
      `${count} QR ${count === 1 ? "code" : "codes"} failed. Reload the page and try again.`,

    overflow: (list) => `These labels have overflowing text: ${list}`,
    overflowHint:
      "Overflowing text will not appear on the label (the red outline shows on screen only). You can still print.",

    print: "Print",
    page: "Page",
  },
};

export default function PrintLabelsPage() {
  const { language } = useSiteSettings();

  const t = language === "EN" ? text.EN : text.TH;

  /* =====================================================
     STATE
     หน้านี้ render ฝั่ง browser เท่านั้น (อยู่หลัง guard ของ /account)
     จึงอ่าน ?source=selection และ sessionStorage ตอนเริ่มได้เลย
  ===================================================== */

  const [initial] = useState(readInitialSource);

  const [source, setSource] = useState(initial.source);

  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");

  const [selectionIds, setSelectionIds] = useState(initial.ids);

  const [layout, setLayout] = useState("eight");

  /* null = ยังไม่ได้ดึง */
  const [plants, setPlants] = useState(null);
  const [missingPnu, setMissingPnu] = useState([]);
  const [missingIdCount, setMissingIdCount] = useState(0);

  const [loading, setLoading] = useState(
    initial.source === "selection" && !getSelectionProblem(initial.ids),
  );
  const [error, setError] = useState("");

  /* { key, count } ของข้อความใน t (เปลี่ยนภาษาแล้วข้อความเปลี่ยนตาม) */
  const [notice, setNotice] = useState(
    initial.source === "selection" ? getSelectionProblem(initial.ids) : null,
  );

  /* ผลการสร้าง QR ของแต่ละป้าย: id → true/false */
  const qrResultsRef = useRef(new Map());
  const [qrCounts, setQrCounts] = useState({ ready: 0, failed: 0 });

  /* id ของป้ายที่ข้อความล้น (วัดหลัง render ใน HerbariumLabel) */
  const [overflowIds, setOverflowIds] = useState(() => new Set());

  const requestIdRef = useRef(0);

  /* =====================================================
     LOAD
  ===================================================== */

  function resetResults() {
    requestIdRef.current += 1;

    qrResultsRef.current = new Map();
    setQrCounts({ ready: 0, failed: 0 });
    setOverflowIds(new Set());

    setPlants(null);
    setMissingPnu([]);
    setMissingIdCount(0);
    setError("");
    setNotice(null);
    setLoading(false);
  }

  /* state เปลี่ยนใน callback ของ promise เท่านั้น ผู้เรียกตั้ง loading เอง */
  function runLoad(load) {
    const requestId = ++requestIdRef.current;

    const isCurrent = () => requestId === requestIdRef.current;

    return load()
      .then((result) => {
        if (!isCurrent()) return;

        setPlants(result.plants);
        setMissingPnu(result.missingPnu || []);
        setMissingIdCount(result.missingIdCount || 0);
      })
      .catch((err) => {
        console.error("Fetch label plants error:", err);

        if (isCurrent()) {
          setError(err?.message || "load_error");
        }
      })
      .finally(() => {
        if (isCurrent()) {
          setLoading(false);
        }
      });
  }

  function loadRange(event) {
    event?.preventDefault();

    resetResults();

    const from = parsePnu(fromInput);
    const to = parsePnu(toInput);

    if (from === null || to === null) {
      setNotice({ key: "rangeInvalid" });
      return;
    }

    if (from > to) {
      setNotice({ key: "rangeReversed" });
      return;
    }

    const count = to - from + 1;

    if (count > MAX_LABELS) {
      setNotice({ key: "rangeTooMany", count });
      return;
    }

    setLoading(true);

    runLoad(async () => {
      const rows = await fetchLabelPlantsByPnuRange(from, to);

      const found = new Set(rows.map((plant) => Number(plant.pnu_no)));

      const missing = [];

      for (let pnu = from; pnu <= to; pnu += 1) {
        if (!found.has(pnu)) missing.push(pnu);
      }

      return { plants: rows, missingPnu: missing };
    });
  }

  function fetchSelection(ids) {
    return runLoad(async () => {
      const rows = await fetchLabelPlantsByIds(ids);

      return {
        plants: rows,
        missingIdCount: new Set(ids).size - rows.length,
      };
    });
  }

  function loadSelection(ids) {
    resetResults();

    const problem = getSelectionProblem(ids);

    if (problem) {
      setNotice(problem);
      return;
    }

    setLoading(true);

    fetchSelection(ids);
  }

  /* มาจาก "พิมพ์ป้ายที่เลือก" → โหลดทันที (loading ตั้งไว้ตั้งแต่ state เริ่มต้น) */
  useEffect(() => {
    if (initial.source === "selection" && !getSelectionProblem(initial.ids)) {
      fetchSelection(initial.ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  function changeSource(next) {
    if (next === source) return;

    setSource(next);

    window.history.replaceState(
      null,
      "",
      next === "selection" ? "?source=selection" : window.location.pathname,
    );

    if (next === "selection") {
      const ids = readLabelSelection();

      setSelectionIds(ids);

      loadSelection(ids);
    } else {
      resetResults();
    }
  }

  /* =====================================================
     QR READINESS
  ===================================================== */

  const handleQrDone = useCallback((id, ok) => {
    qrResultsRef.current.set(id, ok);

    let ready = 0;
    let failed = 0;

    qrResultsRef.current.forEach((value) => {
      if (value) ready += 1;
      else failed += 1;
    });

    setQrCounts({ ready, failed });
  }, []);

  const handleFitChange = useCallback((id, overflowing) => {
    setOverflowIds((current) => {
      if (current.has(id) === overflowing) return current;

      const next = new Set(current);

      if (overflowing) next.add(id);
      else next.delete(id);

      return next;
    });
  }, []);

  const labelCount = plants?.length || 0;

  const overflowPnus = (plants || [])
    .filter((plant) => overflowIds.has(plant.id))
    .map((plant) => (plant.pnu_no != null ? `PNU ${plant.pnu_no}` : plant.id));

  const qrDone = qrCounts.ready + qrCounts.failed;

  const allQrReady = labelCount > 0 && qrCounts.ready === labelCount;

  const perPage = LAYOUTS[layout];

  const pages = chunk(plants || [], perPage);

  const noticeText = notice
    ? typeof t[notice.key] === "function"
      ? t[notice.key](notice.count)
      : t[notice.key]
    : "";

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="page min-h-screen overflow-x-hidden text-ink">
      <style>{PRINT_CSS}</style>

      <Navbar />

      <div className="vh-label-print vh-container page-enter pb-[calc(106px+env(safe-area-inset-bottom))] pt-6 sm:pb-16 md:pt-10">
        <div data-print-hide>
          <Link
            href="/account/plants"
            className="vh-btn vh-btn-ghost vh-btn-sm -ml-3 hidden md:inline-flex"
          >
            <ArrowLeftIcon className="h-4 w-4" />

            {t.back}
          </Link>

          <div className="mt-2 border-b border-rule-strong pb-7 md:mt-5">
            <p className="vh-eyebrow flex items-center gap-3">
              <span className="h-px w-6 bg-ochre" />
              {t.eyebrow}
            </p>

            <h1 className="vh-display mt-4 text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]">
              {t.title}
            </h1>

            <p className="mt-4 max-w-2xl text-[14px] leading-7 text-muted sm:text-[15px]">
              {t.subtitle}
            </p>
          </div>

          {/* =================================================
              SOURCE + LAYOUT
          ================================================= */}

          <section className="vh-panel mt-7 p-4 sm:p-5">
            <div
              role="tablist"
              className="grid grid-cols-2 gap-1 rounded-full border border-rule p-1 sm:inline-grid"
            >
              {[
                ["range", t.sourceRange],
                ["selection", t.sourceSelection],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={source === value}
                  onClick={() => changeSource(value)}
                  className={`rounded-full px-4 py-2 text-[13px] transition ${
                    source === value
                      ? "bg-moss text-on-moss"
                      : "text-muted hover:bg-moss-soft hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {source === "range" ? (
              <form
                onSubmit={loadRange}
                className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
              >
                <NumberField
                  label={t.rangeFrom}
                  value={fromInput}
                  onChange={setFromInput}
                  placeholder="3001"
                />

                <NumberField
                  label={t.rangeTo}
                  value={toInput}
                  onChange={setToInput}
                  placeholder="3050"
                />

                <button
                  type="submit"
                  disabled={loading || !fromInput.trim() || !toInput.trim()}
                  className="vh-btn vh-btn-outline"
                >
                  {t.rangeSubmit}
                </button>

                <p className="text-[12px] text-faint sm:col-span-3">
                  {t.rangeHint}
                </p>
              </form>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-[14px] text-ink-soft">
                  {t.selectionCount(selectionIds.length)}
                </p>

                <Link
                  href="/account/plants"
                  className="vh-btn vh-btn-ghost vh-btn-sm"
                >
                  {t.goSelect}
                </Link>
              </div>
            )}

            <fieldset className="mt-5 border-t border-rule pt-4">
              <legend className="vh-eyebrow float-left mb-2 w-full !text-[10px]">
                {t.layout}
              </legend>

              <div className="clear-both flex flex-col gap-2 sm:flex-row sm:gap-6">
                {[
                  ["eight", t.layoutEight],
                  ["one", t.layoutOne],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink-soft"
                  >
                    <input
                      type="radio"
                      name="label-layout"
                      value={value}
                      checked={layout === value}
                      onChange={() => setLayout(value)}
                      className="h-4 w-4 accent-moss"
                    />

                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          {/* =================================================
              STATUS
          ================================================= */}

          {notice && (
            <div
              role="alert"
              className="vh-panel mt-5 flex items-start gap-3 border-ochre/35 bg-ochre-soft p-4"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />

              <p className="min-w-0 text-[14px] leading-6 text-ochre">
                {noticeText}
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="vh-panel mt-5 flex items-start gap-3 border-clay/40 bg-clay-soft p-4"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-clay" />

              <div className="min-w-0">
                <p className="text-[14px] leading-6 text-clay">
                  {error === "load_error" ? t.loadError : error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    source === "selection"
                      ? loadSelection(selectionIds)
                      : loadRange()
                  }
                  className="vh-btn vh-btn-danger vh-btn-sm mt-3"
                >
                  {t.retry}
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="vh-panel mt-5 flex items-center justify-center gap-3 px-6 py-10">
              <LoadingIcon className="h-5 w-5 animate-spin text-moss" />

              <p className="font-serif text-[15px] italic text-muted">
                {t.loading}
              </p>
            </div>
          )}

          {plants && !loading && (
            <section
              aria-live="polite"
              className="vh-panel mt-5 p-4 sm:p-5"
            >
              {overflowPnus.length > 0 && (
                <div
                  role="alert"
                  data-overflow-warning
                  className="mb-4 flex items-start gap-3 rounded-[6px] border border-clay/40 bg-clay-soft px-3.5 py-3"
                >
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-clay" />

                  <div className="min-w-0 text-[13px] leading-6 text-clay">
                    <p className="font-medium">
                      {t.overflow(overflowPnus.join(", "))}
                    </p>

                    <p>{t.overflowHint}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <p className="text-[15px] text-ink">
                    <span className="font-mono tabular-nums">
                      {t.labelCount(labelCount)}
                    </span>
                    {labelCount > 0 && (
                      <span className="text-muted">
                        {" "}
                        · {t.pageCount(pages.length)}
                      </span>
                    )}
                  </p>

                  {labelCount === 0 && (
                    <p className="text-[13px] text-muted">{t.noLabels}</p>
                  )}

                  {missingPnu.length > 0 && (
                    <p className="text-[13px] leading-6 text-ochre">
                      {t.missingPnu(missingPnu.length)}{" "}
                      <span className="font-mono tabular-nums">
                        {formatNumberRanges(missingPnu)}
                      </span>
                    </p>
                  )}

                  {missingIdCount > 0 && (
                    <p className="text-[13px] leading-6 text-ochre">
                      {t.missingIds(missingIdCount)}
                    </p>
                  )}

                  {labelCount > 0 && (
                    <p
                      data-qr-status={allQrReady ? "ready" : "pending"}
                      className={`text-[13px] ${
                        qrCounts.failed > 0
                          ? "text-clay"
                          : allQrReady
                            ? "text-moss"
                            : "text-muted"
                      }`}
                    >
                      {qrCounts.failed > 0
                        ? t.qrFailed(qrCounts.failed)
                        : allQrReady
                          ? t.qrReady
                          : t.qrProgress(qrDone, labelCount)}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  disabled={!allQrReady}
                  className="vh-btn vh-btn-primary w-full shrink-0 sm:w-auto"
                >
                  {allQrReady ? (
                    <PrintIcon className="h-4 w-4" />
                  ) : (
                    <LoadingIcon className="h-4 w-4 animate-spin" />
                  )}

                  {t.print}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* =================================================
            LABELS (หน้าจอ = ตัวอย่าง, ตอนพิมพ์ = หน้า A4)
        ================================================= */}

        {!loading && pages.length > 0 && (
          <div className="vh-label-pages mt-8 space-y-6">
            {pages.map((pagePlants, index) => (
              <section
                key={pagePlants[0].id}
                data-layout={layout}
                aria-label={`${t.page} ${index + 1}`}
                className="vh-label-page vh-panel grid justify-center p-4 sm:p-6"
              >
                <p data-print-hide className="vh-eyebrow !text-[10px]">
                  {t.page} {index + 1} / {pages.length}
                </p>

                {pagePlants.map((plant) => (
                  <HerbariumLabel
                    key={plant.id}
                    plant={plant}
                    language={language}
                    overflowing={overflowIds.has(plant.id)}
                    onQrDone={handleQrDone}
                    onFitChange={handleFitChange}
                  />
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function readInitialSource() {
  if (typeof window === "undefined") {
    return { source: "range", ids: [] };
  }

  const params = new URLSearchParams(window.location.search);

  return {
    source: params.get("source") === "selection" ? "selection" : "range",
    ids: readLabelSelection(),
  };
}

/* รายการที่เลือกพิมพ์ไม่ได้: ว่าง หรือเกินจำนวนสูงสุด */
function getSelectionProblem(ids) {
  if (ids.length === 0) return { key: "selectionEmpty" };

  if (ids.length > MAX_LABELS) {
    return { key: "selectionTooMany", count: ids.length };
  }

  return null;
}

function parsePnu(value) {
  const textValue = String(value ?? "").trim();

  if (!/^\d+$/.test(textValue)) return null;

  const number = Number(textValue);

  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function chunk(items, size) {
  const result = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

/* [3005, 3010, 3011, 3012] → "3005, 3010–3012" */
function formatNumberRanges(numbers) {
  const parts = [];

  let start = numbers[0];
  let previous = numbers[0];

  for (const number of [...numbers.slice(1), null]) {
    if (number === previous + 1) {
      previous = number;
      continue;
    }

    parts.push(start === previous ? `${start}` : `${start}–${previous}`);

    start = number;
    previous = number;
  }

  return parts.join(", ");
}

/* =========================================================
   FIELDS
========================================================= */

function NumberField({ label, value, onChange, placeholder }) {
  return (
    <label className="block min-w-0">
      <span className="vh-eyebrow mb-1.5 block !text-[10px]">{label}</span>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="vh-input font-mono tabular-nums"
      />
    </label>
  );
}

/* =========================================================
   ICONS
========================================================= */

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
      <path d="m15 18-6-6 6-6" />

      <path d="M9 12h10" />
    </svg>
  );
}

function PrintIcon({ className = "" }) {
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
      <path d="M7 9V4h10v5" />

      <path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />

      <path d="M7 14h10v6H7z" />
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
      <circle cx="12" cy="12" r="9" />

      <path d="M12 8v5" />

      <path d="M12 16.5h.01" />
    </svg>
  );
}

function LoadingIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
