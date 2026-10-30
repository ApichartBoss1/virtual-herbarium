"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import Navbar from "@/components/Navbar";
import { useAdmin } from "@/components/AdminContext";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import { useWarnBeforeLeave } from "@/lib/useWarnBeforeLeave";
import GeocodeFillPanel from "@/components/GeocodeFillPanel";
import NameReportPanel from "@/components/NameReportPanel";
import {
  AlertBox,
  AlertIcon,
  ArrowLeftIcon,
  CheckIcon,
  DownloadIcon,
  ImageIcon,
  LoadingIcon,
  PagedTable,
  ProgressBar,
  RefreshIcon,
  StatCard,
  StepPanel,
  StopIcon,
  UploadIcon,
  formatNumber,
} from "@/components/ImportUi";
import {
  IMAGE_INPUT_ACCEPT,
  getImageExtension,
  getPlantImageStoragePath,
  preparePlantImage,
} from "@/lib/plantImage";
import {
  IMPORT_BATCH_SIZE,
  downloadBlob,
  downloadImportTemplate,
  fetchAllPnuNumbers,
  fetchPlantsByPnu,
  getPnuFromFileName,
  importPlantRows,
  loadSheetJs,
  runWithConcurrency,
} from "@/lib/plantImport";
import {
  MAX_SHEET_IMPORT_ROWS,
  REQUIRED_FIELD_OPTIONS,
  SHEET_IMPORT_ACCEPT,
  SHEET_IMPORT_FIELDS,
  SKIP_REASONS,
  classifyImportRows,
  cleanImportRows,
  getMissingFields,
  getRowWarnings,
  readImportWorkbook,
} from "@/lib/plantImportSheets";
import {
  XLSX_MIME_TYPE,
  buildImportReportWorkbook,
  getImportReportFileName,
  writeWorkbookWithFrozenHeader,
} from "@/lib/plantImportReport";

const IMAGE_BUCKET = "plant-images";

const IMAGE_UPLOAD_CONCURRENCY = 3;

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

    tabData: "นำเข้าข้อมูล (Excel/CSV)",
    tabImages: "นำเข้ารูปตามหมายเลข PNU",
    tabTools: "เติมพิกัด / ตรวจชื่อ",

    stepFile: "เลือกไฟล์",
    stepFileDesc: `รองรับ .xlsx และ .csv (UTF-8) ไม่เกิน 10 MB อ่านทุกชีตรวมกัน ไม่เกิน ${MAX_SHEET_IMPORT_ROWS.toLocaleString("th-TH")} แถวต่อไฟล์`,
    downloadTemplate: "ดาวน์โหลดเทมเพลต .xlsx",
    chooseFile: "เลือกไฟล์ข้อมูล",
    chooseFileHint: "แตะเพื่อเลือกไฟล์ .xlsx หรือ .csv",
    reading: "กำลังอ่านไฟล์และตรวจข้อมูล...",
    fileSummary: (name, rows, sheets) =>
      `${name} • ${sheets.toLocaleString("th-TH")} ชีต • ${rows.toLocaleString("th-TH")} แถว`,
    elapsed: (seconds) => `อ่านและตรวจเสร็จใน ${seconds} วินาที`,
    sheetRows: "จำนวนแถวต่อชีต",
    sheet: "ชีต",
    rows: "แถว",

    stepMapping: "จับคู่คอลัมน์",
    stepMappingDesc:
      "จับคู่จากหัวคอลัมน์อัตโนมัติ โดยไม่สนตัวพิมพ์ใหญ่-เล็กและช่องว่าง",
    field: "ฟิลด์ในระบบ",
    fileColumn: "คอลัมน์ในไฟล์",
    columnNotFound: "ไม่พบในไฟล์",
    unusedColumns: "คอลัมน์ที่ไม่นำเข้า",
    noUnusedColumns: "ไม่มี",

    stepSummary: "สรุปการคัดข้อมูล",
    stepSummaryDesc:
      "ขั้นนี้ยังไม่บันทึกข้อมูลลงระบบ แถวหนึ่งถูกคัดออกด้วยเหตุผลแรกที่พบตามลำดับ a–e",
    requiredTitle: "ช่องที่ต้องมีข้อมูล",
    totalRows: "แถวทั้งหมด",
    readyRows: "พร้อมนำเข้า",
    warnings: "คำเตือน",
    duplicateNumbers: (count) => `${count.toLocaleString("th-TH")} เลข`,
    warningsHint: "ไม่ถูกคัดออก",

    fieldLabels: {
      pnu_no: "เลข PNU",
      artificial_group: "กลุ่มพืช",
      family: "วงศ์",
      botanical_name: "ชื่อวิทยาศาสตร์",
      collected_by: "ผู้เก็บ",
      collector_no: "เลขผู้เก็บ",
      locality: "สถานที่เก็บ",
      latitude: "ละติจูด",
      longitude: "ลองจิจูด",
      elevation: "ความสูง",
    },

    reasons: {
      blank: "แถวว่าง",
      pnuInvalid: "PNU ไม่ถูกต้อง",
      pnuDuplicateInFile: "PNU ซ้ำในไฟล์",
      pnuExists: "PNU มีในระบบแล้ว",
      incomplete: "ข้อมูลไม่ครบ",
    },

    warningSummary: {
      artificialGroupUnknown: "กลุ่มพืชไม่รู้จัก (ไม่นำเข้าค่านี้)",
      collectorNoDate: "เลขผู้เก็บถูก Excel แปลงเป็นวันที่ (ถือว่าไม่มีค่า)",
      latitudeInvalid: "ละติจูดไม่ถูกต้อง (ไม่นำเข้าค่านี้)",
      longitudeInvalid: "ลองจิจูดไม่ถูกต้อง (ไม่นำเข้าค่านี้)",
    },

    warningLabels: {
      artificialGroupUnknown: (value) => `กลุ่มพืชไม่รู้จัก “${value}” (ไม่นำเข้าค่านี้)`,
      collectorNoDate: (value) => `เลขผู้เก็บถูก Excel แปลงเป็นวันที่ “${value}”`,
      latitudeInvalid: () => "ละติจูดไม่ถูกต้อง (ไม่นำเข้าค่านี้)",
      longitudeInvalid: () => "ลองจิจูดไม่ถูกต้อง (ไม่นำเข้าค่านี้)",
    },

    readyTitle: "แถวที่พร้อมนำเข้า",
    skippedTitle: "แถวที่ถูกคัดออก",
    filterAll: "ทุกเหตุผล",
    row: "แถว",
    reason: "เหตุผล",
    missing: "ช่องที่ขาด",
    warning: "คำเตือน",
    noRows: "ไม่มีแถวที่ตรงกับตัวกรอง",
    page: (current, total) => `หน้า ${current} / ${total}`,
    previous: "ก่อนหน้า",
    next: "ถัดไป",
    importButton: (count) => `นำเข้า ${count.toLocaleString("th-TH")} รายการ`,
    nothingToImport: "ไม่มีรายการที่พร้อมนำเข้า",
    recheckFirst: "นำเข้าไฟล์นี้แล้ว กด “ตรวจใหม่” เพื่ออ่าน PNU จากฐานข้อมูลก่อนนำเข้าอีกครั้ง",
    confirmTitle: "ยืนยันการนำเข้า",
    confirmCount: (count) =>
      `จะนำเข้า ${count.toLocaleString("th-TH")} รายการลงระบบ`,
    confirmBatches: (batches, size) =>
      `ส่งทีละชุด ${size.toLocaleString("th-TH")} รายการ รวม ${batches.toLocaleString("th-TH")} ชุด`,
    confirmRequired: "ช่องบังคับที่ใช้",
    confirmReportHint:
      "แนะนำให้ดาวน์โหลดรายงานเก็บไว้ก่อน เพื่อใช้ตรวจแถวที่ถูกคัดออกภายหลัง",
    cancel: "ยกเลิก",
    importing: "กำลังนำเข้าข้อมูล...",
    importProgress: (batch, total, imported) =>
      `ชุดที่ ${batch.toLocaleString("th-TH")} จาก ${total.toLocaleString("th-TH")} • นำเข้าแล้ว ${imported.toLocaleString("th-TH")} รายการ`,
    retryingRows: "ชุดนี้มี PNU ที่ถูกเพิ่มในระบบระหว่างนำเข้า กำลังลองใหม่ทีละรายการ...",
    stop: "หยุด",
    stopping: "จะหยุดหลังชุดปัจจุบันเสร็จ...",
    leaveWarning:
      "กำลังนำเข้าข้อมูลอยู่ ถ้าออกจากหน้านี้ ระบบจะหยุดหลังชุดปัจจุบันและคุณจะไม่เห็นสรุปผล ต้องการออกจากหน้านี้หรือไม่?",
    resultTitle: "ผลการนำเข้า",
    resultStopped: "หยุดก่อนนำเข้าครบทุกชุด",
    resultElapsed: (seconds) => `ใช้เวลา ${seconds} วินาที`,
    importStatuses: {
      success: "สำเร็จ",
      duplicate: "ข้ามเพราะซ้ำระหว่างนำเข้า",
      failed: "ล้มเหลว",
      notImported: "ยังไม่ได้นำเข้า (หยุดก่อน)",
    },
    issueRows: "รายการที่ไม่ได้นำเข้า",
    status: "สถานะ",
    errorMessage: "ข้อความ error",
    downloadResultReport: "ดาวน์โหลดรายงานรวมผลการนำเข้า (Excel)",
    recheck: "ตรวจใหม่",
    rechecking: "กำลังอ่าน PNU จากฐานข้อมูล...",
    recheckHint:
      "อ่านรายการ PNU จากฐานข้อมูลอีกครั้ง แถวที่นำเข้าแล้วจะย้ายไปอยู่ข้อ d",
    downloadReport: "ดาวน์โหลดรายงาน (Excel)",
    creatingReport: "กำลังสร้างรายงาน...",
    reportDownloaded: (fileName) =>
      `ดาวน์โหลดแล้ว: ${fileName} (ดูในโฟลเดอร์ Downloads)`,
    reportFailed: "สร้างรายงาน Excel ไม่สำเร็จ กรุณาลองอีกครั้ง",
    goToList: "ไปหน้ารายการพรรณไม้",

    errors: {
      NO_FILE: "กรุณาเลือกไฟล์",
      INVALID_FILE_TYPE: "รองรับเฉพาะไฟล์ .xlsx และ .csv",
      FILE_TOO_LARGE: "ไฟล์ต้องมีขนาดไม่เกิน 10 MB",
      TOO_MANY_ROWS: `ไฟล์ต้องมีข้อมูลไม่เกิน ${MAX_SHEET_IMPORT_ROWS.toLocaleString("th-TH")} แถว`,
      EMPTY_FILE: "ไม่พบข้อมูลในไฟล์ (แถวแรกของแต่ละชีตต้องเป็นหัวคอลัมน์)",
      READ_FAILED: "ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์",
      noPnuColumn: (sheets) =>
        `ไม่พบคอลัมน์ PNU (เช่น “PNU no.” หรือ “pnu_no”) ในชีต: ${sheets.join(", ")} จึงหยุดการตรวจ กรุณาแก้หัวคอลัมน์แล้วเลือกไฟล์ใหม่`,
      existingFailed: "ไม่สามารถดึงเลข PNU ที่มีในระบบได้ กรุณาลองใหม่",
    },

    img: {
      stepChoose: "เลือกรูปภาพ",
      stepChooseDesc:
        "เลือกได้หลายไฟล์ ชื่อไฟล์ (ไม่รวมนามสกุล) ต้องเป็นหมายเลข PNU เช่น 12345.jpg หรือ 12345.heic • JPG, PNG, WEBP ไม่เกิน 10 MB • HEIC / HEIF จะถูกแปลงเป็น JPEG",
      choose: "เลือกรูปภาพ",
      chooseHint: "แตะเพื่อเลือกรูปหลายไฟล์",
      matching: "กำลังจับคู่กับฐานข้อมูล...",
      selected: (count) => `เลือกแล้ว ${count.toLocaleString("th-TH")} ไฟล์`,
      matchFailed: "ไม่สามารถจับคู่กับฐานข้อมูลได้",

      stepReview: "ตรวจสอบก่อนอัปโหลด",
      fileName: "ชื่อไฟล์",
      pnu: "PNU",
      plantName: "ชื่อพืชที่พบ",
      status: "สถานะ",
      result: "ผลลัพธ์",
      existingLabel: "พืชที่มีรูปอยู่แล้ว",
      existingSkip: "ข้าม",
      existingReplace: "แทนที่",
      upload: (count) => `อัปโหลด ${count.toLocaleString("th-TH")} ไฟล์`,
      nothingToUpload: "ไม่มีไฟล์ที่พร้อมอัปโหลด",
      uploading: "กำลังอัปโหลดรูปภาพ...",
      progress: (done, total) =>
        `${done.toLocaleString("th-TH")} / ${total.toLocaleString("th-TH")} ไฟล์`,
      summary: (success, skipped, failed) =>
        `สำเร็จ ${success.toLocaleString("th-TH")} / ข้าม ${skipped.toLocaleString("th-TH")} / ล้มเหลว ${failed.toLocaleString("th-TH")} ไฟล์`,
      startOver: "เลือกรูปชุดใหม่",

      statuses: {
        ready: "พร้อมอัปโหลด",
        hasImage: "มีรูปอยู่แล้ว",
        notFound: "ไม่พบ PNU",
        notNumber: "ชื่อไฟล์ไม่ใช่ตัวเลข",
        duplicateFile: "มีหลายไฟล์ใช้ PNU เดียวกัน",
      },

      results: {
        success: "สำเร็จ",
        replaced: "สำเร็จ (แทนที่รูปเดิม)",
        skipped: "ข้าม (มีรูปอยู่แล้ว)",
        failed: "ล้มเหลว",
      },

      reasons: {
        HEIC_SOURCE_TOO_LARGE: "ไฟล์ HEIC / HEIF ต้นฉบับต้องไม่เกิน 25 MB",
        HEIC_CONVERSION_FAILED: "ไม่สามารถแปลงไฟล์ HEIC / HEIF ได้",
        IMAGE_TOO_LARGE: "รูปภาพต้องมีขนาดไม่เกิน 10 MB",
        INVALID_IMAGE_TYPE: "รองรับเฉพาะ JPG, PNG, WEBP, HEIC และ HEIF",
        uploadFailed: "อัปโหลดรูปภาพไม่สำเร็จ",
        updateFailed: "บันทึก image_url ไม่สำเร็จ",
        changed: "ข้อมูลพืชถูกเปลี่ยนระหว่างอัปโหลด กรุณาเลือกไฟล์ใหม่อีกครั้ง",
      },
    },
  },

  EN: {
    eyebrow: "DATA IMPORT",
    title: "Import Plant Records",
    subtitle:
      "Import many plant records from an Excel (.xlsx) or CSV file. Every row is checked before saving, and only valid rows are imported.",
    back: "Back to Collection",

    tabData: "Import Data (Excel/CSV)",
    tabImages: "Import Images by PNU",
    tabTools: "Coordinates & Names",

    stepFile: "Choose File",
    stepFileDesc: `Supports .xlsx and .csv (UTF-8) up to 10 MB. All sheets are read together, up to ${MAX_SHEET_IMPORT_ROWS.toLocaleString("en-US")} rows per file.`,
    downloadTemplate: "Download .xlsx Template",
    chooseFile: "Choose Data File",
    chooseFileHint: "Tap to choose a .xlsx or .csv file",
    reading: "Reading and checking the file...",
    fileSummary: (name, rows, sheets) =>
      `${name} • ${sheets.toLocaleString("en-US")} sheets • ${rows.toLocaleString("en-US")} rows`,
    elapsed: (seconds) => `Read and checked in ${seconds} s`,
    sheetRows: "Rows per sheet",
    sheet: "Sheet",
    rows: "Rows",

    stepMapping: "Column Mapping",
    stepMappingDesc:
      "Columns are matched automatically by header, ignoring letter case and spaces.",
    field: "System field",
    fileColumn: "Column in file",
    columnNotFound: "Not in file",
    unusedColumns: "Columns not imported",
    noUnusedColumns: "None",

    stepSummary: "Filtering Summary",
    stepSummaryDesc:
      "Nothing is saved at this step. Each row is excluded for the first reason found, in order a–e.",
    requiredTitle: "Fields that must have a value",
    totalRows: "Total rows",
    readyRows: "Ready to import",
    warnings: "Warnings",
    duplicateNumbers: (count) => `${count.toLocaleString("en-US")} numbers`,
    warningsHint: "Not excluded",

    fieldLabels: {
      pnu_no: "PNU No.",
      artificial_group: "Artificial group",
      family: "Family",
      botanical_name: "Botanical name",
      collected_by: "Collector",
      collector_no: "Collector no.",
      locality: "Locality",
      latitude: "Latitude",
      longitude: "Longitude",
      elevation: "Elevation",
    },

    reasons: {
      blank: "Blank row",
      pnuInvalid: "Invalid PNU",
      pnuDuplicateInFile: "PNU duplicated in file",
      pnuExists: "PNU already in system",
      incomplete: "Incomplete",
    },

    warningSummary: {
      artificialGroupUnknown: "Unknown artificial group (value not imported)",
      collectorNoDate: "Collector no. converted to a date by Excel (treated as empty)",
      latitudeInvalid: "Invalid latitude (value not imported)",
      longitudeInvalid: "Invalid longitude (value not imported)",
    },

    warningLabels: {
      artificialGroupUnknown: (value) => `Unknown artificial group “${value}” (value not imported)`,
      collectorNoDate: (value) => `Collector no. was converted to a date by Excel “${value}”`,
      latitudeInvalid: () => "Invalid latitude (value not imported)",
      longitudeInvalid: () => "Invalid longitude (value not imported)",
    },

    readyTitle: "Rows ready to import",
    skippedTitle: "Excluded rows",
    filterAll: "All reasons",
    row: "Row",
    reason: "Reason",
    missing: "Missing fields",
    warning: "Warnings",
    noRows: "No rows match this filter",
    page: (current, total) => `Page ${current} / ${total}`,
    previous: "Previous",
    next: "Next",
    importButton: (count) => `Import ${count.toLocaleString("en-US")} records`,
    nothingToImport: "No records are ready to import",
    recheckFirst: "This file has been imported. Press “Check Again” to reload PNU numbers from the database before importing again.",
    confirmTitle: "Confirm Import",
    confirmCount: (count) =>
      `${count.toLocaleString("en-US")} records will be imported into the system`,
    confirmBatches: (batches, size) =>
      `Sent in batches of ${size.toLocaleString("en-US")}, ${batches.toLocaleString("en-US")} batches in total`,
    confirmRequired: "Required fields used",
    confirmReportHint:
      "We recommend downloading the report first so you can review the excluded rows later.",
    cancel: "Cancel",
    importing: "Importing data...",
    importProgress: (batch, total, imported) =>
      `Batch ${batch.toLocaleString("en-US")} of ${total.toLocaleString("en-US")} • ${imported.toLocaleString("en-US")} records imported`,
    retryingRows: "Some PNU numbers in this batch were added during the import. Retrying one record at a time...",
    stop: "Stop",
    stopping: "Stopping after the current batch...",
    leaveWarning:
      "Data is being imported. If you leave this page, the import stops after the current batch and you will not see the summary. Leave this page?",
    resultTitle: "Import Result",
    resultStopped: "Stopped before all batches were imported",
    resultElapsed: (seconds) => `Took ${seconds} s`,
    importStatuses: {
      success: "Succeeded",
      duplicate: "Skipped (added during import)",
      failed: "Failed",
      notImported: "Not imported (stopped)",
    },
    issueRows: "Records not imported",
    status: "Status",
    errorMessage: "Error message",
    downloadResultReport: "Download Report with Import Result (Excel)",
    recheck: "Check Again",
    rechecking: "Reading PNU numbers from the database...",
    recheckHint:
      "Reload PNU numbers from the database. Imported rows move to rule d.",
    downloadReport: "Download Report (Excel)",
    creatingReport: "Creating report...",
    reportDownloaded: (fileName) =>
      `Downloaded: ${fileName} (check your Downloads folder)`,
    reportFailed: "Unable to create the Excel report. Please try again.",
    goToList: "Go to Plant List",

    errors: {
      NO_FILE: "Please choose a file",
      INVALID_FILE_TYPE: "Only .xlsx and .csv files are supported",
      FILE_TOO_LARGE: "The file must be 10 MB or smaller",
      TOO_MANY_ROWS: `The file must contain no more than ${MAX_SHEET_IMPORT_ROWS.toLocaleString("en-US")} rows`,
      EMPTY_FILE: "No data found in the file (the first row of each sheet must be the header)",
      READ_FAILED: "Unable to read the file. Please check the file format.",
      noPnuColumn: (sheets) =>
        `No PNU column (e.g. “PNU no.” or “pnu_no”) found in sheet: ${sheets.join(", ")}. Checking stopped. Please fix the header and choose the file again.`,
      existingFailed: "Unable to load the PNU numbers already in the system. Please try again.",
    },

    img: {
      stepChoose: "Choose Images",
      stepChooseDesc:
        "Choose multiple files. The file name (without extension) must be the PNU No., e.g. 12345.jpg or 12345.heic • JPG, PNG, WEBP up to 10 MB • HEIC / HEIF is converted to JPEG",
      choose: "Choose Images",
      chooseHint: "Tap to choose multiple images",
      matching: "Matching with the database...",
      selected: (count) => `${count.toLocaleString("en-US")} files selected`,
      matchFailed: "Unable to match files with the database",

      stepReview: "Review Before Upload",
      fileName: "File Name",
      pnu: "PNU",
      plantName: "Plant Found",
      status: "Status",
      result: "Result",
      existingLabel: "Plants that already have an image",
      existingSkip: "Skip",
      existingReplace: "Replace",
      upload: (count) => `Upload ${count.toLocaleString("en-US")} files`,
      nothingToUpload: "No files are ready to upload",
      uploading: "Uploading images...",
      progress: (done, total) =>
        `${done.toLocaleString("en-US")} / ${total.toLocaleString("en-US")} files`,
      summary: (success, skipped, failed) =>
        `Succeeded ${success.toLocaleString("en-US")} / Skipped ${skipped.toLocaleString("en-US")} / Failed ${failed.toLocaleString("en-US")} files`,
      startOver: "Choose Another Set",

      statuses: {
        ready: "Ready to upload",
        hasImage: "Already has an image",
        notFound: "PNU not found",
        notNumber: "File name is not a number",
        duplicateFile: "Several files use the same PNU",
      },

      results: {
        success: "Succeeded",
        replaced: "Succeeded (image replaced)",
        skipped: "Skipped (already has an image)",
        failed: "Failed",
      },

      reasons: {
        HEIC_SOURCE_TOO_LARGE: "The source HEIC / HEIF image must be 25MB or smaller",
        HEIC_CONVERSION_FAILED: "Unable to convert the HEIC / HEIF image",
        IMAGE_TOO_LARGE: "The image must be 10MB or smaller",
        INVALID_IMAGE_TYPE: "Supported formats: JPG, PNG, WEBP, HEIC and HEIF",
        uploadFailed: "Unable to upload image",
        updateFailed: "Unable to save image_url",
        changed: "The plant record changed during upload. Please choose the file again.",
      },
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

  /* สิทธิ์ admin ตรวจแล้วที่ app/account/layout.js */
  const { user } = useAdmin();

  const [tab, setTab] = useState("data");

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

        <div
          role="tablist"
          aria-label={t.title}
          className="mt-6 flex gap-6 overflow-x-auto border-b border-rule"
        >
          {[
            ["data", t.tabData],
            ["images", t.tabImages],
            ["tools", t.tabTools],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`import-tab-${value}`}
              aria-selected={tab === value}
              aria-controls={`import-panel-${value}`}
              onClick={() => setTab(value)}
              className={`-mb-px shrink-0 border-b-2 pb-3 text-[14px] transition ${
                tab === value
                  ? "border-moss font-medium text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ซ่อนแทนการ unmount เพื่อไม่ให้งานที่กำลังทำหายเมื่อสลับแท็บ */}
        <div
          role="tabpanel"
          id="import-panel-data"
          aria-labelledby="import-tab-data"
          hidden={tab !== "data"}
        >
          <DataImportSection t={t} user={user} />
        </div>

        <div
          role="tabpanel"
          id="import-panel-images"
          aria-labelledby="import-tab-images"
          hidden={tab !== "images"}
        >
          <ImageImportSection t={t} user={user} />
        </div>

        <div
          role="tabpanel"
          id="import-panel-tools"
          aria-labelledby="import-tab-tools"
          hidden={tab !== "tools"}
          className="mt-7 space-y-6"
        >
          <GeocodeFillPanel mode="all" />

          <NameReportPanel />
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   DATA IMPORT (EXCEL / CSV)
   ขั้นนี้อ่านทุกชีต ทำความสะอาด และคัดแถว ยังไม่บันทึกลงฐานข้อมูล
========================================================= */

function DataImportSection({ t, user }) {
  const [fileName, setFileName] = useState("");

  const [reading, setReading] = useState(false);

  const [templateBusy, setTemplateBusy] = useState(false);

  const [error, setError] = useState("");

  /* ผลการอ่าน: null = ยังไม่ได้เลือกไฟล์ */
  const [parsed, setParsed] = useState(null);

  const [elapsedMs, setElapsedMs] = useState(null);

  const [requiredFields, setRequiredFields] = useState(REQUIRED_FIELD_OPTIONS);

  const [skipFilter, setSkipFilter] = useState("all");

  const [readyPage, setReadyPage] = useState(1);

  const [skippedPage, setSkippedPage] = useState(1);

  const [inputKey, setInputKey] = useState(0);

  /* { kind: "screening" | "result", status: "creating" | "done" | "failed", fileName } */
  const [reportResult, setReportResult] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [importing, setImporting] = useState(false);

  /* { batch, totalBatches, imported, processed, retrying } */
  const [importProgress, setImportProgress] = useState(null);

  const [stopRequested, setStopRequested] = useState(false);

  const stopRef = useRef(false);

  /* { results, stopped, elapsedMs, finishedAt, requiredFields } */
  const [importResult, setImportResult] = useState(null);

  /* นำเข้าแล้วต้องตรวจกับฐานข้อมูลใหม่ก่อน กันการส่งแถวเดิมซ้ำ */
  const [needsRecheck, setNeedsRecheck] = useState(false);

  const [rechecking, setRechecking] = useState(false);

  const [issuePage, setIssuePage] = useState(1);

  useWarnBeforeLeave(importing, t.leaveWarning);

  /* ออกจากหน้าระหว่างนำเข้า: หยุดหลังชุดปัจจุบัน */
  useEffect(
    () => () => {
      stopRef.current = true;
    },
    [],
  );

  /* ข้อ e คำนวณใหม่ทุกครั้งที่เปลี่ยนช่องบังคับ โดยไม่ต้องอ่านไฟล์ใหม่ */
  const summary = useMemo(() => {
    if (!parsed) {
      return null;
    }

    const ready = [];

    const skipped = [];

    const reasonCounts = Object.fromEntries(SKIP_REASONS.map((reason) => [reason, 0]));

    parsed.rows.forEach((row) => {
      let finalRow = { ...row, warnings: getRowWarnings(row, requiredFields) };

      if (row.reason === null) {
        const missing = getMissingFields(row, requiredFields);

        if (missing.length > 0) {
          finalRow = { ...finalRow, reason: "incomplete", missing };
        }
      }

      if (finalRow.reason === null) {
        ready.push(finalRow);
      } else {
        reasonCounts[finalRow.reason] += 1;
        skipped.push(finalRow);
      }
    });

    return { ready, skipped, reasonCounts };
  }, [parsed, requiredFields]);

  const filteredSkipped = useMemo(() => {
    const list = summary?.skipped || [];

    return skipFilter === "all"
      ? list
      : list.filter((row) => row.reason === skipFilter);
  }, [summary, skipFilter]);

  function errorText(code) {
    return t.errors[code] || t.errors.READ_FAILED;
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
    setError("");
    setParsed(null);
    setElapsedMs(null);
    setSkipFilter("all");
    setReadyPage(1);
    setSkippedPage(1);
    setReportResult(null);
    setImportResult(null);
    setNeedsRecheck(false);
    setIssuePage(1);
    setInputKey((key) => key + 1);
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const startedAt = performance.now();

    resetAll();

    setFileName(file.name);

    setReading(true);

    /* ดึง pnu_no ในระบบไปพร้อมกับอ่านไฟล์ */
    const existingPromise = fetchAllPnuNumbers();

    existingPromise.catch(() => {});

    try {
      const [XLSX, data] = await Promise.all([
        loadSheetJs(),
        file.arrayBuffer(),
      ]);

      const workbook = readImportWorkbook(XLSX, {
        name: file.name,
        data: new Uint8Array(data),
      });

      const sheetsWithoutPnu = workbook.sheets
        .filter((sheet) => !sheet.mapping.pnu_no)
        .map((sheet) => sheet.name);

      if (sheetsWithoutPnu.length > 0) {
        setError(t.errors.noPnuColumn(sheetsWithoutPnu));
        return;
      }

      const cleaned = cleanImportRows(workbook.rows);

      let existing;

      try {
        existing = await existingPromise;
      } catch (err) {
        console.error("Fetch existing PNU error:", err);

        setError(t.errors.existingFailed);
        return;
      }

      setParsed({
        sheets: workbook.sheets,
        rows: classifyImportRows(cleaned, existing),
        checkedAt: new Date(),
      });

      setElapsedMs(performance.now() - startedAt);
    } catch (err) {
      console.error("Read import file error:", err);

      setError(errorText(err?.code));
    } finally {
      setReading(false);
    }
  }

  function toggleRequired(field) {
    setRequiredFields((previous) =>
      previous.includes(field)
        ? previous.filter((item) => item !== field)
        : REQUIRED_FIELD_OPTIONS.filter(
            (item) => item === field || previous.includes(item),
          ),
    );

    setReadyPage(1);
    setSkippedPage(1);

    /* รายงานเดิมใช้ช่องบังคับชุดก่อน */
    setReportResult(null);
  }

  /* =====================================================
     REPORT
  ===================================================== */

  /* kind: "screening" = รายงานการคัด, "result" = รวมผลการนำเข้า */
  async function handleDownloadReport(kind = "screening") {
    if (!summary || reportResult?.status === "creating") {
      return;
    }

    const name = getImportReportFileName(fileName);

    setReportResult({ kind, status: "creating", fileName: name });

    try {
      const XLSX = await loadSheetJs();

      const workbook = buildImportReportWorkbook(XLSX, {
        fileName,
        checkedAt: parsed.checkedAt,
        requiredFields,
        sheets: parsed.sheets,
        rows: [...summary.ready, ...summary.skipped],
        importResult: kind === "result" ? importResult : null,
      });

      const bytes = writeWorkbookWithFrozenHeader(XLSX, workbook);

      downloadBlob(new Blob([bytes], { type: XLSX_MIME_TYPE }), name);

      setReportResult({ kind, status: "done", fileName: name });
    } catch (err) {
      console.error("Create import report error:", err);

      setReportResult({ kind, status: "failed", fileName: name });
    }
  }

  const creatingReport = reportResult?.status === "creating";

  /* =====================================================
     IMPORT
  ===================================================== */

  async function handleImport() {
    setConfirmOpen(false);

    if (importing || needsRecheck || !summary?.ready.length) {
      return;
    }

    const rows = summary.ready;

    /* ส่งเฉพาะฟิลด์ที่จับคู่ได้ในไฟล์ */
    const fields = SHEET_IMPORT_FIELDS.filter((field) =>
      parsed.sheets.some((sheet) => sheet.mapping[field]),
    );

    const usedRequiredFields = requiredFields;

    stopRef.current = false;

    setStopRequested(false);
    setImportResult(null);
    setReportResult(null);
    setIssuePage(1);
    setImporting(true);
    setImportProgress({
      batch: 1,
      totalBatches: Math.ceil(rows.length / IMPORT_BATCH_SIZE),
      imported: 0,
      processed: 0,
      retrying: false,
    });

    const startedAt = performance.now();

    try {
      const { results, stopped } = await importPlantRows({
        rows,
        fields,
        userId: user.id,
        onProgress: setImportProgress,
        shouldStop: () => stopRef.current,
      });

      setImportResult({
        results,
        stopped,
        elapsedMs: performance.now() - startedAt,
        finishedAt: new Date(),
        requiredFields: usedRequiredFields,
      });
    } finally {
      setImporting(false);
      setImportProgress(null);
      setNeedsRecheck(true);
    }
  }

  function handleStop() {
    stopRef.current = true;

    setStopRequested(true);
  }

  /* อ่าน pnu_no จากฐานข้อมูลใหม่ แล้วคัดข้อ a–d อีกครั้งโดยไม่ต้องอ่านไฟล์ */
  async function handleRecheck() {
    setRechecking(true);
    setError("");

    try {
      const existing = await fetchAllPnuNumbers();

      setParsed((previous) => ({
        ...previous,
        rows: classifyImportRows(previous.rows, existing),
        checkedAt: new Date(),
      }));

      setNeedsRecheck(false);
      setReadyPage(1);
      setSkippedPage(1);
      setReportResult(null);
    } catch (err) {
      console.error("Recheck existing PNU error:", err);

      setError(t.errors.existingFailed);
    } finally {
      setRechecking(false);
    }
  }

  const importCounts = useMemo(() => {
    const counts = { success: 0, duplicate: 0, failed: 0, notImported: 0 };

    (importResult?.results || []).forEach(({ status }) => {
      counts[status] += 1;
    });

    return counts;
  }, [importResult]);

  /* เติมพิกัดอัตโนมัติให้เฉพาะรายการที่เพิ่งนำเข้าสำเร็จ */
  const importedPnuNumbers = useMemo(
    () =>
      (importResult?.results || [])
        .filter(({ status }) => status === "success")
        .map(({ row }) => row.pnuNo),
    [importResult],
  );

  const issueRows = useMemo(
    () =>
      (importResult?.results || [])
        .filter(({ status }) => status !== "success")
        .map(({ row, status, message }) => ({ ...row, importStatus: status, message })),
    [importResult],
  );

  /* =====================================================
     DERIVED
  ===================================================== */

  const sheets = parsed?.sheets || [];

  const totalRows = parsed?.rows.length || 0;

  /* ฟิลด์ → หัวคอลัมน์ในไฟล์ (ถ้าแต่ละชีตใช้ชื่อต่างกันจะแสดงทุกชื่อ) */
  const mappingRows = SHEET_IMPORT_FIELDS.map((field) => [
    field,
    [...new Set(sheets.map((sheet) => sheet.mapping[field]).filter(Boolean))],
  ]);

  const unusedHeaders = [
    ...new Set(sheets.flatMap((sheet) => sheet.unusedHeaders)),
  ];

  /* คอลัมน์ที่แสดงในตาราง: เฉพาะฟิลด์ที่พบในไฟล์ */
  const tableFields = mappingRows
    .filter(([, headers]) => headers.length > 0)
    .map(([field]) => field);

  const duplicateNumbers = useMemo(
    () =>
      new Set(
        (parsed?.rows || [])
          .filter((row) => row.reason === "pnuDuplicateInFile")
          .map((row) => row.pnuNo),
      ).size,
    [parsed],
  );

  /* คำเตือนนับจากทุกแถวที่ไม่ใช่แถวว่าง (ขึ้นกับช่องบังคับที่เลือก) */
  const warningCounts = useMemo(() => {
    const counts = {};

    [...(summary?.ready || []), ...(summary?.skipped || [])].forEach((row) => {
      if (row.reason === "blank") {
        return;
      }

      row.warnings.forEach((code) => {
        counts[code] = (counts[code] || 0) + 1;
      });
    });

    return counts;
  }, [summary]);

  const warningTotal = Object.values(warningCounts).reduce(
    (total, count) => total + count,
    0,
  );

  function warningText(row, code) {
    const value =
      code === "artificialGroupUnknown"
        ? row.values.artificialGroupOriginal
        : row.collectorNoDate;

    return t.warningLabels[code](value);
  }

  /* =====================================================
     RENDER
  ===================================================== */

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
            reading || importing || rechecking
              ? "pointer-events-none opacity-60"
              : ""
          }`}
        >
          <input
            key={inputKey}
            type="file"
            accept={SHEET_IMPORT_ACCEPT}
            onChange={handleFileChange}
            disabled={reading || importing || rechecking}
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

          <span className="break-all text-[13px] text-muted">
            {parsed
              ? t.fileSummary(fileName, totalRows, sheets.length)
              : fileName || t.chooseFileHint}
          </span>
        </label>

        {parsed && (
          <>
            {elapsedMs !== null && (
              <p
                data-testid="import-elapsed"
                data-ms={Math.round(elapsedMs)}
                className="mt-3 font-mono text-[12px] tabular-nums text-muted"
              >
                {t.elapsed((elapsedMs / 1000).toFixed(2))}
              </p>
            )}

            <h3 className="vh-eyebrow mt-5">{t.sheetRows}</h3>

            <div className="mt-3 overflow-x-auto rounded-[6px] border border-rule">
              <table className="vh-table min-w-[320px]">
                <thead>
                  <tr>
                    <th>{t.sheet}</th>
                    <th className="text-right">{t.rows}</th>
                  </tr>
                </thead>

                <tbody>
                  {sheets.map((sheet) => (
                    <tr key={sheet.name}>
                      <td className="text-[13px]">{sheet.name}</td>
                      <td className="text-right font-mono tabular-nums">
                        {formatNumber(sheet.rowCount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </StepPanel>

      {error && <AlertBox type="error">{error}</AlertBox>}

      {/* 02 MAPPING */}

      {parsed && (
        <StepPanel
          number="02"
          title={t.stepMapping}
          description={t.stepMappingDesc}
        >
          <div className="overflow-x-auto rounded-[6px] border border-rule">
            <table className="vh-table min-w-[480px]">
              <thead>
                <tr>
                  <th>{t.field}</th>
                  <th>{t.fileColumn}</th>
                </tr>
              </thead>

              <tbody>
                {mappingRows.map(([field, headers]) => (
                  <tr key={field}>
                    <td className="text-[13px]">
                      <span className="text-ink">{t.fieldLabels[field]}</span>
                      <span className="ml-2 font-mono text-[11px] text-faint">
                        {field}
                      </span>
                    </td>

                    <td className="text-[13px]">
                      {headers.length > 0 ? (
                        <span className="font-mono text-moss">
                          {headers.join(" / ")}
                        </span>
                      ) : (
                        <span className="text-faint">{t.columnNotFound}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="vh-eyebrow mt-5">{t.unusedColumns}</h3>

          <div className="mt-3 flex flex-wrap gap-2">
            {unusedHeaders.length > 0 ? (
              unusedHeaders.map((header) => (
                <span key={header} className="vh-tag font-mono">
                  {header}
                </span>
              ))
            ) : (
              <span className="text-[13px] text-muted">{t.noUnusedColumns}</span>
            )}
          </div>
        </StepPanel>
      )}

      {/* 03 SUMMARY */}

      {summary && (
        <StepPanel
          number="03"
          title={t.stepSummary}
          description={t.stepSummaryDesc}
        >
          <fieldset>
            <legend className="vh-eyebrow !text-[10px]">{t.requiredTitle}</legend>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
              {REQUIRED_FIELD_OPTIONS.map((field) => (
                <label
                  key={field}
                  className={`flex items-center gap-2 text-[14px] text-ink-soft ${
                    importing ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    data-required-field={field}
                    checked={requiredFields.includes(field)}
                    onChange={() => toggleRequired(field)}
                    disabled={importing}
                    className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-moss"
                  />

                  {t.fieldLabels[field]}
                </label>
              ))}
            </div>
          </fieldset>

          <div
            data-testid="import-summary"
            className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            <StatCard id="total" label={t.totalRows} value={totalRows} />

            <StatCard
              id="ready"
              label={t.readyRows}
              value={summary.ready.length}
              tone="moss"
            />

            {SKIP_REASONS.map((reason, index) => (
              <StatCard
                key={reason}
                id={reason}
                label={`${String.fromCharCode(97 + index)}) ${t.reasons[reason]}`}
                value={summary.reasonCounts[reason]}
                sub={
                  reason === "pnuDuplicateInFile" && duplicateNumbers
                    ? t.duplicateNumbers(duplicateNumbers)
                    : null
                }
                tone={summary.reasonCounts[reason] ? "clay" : null}
              />
            ))}

            <StatCard
              id="warnings"
              label={t.warnings}
              value={warningTotal}
              sub={t.warningsHint}
              tone={warningTotal ? "ochre" : null}
            />
          </div>

          {warningTotal > 0 && (
            <ul className="mt-4 space-y-1 text-[13px] leading-6 text-ochre">
              {Object.entries(warningCounts).map(([code, count]) => (
                <li key={code}>
                  • {t.warningSummary[code]} —{" "}
                  <span className="font-mono tabular-nums">
                    {formatNumber(count)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
            <button
              type="button"
              data-download-report
              onClick={() => handleDownloadReport("screening")}
              disabled={creatingReport}
              aria-busy={creatingReport}
              className="vh-btn vh-btn-outline w-full sm:w-auto"
            >
              {creatingReport && reportResult?.kind === "screening" ? (
                <LoadingIcon className="h-4 w-4 animate-spin" />
              ) : (
                <DownloadIcon className="h-4 w-4" />
              )}

              {creatingReport && reportResult?.kind === "screening"
                ? t.creatingReport
                : t.downloadReport}
            </button>
          </div>

          {!confirmOpen && (
            <ReportStatus t={t} result={reportResult} kind="screening" />
          )}

          <div className="vh-rule mt-6" />

          {/* IMPORT */}

          {importing && importProgress ? (
            <div data-testid="import-progress">
              <ProgressBar
                label={
                  stopRequested
                    ? t.stopping
                    : importProgress.retrying
                      ? t.retryingRows
                      : t.importing
                }
                detail={t.importProgress(
                  importProgress.batch,
                  importProgress.totalBatches,
                  importProgress.imported,
                )}
                done={importProgress.processed}
                total={summary.ready.length}
              />

              <div className="mt-4">
                <button
                  type="button"
                  data-stop-import
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
          ) : (
            <div className="mt-5">
              <button
                type="button"
                data-start-import
                onClick={() => setConfirmOpen(true)}
                disabled={
                  summary.ready.length === 0 || needsRecheck || rechecking
                }
                className="vh-btn vh-btn-primary w-full sm:w-auto"
              >
                <UploadIcon className="h-4 w-4" />

                {summary.ready.length === 0
                  ? t.nothingToImport
                  : t.importButton(summary.ready.length)}
              </button>

              {needsRecheck && (
                <p className="mt-3 text-[13px] leading-6 text-muted">
                  {t.recheckFirst}
                </p>
              )}
            </div>
          )}

          {/* RESULT */}

          {importResult && (
            <div data-testid="import-result" className="mt-7">
              <h3 className="font-serif text-[1.2rem] leading-tight text-ink">
                {t.resultTitle}
              </h3>

              <p className="mt-1.5 font-mono text-[12px] tabular-nums text-muted">
                {t.resultElapsed((importResult.elapsedMs / 1000).toFixed(1))}
              </p>

              {importResult.stopped && (
                <div className="mt-4">
                  <AlertBox type="error">{t.resultStopped}</AlertBox>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.keys(importCounts).map((status) => (
                  <StatCard
                    key={status}
                    id={`import-${status}`}
                    label={t.importStatuses[status]}
                    value={importCounts[status]}
                    tone={
                      status === "success"
                        ? "moss"
                        : importCounts[status]
                          ? status === "failed"
                            ? "clay"
                            : "ochre"
                          : null
                    }
                  />
                ))}
              </div>

              {issueRows.length > 0 && (
                <>
                  <h3 className="vh-eyebrow mt-6">{t.issueRows}</h3>

                  <div className="mt-3">
                    <PagedTable
                      t={t}
                      rows={issueRows}
                      page={issuePage}
                      onPageChange={setIssuePage}
                      testId="import-issue-table"
                      columns={[
                        {
                          key: "pnu_no",
                          label: t.fieldLabels.pnu_no,
                          mono: true,
                          render: (row) => row.pnuNo,
                        },
                        {
                          key: "sheet",
                          label: t.sheet,
                          render: (row) => row.sheet,
                        },
                        {
                          key: "row",
                          label: t.row,
                          mono: true,
                          render: (row) => row.rowNumber,
                        },
                        {
                          key: "status",
                          label: t.status,
                          render: (row) => (
                            <span
                              className={
                                row.importStatus === "failed"
                                  ? "text-clay"
                                  : "text-ochre"
                              }
                            >
                              {t.importStatuses[row.importStatus]}
                            </span>
                          ),
                        },
                        {
                          key: "message",
                          label: t.errorMessage,
                          render: (row) => row.message || "—",
                        },
                      ]}
                    />
                  </div>
                </>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  data-download-result-report
                  onClick={() => handleDownloadReport("result")}
                  disabled={creatingReport}
                  className="vh-btn vh-btn-outline w-full sm:w-auto"
                >
                  {creatingReport && reportResult?.kind === "result" ? (
                    <LoadingIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <DownloadIcon className="h-4 w-4" />
                  )}

                  {t.downloadResultReport}
                </button>

                <button
                  type="button"
                  data-recheck
                  onClick={handleRecheck}
                  disabled={rechecking}
                  className="vh-btn vh-btn-primary w-full sm:w-auto"
                >
                  {rechecking ? (
                    <LoadingIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshIcon className="h-4 w-4" />
                  )}

                  {rechecking ? t.rechecking : t.recheck}
                </button>
              </div>

              <ReportStatus t={t} result={reportResult} kind="result" />

              <p className="mt-3 text-[13px] leading-6 text-muted">
                {t.recheckHint}
              </p>

              {importedPnuNumbers.length > 0 && (
                <div className="mt-7">
                  <GeocodeFillPanel
                    key={importResult.finishedAt.getTime()}
                    mode="imported"
                    pnuNumbers={importedPnuNumbers}
                    autoStart
                  />
                </div>
              )}
            </div>
          )}

          {confirmOpen && (
            <ImportConfirmDialog
              t={t}
              count={summary.ready.length}
              requiredFields={requiredFields}
              reportResult={reportResult}
              creatingReport={creatingReport}
              onDownloadReport={() => handleDownloadReport("screening")}
              onCancel={() => setConfirmOpen(false)}
              onConfirm={handleImport}
            />
          )}
        </StepPanel>
      )}

      {/* 04 READY ROWS */}

      {summary && (
        <StepPanel number="04" title={t.readyTitle}>
          <PagedTable
            t={t}
            rows={summary.ready}
            page={readyPage}
            onPageChange={setReadyPage}
            testId="ready-table"
            columns={[
              {
                key: "sheet",
                label: t.sheet,
                render: (row) => row.sheet,
              },
              {
                key: "row",
                label: t.row,
                mono: true,
                render: (row) => row.rowNumber,
              },
              ...tableFields.map((field) => ({
                key: field,
                label: t.fieldLabels[field],
                mono: field === "pnu_no",
                render: (row) => row.values[field] ?? "—",
              })),
              {
                key: "warnings",
                label: t.warning,
                render: (row) =>
                  row.warnings.length > 0 ? (
                    <span className="text-ochre">
                      {row.warnings.map((code) => warningText(row, code)).join(" • ")}
                    </span>
                  ) : (
                    "—"
                  ),
              },
            ]}
          />
        </StepPanel>
      )}

      {/* 05 SKIPPED ROWS */}

      {summary && (
        <StepPanel number="05" title={t.skippedTitle}>
          <div className="flex flex-wrap gap-2">
            {[["all", summary.skipped.length], ...SKIP_REASONS.map((reason) => [reason, summary.reasonCounts[reason]])].map(
              ([value, count]) => (
                <button
                  key={value}
                  type="button"
                  data-skip-filter={value}
                  onClick={() => {
                    setSkipFilter(value);
                    setSkippedPage(1);
                  }}
                  aria-pressed={skipFilter === value}
                  className={`vh-btn vh-btn-sm ${
                    skipFilter === value ? "vh-btn-primary" : "vh-btn-outline"
                  }`}
                >
                  {value === "all" ? t.filterAll : t.reasons[value]}

                  <span className="font-mono tabular-nums opacity-70">
                    {formatNumber(count)}
                  </span>
                </button>
              ),
            )}
          </div>

          <div className="mt-4">
            <PagedTable
              t={t}
              rows={filteredSkipped}
              page={skippedPage}
              onPageChange={setSkippedPage}
              testId="skipped-table"
              columns={[
                {
                  key: "sheet",
                  label: t.sheet,
                  render: (row) => row.sheet,
                },
                {
                  key: "row",
                  label: t.row,
                  mono: true,
                  render: (row) => row.rowNumber,
                },
                {
                  key: "pnu_no",
                  label: t.fieldLabels.pnu_no,
                  mono: true,
                  render: (row) => row.values.pnu_no ?? "—",
                },
                {
                  key: "reason",
                  label: t.reason,
                  render: (row) => (
                    <span className="text-clay">{t.reasons[row.reason]}</span>
                  ),
                },
                {
                  key: "missing",
                  label: t.missing,
                  render: (row) =>
                    row.missing?.length
                      ? row.missing.map((field) => t.fieldLabels[field]).join(", ")
                      : "—",
                },
                ...tableFields
                  .filter((field) => field !== "pnu_no")
                  .map((field) => ({
                    key: field,
                    label: t.fieldLabels[field],
                    render: (row) => row.values[field] ?? "—",
                  })),
              ]}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/account/plants"
              className="vh-btn vh-btn-outline w-full sm:w-auto"
            >
              {t.goToList}
            </Link>
          </div>
        </StepPanel>
      )}
    </div>
  );
}

/* ข้อความหลังดาวน์โหลดรายงาน แบบเดียวกับปุ่ม PDF ป้าย */
function ReportStatus({ t, result, kind }) {
  if (result?.kind !== kind) {
    return null;
  }

  if (result.status === "done") {
    return (
      <p
        role="status"
        data-report-result="done"
        data-report-kind={kind}
        className="mt-4 flex items-start gap-2.5 rounded-[6px] border border-moss/30 bg-moss-soft px-3.5 py-3 text-[13px] leading-6 text-moss"
      >
        <CheckIcon className="mt-1 h-4 w-4 shrink-0" />

        <span className="min-w-0 break-words">
          {t.reportDownloaded(result.fileName)}
        </span>
      </p>
    );
  }

  if (result.status === "failed") {
    return (
      <p
        role="alert"
        data-report-result="failed"
        data-report-kind={kind}
        className="mt-4 flex items-start gap-2.5 rounded-[6px] border border-clay/40 bg-clay-soft px-3.5 py-3 text-[13px] leading-6 text-clay"
      >
        <AlertIcon className="mt-1 h-4 w-4 shrink-0" />

        <span className="min-w-0">{t.reportFailed}</span>
      </p>
    );
  }

  return null;
}

function ImportConfirmDialog({
  t,
  count,
  requiredFields,
  reportResult,
  creatingReport,
  onDownloadReport,
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  /*
   * render ที่ body: .page-enter มี transform ทำให้ position: fixed
   * อิงกรอบเนื้อหาแทนหน้าจอ กล่องยืนยันจะหลุดไปอยู่ท้ายหน้า
   */
  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/40 p-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:items-center"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="import-confirm-title"
        aria-describedby="import-confirm-description"
        data-testid="import-confirm"
        className="vh-sheet page-enter max-h-full w-full max-w-md overflow-y-auto p-6 shadow-lift"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="vh-eyebrow flex items-center gap-3">
          <span className="h-px w-6 bg-ochre" />
          {t.confirmTitle}
        </p>

        <h2
          id="import-confirm-title"
          className="vh-display mt-3 text-[1.5rem] leading-tight"
        >
          {t.confirmCount(count)}
        </h2>

        <div id="import-confirm-description" className="mt-4 space-y-3 text-[14px] leading-6">
          <p className="text-muted">
            {t.confirmBatches(Math.ceil(count / IMPORT_BATCH_SIZE), IMPORT_BATCH_SIZE)}
          </p>

          <div>
            <p className="vh-eyebrow !text-[10px]">{t.confirmRequired}</p>

            <p className="mt-1 text-ink-soft">
              {requiredFields.length
                ? requiredFields.map((field) => t.fieldLabels[field]).join(", ")
                : "—"}
            </p>
          </div>

          <p className="rounded-[6px] border border-ochre/40 bg-ochre-soft px-3.5 py-3 text-[13px] text-ink-soft">
            {t.confirmReportHint}
          </p>
        </div>

        <button
          type="button"
          onClick={onDownloadReport}
          disabled={creatingReport}
          className="vh-btn vh-btn-ghost vh-btn-sm mt-3 -ml-3"
        >
          {creatingReport ? (
            <LoadingIcon className="h-4 w-4 animate-spin" />
          ) : (
            <DownloadIcon className="h-4 w-4" />
          )}

          {t.downloadReport}
        </button>

        <ReportStatus t={t} result={reportResult} kind="screening" />

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="vh-btn vh-btn-outline"
            autoFocus
          >
            {t.cancel}
          </button>

          <button
            type="button"
            data-confirm-import
            onClick={onConfirm}
            className="vh-btn vh-btn-primary"
          >
            <UploadIcon className="h-4 w-4" />
            {t.importButton(count)}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* =========================================================
   IMAGE IMPORT BY PNU
========================================================= */

function ImageImportSection({ t, user }) {
  const m = t.img;

  /*
   * item: { key, file, fileName, pnu, plant, status, outcome, reason }
   * status (ก่อนอัปโหลด): ready | hasImage | notFound | notNumber | duplicateFile
   * outcome (หลังอัปโหลด): success | replaced | skipped | failed
   */
  const [items, setItems] = useState([]);

  const [matching, setMatching] = useState(false);

  const [replaceExisting, setReplaceExisting] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const [finished, setFinished] = useState(false);

  const [error, setError] = useState("");

  const [inputKey, setInputKey] = useState(0);

  useWarnBeforeLeave(uploading);

  const busy = matching || uploading;

  const hasExisting = items.some((item) => item.status === "hasImage");

  const targets = items.filter(
    (item) =>
      item.status === "ready" ||
      (item.status === "hasImage" && replaceExisting),
  );

  const counts = items.reduce(
    (total, item) => {
      if (item.outcome === "success" || item.outcome === "replaced") {
        total.success += 1;
      } else if (item.outcome === "skipped") {
        total.skipped += 1;
      } else if (item.outcome === "failed") {
        total.failed += 1;
      }

      return total;
    },
    { success: 0, skipped: 0, failed: 0 },
  );

  function updateItem(key, changes) {
    setItems((previous) =>
      previous.map((item) => (item.key === key ? { ...item, ...changes } : item)),
    );
  }

  function resetAll() {
    setItems([]);
    setProgress({ done: 0, total: 0 });
    setFinished(false);
    setError("");
    setInputKey((key) => key + 1);
  }

  /* =====================================================
     MATCH FILES WITH PLANTS
  ===================================================== */

  async function handleFilesChange(event) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    resetAll();

    setMatching(true);

    try {
      const parsed = files.map((file, index) => ({
        key: `${index}-${file.name}`,
        file,
        fileName: file.name,
        pnu: getPnuFromFileName(file.name),
      }));

      const plants = await fetchPlantsByPnu(
        parsed.map((item) => item.pnu),
        "id, pnu_no, botanical_name, image_url",
      );

      const pnuCounts = new Map();

      parsed.forEach((item) => {
        if (item.pnu !== null) {
          pnuCounts.set(item.pnu, (pnuCounts.get(item.pnu) || 0) + 1);
        }
      });

      setItems(
        parsed.map((item) => {
          const plant = item.pnu !== null ? plants.get(item.pnu) || null : null;

          let status = "ready";

          if (item.pnu === null) {
            status = "notNumber";
          } else if (!plant) {
            status = "notFound";
          } else if (pnuCounts.get(item.pnu) > 1) {
            /* ไม่รู้ว่าไฟล์ไหนถูก จึงไม่อัปโหลดทั้งหมด */
            status = "duplicateFile";
          } else if (plant.image_url) {
            status = "hasImage";
          }

          return { ...item, plant, status, outcome: null, reason: "" };
        }),
      );
    } catch (err) {
      console.error("Match image files error:", err);

      setError(m.matchFailed);
    } finally {
      setMatching(false);
    }
  }

  /* =====================================================
     UPLOAD
  ===================================================== */

  async function uploadOne(item) {
    let uploadedPath = null;

    try {
      let prepared;

      try {
        prepared = await preparePlantImage(item.file);
      } catch (err) {
        throw new Error(m.reasons[err?.code] || m.reasons.INVALID_IMAGE_TYPE);
      }

      const imageFile = prepared.file;

      const filePath = `${user.id}/${crypto.randomUUID()}.${getImageExtension(imageFile)}`;

      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: imageFile.type,
        });

      if (uploadError) {
        throw new Error(`${m.reasons.uploadFailed}: ${uploadError.message}`);
      }

      uploadedPath = filePath;

      const { data: urlData } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error(m.reasons.uploadFailed);
      }

      /*
       * อัปเดตเฉพาะเมื่อ pnu_no และรูปเดิมยังตรงกับตอนจับคู่
       * กันการเขียนทับรูปที่ถูกเปลี่ยนระหว่างอัปโหลด
       */
      const oldImageUrl = item.plant.image_url ?? null;

      let query = supabase
        .from("plants")
        .update({ image_url: urlData.publicUrl })
        .eq("id", item.plant.id)
        .eq("pnu_no", item.pnu);

      query =
        oldImageUrl === null
          ? query.is("image_url", null)
          : query.eq("image_url", oldImageUrl);

      const { data: updated, error: updateError } = await query
        .select("id")
        .maybeSingle();

      if (updateError) {
        throw new Error(`${m.reasons.updateFailed}: ${updateError.message}`);
      }

      if (!updated) {
        throw new Error(m.reasons.changed);
      }

      uploadedPath = null;

      /* แทนที่สำเร็จแล้ว ลบรูปเดิมเฉพาะไฟล์ใน bucket plant-images */
      const oldPath = getPlantImageStoragePath(oldImageUrl);

      if (oldPath && oldPath !== filePath) {
        await removeStorageFile(oldPath, "Remove old image failed:");
      }

      updateItem(item.key, {
        outcome: oldImageUrl ? "replaced" : "success",
        reason: "",
      });
    } catch (err) {
      console.error("Import image error:", err);

      /* อัปโหลดไฟล์แล้วแต่บันทึกไม่สำเร็จ ให้ลบไฟล์ที่ไม่ได้ใช้ออก */
      if (uploadedPath) {
        await removeStorageFile(uploadedPath, "Remove unused image failed:");
      }

      updateItem(item.key, {
        outcome: "failed",
        reason: err?.message || m.reasons.uploadFailed,
      });
    } finally {
      setProgress((previous) => ({ ...previous, done: previous.done + 1 }));
    }
  }

  async function handleUpload() {
    if (busy || targets.length === 0) {
      return;
    }

    setError("");

    const targetKeys = new Set(targets.map((item) => item.key));

    /* ไฟล์ที่ไม่ได้อัปโหลด: ข้าม (ผู้ใช้เลือก) หรือ ล้มเหลว (จับคู่ไม่ได้) */
    setItems((previous) =>
      previous.map((item) => {
        if (targetKeys.has(item.key)) {
          return item;
        }

        return item.status === "hasImage"
          ? { ...item, outcome: "skipped", reason: m.statuses.hasImage }
          : { ...item, outcome: "failed", reason: m.statuses[item.status] };
      }),
    );

    setUploading(true);
    setProgress({ done: 0, total: targets.length });

    await runWithConcurrency(targets, IMAGE_UPLOAD_CONCURRENCY, uploadOne);

    setUploading(false);
    setFinished(true);
  }

  /* =====================================================
     RENDER
  ===================================================== */

  function statusClass(status) {
    if (status === "ready") return "text-moss";

    if (status === "hasImage") return "text-ochre";

    return "text-clay";
  }

  function outcomeClass(outcome) {
    if (outcome === "success" || outcome === "replaced") return "text-moss";

    if (outcome === "skipped") return "text-ochre";

    return "text-clay";
  }

  return (
    <div className="mt-7 space-y-6">
      {/* 01 CHOOSE */}

      <StepPanel number="01" title={m.stepChoose} description={m.stepChooseDesc}>
        <label
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed border-rule-strong bg-sheet px-4 py-8 text-center transition hover:border-moss hover:bg-moss-soft ${
            busy ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <input
            key={inputKey}
            type="file"
            multiple
            accept={IMAGE_INPUT_ACCEPT}
            onChange={handleFilesChange}
            disabled={busy}
            className="sr-only"
          />

          {matching ? (
            <LoadingIcon className="h-6 w-6 animate-spin text-moss" />
          ) : (
            <ImageIcon className="h-6 w-6 text-moss" />
          )}

          <span className="text-[15px] font-medium text-ink">
            {matching ? m.matching : m.choose}
          </span>

          <span className="text-[13px] text-muted">
            {items.length ? m.selected(items.length) : m.chooseHint}
          </span>
        </label>
      </StepPanel>

      {error && <AlertBox type="error">{error}</AlertBox>}

      {/* 02 REVIEW / RESULT */}

      {items.length > 0 && (
        <StepPanel number="02" title={m.stepReview}>
          {finished && (
            <div className="mb-5">
              <AlertBox type={counts.failed ? "error" : "success"}>
                {m.summary(counts.success, counts.skipped, counts.failed)}
              </AlertBox>
            </div>
          )}

          {hasExisting && !finished && (
            <fieldset className="mb-5" disabled={busy}>
              <legend className="vh-eyebrow !text-[10px]">
                {m.existingLabel}
              </legend>

              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  [false, m.existingSkip],
                  [true, m.existingReplace],
                ].map(([value, label]) => (
                  <label
                    key={label}
                    className={`vh-btn vh-btn-sm cursor-pointer ${
                      replaceExisting === value
                        ? "vh-btn-primary"
                        : "vh-btn-outline"
                    }`}
                  >
                    <input
                      type="radio"
                      name="existing-image"
                      checked={replaceExisting === value}
                      onChange={() => setReplaceExisting(value)}
                      className="sr-only"
                    />

                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="max-h-[520px] overflow-auto rounded-[6px] border border-rule">
            <table className="vh-table min-w-[720px]">
              <thead>
                <tr>
                  <th>{m.fileName}</th>
                  <th>{m.pnu}</th>
                  <th>{m.plantName}</th>
                  <th>{m.status}</th>
                  {(uploading || finished) && <th>{m.result}</th>}
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.key}
                    className={
                      item.outcome === "failed" ||
                      (!item.outcome &&
                        item.status !== "ready" &&
                        item.status !== "hasImage")
                        ? "bg-clay-soft"
                        : ""
                    }
                  >
                    <td
                      className="max-w-[220px] truncate font-mono text-[13px]"
                      title={item.fileName}
                    >
                      {item.fileName}
                    </td>

                    <td className="font-mono tabular-nums">
                      {item.pnu ?? "—"}
                    </td>

                    <td className="max-w-[240px] truncate text-[13px] italic">
                      {item.plant?.botanical_name || "—"}
                    </td>

                    <td className={`text-[13px] ${statusClass(item.status)}`}>
                      {m.statuses[item.status]}
                    </td>

                    {(uploading || finished) && (
                      <td className="min-w-[200px] text-[13px]">
                        {item.outcome ? (
                          <>
                            <span className={outcomeClass(item.outcome)}>
                              {m.results[item.outcome]}
                            </span>

                            {item.reason && item.outcome !== "skipped" && (
                              <span className="mt-0.5 block text-clay">
                                {item.reason}
                              </span>
                            )}
                          </>
                        ) : (
                          <LoadingIcon className="h-4 w-4 animate-spin text-muted" />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(uploading || finished) && (
            <ProgressBar
              label={m.uploading}
              detail={m.progress(progress.done, progress.total)}
              done={progress.done}
              total={progress.total}
            />
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {finished ? (
              <>
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
                  {m.startOver}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleUpload}
                disabled={busy || targets.length === 0}
                className="vh-btn vh-btn-primary w-full sm:w-auto"
              >
                {uploading ? (
                  <LoadingIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadIcon className="h-4 w-4" />
                )}

                {targets.length === 0
                  ? m.nothingToUpload
                  : m.upload(targets.length)}
              </button>
            )}
          </div>
        </StepPanel>
      )}
    </div>
  );
}

/* =========================================================
   SHARED UI
========================================================= */

/* ลบไฟล์ใน bucket plant-images ถ้าไม่สำเร็จให้ log ไว้เท่านั้น */
async function removeStorageFile(path, logMessage) {
  try {
    const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([path]);

    if (error) {
      console.error(logMessage, error);
    }
  } catch (err) {
    console.error(logMessage, err);
  }
}
