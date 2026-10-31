"use client";

/* =========================================================
   BULK DELETE DIALOG (หน้า /account/plants)
   ยืนยันและลบพรรณไม้ที่เลือกไว้ทีละหลายรายการ
   - โหลดทุกคอลัมน์ของรายการที่เลือก → แสดงจำนวน ตัวอย่าง PNU และจำนวนรูปที่จะถูกลบ
   - ดาวน์โหลดไฟล์สำรอง (Excel) ก่อนลบได้
   - เกิน 20 รายการต้องพิมพ์จำนวนให้ตรงก่อนกด "ลบถาวร"
   - ลบทีละชุด 100 รายการ มีแถบความคืบหน้าและปุ่มหยุด (หยุดหลังชุดปัจจุบัน)
   - render ที่ body (createPortal) แบบกล่องยืนยันหน้านำเข้า
========================================================= */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useSiteSettings } from "@/components/SiteSettingsContext";
import {
  AlertBox,
  CheckIcon,
  DownloadIcon,
  LoadingIcon,
  ProgressBar,
  StatCard,
  StopIcon,
} from "@/components/ImportUi";
import {
  DELETE_BATCH_SIZE,
  TYPED_CONFIRM_THRESHOLD,
  buildDeleteBackupWorkbook,
  countPlantsWithStoredImage,
  deletePlantsInBatches,
  fetchPlantsForDelete,
  getDeleteBackupFileName,
} from "@/lib/bulkDelete";
import { downloadBlob, loadSheetJs } from "@/lib/plantImport";
import {
  XLSX_MIME_TYPE,
  writeWorkbookWithFrozenHeader,
} from "@/lib/plantImportReport";
import { useWarnBeforeLeave } from "@/lib/useWarnBeforeLeave";

/* ตัวอย่าง PNU ที่แสดงในกล่องยืนยัน */
const SAMPLE_PNU_COUNT = 10;

const COPY = {
  TH: {
    eyebrow: "ลบหลายรายการ",
    loading: "กำลังโหลดรายการที่เลือก...",
    loadFailed: "โหลดรายการที่เลือกไม่สำเร็จ กรุณาลองใหม่",
    nothingFound: "ไม่พบรายการที่เลือกในระบบ (อาจถูกลบไปแล้ว)",
    title: (count) => `ลบ ${count.toLocaleString("th-TH")} รายการ`,
    missing: (count) =>
      `ไม่พบในระบบ ${count.toLocaleString("th-TH")} รายการที่เลือกไว้ (อาจถูกลบไปแล้ว)`,
    samplePnu: "PNU",
    andMore: (count) => `และอีก ${count.toLocaleString("th-TH")} รายการ`,
    noPnu: "ไม่มี PNU",
    images: (count) =>
      count > 0
        ? `รูปใน Storage ${count.toLocaleString("th-TH")} รูปจะถูกลบด้วย`
        : "รายการที่เลือกไม่มีรูปใน Storage",
    batches: (batches) =>
      `ลบทีละ ${DELETE_BATCH_SIZE} รายการ (${batches.toLocaleString("th-TH")} ชุด)`,
    irreversible: "การลบย้อนกลับไม่ได้",
    backupHint: "แนะนำให้ดาวน์โหลดรายการเก็บไว้ก่อน ไฟล์นี้อัปกลับเข้าหน้านำเข้าได้",
    downloadBackup: "ดาวน์โหลดรายการก่อนลบ (Excel)",
    creatingBackup: "กำลังสร้างไฟล์...",
    backupDone: (fileName) => `ดาวน์โหลดแล้ว: ${fileName}`,
    backupFailed: "สร้างไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง",
    typeLabel: (count) =>
      `พิมพ์ ${count.toLocaleString("th-TH")} เพื่อยืนยันการลบ`,
    cancel: "ยกเลิก",
    confirm: "ลบถาวร",
    running: "กำลังลบ...",
    progress: (batch, total, deleted) =>
      `ชุด ${batch.toLocaleString("th-TH")} จาก ${total.toLocaleString("th-TH")} • ลบแล้ว ${deleted.toLocaleString("th-TH")} รายการ`,
    stop: "หยุด",
    stopping: "จะหยุดหลังชุดนี้เสร็จ...",
    leaveWarning:
      "กำลังลบข้อมูลอยู่ ถ้าออกจากหน้านี้การลบจะหยุดกลางคัน ต้องการออกจากหน้านี้หรือไม่?",
    doneTitle: "สรุปการลบ",
    deleted: "ลบสำเร็จ",
    failed: "ล้มเหลว",
    imagesDeleted: "รูปที่ลบ",
    imageErrors: "รูปที่ลบไม่สำเร็จ",
    stopped: (count) =>
      `หยุดแล้ว ยังไม่ได้ลบ ${count.toLocaleString("th-TH")} รายการ (ยังอยู่ในรายการที่เลือก)`,
    failedBatch: (batch, count, message) =>
      `ชุดที่ ${batch}: ${count.toLocaleString("th-TH")} รายการ — ${message}`,
    imageErrorBatch: (batch, count, message) =>
      `รูปของชุดที่ ${batch}: ${count.toLocaleString("th-TH")} รูป — ${message}`,
    failedHint: "รายการที่ลบไม่สำเร็จยังอยู่ในรายการที่เลือก กดลบอีกครั้งได้",
    imageErrorHint: "ข้อมูลถูกลบแล้ว แต่ไฟล์รูปบางส่วนยังอยู่ใน Storage",
    close: "ปิด",
  },

  EN: {
    eyebrow: "Delete multiple",
    loading: "Loading selected records...",
    loadFailed: "Unable to load the selected records. Please try again.",
    nothingFound: "None of the selected records exist (they may already be deleted).",
    title: (count) => `Delete ${count.toLocaleString("en-US")} records`,
    missing: (count) =>
      `${count.toLocaleString("en-US")} selected records were not found (they may already be deleted)`,
    samplePnu: "PNU",
    andMore: (count) => `and ${count.toLocaleString("en-US")} more`,
    noPnu: "No PNU",
    images: (count) =>
      count > 0
        ? `${count.toLocaleString("en-US")} images in Storage will also be deleted`
        : "The selected records have no images in Storage",
    batches: (batches) =>
      `Deleted ${DELETE_BATCH_SIZE} at a time (${batches.toLocaleString("en-US")} batches)`,
    irreversible: "Deleting cannot be undone",
    backupHint:
      "Download the records first. The file can be uploaded back on the import page.",
    downloadBackup: "Download records before deleting (Excel)",
    creatingBackup: "Creating file...",
    backupDone: (fileName) => `Downloaded: ${fileName}`,
    backupFailed: "Unable to create the file. Please try again.",
    typeLabel: (count) =>
      `Type ${count.toLocaleString("en-US")} to confirm`,
    cancel: "Cancel",
    confirm: "Delete permanently",
    running: "Deleting...",
    progress: (batch, total, deleted) =>
      `Batch ${batch.toLocaleString("en-US")} of ${total.toLocaleString("en-US")} • ${deleted.toLocaleString("en-US")} deleted`,
    stop: "Stop",
    stopping: "Stopping after this batch...",
    leaveWarning:
      "Records are being deleted. Leaving this page stops the deletion part-way. Leave this page?",
    doneTitle: "Delete summary",
    deleted: "Deleted",
    failed: "Failed",
    imagesDeleted: "Images deleted",
    imageErrors: "Images not deleted",
    stopped: (count) =>
      `Stopped. ${count.toLocaleString("en-US")} records were not deleted (still selected).`,
    failedBatch: (batch, count, message) =>
      `Batch ${batch}: ${count.toLocaleString("en-US")} records — ${message}`,
    imageErrorBatch: (batch, count, message) =>
      `Images of batch ${batch}: ${count.toLocaleString("en-US")} — ${message}`,
    failedHint: "Records that failed are still selected. You can delete them again.",
    imageErrorHint: "The records were deleted, but some image files remain in Storage.",
    close: "Close",
  },
};

export default function BulkDeleteDialog({ ids, onClose, onFinished }) {
  const { language } = useSiteSettings();

  const t = language === "EN" ? COPY.EN : COPY.TH;

  /* loading | confirm | running | done | error */
  const [phase, setPhase] = useState("loading");

  const [plants, setPlants] = useState([]);

  const [typed, setTyped] = useState("");

  const [backup, setBackup] = useState(null);

  const [progress, setProgress] = useState(null);

  const [stopRequested, setStopRequested] = useState(false);

  const [summary, setSummary] = useState(null);

  const stopRef = useRef(false);

  const running = phase === "running";

  useWarnBeforeLeave(running, t.leaveWarning);

  /* ids ไม่เปลี่ยนระหว่างเปิดกล่อง (เปิดใหม่ทุกครั้งที่กดปุ่ม) */
  useEffect(() => {
    let active = true;

    fetchPlantsForDelete(ids)
      .then((rows) => {
        if (!active) return;

        setPlants(rows);
        setPhase("confirm");
      })
      .catch((err) => {
        console.error("Load plants for delete error:", err);

        if (active) setPhase("error");
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- โหลดครั้งเดียวตอนเปิด
  }, []);

  function requestClose() {
    if (running) return;

    onClose();
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        requestClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const count = plants.length;

  const missing = Math.max(0, new Set(ids).size - count);

  const needsTyping = count > TYPED_CONFIRM_THRESHOLD;

  const typedOk = !needsTyping || typed.trim() === String(count);

  const samplePnus = plants
    .slice(0, SAMPLE_PNU_COUNT)
    .map((plant) => (plant.pnu_no ?? null) === null ? t.noPnu : plant.pnu_no);

  const imageCount = countPlantsWithStoredImage(plants);

  async function handleBackup() {
    const fileName = getDeleteBackupFileName();

    setBackup({ status: "creating", fileName });

    try {
      const XLSX = await loadSheetJs();

      const bytes = writeWorkbookWithFrozenHeader(
        XLSX,
        buildDeleteBackupWorkbook(XLSX, plants),
      );

      downloadBlob(new Blob([bytes], { type: XLSX_MIME_TYPE }), fileName);

      setBackup({ status: "done", fileName });
    } catch (err) {
      console.error("Create delete backup error:", err);

      setBackup({ status: "failed", fileName });
    }
  }

  async function handleDelete() {
    if (!typedOk || count === 0) return;

    stopRef.current = false;

    setStopRequested(false);
    setProgress({ batch: 1, totalBatches: Math.ceil(count / DELETE_BATCH_SIZE), deleted: 0 });
    setPhase("running");

    const result = await deletePlantsInBatches({
      plants,
      onProgress: setProgress,
      shouldStop: () => stopRef.current,
    });

    /* id ที่เลือกไว้แต่ไม่พบในระบบ ล้างออกจากการเลือกด้วย */
    const found = new Set(plants.map((plant) => plant.id));

    const finished = {
      ...result,
      clearedIds: [...result.deletedIds, ...ids.filter((id) => !found.has(id))],
    };

    setSummary(finished);

    setPhase("done");

    /* ล้างการเลือกและโหลดรายการใหม่ทันที (กล่องสรุปยังเปิดอยู่) */
    onFinished(finished);
  }

  function handleStop() {
    stopRef.current = true;

    setStopRequested(true);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/40 p-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:items-center"
      onClick={requestClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="bulk-delete-title"
        aria-describedby="bulk-delete-description"
        data-testid="bulk-delete-dialog"
        data-phase={phase}
        className="vh-sheet page-enter max-h-full w-full max-w-md overflow-y-auto p-5 shadow-lift sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="vh-eyebrow flex items-center gap-3 !text-clay">
          <span className="h-px w-6 bg-clay" />
          {t.eyebrow}
        </p>

        {phase === "loading" && (
          <p className="mt-5 flex items-center gap-2 text-[14px] text-muted">
            <LoadingIcon className="h-4 w-4 animate-spin" />
            {t.loading}
          </p>
        )}

        {phase === "error" && (
          <div className="mt-5">
            <AlertBox type="error">{t.loadFailed}</AlertBox>
          </div>
        )}

        {phase === "confirm" && count === 0 && (
          <div className="mt-5">
            <AlertBox type="error">{t.nothingFound}</AlertBox>
          </div>
        )}

        {/* CONFIRM */}

        {phase === "confirm" && count > 0 && (
          <>
            <h2
              id="bulk-delete-title"
              className="vh-display mt-3 text-[1.5rem] leading-tight"
            >
              {t.title(count)}
            </h2>

            <div
              id="bulk-delete-description"
              className="mt-4 space-y-3 text-[14px] leading-6"
            >
              <div>
                <p className="vh-eyebrow !text-[10px]">{t.samplePnu}</p>

                <p
                  data-bulk-delete-sample
                  className="mt-1 break-words font-mono text-[13px] tabular-nums text-ink-soft"
                >
                  {samplePnus.join(", ")}
                  {count > SAMPLE_PNU_COUNT && (
                    <span className="font-sans text-muted">
                      {" "}
                      {t.andMore(count - SAMPLE_PNU_COUNT)}
                    </span>
                  )}
                </p>
              </div>

              <p data-bulk-delete-images className="text-ink-soft">
                {t.images(imageCount)}
              </p>

              <p className="text-muted">
                {t.batches(Math.ceil(count / DELETE_BATCH_SIZE))}
              </p>

              {missing > 0 && <p className="text-[13px] text-ochre">{t.missing(missing)}</p>}

              <p
                role="note"
                className="rounded-[6px] border border-clay/40 bg-clay-soft px-3.5 py-3 text-[13px] font-medium text-clay"
              >
                {t.irreversible}
              </p>

              <p className="text-[13px] text-muted">{t.backupHint}</p>
            </div>

            <button
              type="button"
              data-bulk-delete-backup
              onClick={handleBackup}
              disabled={backup?.status === "creating"}
              className="vh-btn vh-btn-ghost vh-btn-sm mt-2 -ml-3"
            >
              {backup?.status === "creating" ? (
                <LoadingIcon className="h-4 w-4 animate-spin" />
              ) : (
                <DownloadIcon className="h-4 w-4" />
              )}

              {backup?.status === "creating" ? t.creatingBackup : t.downloadBackup}
            </button>

            {backup?.status === "done" && (
              <p
                role="status"
                data-bulk-delete-backup-result
                className="mt-1 flex items-start gap-2 text-[13px] leading-6 text-moss"
              >
                <CheckIcon className="mt-1 h-4 w-4 shrink-0" />
                <span className="min-w-0 break-all">{t.backupDone(backup.fileName)}</span>
              </p>
            )}

            {backup?.status === "failed" && (
              <div className="mt-2">
                <AlertBox type="error">{t.backupFailed}</AlertBox>
              </div>
            )}

            {needsTyping && (
              <label className="mt-4 block">
                <span className="text-[13px] font-medium text-ink-soft">
                  {t.typeLabel(count)}
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  data-bulk-delete-typed
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  placeholder={String(count)}
                  className="vh-input mt-1.5 font-mono tabular-nums"
                />
              </label>
            )}
          </>
        )}

        {/* RUNNING */}

        {running && progress && (
          <div data-testid="bulk-delete-progress">
            <h2 id="bulk-delete-title" className="vh-display mt-3 text-[1.5rem] leading-tight">
              {t.title(count)}
            </h2>

            <ProgressBar
              label={stopRequested ? t.stopping : t.running}
              detail={t.progress(progress.batch, progress.totalBatches, progress.deleted)}
              done={Math.max(0, progress.batch - 1)}
              total={progress.totalBatches}
            />

            <button
              type="button"
              data-bulk-delete-stop
              onClick={handleStop}
              disabled={stopRequested}
              className="vh-btn vh-btn-outline mt-5 w-full"
            >
              {stopRequested ? (
                <LoadingIcon className="h-4 w-4 animate-spin" />
              ) : (
                <StopIcon className="h-4 w-4" />
              )}
              {t.stop}
            </button>
          </div>
        )}

        {/* DONE */}

        {phase === "done" && summary && (
          <div data-testid="bulk-delete-summary">
            <h2 id="bulk-delete-title" className="vh-display mt-3 text-[1.5rem] leading-tight">
              {t.doneTitle}
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard
                id="bulk-deleted"
                label={t.deleted}
                value={summary.deleted}
                tone={summary.deleted ? "moss" : null}
              />
              <StatCard
                id="bulk-failed"
                label={t.failed}
                value={summary.failed}
                tone={summary.failed ? "clay" : null}
              />
              <StatCard id="bulk-images" label={t.imagesDeleted} value={summary.imagesDeleted} />
              <StatCard
                id="bulk-image-errors"
                label={t.imageErrors}
                value={summary.imageErrors.reduce((total, item) => total + item.count, 0)}
                tone={summary.imageErrors.length ? "ochre" : null}
              />
            </div>

            {summary.stopped && (
              <div className="mt-4">
                <AlertBox type="error">{t.stopped(summary.remaining)}</AlertBox>
              </div>
            )}

            {summary.failedBatches.length > 0 && (
              <div className="mt-4 rounded-[6px] border border-clay/40 bg-clay-soft px-3.5 py-3 text-[13px] leading-6 text-clay">
                {summary.failedBatches.map((item) => (
                  <p key={`f-${item.batch}-${item.message}`} className="break-words">
                    {t.failedBatch(item.batch, item.count, item.message)}
                  </p>
                ))}
                <p className="mt-1 text-ink-soft">{t.failedHint}</p>
              </div>
            )}

            {summary.imageErrors.length > 0 && (
              <div className="mt-4 rounded-[6px] border border-ochre/40 bg-ochre-soft px-3.5 py-3 text-[13px] leading-6 text-ink-soft">
                {summary.imageErrors.map((item) => (
                  <p key={`i-${item.batch}-${item.message}`} className="break-words">
                    {t.imageErrorBatch(item.batch, item.count, item.message)}
                  </p>
                ))}
                <p className="mt-1">{t.imageErrorHint}</p>
              </div>
            )}
          </div>
        )}

        {/* ACTIONS */}

        {!running && (
          <div className={`mt-6 grid gap-3 ${phase === "confirm" && count > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
            <button
              type="button"
              data-bulk-delete-close
              onClick={requestClose}
              className="vh-btn vh-btn-outline"
              autoFocus
            >
              {phase === "done" ? t.close : t.cancel}
            </button>

            {phase === "confirm" && count > 0 && (
              <button
                type="button"
                data-bulk-delete-confirm
                onClick={handleDelete}
                disabled={!typedOk}
                className="vh-btn vh-btn-danger"
              >
                <TrashIcon className="h-4 w-4" />
                {t.confirm}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function TrashIcon({ className = "" }) {
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
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
