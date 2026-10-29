"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import {
  IMPORT_BATCH_SIZE,
  IMPORT_FIELDS,
  IMPORT_FILE_ACCEPT,
  MAX_IMPORT_ROWS,
  REQUIRED_IMPORT_FIELDS,
  autoMapColumns,
  chunkArray,
  downloadCsv,
  downloadImportTemplate,
  findExistingPnuNumbers,
  readImportFile,
  validateImportRows,
} from "@/lib/plantImport";

const PREVIEW_PAGE_SIZE = 50;

/* =========================================================
   COPY
========================================================= */

const COPY = {
  TH: {
    eyebrow: "นำเข้าข้อมูล",
    title: "นำเข้าข้อมูลพรรณไม้",
    subtitle:
      "นำเข้าข้อมูลพรรณไม้จำนวนมากจากไฟล์ Excel (.xlsx) หรือ CSV ระบบจะตรวจทุกแถวก่อนบันทึก และบันทึกเฉพาะแถวที่ถูกต้อง",
    back: "กลับคลังพรรณไม้",
    loading: "กำลังตรวจสอบสิทธิ์...",
    loginRequired: "สำหรับผู้ดูแลระบบเท่านั้น",
    loginDescription: "เข้าสู่ระบบด้วยบัญชี Admin เพื่อนำเข้าข้อมูลพรรณไม้",
    denied: "บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ",
    login: "เข้าสู่ระบบ Admin",

    stepFile: "เลือกไฟล์",
    stepFileDesc: `รองรับ .xlsx และ .csv (UTF-8) ไม่เกิน 10 MB และไม่เกิน ${MAX_IMPORT_ROWS.toLocaleString("th-TH")} แถวต่อไฟล์`,
    downloadTemplate: "ดาวน์โหลดเทมเพลต .xlsx",
    chooseFile: "เลือกไฟล์ข้อมูล",
    chooseFileHint: "แตะเพื่อเลือกไฟล์ .xlsx หรือ .csv",
    reading: "กำลังอ่านไฟล์...",
    fileSummary: (name, rows) =>
      `${name} • ${rows.toLocaleString("th-TH")} แถว`,

    stepMapping: "จับคู่คอลัมน์",
    stepMappingDesc:
      "หัวคอลัมน์ที่ตรงกับชื่อฟิลด์จะถูกจับคู่อัตโนมัติ หากไม่ตรงให้เลือกคอลัมน์เอง",
    notImported: "— ไม่นำเข้า —",
    columnLabel: (index, name) => `คอลัมน์ ${index + 1}${name ? `: ${name}` : ""}`,
    required: "จำเป็น",
    mapRequired: "กรุณาจับคู่คอลัมน์ pnu_no และ botanical_name ก่อนตรวจสอบ",
    validate: "ตรวจสอบข้อมูล",
    validating: "กำลังตรวจสอบข้อมูล...",

    stepPreview: "ตรวจสอบก่อนนำเข้า",
    summary: (ready, invalid) =>
      `พร้อมนำเข้า ${ready.toLocaleString("th-TH")} แถว / มีปัญหา ${invalid.toLocaleString("th-TH")} แถว`,
    filterAll: "ทุกแถว",
    filterInvalid: "เฉพาะแถวที่มีปัญหา",
    row: "แถว",
    status: "สถานะ",
    statusReady: "พร้อมนำเข้า",
    noRows: "ไม่มีแถวที่ตรงกับตัวกรอง",
    page: (current, total) => `หน้า ${current} / ${total}`,
    previous: "ก่อนหน้า",
    next: "ถัดไป",
    import: (count) => `นำเข้า ${count.toLocaleString("th-TH")} แถว`,
    nothingToImport: "ไม่มีแถวที่พร้อมนำเข้า",
    importing: "กำลังนำเข้าข้อมูล...",
    progress: (done, total) =>
      `${done.toLocaleString("th-TH")} / ${total.toLocaleString("th-TH")} แถว`,

    stepResult: "ผลการนำเข้า",
    resultSummary: (success, failed) =>
      `นำเข้าสำเร็จ ${success.toLocaleString("th-TH")} แถว / ไม่สำเร็จ ${failed.toLocaleString("th-TH")} แถว`,
    failedRows: "แถวที่ไม่สำเร็จ",
    downloadFailed: "ดาวน์โหลดรายงานแถวที่ไม่สำเร็จ (CSV)",
    goToList: "ไปหน้ารายการพรรณไม้",
    startOver: "นำเข้าไฟล์ใหม่",
    reason: "เหตุผล",

    errors: {
      NO_FILE: "กรุณาเลือกไฟล์",
      INVALID_FILE_TYPE: "รองรับเฉพาะไฟล์ .xlsx และ .csv",
      FILE_TOO_LARGE: "ไฟล์ต้องมีขนาดไม่เกิน 10 MB",
      TOO_MANY_ROWS: `ไฟล์ต้องมีข้อมูลไม่เกิน ${MAX_IMPORT_ROWS.toLocaleString("th-TH")} แถว`,
      EMPTY_FILE: "ไม่พบข้อมูลในไฟล์ (แถวแรกต้องเป็นหัวคอลัมน์)",
      READ_FAILED: "ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์",
      validateFailed: "ไม่สามารถตรวจสอบข้อมูลกับฐานข้อมูลได้",
      denied: "บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ",

      pnuRequired: "ไม่มีหมายเลข PNU",
      pnuInvalid: "หมายเลข PNU ต้องเป็นจำนวนเต็มบวก",
      botanicalRequired: "ไม่มีชื่อวิทยาศาสตร์",
      latitudeInvalid: "ละติจูดต้องเป็นตัวเลขระหว่าง −90 ถึง 90",
      longitudeInvalid: "ลองจิจูดต้องเป็นตัวเลขระหว่าง −180 ถึง 180",
      imageUrlInvalid: "image_url ต้องขึ้นต้นด้วย https://",
      pnuDuplicateInFile: "หมายเลข PNU ซ้ำกันในไฟล์",
      pnuExists: "หมายเลข PNU นี้มีอยู่ในระบบแล้ว",
      pnuDuplicate: "หมายเลข PNU นี้มีอยู่ในระบบแล้ว",
      insertFailed: "บันทึกไม่สำเร็จ",
    },
  },

  EN: {
    eyebrow: "DATA IMPORT",
    title: "Import Plant Records",
    subtitle:
      "Import many plant records from an Excel (.xlsx) or CSV file. Every row is checked before saving, and only valid rows are imported.",
    back: "Back to Collection",
    loading: "Checking access...",
    loginRequired: "Administrator access only",
    loginDescription: "Sign in with an Admin account to import plant records.",
    denied: "This account does not have administrator access.",
    login: "Admin Login",

    stepFile: "Choose File",
    stepFileDesc: `Supports .xlsx and .csv (UTF-8), up to 10 MB and ${MAX_IMPORT_ROWS.toLocaleString("en-US")} rows per file.`,
    downloadTemplate: "Download .xlsx Template",
    chooseFile: "Choose Data File",
    chooseFileHint: "Tap to choose a .xlsx or .csv file",
    reading: "Reading file...",
    fileSummary: (name, rows) =>
      `${name} • ${rows.toLocaleString("en-US")} rows`,

    stepMapping: "Map Columns",
    stepMappingDesc:
      "Columns whose header matches a field name are mapped automatically. Choose the column yourself when it does not match.",
    notImported: "— Not imported —",
    columnLabel: (index, name) => `Column ${index + 1}${name ? `: ${name}` : ""}`,
    required: "Required",
    mapRequired: "Please map the pnu_no and botanical_name columns before checking.",
    validate: "Check Data",
    validating: "Checking data...",

    stepPreview: "Review Before Import",
    summary: (ready, invalid) =>
      `Ready to import ${ready.toLocaleString("en-US")} rows / ${invalid.toLocaleString("en-US")} rows with problems`,
    filterAll: "All rows",
    filterInvalid: "Rows with problems",
    row: "Row",
    status: "Status",
    statusReady: "Ready",
    noRows: "No rows match this filter",
    page: (current, total) => `Page ${current} / ${total}`,
    previous: "Previous",
    next: "Next",
    import: (count) => `Import ${count.toLocaleString("en-US")} rows`,
    nothingToImport: "No rows are ready to import",
    importing: "Importing data...",
    progress: (done, total) =>
      `${done.toLocaleString("en-US")} / ${total.toLocaleString("en-US")} rows`,

    stepResult: "Import Result",
    resultSummary: (success, failed) =>
      `Imported ${success.toLocaleString("en-US")} rows / ${failed.toLocaleString("en-US")} rows failed`,
    failedRows: "Failed Rows",
    downloadFailed: "Download failed rows report (CSV)",
    goToList: "Go to Plant List",
    startOver: "Import Another File",
    reason: "Reason",

    errors: {
      NO_FILE: "Please choose a file",
      INVALID_FILE_TYPE: "Only .xlsx and .csv files are supported",
      FILE_TOO_LARGE: "The file must be 10 MB or smaller",
      TOO_MANY_ROWS: `The file must contain no more than ${MAX_IMPORT_ROWS.toLocaleString("en-US")} rows`,
      EMPTY_FILE: "No data found in the file (the first row must be the header)",
      READ_FAILED: "Unable to read the file. Please check the file format.",
      validateFailed: "Unable to check the data against the database",
      denied: "This account does not have administrator access.",

      pnuRequired: "Missing PNU No.",
      pnuInvalid: "PNU No. must be a positive whole number",
      botanicalRequired: "Missing botanical name",
      latitudeInvalid: "Latitude must be a number between −90 and 90",
      longitudeInvalid: "Longitude must be a number between −180 and 180",
      imageUrlInvalid: "image_url must start with https://",
      pnuDuplicateInFile: "PNU No. is duplicated within the file",
      pnuExists: "This PNU No. already exists in the system.",
      pnuDuplicate: "This PNU No. already exists in the system.",
      insertFailed: "Unable to save",
    },
  },
};

/* =========================================================
   PAGE
========================================================= */

export default function ImportPlantsPage() {
  const { language } = useSiteSettings();

  const isEnglish = language === "EN";

  const t = isEnglish ? COPY.EN : COPY.TH;

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [accessDenied, setAccessDenied] = useState(false);

  /* =====================================================
     ADMIN AUTH CHECK
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);

      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (userError || !currentUser) {
          setUser(null);
          return;
        }

        if (currentUser.app_metadata?.role !== "admin") {
          setUser(null);
          setAccessDenied(true);
          return;
        }

        setUser(currentUser);
      } catch (err) {
        console.error("Load import page error:", err);

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="page min-h-screen overflow-x-hidden text-ink">
        <Navbar />

        <section className="flex min-h-[65dvh] items-center justify-center px-5">
          <div className="text-center">
            <LoadingIcon className="mx-auto h-6 w-6 animate-spin text-moss" />

            <p className="mt-4 font-serif text-[15px] italic text-muted">
              {t.loading}
            </p>
          </div>
        </section>
      </main>
    );
  }

  /* =====================================================
     NOT LOGGED IN / NOT ADMIN
  ===================================================== */

  if (!user) {
    return (
      <main className="page min-h-screen overflow-x-hidden text-ink">
        <Navbar />

        <section className="vh-grid-paper flex min-h-[calc(100dvh-58px)] items-center justify-center px-4 py-10 md:min-h-[calc(100dvh-78px)]">
          <div className="vh-sheet page-enter w-full max-w-md p-6 sm:p-8">
            <p className="vh-eyebrow flex items-center gap-3">
              <span className="h-px w-6 bg-ochre" />
              {t.eyebrow}
            </p>

            <div className="mt-5 flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-rule bg-moss-soft text-moss">
                <UploadIcon className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <h1 className="vh-display text-[1.8rem]">{t.loginRequired}</h1>

                <p className="mt-2 text-[14px] leading-6 text-muted">
                  {accessDenied ? t.denied : t.loginDescription}
                </p>
              </div>
            </div>

            <div className="vh-rule-double mt-6" />

            <div className="mt-6">
              <Link href="/login" className="vh-btn vh-btn-primary w-full">
                {t.login}
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
    <main className="page min-h-screen overflow-x-hidden text-ink">
      <Navbar />

      <div className="vh-container page-enter pb-[calc(106px+env(safe-area-inset-bottom))] pt-6 sm:pb-16 md:pt-10">
        <Link
          href="/account/plants"
          className="vh-btn vh-btn-ghost vh-btn-sm -ml-3"
        >
          <ArrowLeftIcon className="h-4 w-4" />

          {t.back}
        </Link>

        <header className="mt-2 border-b border-rule-strong pb-7 md:mt-5">
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
        </header>

        <DataImportSection t={t} user={user} />
      </div>
    </main>
  );
}

/* =========================================================
   DATA IMPORT (EXCEL / CSV)
========================================================= */

function DataImportSection({ t, user }) {
  const [fileName, setFileName] = useState("");

  const [headers, setHeaders] = useState([]);

  const [rows, setRows] = useState([]);

  const [mapping, setMapping] = useState({});

  const [reading, setReading] = useState(false);

  const [templateBusy, setTemplateBusy] = useState(false);

  const [error, setError] = useState("");

  /* ผลการตรวจ: null = ยังไม่ได้ตรวจ */
  const [checkedRows, setCheckedRows] = useState(null);

  const [validating, setValidating] = useState(false);

  const [filter, setFilter] = useState("all");

  const [previewPage, setPreviewPage] = useState(1);

  const [importing, setImporting] = useState(false);

  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const [result, setResult] = useState(null);

  const [inputKey, setInputKey] = useState(0);

  /* กันการปิดหน้าระหว่างนำเข้า */
  useEffect(() => {
    if (!importing) {
      return;
    }

    function handleBeforeUnload(event) {
      event.preventDefault();

      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [importing]);

  const readyRows = useMemo(
    () => (checkedRows || []).filter((row) => row.errors.length === 0),
    [checkedRows],
  );

  const invalidCount = checkedRows ? checkedRows.length - readyRows.length : 0;

  const visibleRows = useMemo(() => {
    const list = checkedRows || [];

    return filter === "invalid"
      ? list.filter((row) => row.errors.length > 0)
      : list;
  }, [checkedRows, filter]);

  const totalPreviewPages = Math.max(
    1,
    Math.ceil(visibleRows.length / PREVIEW_PAGE_SIZE),
  );

  const currentPreviewPage = Math.min(previewPage, totalPreviewPages);

  const pageRows = visibleRows.slice(
    (currentPreviewPage - 1) * PREVIEW_PAGE_SIZE,
    currentPreviewPage * PREVIEW_PAGE_SIZE,
  );

  const columnOptions = headers.map((_, index) => String(index));

  const columnLabels = Object.fromEntries(
    headers.map((name, index) => [String(index), t.columnLabel(index, name)]),
  );

  function errorText(code) {
    return t.errors[code] || code;
  }

  /* =====================================================
     TEMPLATE
  ===================================================== */

  async function handleDownloadTemplate() {
    setTemplateBusy(true);

    try {
      await downloadImportTemplate();
    } catch (err) {
      console.error("Download template error:", err);

      setError(t.errors.READ_FAILED);
    } finally {
      setTemplateBusy(false);
    }
  }

  /* =====================================================
     FILE
  ===================================================== */

  function resetAll() {
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setError("");
    setCheckedRows(null);
    setFilter("all");
    setPreviewPage(1);
    setProgress({ done: 0, total: 0 });
    setResult(null);
    setInputKey((key) => key + 1);
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    resetAll();

    setReading(true);

    try {
      const table = await readImportFile(file);

      setFileName(file.name);
      setHeaders(table.headers);
      setRows(table.rows);
      setMapping(autoMapColumns(table.headers));
    } catch (err) {
      console.error("Read import file error:", err);

      setError(errorText(err?.code || "READ_FAILED"));
    } finally {
      setReading(false);
    }
  }

  function handleMappingChange(field, value) {
    setMapping((previous) => ({ ...previous, [field]: value }));

    /* เปลี่ยนการจับคู่แล้วต้องตรวจใหม่ */
    setCheckedRows(null);
    setError("");
  }

  /* =====================================================
     VALIDATE
  ===================================================== */

  async function handleValidate() {
    if (REQUIRED_IMPORT_FIELDS.some((field) => !mapping[field])) {
      setError(t.mapRequired);
      return;
    }

    setError("");
    setValidating(true);

    try {
      const checked = validateImportRows(rows, mapping);

      const existing = await findExistingPnuNumbers(
        checked.map((row) => row.record.pnu_no),
      );

      checked.forEach((row) => {
        if (existing.has(row.record.pnu_no)) {
          row.errors.push("pnuExists");
        }
      });

      setCheckedRows(checked);
      setFilter("all");
      setPreviewPage(1);
    } catch (err) {
      console.error("Validate import error:", err);

      setError(t.errors.validateFailed);
    } finally {
      setValidating(false);
    }
  }

  /* =====================================================
     IMPORT
  ===================================================== */

  async function handleImport() {
    if (importing || readyRows.length === 0) {
      return;
    }

    setError("");

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (
      authError ||
      authData?.user?.id !== user.id ||
      authData.user.app_metadata?.role !== "admin"
    ) {
      setError(t.errors.denied);
      return;
    }

    setImporting(true);
    setProgress({ done: 0, total: readyRows.length });

    let successCount = 0;

    const failed = [];

    for (const batch of chunkArray(readyRows, IMPORT_BATCH_SIZE)) {
      /* ไม่ส่ง plant_id และ search_text (ฐานข้อมูลสร้างเอง) */
      const payload = batch.map((row) => ({
        id: crypto.randomUUID(),
        user_id: user.id,
        ...row.record,
      }));

      try {
        const { error: insertError } = await supabase
          .from("plants")
          .insert(payload);

        if (insertError) {
          throw insertError;
        }

        successCount += batch.length;
      } catch (err) {
        console.error("Import batch error:", err);

        const code = err?.code === "23505" ? "pnuDuplicate" : null;

        batch.forEach((row) =>
          failed.push({
            rowNumber: row.rowNumber,
            values: row.values,
            code,
            message: err?.message || "",
          }),
        );
      }

      setProgress((previous) => ({
        ...previous,
        done: previous.done + batch.length,
      }));
    }

    setResult({ success: successCount, failed });
    setImporting(false);
  }

  function failedReason(row) {
    return row.code
      ? errorText(row.code)
      : `${t.errors.insertFailed}${row.message ? `: ${row.message}` : ""}`;
  }

  function handleDownloadFailed() {
    if (!result?.failed.length) {
      return;
    }

    downloadCsv(
      "plant-import-failed-rows.csv",
      ["row", ...IMPORT_FIELDS, "error"],
      result.failed.map((row) => [
        row.rowNumber,
        ...IMPORT_FIELDS.map((field) => row.values[field]),
        failedReason(row),
      ]),
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  const busy = reading || validating || importing;

  return (
    <div className="mt-7 space-y-6">
      {/* 01 FILE */}

      <StepPanel number="01" title={t.stepFile} description={t.stepFileDesc}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={templateBusy}
            className="vh-btn vh-btn-outline w-full sm:w-auto"
          >
            {templateBusy ? (
              <LoadingIcon className="h-4 w-4 animate-spin" />
            ) : (
              <DownloadIcon className="h-4 w-4" />
            )}

            {t.downloadTemplate}
          </button>
        </div>

        <label
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed border-rule-strong bg-sheet px-4 py-8 text-center transition hover:border-moss hover:bg-moss-soft ${
            busy ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <input
            key={inputKey}
            type="file"
            accept={IMPORT_FILE_ACCEPT}
            onChange={handleFileChange}
            disabled={busy}
            className="sr-only"
          />

          {reading ? (
            <LoadingIcon className="h-6 w-6 animate-spin text-moss" />
          ) : (
            <UploadIcon className="h-6 w-6 text-moss" />
          )}

          <span className="text-[15px] font-medium text-ink">
            {reading ? t.reading : t.chooseFile}
          </span>

          <span className="text-[13px] text-muted">
            {fileName ? t.fileSummary(fileName, rows.length) : t.chooseFileHint}
          </span>
        </label>
      </StepPanel>

      {/* 02 MAPPING */}

      {headers.length > 0 && !result && (
        <StepPanel
          number="02"
          title={t.stepMapping}
          description={t.stepMappingDesc}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {IMPORT_FIELDS.map((field) => (
              <SelectField
                key={field}
                label={
                  REQUIRED_IMPORT_FIELDS.includes(field)
                    ? `${field} · ${t.required}`
                    : field
                }
                value={mapping[field] || ""}
                onChange={(value) => handleMappingChange(field, value)}
                options={columnOptions}
                labels={columnLabels}
                placeholder={t.notImported}
                disabled={busy}
              />
            ))}
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={handleValidate}
              disabled={busy}
              className="vh-btn vh-btn-primary w-full sm:w-auto"
            >
              {validating && <LoadingIcon className="h-4 w-4 animate-spin" />}

              {validating ? t.validating : t.validate}
            </button>
          </div>
        </StepPanel>
      )}

      {error && <AlertBox type="error">{error}</AlertBox>}

      {/* 03 PREVIEW */}

      {checkedRows && !result && (
        <StepPanel number="03" title={t.stepPreview}>
          <p
            className={`font-mono text-[13px] tabular-nums ${
              invalidCount ? "text-clay" : "text-moss"
            }`}
          >
            {t.summary(readyRows.length, invalidCount)}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ["all", t.filterAll],
              ["invalid", t.filterInvalid],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setFilter(value);
                  setPreviewPage(1);
                }}
                aria-pressed={filter === value}
                className={`vh-btn vh-btn-sm ${
                  filter === value ? "vh-btn-primary" : "vh-btn-outline"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto rounded-[6px] border border-rule">
            <table className="vh-table min-w-[960px]">
              <thead>
                <tr>
                  <th>{t.row}</th>
                  <th>{t.status}</th>
                  {IMPORT_FIELDS.map((field) => (
                    <th key={field}>{field}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pageRows.map((row) => {
                  const invalid = row.errors.length > 0;

                  return (
                    <tr
                      key={row.rowNumber}
                      className={invalid ? "bg-clay-soft" : ""}
                    >
                      <td className="font-mono tabular-nums">
                        {row.rowNumber}
                      </td>

                      <td className="min-w-[220px]">
                        {invalid ? (
                          <ul className="space-y-0.5 text-[13px] leading-5 text-clay">
                            {row.errors.map((code) => (
                              <li key={code}>• {errorText(code)}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-[13px] text-moss">
                            {t.statusReady}
                          </span>
                        )}
                      </td>

                      {IMPORT_FIELDS.map((field) => (
                        <td
                          key={field}
                          className="max-w-[220px] truncate text-[13px]"
                          title={row.values[field] ?? ""}
                        >
                          {row.values[field] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {pageRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={IMPORT_FIELDS.length + 2}
                      className="py-8 text-center text-muted"
                    >
                      {t.noRows}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPreviewPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPreviewPage(Math.max(1, currentPreviewPage - 1))}
                disabled={currentPreviewPage <= 1}
                className="vh-btn vh-btn-outline vh-btn-sm"
              >
                {t.previous}
              </button>

              <span className="font-mono text-[12px] tabular-nums text-muted">
                {t.page(currentPreviewPage, totalPreviewPages)}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPreviewPage(Math.min(totalPreviewPages, currentPreviewPage + 1))
                }
                disabled={currentPreviewPage >= totalPreviewPages}
                className="vh-btn vh-btn-outline vh-btn-sm"
              >
                {t.next}
              </button>
            </div>
          )}

          <div className="vh-rule mt-6" />

          {importing && (
            <ProgressBar
              label={t.importing}
              detail={t.progress(progress.done, progress.total)}
              done={progress.done}
              total={progress.total}
            />
          )}

          <div className="mt-5">
            <button
              type="button"
              onClick={handleImport}
              disabled={busy || readyRows.length === 0}
              className="vh-btn vh-btn-primary w-full sm:w-auto"
            >
              {importing ? (
                <LoadingIcon className="h-4 w-4 animate-spin" />
              ) : (
                <UploadIcon className="h-4 w-4" />
              )}

              {readyRows.length === 0
                ? t.nothingToImport
                : t.import(readyRows.length)}
            </button>
          </div>
        </StepPanel>
      )}

      {/* 04 RESULT */}

      {result && (
        <StepPanel number="04" title={t.stepResult}>
          <AlertBox type={result.failed.length ? "error" : "success"}>
            {t.resultSummary(result.success, result.failed.length)}
          </AlertBox>

          {result.failed.length > 0 && (
            <>
              <h3 className="vh-eyebrow mt-6">{t.failedRows}</h3>

              <div className="mt-3 max-h-[420px] overflow-auto rounded-[6px] border border-rule">
                <table className="vh-table min-w-[640px]">
                  <thead>
                    <tr>
                      <th>{t.row}</th>
                      <th>pnu_no</th>
                      <th>botanical_name</th>
                      <th>{t.reason}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.failed.map((row) => (
                      <tr key={row.rowNumber} className="bg-clay-soft">
                        <td className="font-mono tabular-nums">
                          {row.rowNumber}
                        </td>
                        <td className="font-mono">{row.values.pnu_no}</td>
                        <td className="text-[13px]">
                          {row.values.botanical_name}
                        </td>
                        <td className="text-[13px] text-clay">
                          {failedReason(row)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleDownloadFailed}
                className="vh-btn vh-btn-outline mt-4 w-full sm:w-auto"
              >
                <DownloadIcon className="h-4 w-4" />
                {t.downloadFailed}
              </button>
            </>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/account/plants"
              className="vh-btn vh-btn-primary w-full sm:w-auto"
            >
              {t.goToList}
            </Link>

            <button
              type="button"
              onClick={resetAll}
              className="vh-btn vh-btn-outline w-full sm:w-auto"
            >
              {t.startOver}
            </button>
          </div>
        </StepPanel>
      )}
    </div>
  );
}

/* =========================================================
   SHARED UI
========================================================= */

function StepPanel({ number, title, description, children }) {
  return (
    <section className="vh-panel p-4 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="font-mono text-[12px] tabular-nums text-ochre">
          {number}
        </span>

        <div className="min-w-0">
          <h2 className="font-serif text-[1.35rem] leading-tight text-ink">
            {title}
          </h2>

          {description && (
            <p className="mt-1.5 text-[14px] leading-6 text-muted">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function ProgressBar({ label, detail, done, total }) {
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="text-ink-soft">{label}</span>

        <span className="font-mono tabular-nums text-muted">{detail}</span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-2 h-2 overflow-hidden rounded-full bg-paper-deep"
      >
        <div
          className="h-full rounded-full bg-moss transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  labels = {},
  disabled = false,
}) {
  return (
    <label className="block min-w-0">
      <span className="vh-eyebrow mb-1.5 block !text-[10px]">{label}</span>

      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="vh-input appearance-none truncate pr-9 text-[14px]"
        >
          {placeholder && <option value="">{placeholder}</option>}

          {options.map((option) => (
            <option key={option} value={option}>
              {labels[option] || option}
            </option>
          ))}
        </select>

        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      </span>
    </label>
  );
}

function AlertBox({ type, children }) {
  const isSuccess = type === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-[6px] border px-4 py-3.5 text-[14px] leading-6 ${
        isSuccess
          ? "border-moss/30 bg-moss-soft text-moss"
          : "border-clay/40 bg-clay-soft text-clay"
      }`}
    >
      {isSuccess ? (
        <CheckIcon className="mt-1 h-4 w-4 shrink-0" />
      ) : (
        <AlertIcon className="mt-1 h-4 w-4 shrink-0" />
      )}

      <span>{children}</span>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function SvgIcon({ className = "", children }) {
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
      {children}
    </svg>
  );
}

function ArrowLeftIcon({ className = "" }) {
  return (
    <SvgIcon className={className}>
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h10" />
    </SvgIcon>
  );
}

function ChevronDownIcon({ className = "" }) {
  return (
    <SvgIcon className={className}>
      <path d="m6 9 6 6 6-6" />
    </SvgIcon>
  );
}

function UploadIcon({ className = "" }) {
  return (
    <SvgIcon className={className}>
      <path d="M12 15V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </SvgIcon>
  );
}

function DownloadIcon({ className = "" }) {
  return (
    <SvgIcon className={className}>
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </SvgIcon>
  );
}

function CheckIcon({ className = "" }) {
  return (
    <SvgIcon className={className}>
      <path d="m5 12 4.5 4.5L19 7" />
    </SvgIcon>
  );
}

function AlertIcon({ className = "" }) {
  return (
    <SvgIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16.5h.01" />
    </SvgIcon>
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
