"use client";

/* =========================================================
   GEOCODE FILL PANEL
   เติมพิกัดโดยประมาณจากชื่อสถานที่ (ใช้ในหน้า /account/plants/import)
   - mode "imported": หลังนำเข้า เติมให้เฉพาะ PNU ที่เพิ่งนำเข้า (autoStart)
   - mode "all": ปุ่มเติมพิกัดให้ทุกรายการที่ยังไม่มี แสดงจำนวนที่รอก่อนกด
========================================================= */

import { useCallback, useEffect, useRef, useState } from "react";

import { useSiteSettings } from "@/components/SiteSettingsContext";
import {
  AlertBox,
  CheckIcon,
  DownloadIcon,
  LoadingIcon,
  PagedTable,
  ProgressBar,
  RefreshIcon,
  StatCard,
  StopIcon,
  formatNumber,
} from "@/components/ImportUi";
import { COORDINATE_SQL_FILE } from "@/lib/coordinateSource";
import {
  buildGeocodeReportWorkbook,
  countPlantsMissingCoordinates,
  fetchPlantsMissingCoordinates,
  groupPlantsByLocality,
  hasCoordinateColumns,
  runGeocodeFill,
  summarizeGeocodeResults,
} from "@/lib/geocodeFill";
import { PRECISIONS } from "@/lib/geocodeLocality";
import { downloadBlob, loadSheetJs } from "@/lib/plantImport";
import {
  XLSX_MIME_TYPE,
  writeWorkbookWithFrozenHeader,
} from "@/lib/plantImportReport";
import { useWarnBeforeLeave } from "@/lib/useWarnBeforeLeave";

const COPY = {
  TH: {
    titleAll: "เติมพิกัดให้รายการที่ยังไม่มี",
    titleImported: "เติมพิกัดให้รายการที่เพิ่งนำเข้า",
    description:
      "ค้นพิกัดโดยประมาณจากชื่อสถานที่ (OpenStreetMap Nominatim) ค้นครั้งเดียวต่อชื่อ ไม่เกิน 1 คำขอต่อวินาที และไม่เขียนทับรายการที่มีพิกัดแล้ว พิกัดที่ได้จะบันทึกเป็น “โดยประมาณ” พร้อมรัศมีความคลาดเคลื่อน",
    pending: (count) =>
      `รอเติมพิกัด ${count.toLocaleString("th-TH")} รายการ (มีชื่อสถานที่แต่ยังไม่มีพิกัด)`,
    countingPending: "กำลังนับรายการที่รอเติม...",
    start: "เติมพิกัดให้รายการที่ยังไม่มี",
    resume: "ทำต่อ",
    nothingPending: "ไม่มีรายการที่รอเติมพิกัด",
    preparing: "กำลังเตรียมรายการ...",
    running: "กำลังเติมพิกัด...",
    progress: (index, total, filled) =>
      `ชื่อสถานที่ ${index.toLocaleString("th-TH")} จาก ${total.toLocaleString("th-TH")} • เติมแล้ว ${filled.toLocaleString("th-TH")} รายการ`,
    eta: (minutes) =>
      minutes < 1 ? "เหลือไม่ถึง 1 นาที" : `เหลือประมาณ ${minutes.toLocaleString("th-TH")} นาที`,
    current: "กำลังค้น",
    stop: "หยุด",
    stopping: "จะหยุดหลังชื่อสถานที่นี้เสร็จ...",
    stopped: "หยุดแล้ว กด “ทำต่อ” เพื่อเติมเฉพาะรายการที่ยังไม่มีพิกัด",
    leaveWarning:
      "กำลังเติมพิกัดอยู่ ถ้าออกจากหน้านี้จะหยุดหลังชื่อสถานที่ปัจจุบัน ต้องการออกจากหน้านี้หรือไม่?",
    summaryTitle: "ผลการเติมพิกัด",
    filledBy: {
      place: "เติมได้: ระดับสถานที่",
      district: "เติมได้: ระดับอำเภอ",
      province: "เติมได้: ระดับจังหวัด",
      country: "เติมได้: ระดับประเทศ",
    },
    notFound: "หาไม่เจอ",
    skipped: "ข้าม (ไม่ใช่ชื่อสถานที่)",
    error: "ผิดพลาด",
    unitRecords: "รายการ",
    localities: (count) => `${count.toLocaleString("th-TH")} ชื่อสถานที่`,
    tableTitle: "ชื่อสถานที่ที่เติมไม่ได้",
    locality: "ชื่อสถานที่",
    records: "รายการ",
    result: "ผล",
    message: "หมายเหตุ",
    statuses: {
      not_found: "หาไม่เจอ",
      skipped: "ข้าม",
      error: "ผิดพลาด",
    },
    downloadReport: "ดาวน์โหลดรายงานเติมพิกัด (Excel)",
    reportDownloaded: (fileName) =>
      `ดาวน์โหลดแล้ว: ${fileName} (ดูในโฟลเดอร์ Downloads)`,
    reportFailed: "สร้างรายงานไม่สำเร็จ กรุณาลองอีกครั้ง",
    missingColumns: `ฐานข้อมูลยังไม่มีคอลัมน์ที่มาของพิกัด กรุณารันไฟล์ ${COORDINATE_SQL_FILE} ใน Supabase SQL Editor ก่อน`,
    loadFailed: "ไม่สามารถอ่านรายการจากฐานข้อมูลได้ กรุณาลองใหม่",
    previous: "ก่อนหน้า",
    next: "ถัดไป",
    page: (current, total) => `หน้า ${current} / ${total}`,
    noRows: "ไม่มีรายการ",
  },

  EN: {
    titleAll: "Fill Coordinates for Records Without Them",
    titleImported: "Fill Coordinates for Newly Imported Records",
    description:
      "Looks up approximate coordinates from the locality text (OpenStreetMap Nominatim): one lookup per locality, at most 1 request per second, and records that already have coordinates are never overwritten. Results are saved as “approximate” with an uncertainty radius.",
    pending: (count) =>
      `${count.toLocaleString("en-US")} records waiting (locality but no coordinates)`,
    countingPending: "Counting records waiting...",
    start: "Fill Coordinates for Records Without Them",
    resume: "Resume",
    nothingPending: "No records are waiting for coordinates",
    preparing: "Preparing records...",
    running: "Filling coordinates...",
    progress: (index, total, filled) =>
      `Locality ${index.toLocaleString("en-US")} of ${total.toLocaleString("en-US")} • ${filled.toLocaleString("en-US")} records filled`,
    eta: (minutes) =>
      minutes < 1 ? "Less than 1 minute left" : `About ${minutes.toLocaleString("en-US")} min left`,
    current: "Looking up",
    stop: "Stop",
    stopping: "Stopping after this locality...",
    stopped: "Stopped. Press “Resume” to fill only the records that still have no coordinates.",
    leaveWarning:
      "Coordinates are being filled. If you leave this page, it stops after the current locality. Leave this page?",
    summaryTitle: "Fill Result",
    filledBy: {
      place: "Filled: place",
      district: "Filled: district",
      province: "Filled: province",
      country: "Filled: country",
    },
    notFound: "Not found",
    skipped: "Skipped (not a place)",
    error: "Errors",
    unitRecords: "records",
    localities: (count) => `${count.toLocaleString("en-US")} localities`,
    tableTitle: "Localities that could not be filled",
    locality: "Locality",
    records: "Records",
    result: "Result",
    message: "Note",
    statuses: {
      not_found: "Not found",
      skipped: "Skipped",
      error: "Error",
    },
    downloadReport: "Download Coordinate Report (Excel)",
    reportDownloaded: (fileName) =>
      `Downloaded: ${fileName} (check your Downloads folder)`,
    reportFailed: "Unable to create the report. Please try again.",
    missingColumns: `The database does not have the coordinate source columns yet. Please run ${COORDINATE_SQL_FILE} in the Supabase SQL Editor first.`,
    loadFailed: "Unable to read records from the database. Please try again.",
    previous: "Previous",
    next: "Next",
    page: (current, total) => `Page ${current} / ${total}`,
    noRows: "No rows",
  },
};

function reportFileName(date = new Date()) {
  const day = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  return `geocode-report_${day}.xlsx`;
}

export default function GeocodeFillPanel({
  mode = "all",
  pnuNumbers = null,
  autoStart = false,
}) {
  const { language } = useSiteSettings();

  const t = language === "EN" ? COPY.EN : COPY.TH;

  /* idle | preparing | running | done */
  const [phase, setPhase] = useState("idle");

  const [pending, setPending] = useState(null);

  const [progress, setProgress] = useState(null);

  const [stopRequested, setStopRequested] = useState(false);

  const [outcome, setOutcome] = useState(null);

  const [error, setError] = useState("");

  const [reportResult, setReportResult] = useState(null);

  const [issuePage, setIssuePage] = useState(1);

  const stopRef = useRef(false);

  const abortRef = useRef(null);

  const busy = phase === "preparing" || phase === "running";

  useWarnBeforeLeave(busy, t.leaveWarning);

  /* ออกจากหน้า: ยกเลิกคำขอที่ค้างและหยุด */
  useEffect(
    () => () => {
      stopRef.current = true;
      abortRef.current?.abort();
    },
    [],
  );

  const refreshPending = useCallback(async () => {
    if (mode !== "all") {
      return;
    }

    try {
      setPending(await countPlantsMissingCoordinates());
    } catch (err) {
      console.error("Count missing coordinates error:", err);

      setPending(null);
    }
  }, [mode]);

  const start = useCallback(async () => {
    stopRef.current = false;

    abortRef.current = new AbortController();

    setStopRequested(false);
    setError("");
    setReportResult(null);
    setIssuePage(1);
    setPhase("preparing");
    setProgress(null);

    try {
      if (!(await hasCoordinateColumns())) {
        setError(t.missingColumns);
        setPhase("idle");
        return;
      }

      const plants = await fetchPlantsMissingCoordinates({ pnuNumbers });

      const groups = groupPlantsByLocality(plants);

      setPhase("running");

      const { results, stopped } = await runGeocodeFill({
        groups,
        onProgress: setProgress,
        shouldStop: () => stopRef.current,
        signal: abortRef.current.signal,
      });

      setOutcome({ results, stopped, summary: summarizeGeocodeResults(results) });
      setPhase("done");
    } catch (err) {
      console.error("Geocode fill error:", err);

      setError(t.loadFailed);
      setPhase("idle");
    } finally {
      refreshPending();
    }
  }, [pnuNumbers, refreshPending, t.loadFailed, t.missingColumns]);

  /* นับรายการที่รอ (mode all) หรือเริ่มเองหลังนำเข้า (autoStart) */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (autoStart) {
        start();
      } else {
        refreshPending();
      }
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- เริ่มครั้งเดียวตอนแสดงผล
  }, []);

  function handleStop() {
    stopRef.current = true;

    setStopRequested(true);
  }

  async function handleDownloadReport() {
    if (!outcome) {
      return;
    }

    const name = reportFileName();

    try {
      const XLSX = await loadSheetJs();

      const bytes = writeWorkbookWithFrozenHeader(
        XLSX,
        buildGeocodeReportWorkbook(XLSX, outcome.results),
      );

      downloadBlob(new Blob([bytes], { type: XLSX_MIME_TYPE }), name);

      setReportResult({ status: "done", fileName: name });
    } catch (err) {
      console.error("Create geocode report error:", err);

      setReportResult({ status: "failed", fileName: name });
    }
  }

  const summary = outcome?.summary;

  const issues = (outcome?.results || []).filter(
    (result) => result.status !== "found",
  );

  const canStart = mode === "all" ? pending > 0 : true;

  return (
    <section
      data-testid={`geocode-panel-${mode}`}
      className="vh-panel p-4 sm:p-6"
    >
      <h2 className="font-serif text-[1.35rem] leading-tight text-ink">
        {mode === "all" ? t.titleAll : t.titleImported}
      </h2>

      <p className="mt-1.5 max-w-3xl text-[14px] leading-6 text-muted">
        {t.description}
      </p>

      {mode === "all" && !busy && (
        <p
          data-testid="geocode-pending"
          className="mt-4 font-mono text-[13px] tabular-nums text-ink-soft"
        >
          {pending === null ? t.countingPending : t.pending(pending)}
        </p>
      )}

      {error && (
        <div className="mt-4">
          <AlertBox type="error">{error}</AlertBox>
        </div>
      )}

      {/* PROGRESS */}

      {phase === "preparing" && (
        <p className="mt-5 flex items-center gap-2 text-[14px] text-muted">
          <LoadingIcon className="h-4 w-4 animate-spin" />
          {t.preparing}
        </p>
      )}

      {phase === "running" && progress && (
        <div data-testid="geocode-progress">
          <ProgressBar
            label={stopRequested ? t.stopping : t.running}
            detail={t.progress(progress.index, progress.total, progress.filled)}
            done={Math.max(0, progress.index - 1)}
            total={progress.total}
          />

          <p className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[13px] text-muted">
            <span className="min-w-0 truncate">
              {progress.locality && `${t.current}: ${progress.locality}`}
            </span>

            {progress.etaMs !== null && (
              <span className="font-mono tabular-nums">
                {t.eta(Math.round(progress.etaMs / 60000))}
              </span>
            )}
          </p>

          <div className="mt-4">
            <button
              type="button"
              data-geocode-stop
              onClick={handleStop}
              disabled={stopRequested}
              className="vh-btn vh-btn-outline w-full sm:w-auto"
            >
              {stopRequested ? (
                <LoadingIcon className="h-4 w-4 animate-spin" />
              ) : (
                <StopIcon className="h-4 w-4" />
              )}

              {t.stop}
            </button>
          </div>
        </div>
      )}

      {/* START / RESUME */}

      {!busy && (mode === "all" || outcome?.stopped || error) && (
        <div className="mt-5">
          <button
            type="button"
            data-geocode-start
            onClick={start}
            disabled={!canStart}
            className="vh-btn vh-btn-primary w-full sm:w-auto"
          >
            <RefreshIcon className="h-4 w-4" />

            {mode === "all" && pending === 0
              ? t.nothingPending
              : outcome?.stopped
                ? t.resume
                : t.start}
          </button>
        </div>
      )}

      {/* SUMMARY */}

      {phase === "done" && summary && (
        <div data-testid="geocode-summary" className="mt-6">
          <h3 className="font-serif text-[1.15rem] leading-tight text-ink">
            {t.summaryTitle}
          </h3>

          <p className="mt-1 text-[13px] text-muted">
            {t.localities(summary.localities)}
          </p>

          {outcome.stopped && (
            <div className="mt-4">
              <AlertBox type="error">{t.stopped}</AlertBox>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRECISIONS.map((precision) => (
              <StatCard
                key={precision}
                id={`geocode-${precision}`}
                label={t.filledBy[precision]}
                value={summary.found[precision]}
                tone={summary.found[precision] ? "moss" : null}
              />
            ))}

            <StatCard
              id="geocode-not_found"
              label={t.notFound}
              value={summary.not_found}
              tone={summary.not_found ? "ochre" : null}
            />

            <StatCard
              id="geocode-skipped"
              label={t.skipped}
              value={summary.skipped}
            />

            <StatCard
              id="geocode-error"
              label={t.error}
              value={summary.error}
              tone={summary.error ? "clay" : null}
            />
          </div>

          {issues.length > 0 && (
            <>
              <h4 className="vh-eyebrow mt-6">{t.tableTitle}</h4>

              <div className="mt-3">
                <PagedTable
                  t={t}
                  rows={issues}
                  page={issuePage}
                  onPageChange={setIssuePage}
                  testId="geocode-issue-table"
                  rowKey={(row) => row.locality}
                  columns={[
                    {
                      key: "locality",
                      label: t.locality,
                      render: (row) => row.locality,
                    },
                    {
                      key: "count",
                      label: t.records,
                      mono: true,
                      render: (row) => formatNumber(row.count),
                    },
                    {
                      key: "status",
                      label: t.result,
                      render: (row) => (
                        <span
                          className={
                            row.status === "error" ? "text-clay" : "text-ochre"
                          }
                        >
                          {t.statuses[row.status]}
                        </span>
                      ),
                    },
                    {
                      key: "message",
                      label: t.message,
                      render: (row) => row.message || "—",
                    },
                  ]}
                />
              </div>
            </>
          )}

          <div className="mt-6">
            <button
              type="button"
              data-geocode-report
              onClick={handleDownloadReport}
              className="vh-btn vh-btn-outline w-full sm:w-auto"
            >
              <DownloadIcon className="h-4 w-4" />
              {t.downloadReport}
            </button>
          </div>

          {reportResult?.status === "done" && (
            <p
              role="status"
              data-geocode-report-result="done"
              className="mt-4 flex items-start gap-2.5 rounded-[6px] border border-moss/30 bg-moss-soft px-3.5 py-3 text-[13px] leading-6 text-moss"
            >
              <CheckIcon className="mt-1 h-4 w-4 shrink-0" />

              <span className="min-w-0 break-words">
                {t.reportDownloaded(reportResult.fileName)}
              </span>
            </p>
          )}

          {reportResult?.status === "failed" && (
            <div className="mt-4">
              <AlertBox type="error">{t.reportFailed}</AlertBox>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
