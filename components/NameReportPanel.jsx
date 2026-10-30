"use client";

/* =========================================================
   NAME REPORT PANEL
   ปุ่ม "ตรวจชื่อวิทยาศาสตร์ทั้งหมด" (ใช้ในหน้า /account/plants/import)
   รายงานอย่างเดียว ไม่แก้ข้อมูลในฐานข้อมูล
========================================================= */

import { useEffect, useRef, useState } from "react";

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
import {
  NAME_RESULTS,
  buildNameReportWorkbook,
  clearStoredResults,
  fetchDistinctBotanicalNames,
  loadStoredResults,
  runNameCheck,
  summarizeNameResults,
} from "@/lib/nameReport";
import { downloadBlob, loadSheetJs } from "@/lib/plantImport";
import {
  XLSX_MIME_TYPE,
  writeWorkbookWithFrozenHeader,
} from "@/lib/plantImportReport";
import { useWarnBeforeLeave } from "@/lib/useWarnBeforeLeave";

const COPY = {
  TH: {
    title: "ตรวจชื่อวิทยาศาสตร์ทั้งหมด",
    description:
      "ตรวจชื่อวิทยาศาสตร์ที่ไม่ซ้ำทุกชื่อในระบบกับ GBIF ทำรายงานอย่างเดียว ไม่แก้ข้อมูลในฐานข้อมูล ผลที่ตรวจแล้วเก็บไว้ในเบราว์เซอร์นี้ ถ้าหยุดหรือปิดหน้า กดใหม่จะทำต่อจากเดิม",
    stored: (count) =>
      count
        ? `ตรวจไว้แล้ว ${count.toLocaleString("th-TH")} ชื่อในเบราว์เซอร์นี้`
        : "ยังไม่มีผลที่ตรวจไว้",
    start: "ตรวจชื่อวิทยาศาสตร์ทั้งหมด",
    resume: "ตรวจต่อจากเดิม",
    clear: "ล้างผลเพื่อเริ่มใหม่",
    clearConfirm: "ล้างผลที่ตรวจไว้ทั้งหมดในเบราว์เซอร์นี้ แล้วเริ่มใหม่?",
    loadingNames: "กำลังอ่านชื่อจากฐานข้อมูล...",
    running: "กำลังตรวจกับ GBIF...",
    progress: (done, total) =>
      `ตรวจแล้ว ${done.toLocaleString("th-TH")} จาก ${total.toLocaleString("th-TH")} ชื่อ`,
    eta: (minutes) =>
      minutes < 1 ? "เหลือไม่ถึง 1 นาที" : `เหลือประมาณ ${minutes.toLocaleString("th-TH")} นาที`,
    current: "กำลังตรวจ",
    stop: "หยุด",
    stopping: "จะหยุดหลังชื่อที่กำลังตรวจเสร็จ...",
    stopped: "หยุดแล้ว ผลที่ตรวจแล้วถูกเก็บไว้ กด “ตรวจต่อจากเดิม” เพื่อทำต่อ",
    leaveWarning:
      "กำลังตรวจชื่ออยู่ ผลที่ตรวจแล้วถูกเก็บไว้ ถ้าออกจากหน้านี้ กดใหม่จะทำต่อจากเดิม ต้องการออกจากหน้านี้หรือไม่?",
    summaryTitle: "สรุปผลการตรวจชื่อ",
    checkedOf: (checked, total) =>
      `ตรวจแล้ว ${checked.toLocaleString("th-TH")} จาก ${total.toLocaleString("th-TH")} ชื่อ`,
    results: {
      ok: "ถูกต้อง (ok)",
      synonym: "ชื่อพ้อง (synonym)",
      spelling: "อาจสะกดผิด (spelling)",
      genus_only: "ถึงระดับสกุล (genus_only)",
      not_found: "ไม่พบ (not_found)",
      error: "ตรวจไม่สำเร็จ (error)",
    },
    tableTitle: "ชื่อที่ต้องตรวจ (ไม่ใช่ ok)",
    name: "ชื่อเดิม",
    result: "ผล",
    suggested: "ชื่อที่แนะนำ / ชื่อที่ยอมรับ",
    records: "รายการ",
    downloadReport: "ดาวน์โหลดรายงานชื่อ (Excel)",
    reportDownloaded: (fileName) =>
      `ดาวน์โหลดแล้ว: ${fileName} (ดูในโฟลเดอร์ Downloads)`,
    reportFailed: "สร้างรายงานไม่สำเร็จ กรุณาลองอีกครั้ง",
    loadFailed: "ไม่สามารถอ่านชื่อจากฐานข้อมูลได้ กรุณาลองใหม่",
    previous: "ก่อนหน้า",
    next: "ถัดไป",
    page: (current, total) => `หน้า ${current} / ${total}`,
    noRows: "ไม่มีชื่อที่ต้องตรวจ",
  },

  EN: {
    title: "Check All Scientific Names",
    description:
      "Checks every distinct scientific name in the system against GBIF. Report only: nothing in the database is changed. Results are kept in this browser, so if you stop or close the page, pressing the button again continues where it left off.",
    stored: (count) =>
      count
        ? `${count.toLocaleString("en-US")} names already checked in this browser`
        : "No saved results yet",
    start: "Check All Scientific Names",
    resume: "Continue Checking",
    clear: "Clear Results and Start Over",
    clearConfirm: "Clear all saved results in this browser and start over?",
    loadingNames: "Reading names from the database...",
    running: "Checking with GBIF...",
    progress: (done, total) =>
      `${done.toLocaleString("en-US")} of ${total.toLocaleString("en-US")} names checked`,
    eta: (minutes) =>
      minutes < 1 ? "Less than 1 minute left" : `About ${minutes.toLocaleString("en-US")} min left`,
    current: "Checking",
    stop: "Stop",
    stopping: "Stopping after the names being checked...",
    stopped: "Stopped. Results so far are saved. Press “Continue Checking” to resume.",
    leaveWarning:
      "Names are being checked. Results so far are saved and will resume next time. Leave this page?",
    summaryTitle: "Name Check Summary",
    checkedOf: (checked, total) =>
      `${checked.toLocaleString("en-US")} of ${total.toLocaleString("en-US")} names checked`,
    results: {
      ok: "Correct (ok)",
      synonym: "Synonym",
      spelling: "Possible misspelling",
      genus_only: "Genus only",
      not_found: "Not found",
      error: "Check failed",
    },
    tableTitle: "Names to review (not ok)",
    name: "Original name",
    result: "Result",
    suggested: "Suggested / accepted name",
    records: "Records",
    downloadReport: "Download Name Report (Excel)",
    reportDownloaded: (fileName) =>
      `Downloaded: ${fileName} (check your Downloads folder)`,
    reportFailed: "Unable to create the report. Please try again.",
    loadFailed: "Unable to read names from the database. Please try again.",
    previous: "Previous",
    next: "Next",
    page: (current, total) => `Page ${current} / ${total}`,
    noRows: "No names to review",
  },
};

const RESULT_TONES = {
  ok: "moss",
  synonym: "ochre",
  spelling: "ochre",
  genus_only: "ochre",
  not_found: "clay",
  error: "clay",
};

function reportFileName(date = new Date()) {
  const day = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  return `name-report_${day}.xlsx`;
}

export default function NameReportPanel() {
  const { language } = useSiteSettings();

  const t = language === "EN" ? COPY.EN : COPY.TH;

  /* idle | loading | running | done */
  const [phase, setPhase] = useState("idle");

  const [storedCount, setStoredCount] = useState(0);

  const [entries, setEntries] = useState(null);

  const [results, setResults] = useState({});

  const [progress, setProgress] = useState(null);

  const [stopRequested, setStopRequested] = useState(false);

  const [stopped, setStopped] = useState(false);

  const [error, setError] = useState("");

  const [reportResult, setReportResult] = useState(null);

  const [issuePage, setIssuePage] = useState(1);

  const stopRef = useRef(false);

  const busy = phase === "loading" || phase === "running";

  useWarnBeforeLeave(busy, t.leaveWarning);

  useEffect(() => {
    /* อ่าน localStorage หลัง mount (ฝั่ง server ไม่มี window) */
    const timer = window.setTimeout(() => {
      setStoredCount(Object.keys(loadStoredResults()).length);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      stopRef.current = true;
    };
  }, []);

  async function handleStart() {
    stopRef.current = false;

    setStopRequested(false);
    setStopped(false);
    setError("");
    setReportResult(null);
    setIssuePage(1);
    setPhase("loading");

    try {
      const names = await fetchDistinctBotanicalNames();

      const stored = loadStoredResults();

      setEntries(names);
      setResults(stored);
      setPhase("running");

      const outcome = await runNameCheck({
        entries: names,
        stored,
        onProgress: setProgress,
        shouldStop: () => stopRef.current,
      });

      setResults(outcome.results);
      setStopped(outcome.stopped);
      setStoredCount(Object.keys(loadStoredResults()).length);
      setPhase("done");
    } catch (err) {
      console.error("Name report error:", err);

      setError(t.loadFailed);
      setPhase("idle");
    }
  }

  function handleStop() {
    stopRef.current = true;

    setStopRequested(true);
  }

  function handleClear() {
    if (!window.confirm(t.clearConfirm)) {
      return;
    }

    clearStoredResults();

    setStoredCount(0);
    setResults({});
    setEntries(null);
    setStopped(false);
    setReportResult(null);
    setPhase("idle");
  }

  async function handleDownloadReport() {
    if (!entries) {
      return;
    }

    const name = reportFileName();

    try {
      const XLSX = await loadSheetJs();

      const bytes = writeWorkbookWithFrozenHeader(
        XLSX,
        buildNameReportWorkbook(XLSX, entries, results),
      );

      downloadBlob(new Blob([bytes], { type: XLSX_MIME_TYPE }), name);

      setReportResult({ status: "done", fileName: name });
    } catch (err) {
      console.error("Create name report error:", err);

      setReportResult({ status: "failed", fileName: name });
    }
  }

  const summary =
    phase === "done" && entries ? summarizeNameResults(entries, results) : null;

  const issues =
    phase === "done" && entries
      ? entries
          .filter((entry) => results[entry.name] && results[entry.name].result !== "ok")
          .map((entry) => ({ ...entry, ...results[entry.name] }))
      : [];

  return (
    <section data-testid="name-report-panel" className="vh-panel p-4 sm:p-6">
      <h2 className="font-serif text-[1.35rem] leading-tight text-ink">{t.title}</h2>

      <p className="mt-1.5 max-w-3xl text-[14px] leading-6 text-muted">
        {t.description}
      </p>

      {!busy && (
        <p
          data-testid="name-report-stored"
          className="mt-4 font-mono text-[13px] tabular-nums text-ink-soft"
        >
          {t.stored(storedCount)}
        </p>
      )}

      {error && (
        <div className="mt-4">
          <AlertBox type="error">{error}</AlertBox>
        </div>
      )}

      {phase === "loading" && (
        <p className="mt-5 flex items-center gap-2 text-[14px] text-muted">
          <LoadingIcon className="h-4 w-4 animate-spin" />
          {t.loadingNames}
        </p>
      )}

      {phase === "running" && progress && (
        <div data-testid="name-report-progress">
          <ProgressBar
            label={stopRequested ? t.stopping : t.running}
            detail={t.progress(progress.done, progress.total)}
            done={progress.done}
            total={progress.total}
          />

          <p className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[13px] text-muted">
            <span className="min-w-0 truncate italic">
              {progress.current.length > 0 &&
                `${t.current}: ${progress.current.join(" • ")}`}
            </span>

            {progress.etaMs !== null && (
              <span className="font-mono not-italic tabular-nums">
                {t.eta(Math.round(progress.etaMs / 60000))}
              </span>
            )}
          </p>

          <div className="mt-4">
            <button
              type="button"
              data-name-report-stop
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

      {!busy && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            data-name-report-start
            onClick={handleStart}
            className="vh-btn vh-btn-primary w-full sm:w-auto"
          >
            <RefreshIcon className="h-4 w-4" />
            {storedCount > 0 ? t.resume : t.start}
          </button>

          {storedCount > 0 && (
            <button
              type="button"
              data-name-report-clear
              onClick={handleClear}
              className="vh-btn vh-btn-outline w-full sm:w-auto"
            >
              {t.clear}
            </button>
          )}
        </div>
      )}

      {summary && (
        <div data-testid="name-report-summary" className="mt-6">
          <h3 className="font-serif text-[1.15rem] leading-tight text-ink">
            {t.summaryTitle}
          </h3>

          <p className="mt-1 text-[13px] text-muted">
            {t.checkedOf(summary.checked, summary.total)}
          </p>

          {stopped && (
            <div className="mt-4">
              <AlertBox type="error">{t.stopped}</AlertBox>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {NAME_RESULTS.map((key) => (
              <StatCard
                key={key}
                id={`name-${key}`}
                label={t.results[key]}
                value={summary[key]}
                tone={summary[key] ? RESULT_TONES[key] : null}
              />
            ))}
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
                  testId="name-report-table"
                  rowKey={(row) => row.name}
                  columns={[
                    {
                      key: "name",
                      label: t.name,
                      render: (row) => <span className="italic">{row.name}</span>,
                    },
                    {
                      key: "result",
                      label: t.result,
                      render: (row) => t.results[row.result],
                    },
                    {
                      key: "suggested",
                      label: t.suggested,
                      render: (row) =>
                        row.suggested ? (
                          <span className="italic">{row.suggested}</span>
                        ) : (
                          "—"
                        ),
                    },
                    {
                      key: "count",
                      label: t.records,
                      mono: true,
                      render: (row) => formatNumber(row.count),
                    },
                  ]}
                />
              </div>
            </>
          )}

          <div className="mt-6">
            <button
              type="button"
              data-name-report-download
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
              data-name-report-result="done"
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
