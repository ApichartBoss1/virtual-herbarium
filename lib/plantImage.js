/* =========================================================
   PLANT IMAGE UTILITIES

   - JPG / PNG / WEBP ใช้ไฟล์เดิม
   - HEIC / HEIF แปลงเป็น JPEG ก่อนนำไป preview/upload
========================================================= */

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export const MAX_HEIC_SOURCE_SIZE = 25 * 1024 * 1024;

export const STANDARD_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const HEIC_IMAGE_TYPES = ["image/heic", "image/heif"];

export const IMAGE_INPUT_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";

/* =========================================================
   CHECK HEIC / HEIF

   บางอุปกรณ์อาจไม่ส่ง MIME type มา
   จึงตรวจนามสกุลไฟล์ร่วมด้วย
========================================================= */

export function isHeicImage(file) {
  if (!file) {
    return false;
  }

  const mimeType = (file.type || "").toLowerCase();

  const fileName = (file.name || "").toLowerCase();

  return (
    HEIC_IMAGE_TYPES.includes(mimeType) ||
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif")
  );
}

/* =========================================================
   NORMAL IMAGE
========================================================= */

export function isStandardImage(file) {
  if (!file) {
    return false;
  }

  return STANDARD_IMAGE_TYPES.includes((file.type || "").toLowerCase());
}

/* =========================================================
   IMAGE EXTENSION
========================================================= */

export function getImageExtension(file) {
  const type = (file?.type || "").toLowerCase();

  if (type === "image/png") {
    return "png";
  }

  if (type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

/* =========================================================
   CONVERT HEIC -> JPEG
========================================================= */

export async function convertHeicToJpeg(file) {
  if (!isHeicImage(file)) {
    return file;
  }

  /*
   * Dynamic import ป้องกันปัญหา package ฝั่ง SSR
   */

  const module = await import("heic2any");

  const heic2any = module.default || module;

  const result = await heic2any({
    blob: file,

    toType: "image/jpeg",

    /*
     * คุณภาพสูงพอสำหรับ specimen
     * แต่ไม่ทำให้ไฟล์ใหญ่เกินไป
     */

    quality: 0.9,
  });

  /*
   * heic2any บางกรณีคืน array
   */

  const jpegBlob = Array.isArray(result) ? result[0] : result;

  if (!jpegBlob) {
    throw new Error("Unable to convert HEIC image.");
  }

  const originalName = file.name || "plant-image.heic";

  const baseName = originalName.replace(/\.(heic|heif)$/i, "");

  return new File([jpegBlob], `${baseName}.jpg`, {
    type: "image/jpeg",

    lastModified: Date.now(),
  });
}

/* =========================================================
   PREPARE IMAGE

   คืนไฟล์พร้อม upload
========================================================= */

export async function preparePlantImage(file) {
  if (!file) {
    throw new Error("No image selected.");
  }

  /* -----------------------------------------------------
     HEIC / HEIF
  ----------------------------------------------------- */

  if (isHeicImage(file)) {
    /*
     * ยอมให้ source HEIC ใหญ่กว่า 10MB ได้เล็กน้อย
     * เพราะหลังแปลง JPEG มักเล็กลง
     */

    if (file.size > MAX_HEIC_SOURCE_SIZE) {
      const error = new Error("HEIC_SOURCE_TOO_LARGE");

      error.code = "HEIC_SOURCE_TOO_LARGE";

      throw error;
    }

    let convertedFile;

    try {
      convertedFile = await convertHeicToJpeg(file);
    } catch (error) {
      console.error("HEIC conversion failed:", error);

      const conversionError = new Error("HEIC_CONVERSION_FAILED");

      conversionError.code = "HEIC_CONVERSION_FAILED";

      throw conversionError;
    }

    if (convertedFile.size > MAX_IMAGE_SIZE) {
      const error = new Error("IMAGE_TOO_LARGE");

      error.code = "IMAGE_TOO_LARGE";

      throw error;
    }

    return {
      file: convertedFile,

      converted: true,

      originalFile: file,
    };
  }

  /* -----------------------------------------------------
     JPG / PNG / WEBP
  ----------------------------------------------------- */

  if (!isStandardImage(file)) {
    const error = new Error("INVALID_IMAGE_TYPE");

    error.code = "INVALID_IMAGE_TYPE";

    throw error;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    const error = new Error("IMAGE_TOO_LARGE");

    error.code = "IMAGE_TOO_LARGE";

    throw error;
  }

  return {
    file,
    converted: false,
    originalFile: file,
  };
}
