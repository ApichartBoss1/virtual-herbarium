"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";

import NameCheck from "@/components/NameCheck";
import Navbar from "@/components/Navbar";
import { useAdmin } from "@/components/AdminContext";
import { supabase } from "@/lib/supabase";
import { useLeafletMap } from "@/lib/useLeafletMap";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import {
  IMAGE_INPUT_ACCEPT,
  getImageExtension,
  getPlantImageStoragePath,
  preparePlantImage,
} from "@/lib/plantImage";

/* =========================================================
   CONFIG
========================================================= */

const IMAGE_BUCKET = "plant-images";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFAULT_MAP_CENTER = {
  latitude: 15.87,
  longitude: 100.99,
};

const DEFAULT_MAP_ZOOM = 5;

const FORWARD_GEOCODING_URL =
  process.env.NEXT_PUBLIC_FORWARD_GEOCODING_URL ||
  "https://nominatim.openstreetmap.org/search";

const MAP_TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const ELEVATION_URL =
  process.env.NEXT_PUBLIC_ELEVATION_URL ||
  "https://api.open-meteo.com/v1/elevation";

const INITIAL_FORM = {
  pnu_no: "",
  artificial_group: "",
  family: "",
  botanical_name: "",
  collected_by: "",
  collector_no: "",
  locality: "",

  latitude: null,
  longitude: null,
  elevation: "",
};

/* =========================================================
   COPY
========================================================= */

const COPY = {
  TH: {
    eyebrow: "แก้ไขตัวอย่างพรรณไม้",

    title: "แก้ไขข้อมูลพรรณไม้",

    subtitle:
      "แก้ไขข้อมูลตัวอย่างพรรณไม้ รูปภาพ ตำแหน่งพิกัด และระดับความสูงจากน้ำทะเล",

    back: "กลับคลังพรรณไม้",

    plant: "ข้อมูลพรรณไม้",

    plantDesc: "แก้ไขข้อมูลตัวอย่างพรรณไม้ตามชุดข้อมูล PNU",

    pnuNo: "หมายเลข PNU",

    pnuNoPh: "เช่น 5001",

    artificialGroup: "กลุ่มพืช",

    artificialGroupPh: "เช่น angiosperm",

    family: "วงศ์",

    familyPh: "เช่น Euphorbiaceae",

    botanical: "ชื่อวิทยาศาสตร์",

    botanicalPh: "เช่น Chaetocarpus castanocarpus (Roxb.) Thw.",

    collection: "ข้อมูลผู้เก็บตัวอย่าง",

    collectionDesc: "แก้ไขชื่อผู้เก็บตัวอย่างและหมายเลขผู้เก็บ",

    collector: "ผู้เก็บตัวอย่าง",

    collectorPh: "เช่น A. Boonkongchart",

    collectorNo: "หมายเลขผู้เก็บ",

    collectorNoPh: "เช่น 175 หรือ 584(2)",

    location: "สถานที่และพิกัด",

    locationDesc:
      "แก้ไขสถานที่ได้โดยพิมพ์ Locality แล้วหยุดประมาณ 1 วินาที ระบบจะค้นหาและเลื่อนหมุดให้อัตโนมัติ",

    image: "รูปภาพตัวอย่าง",

    imageDesc: "ใช้รูปเดิม เปลี่ยนรูปจากเครื่อง หรือถ่ายภาพใหม่ได้",

    currentImage: "รูปภาพปัจจุบัน",

    newImage: "รูปภาพใหม่",

    noImage: "ยังไม่มีรูปภาพ",

    chooseImage: "เลือกรูปจากเครื่อง",

    takePhoto: "ถ่ายด้วยกล้อง",

    cameraUnavailable: "สามารถถ่ายรูปได้จากมือถือหรือแท็บเล็ตเท่านั้น",

    imageHint: "JPG, PNG, WEBP ไม่เกิน 10MB • HEIC / HEIF จะถูกแปลงเป็น JPEG",

    invalidImage: "รองรับเฉพาะ JPG, PNG, WEBP, HEIC และ HEIF",

    imageTooLarge: "รูปภาพหลังประมวลผลต้องมีขนาดไม่เกิน 10MB",

    heicSourceTooLarge: "ไฟล์ HEIC / HEIF ต้นฉบับต้องมีขนาดไม่เกิน 25MB",

    heicConversionError:
      "ไม่สามารถแปลงไฟล์ HEIC / HEIF ได้ กรุณาลองเลือกรูปอื่น",

    converting: "กำลังเตรียมรูปภาพ...",

    converted: "แปลงรูป HEIC / HEIF เป็น JPEG เรียบร้อยแล้ว",

    selectedFile: "ไฟล์ใหม่ที่จะอัปโหลด",

    restoreImage: "ใช้รูปเดิม",

    requiredLabel: "จำเป็น",

    pnuRequired: "กรุณากรอกหมายเลข PNU",

    pnuError: "หมายเลข PNU ต้องเป็นเลขจำนวนเต็มตั้งแต่ 1 ขึ้นไป",

    botanicalRequired: "กรุณากรอกชื่อวิทยาศาสตร์",

    loginRequired: "กรุณาเข้าสู่ระบบ",

    uploadError: "ไม่สามารถอัปโหลดรูปภาพได้",

    updateError: "ไม่สามารถแก้ไขข้อมูลได้",

    success: "แก้ไขข้อมูลพรรณไม้เรียบร้อยแล้ว",

    loading: "กำลังโหลดข้อมูลพรรณไม้...",

    notFound: "ไม่พบข้อมูลพรรณไม้ หรือคุณไม่มีสิทธิ์แก้ไขรายการนี้",

    pnuDuplicate: "หมายเลข PNU นี้มีอยู่ในระบบแล้ว",

    cancel: "ยกเลิก",

    save: "บันทึกการแก้ไข",

    saving: "กำลังบันทึก...",
  },

  EN: {
    eyebrow: "EDIT SPECIMEN",

    title: "Edit Plant Record",

    subtitle:
      "Update specimen information, image, coordinates and elevation above sea level.",

    back: "Back to Plant Collection",

    plant: "Plant Information",

    plantDesc: "Update the specimen information used by the PNU dataset.",

    pnuNo: "PNU No.",

    pnuNoPh: "e.g. 5001",

    artificialGroup: "Artificial Group",

    artificialGroupPh: "e.g. angiosperm",

    family: "Family",

    familyPh: "e.g. Euphorbiaceae",

    botanical: "Botanical Name",

    botanicalPh: "e.g. Chaetocarpus castanocarpus (Roxb.) Thw.",

    collection: "Collector Information",

    collectionDesc: "Update the collector name and collector number.",

    collector: "Collector",

    collectorPh: "e.g. A. Boonkongchart",

    collectorNo: "Collector No.",

    collectorNoPh: "e.g. 175 or 584(2)",

    location: "Location & Coordinates",

    locationDesc:
      "Edit the locality and pause typing for about one second. The map will automatically find the location and move the marker.",

    image: "Plant Image",

    imageDesc:
      "Keep the current image, choose another image, or take a new photo.",

    currentImage: "Current Image",

    newImage: "New Image",

    noImage: "No image selected",

    chooseImage: "Choose Image",

    takePhoto: "Take Photo",

    cameraUnavailable: "Photo capture is available on mobile or tablet only.",

    imageHint: "JPG, PNG, WEBP up to 10MB • HEIC / HEIF is converted to JPEG",

    invalidImage: "Supported formats: JPG, PNG, WEBP, HEIC and HEIF",

    imageTooLarge: "The processed image must be 10MB or smaller",

    heicSourceTooLarge: "The source HEIC / HEIF image must be 25MB or smaller",

    heicConversionError:
      "Unable to convert the HEIC / HEIF image. Please choose another image.",

    converting: "Preparing image...",

    converted: "HEIC / HEIF image converted to JPEG",

    selectedFile: "New upload file",

    restoreImage: "Use Current Image",

    requiredLabel: "Required",

    pnuRequired: "Please enter the PNU No.",

    pnuError: "PNU No. must be a whole number greater than or equal to 1",

    botanicalRequired: "Please enter the Botanical Name",

    loginRequired: "Please log in",

    uploadError: "Unable to upload image",

    updateError: "Unable to update plant",

    success: "Plant record updated successfully",

    loading: "Loading plant record...",

    notFound:
      "Plant record not found or you do not have permission to edit it.",

    pnuDuplicate: "This PNU No. already exists in the system.",

    cancel: "Cancel",

    save: "Save Changes",

    saving: "Saving...",
  },
};

/* =========================================================
   PAGE
========================================================= */

export default function EditPlantPage() {
  const router = useRouter();

  const params = useParams();

  const { language } = useSiteSettings();

  const isEnglish = language === "EN";

  const t = isEnglish ? COPY.EN : COPY.TH;

  const plantId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  /* =====================================================
     STATE
  ===================================================== */

  const { user } = useAdmin();

  const [form, setForm] = useState(INITIAL_FORM);

  const [imageFile, setImageFile] = useState(null);

  const [preview, setPreview] = useState("");

  const [oldImageUrl, setOldImageUrl] = useState("");

  const [canUseCamera, setCanUseCamera] = useState(false);

  const [processingImage, setProcessingImage] = useState(false);

  const [imageNotice, setImageNotice] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [fatalError, setFatalError] = useState("");

  const [success, setSuccess] = useState("");

  /* snapshot of the saved record, used for the page header */
  const [record, setRecord] = useState({
    pnu_no: "",

    botanical_name: "",

    family: "",
  });

  const fileInputRef = useRef(null);

  const cameraInputRef = useRef(null);

  /* =====================================================
     CAMERA SUPPORT
  ===================================================== */

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }

    const userAgent = navigator.userAgent || navigator.vendor || "";

    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

    const iPadOS = /Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1;

    setCanUseCamera(mobile || iPadOS);
  }, []);

  /* =====================================================
     LOAD PLANT
     สิทธิ์ admin ตรวจแล้วที่ app/account/layout.js
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadPlant() {
      try {
        if (!plantId || !UUID_PATTERN.test(plantId)) {
          throw new Error(t.notFound);
        }

        const {
          data: plant,

          error: plantError,
        } = await supabase
          .from("plants")
          .select(
            `
                id,
                user_id,
                pnu_no,
                artificial_group,
                family,
                botanical_name,
                collected_by,
                collector_no,
                locality,
                latitude,
                longitude,
                elevation,
                image_url
              `,
          )
          .eq("id", plantId)
          .maybeSingle();

        if (!mounted) {
          return;
        }

        if (plantError || !plant) {
          throw new Error(t.notFound);
        }

        setForm({
          pnu_no:
            plant.pnu_no !== null && plant.pnu_no !== undefined
              ? String(plant.pnu_no)
              : "",

          artificial_group: plant.artificial_group || "",

          family: plant.family || "",

          botanical_name: plant.botanical_name || "",

          collected_by: plant.collected_by || "",

          collector_no: plant.collector_no || "",

          locality: plant.locality || "",

          latitude: toFiniteNumberOrNull(plant.latitude),

          longitude: toFiniteNumberOrNull(plant.longitude),

          elevation:
            plant.elevation !== null && plant.elevation !== undefined
              ? String(plant.elevation)
              : "",
        });

        setRecord({
          pnu_no:
            plant.pnu_no !== null && plant.pnu_no !== undefined
              ? String(plant.pnu_no)
              : "",

          botanical_name: plant.botanical_name || "",

          family: plant.family || "",
        });

        const existingImage = plant.image_url || "";

        setOldImageUrl(existingImage);

        setPreview(existingImage);
      } catch (err) {
        console.error("Load plant error:", err);

        if (mounted) {
          setFatalError(err?.message || t.notFound);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPlant();

    return () => {
      mounted = false;
    };
  }, [plantId, t.notFound]);

  /* =====================================================
     CLEAN PREVIEW
  ===================================================== */

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /* =====================================================
     FORM
  ===================================================== */

  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,

      [name]: value,
    }));

    setError("");

    setSuccess("");
  }

  /* =====================================================
     MAP RESULT
  ===================================================== */

  function handleLocationResolved(locationData) {
    setForm((previous) => ({
      ...previous,

      latitude:
        locationData.latitude !== undefined
          ? toFiniteNumberOrNull(locationData.latitude)
          : previous.latitude,

      longitude:
        locationData.longitude !== undefined
          ? toFiniteNumberOrNull(locationData.longitude)
          : previous.longitude,

      elevation:
        locationData.elevation !== undefined
          ? locationData.elevation !== null &&
            Number.isFinite(Number(locationData.elevation))
            ? String(Math.round(Number(locationData.elevation)))
            : ""
          : previous.elevation,
    }));

    setError("");

    setSuccess("");
  }

  function handleLocationFieldChange(name, value) {
    updateField(name, value);
  }

  /* =====================================================
     IMAGE BUTTONS
  ===================================================== */

  function handleChooseImage() {
    fileInputRef.current?.click();
  }

  function handleTakePhoto() {
    if (!canUseCamera) {
      return;
    }

    cameraInputRef.current?.click();
  }

  /* =====================================================
     IMAGE PROCESS
  ===================================================== */

  async function handleImageChange(event) {
    const input = event.target;

    const selectedFile = input.files?.[0];

    input.value = "";

    if (!selectedFile) {
      return;
    }

    setError("");

    setSuccess("");

    setImageNotice("");

    setProcessingImage(true);

    try {
      const {
        file: preparedFile,

        converted,
      } = await preparePlantImage(selectedFile);

      const objectUrl = URL.createObjectURL(preparedFile);

      setImageFile(preparedFile);

      setPreview((oldPreview) => {
        if (oldPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(oldPreview);
        }

        return objectUrl;
      });

      if (converted) {
        setImageNotice(t.converted);
      }
    } catch (err) {
      console.error("Prepare image error:", err);

      if (err?.code === "HEIC_SOURCE_TOO_LARGE") {
        setError(t.heicSourceTooLarge);
      } else if (err?.code === "HEIC_CONVERSION_FAILED") {
        setError(t.heicConversionError);
      } else if (err?.code === "IMAGE_TOO_LARGE") {
        setError(t.imageTooLarge);
      } else if (err?.code === "INVALID_IMAGE_TYPE") {
        setError(t.invalidImage);
      } else {
        setError(t.uploadError);
      }
    } finally {
      setProcessingImage(false);
    }
  }

  function restoreOldImage() {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setImageFile(null);

    setPreview(oldImageUrl || "");

    setImageNotice("");

    setError("");

    setSuccess("");
  }

  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */

  async function uploadImage() {
    if (!imageFile || !user?.id) {
      return {
        publicUrl: oldImageUrl || null,

        filePath: null,
      };
    }

    const extension = getImageExtension(imageFile);

    const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(filePath, imageFile, {
        cacheControl: "3600",

        upsert: false,

        contentType: imageFile.type,
      });

    if (uploadError) {
      throw new Error(uploadError.message || t.uploadError);
    }

    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error(t.uploadError);
    }

    return {
      publicUrl: data.publicUrl,

      filePath,
    };
  }

  /* =====================================================
     SUBMIT
  ===================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || processingImage) {
      return;
    }

    setError("");

    setSuccess("");

    const pnuText = String(form.pnu_no || "").trim();

    if (!pnuText) {
      setError(t.pnuRequired);

      return;
    }

    const pnuValue = normalizePositiveInteger(pnuText);

    if (pnuValue === null) {
      setError(t.pnuError);

      return;
    }

    if (!String(form.botanical_name || "").trim()) {
      setError(t.botanicalRequired);

      return;
    }

    if (!user?.id) {
      setError(t.loginRequired);

      return;
    }

    if (!plantId || !UUID_PATTERN.test(plantId)) {
      setError(t.notFound);

      return;
    }

    setSaving(true);

    let uploadedImagePath = null;

    try {
      let imageUrl = oldImageUrl || null;

      if (imageFile) {
        const uploaded = await uploadImage();

        imageUrl = uploaded.publicUrl;

        uploadedImagePath = uploaded.filePath;
      }

      const updateData = {
        pnu_no: pnuValue,

        artificial_group: String(form.artificial_group || "").trim() || null,

        family: String(form.family || "").trim() || null,

        botanical_name: String(form.botanical_name || "").trim() || null,

        collected_by: String(form.collected_by || "").trim() || null,

        collector_no: String(form.collector_no || "").trim() || null,

        locality: String(form.locality || "").trim() || null,

        latitude: toFiniteNumberOrNull(form.latitude),

        longitude: toFiniteNumberOrNull(form.longitude),

        /*
         * elevation ของฐานข้อมูลเดิมรองรับค่า text
         * จึงเก็บเป็นข้อความเหมือนเดิม
         */
        elevation: String(form.elevation || "").trim() || null,

        image_url: imageUrl,
      };

      const {
        data,

        error: updateError,
      } = await supabase
        .from("plants")
        .update(updateData)
        .eq("id", plantId)
        .select()
        .maybeSingle();

      if (updateError?.code === "23505") {
        throw new Error(t.pnuDuplicate);
      }

      if (updateError || !data) {
        throw new Error(updateError?.message || t.updateError);
      }

      /*
       * เปลี่ยนรูปสำเร็จแล้ว ลบไฟล์รูปเดิมใน bucket plant-images
       * (ลบเฉพาะไฟล์ใน bucket นี้ ถ้าลบไม่สำเร็จให้ log ไว้เท่านั้น)
       */
      const oldImagePath = getPlantImageStoragePath(oldImageUrl);

      if (uploadedImagePath && oldImagePath && oldImagePath !== uploadedImagePath) {
        try {
          const { error: removeOldError } = await supabase.storage
            .from(IMAGE_BUCKET)
            .remove([oldImagePath]);

          if (removeOldError) {
            console.error("Remove old image failed:", removeOldError);
          }
        } catch (removeOldError) {
          console.error("Remove old image failed:", removeOldError);
        }
      }

      setOldImageUrl(imageUrl || "");

      setSuccess(t.success);

      window.setTimeout(() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/account/plants");
        }

        router.refresh();
      }, 700);
    } catch (err) {
      console.error("Update plant error:", err);

      /*
       * ถ้าอัปโหลดรูปใหม่สำเร็จ
       * แต่ update database ไม่สำเร็จ
       * ให้ลบไฟล์ใหม่ที่ยังไม่ได้ใช้ออก
       */
      if (uploadedImagePath) {
        try {
          await supabase.storage.from(IMAGE_BUCKET).remove([uploadedImagePath]);
        } catch (removeError) {
          console.error("Remove unused image failed:", removeError);
        }
      }

      setError(err?.message || t.updateError);
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <PageShell>
        <Navbar />

        <div className="vh-container flex min-h-[65dvh] items-center justify-center py-10">
          <div className="text-center">
            <LoadingIcon className="mx-auto h-6 w-6 animate-spin text-moss" />

            <p className="vh-eyebrow mt-4">{t.loading}</p>
          </div>
        </div>
      </PageShell>
    );
  }

  /* =====================================================
     NOT FOUND
  ===================================================== */

  if (fatalError) {
    return (
      <PageShell>
        <Navbar />

        <div className="vh-container flex min-h-[65dvh] items-center justify-center py-10">
          <div className="vh-panel w-full max-w-md p-6 text-center sm:p-8">
            <AlertIcon className="mx-auto h-7 w-7 text-clay" />

            <h1 className="vh-display mt-4 text-[1.5rem] leading-[1.35] sm:text-[1.75rem]">
              {t.notFound}
            </h1>

            <p className="mt-3 font-serif text-[15px] italic leading-7 text-muted">
              {fatalError}
            </p>

            <Link
              href="/account/plants"
              className="vh-btn vh-btn-primary mt-6"
            >
              <ArrowLeftIcon className="h-4 w-4" />

              {t.back}
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  const pnuFieldError =
    error &&
    (error === t.pnuRequired ||
      error === t.pnuError ||
      error === t.pnuDuplicate)
      ? error
      : "";

  const botanicalFieldError = error === t.botanicalRequired ? error : "";

  return (
    <PageShell>
      <Navbar />

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-rule">
        <div className="vh-container py-6 sm:py-8 lg:py-10">
          <Link
            href="/account/plants"
            className="vh-btn vh-btn-ghost vh-btn-sm -ml-3.5"
          >
            <ArrowLeftIcon className="h-4 w-4" />

            {t.back}
          </Link>

          <div className="page-enter mt-4 max-w-3xl">
            <p className="vh-eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="h-px w-6 bg-ochre" />

              <span>{t.eyebrow}</span>

              {record.pnu_no && (
                <>
                  <span aria-hidden="true" className="text-faint">
                    ·
                  </span>

                  <span className="font-mono text-ochre">
                    PNU {record.pnu_no}
                  </span>
                </>
              )}
            </p>

            <h1
              className={`vh-display mt-3 break-words text-[2rem] sm:text-[2.6rem] lg:text-[3rem] ${
                record.botanical_name ? "vh-binomial leading-[1.1]" : "leading-[1.3]"
              }`}
            >
              {record.botanical_name || t.title}
            </h1>

            {record.family && (
              <p className="vh-family mt-3">{record.family}</p>
            )}

            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-muted sm:text-[15px]">
              {t.subtitle}
            </p>
          </div>
        </div>
      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="vh-container pb-8 pt-6 sm:pt-8 md:pb-14">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[400px_minmax(0,1fr)]">
            {/* =================================================
                IMAGE
            ================================================= */}

            <aside className="min-w-0 lg:sticky lg:top-24">
              <div className="vh-panel p-4 sm:p-5">
                <p className="vh-eyebrow">{t.image}</p>

                <p className="mt-1.5 text-[13px] leading-6 text-muted">
                  {t.imageDesc}
                </p>

                {/* PREVIEW */}

                <div className="relative mt-4 aspect-[4/5] max-h-[460px] w-full overflow-hidden rounded-[4px] border border-rule bg-paper-deep">
                  {preview ? (
                    <>
                      <img
                        src={preview}
                        alt={
                          form.botanical_name ||
                          (form.pnu_no ? `PNU ${form.pnu_no}` : "Plant preview")
                        }
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                      <span className="absolute bottom-3 left-3 text-[12px] font-medium text-white">
                        {imageFile ? t.newImage : t.currentImage}
                      </span>
                    </>
                  ) : (
                    <div className="vh-grid-paper flex h-full w-full items-center justify-center px-6 text-center">
                      <div>
                        <ImageIcon className="mx-auto h-7 w-7 text-faint" />

                        <p className="mt-3 font-serif text-[16px] italic text-muted">
                          {t.noImage}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* FILE INPUT */}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_INPUT_ACCEPT}
                  onChange={handleImageChange}
                  disabled={saving || processingImage}
                  className="hidden"
                />

                {/* CAMERA INPUT */}

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  disabled={saving || processingImage || !canUseCamera}
                  className="hidden"
                />

                {/* REPLACE DROPZONE */}

                <button
                  type="button"
                  onClick={handleChooseImage}
                  disabled={saving || processingImage}
                  className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed border-rule-strong bg-paper-deep px-4 py-6 text-center transition-colors hover:border-moss hover:bg-moss-soft"
                >
                  {processingImage ? (
                    <LoadingIcon className="h-5 w-5 animate-spin text-moss" />
                  ) : (
                    <UploadIcon className="h-5 w-5 text-moss" />
                  )}

                  <span className="text-[14px] font-medium text-ink">
                    {processingImage ? t.converting : t.chooseImage}
                  </span>

                  <span className="text-[12px] leading-5 text-faint">
                    {t.imageHint}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleTakePhoto}
                  disabled={saving || processingImage || !canUseCamera}
                  className="vh-btn vh-btn-outline mt-3 w-full"
                >
                  <CameraIcon className="h-4 w-4 shrink-0" />

                  <span className="min-w-0 truncate">{t.takePhoto}</span>
                </button>

                {!canUseCamera && (
                  <p className="mt-2 text-[12px] leading-5 text-faint">
                    {t.cameraUnavailable}
                  </p>
                )}

                {imageNotice && (
                  <div className="mt-3 rounded-[4px] border border-moss/25 bg-moss-soft px-3 py-2.5 text-[13px] leading-5 text-moss">
                    {imageNotice}
                  </div>
                )}

                {imageFile && (
                  <div className="mt-4 border-t border-dashed border-rule-strong pt-4">
                    <p className="vh-field-label mb-1">{t.selectedFile}</p>

                    <p
                      className="truncate font-mono text-[12px] text-ink-soft"
                      title={imageFile.name}
                    >
                      {imageFile.name}
                    </p>

                    <button
                      type="button"
                      onClick={restoreOldImage}
                      disabled={saving}
                      className="vh-btn vh-btn-ghost vh-btn-sm mt-3 w-full"
                    >
                      <UndoIcon className="h-3.5 w-3.5" />

                      {t.restoreImage}
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* =================================================
                FORM SECTIONS
            ================================================= */}

            <div className="min-w-0 space-y-6">
              {/* 01 — IDENTIFICATION */}

              <FormSection
                number="01"
                title={t.plant}
                description={t.plantDesc}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label={t.pnuNo}
                    name="pnu_no"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={form.pnu_no}
                    onChange={updateField}
                    placeholder={t.pnuNoPh}
                    required
                    requiredText={t.requiredLabel}
                    disabled={saving}
                    mono
                    error={pnuFieldError}
                  />

                  <Field
                    label={t.family}
                    name="family"
                    value={form.family}
                    onChange={updateField}
                    placeholder={t.familyPh}
                    disabled={saving}
                  />

                  <div className="sm:col-span-2">
                    <Field
                      label={t.botanical}
                      name="botanical_name"
                      value={form.botanical_name}
                      onChange={updateField}
                      placeholder={t.botanicalPh}
                      binomial
                      required
                      requiredText={t.requiredLabel}
                      disabled={saving}
                      error={botanicalFieldError}
                    />

                    <NameCheck
                      botanicalName={form.botanical_name}
                      family={form.family}
                      language={language}
                      disabled={saving}
                      onUseName={(name) => updateField("botanical_name", name)}
                      onUseFamily={(value) => updateField("family", value)}
                    />
                  </div>

                  <Field
                    label={t.artificialGroup}
                    name="artificial_group"
                    value={form.artificial_group}
                    onChange={updateField}
                    placeholder={t.artificialGroupPh}
                    disabled={saving}
                  />
                </div>
              </FormSection>

              {/* 02 — COLLECTION */}

              <FormSection
                number="02"
                title={t.collection}
                description={t.collectionDesc}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label={t.collector}
                    name="collected_by"
                    value={form.collected_by}
                    onChange={updateField}
                    placeholder={t.collectorPh}
                    disabled={saving}
                  />

                  <Field
                    label={t.collectorNo}
                    name="collector_no"
                    value={form.collector_no}
                    onChange={updateField}
                    placeholder={t.collectorNoPh}
                    disabled={saving}
                    mono
                  />
                </div>
              </FormSection>

              {/* 03 — LOCALITY */}

              <AutoLocationMap
                number="03"
                language={language}
                title={t.location}
                description={t.locationDesc}
                initialLocation={{
                  locality: form.locality,

                  latitude: form.latitude,

                  longitude: form.longitude,

                  elevation: form.elevation,
                }}
                onLocationResolved={handleLocationResolved}
                onLocationFieldChange={handleLocationFieldChange}
              />
            </div>
          </div>

          {/* =================================================
              ERROR / SUCCESS + ACTIONS
          ================================================= */}

          <div className="lg:grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[400px_minmax(0,1fr)]">
            <div className="min-w-0 lg:col-start-2">
              {error && (
                <div className="mt-6">
                  <AlertBox type="error">{error}</AlertBox>
                </div>
              )}

              {success && (
                <div className="mt-6">
                  <AlertBox type="success">{success}</AlertBox>
                </div>
              )}

              <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-rule bg-paper/90 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm md:static md:mx-0 md:bg-transparent md:px-0 md:pb-0 md:pt-6 md:backdrop-blur-none">
                <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2.5 md:flex md:items-center md:justify-end md:gap-3">
                  <Link
                    href="/account/plants"
                    className="vh-btn vh-btn-outline md:min-w-[120px]"
                  >
                    {t.cancel}
                  </Link>

                  <button
                    type="submit"
                    disabled={saving || processingImage || Boolean(success)}
                    aria-busy={saving}
                    className="vh-btn vh-btn-primary md:min-w-[200px]"
                  >
                    {saving ? (
                      <LoadingIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <SaveIcon className="h-4 w-4" />
                    )}

                    {saving ? t.saving : t.save}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </section>
    </PageShell>
  );
}

/* =========================================================
   AUTO LOCATION MAP
========================================================= */

function AutoLocationMap({
  number,
  language,
  title,
  description,
  initialLocation,
  onLocationResolved,
  onLocationFieldChange,
}) {
  const isEnglish = language === "EN";

  const mapContainerRef = useRef(null);

  const markerRef = useRef(null);

  const forwardTimerRef = useRef(null);

  const forwardAbortRef = useRef(null);

  const forwardCacheRef = useRef(new Map());

  const selectionSequenceRef = useRef(0);

  const callbackRef = useRef(onLocationResolved);

  const fieldChangeRef = useRef(onLocationFieldChange);

  const initialLocationRef = useRef(initialLocation);

  /*
   * หน้า Edit มีข้อมูลพิกัดเก่าอยู่แล้ว
   * จึงไม่ควรค้นหา Locality ใหม่ทันทีตอนเปิดหน้า
   * จะค้นหาอัตโนมัติเมื่อผู้ใช้แก้ข้อความ Locality
   */
  const firstLocalityRef = useRef(
    String(initialLocation?.locality || "").trim(),
  );

  const firstCoordinatesRef = useRef(
    hasValidCoordinates(initialLocation?.latitude, initialLocation?.longitude),
  );

  const didHandleInitialSearchRef = useRef(false);

  const [locating, setLocating] = useState(false);

  const [searchingLocation, setSearchingLocation] = useState(false);

  const [readingElevation, setReadingElevation] = useState(false);

  const [mapError, setMapError] = useState("");

  const [locationData, setLocationData] = useState(() =>
    normalizeLocationData(initialLocation),
  );

  /* =====================================================
     MAP (lib/useLeafletMap จัดการสร้าง/ลบแผนที่)
  ===================================================== */

  const {
    map: leafletMap,
    error: mapLoadError,
    mapRef,
    leafletRef,
  } = useLeafletMap(mapContainerRef, {
    options: {
      zoomControl: true,

      attributionControl: true,

      preferCanvas: true,

      center: [DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude],

      zoom: DEFAULT_MAP_ZOOM,
    },

    setup: (L, map) => {
      /* แผนที่ใหม่ ต้องสร้าง marker ใหม่ */
      markerRef.current = null;

      L.tileLayer(MAP_TILE_URL, {
        maxZoom: 19,

        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      map.on("click", (event) => {
        selectLocation(
          event.latlng.lat,

          event.latlng.lng,

          true,
        );
      });

      const initial = normalizeLocationData(initialLocationRef.current);

      setLocationData(initial);

      if (hasValidCoordinates(initial.latitude, initial.longitude)) {
        placeMarker(initial.latitude, initial.longitude);

        map.setView([initial.latitude, initial.longitude], 16, {
          animate: false,
        });
      }
    },
  });

  const mapReady = Boolean(leafletMap);

  const shownMapError =
    mapError ||
    (mapLoadError
      ? isEnglish
        ? "Unable to load the map."
        : "ไม่สามารถโหลดแผนที่ได้"
      : "");

  /* =====================================================
     MAP COPY
  ===================================================== */

  const m = isEnglish
    ? {
        locality: "Locality / NP / Province",

        localityPh: "e.g. Khao Yai National Park, Mo Singto area",

        searching: "Searching location...",

        notFound: "Location not found.",

        searchError: "Unable to search for this location.",

        coordinates: "Coordinates",

        latitude: "Latitude",

        longitude: "Longitude",

        elevation: "Elevation Above Sea Level",

        meters: "m",

        current: "Use Current Location",

        locating: "Finding location...",

        reading: "Reading elevation...",

        hint: "Tap the map or drag the marker to adjust the specimen location.",

        noSaved: "Type the locality or choose a point on the map.",

        noValue: "—",

        unsupported: "This browser does not support location services.",

        denied:
          "Unable to access your location. Allow location access or choose a point on the map.",
      }
    : {
        locality: "สถานที่ / อุทยาน / จังหวัด",

        localityPh: "เช่น Khao Yai National Park, Mo Singto area",

        searching: "กำลังค้นหาสถานที่...",

        notFound: "ไม่พบสถานที่ที่พิมพ์",

        searchError: "ไม่สามารถค้นหาสถานที่นี้ได้",

        coordinates: "พิกัด",

        latitude: "ละติจูด",

        longitude: "ลองจิจูด",

        elevation: "ระดับความสูงจากน้ำทะเล",

        meters: "ม.",

        current: "ใช้ตำแหน่งปัจจุบัน",

        locating: "กำลังค้นหาตำแหน่ง...",

        reading: "กำลังอ่านระดับความสูง...",

        hint: "แตะบนแผนที่หรือลากหมุดเพื่อปรับตำแหน่งตัวอย่าง",

        noSaved: "พิมพ์สถานที่หรือเลือกจุดบนแผนที่เพื่อเพิ่มพิกัด",

        noValue: "—",

        unsupported: "เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง",

        denied:
          "ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้ กรุณาอนุญาต Location หรือเลือกจุดบนแผนที่แทน",
      };

  /* =====================================================
     KEEP REFS CURRENT
  ===================================================== */

  useEffect(() => {
    callbackRef.current = onLocationResolved;
  }, [onLocationResolved]);

  useEffect(() => {
    fieldChangeRef.current = onLocationFieldChange;
  }, [onLocationFieldChange]);

  useEffect(() => {
    initialLocationRef.current = initialLocation;
  }, [initialLocation]);

  /* =====================================================
     CLEANUP SEARCH ON UNMOUNT
  ===================================================== */

  useEffect(() => {
    const forwardTimer = forwardTimerRef;

    const forwardAbort = forwardAbortRef;

    return () => {
      if (forwardTimer.current) {
        window.clearTimeout(forwardTimer.current);
      }

      forwardAbort.current?.abort();
    };
  }, []);

  /* =====================================================
     MARKER ICON
  ===================================================== */

  function markerIcon() {
    const L = leafletRef.current;

    if (!L) {
      return null;
    }

    return L.divIcon({
      className: "",

      html: `
        <div style="
          width:38px;
          height:38px;
          border-radius:14px 14px 14px 4px;
          transform:rotate(-45deg);
          background:var(--moss);
          border:4px solid var(--sheet-raised);
          box-shadow:0 8px 20px rgba(0,0,0,.28);
          display:flex;
          align-items:center;
          justify-content:center;
        ">
          <div style="
            width:10px;
            height:10px;
            border-radius:999px;
            background:var(--on-moss);
          "></div>
        </div>
      `,

      iconSize: [38, 38],

      iconAnchor: [19, 36],
    });
  }

  /* =====================================================
     PLACE MARKER
  ===================================================== */

  function placeMarker(latitude, longitude) {
    const L = leafletRef.current;

    const map = mapRef.current;

    if (!L || !map) {
      return;
    }

    if (!markerRef.current) {
      const marker = L.marker([latitude, longitude], {
        draggable: true,

        icon: markerIcon(),
      }).addTo(map);

      marker.on("dragend", () => {
        const point = marker.getLatLng();

        selectLocation(point.lat, point.lng, false);
      });

      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
    }
  }

  /* =====================================================
     SELECT LOCATION
  ===================================================== */

  async function selectLocation(latitude, longitude, moveMap = false) {
    const map = mapRef.current;

    const lat = Number(latitude);

    const lng = Number(longitude);

    if (
      !map ||
      !leafletRef.current ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return;
    }

    const sequence = selectionSequenceRef.current + 1;

    selectionSequenceRef.current = sequence;

    setMapError("");

    placeMarker(lat, lng);

    if (moveMap) {
      map.setView([lat, lng], Math.max(map.getZoom(), 16), {
        animate: true,
      });
    }

    const snapshot = {
      latitude: lat,

      longitude: lng,

      elevation: null,
    };

    setLocationData(snapshot);

    callbackRef.current?.(snapshot);

    setReadingElevation(true);

    try {
      const elevation = await fetchElevation(lat, lng);

      if (sequence !== selectionSequenceRef.current) {
        return;
      }

      const result = {
        latitude: lat,

        longitude: lng,

        elevation,
      };

      setLocationData(result);

      callbackRef.current?.(result);
    } finally {
      if (sequence === selectionSequenceRef.current) {
        setReadingElevation(false);
      }
    }
  }

  /* =====================================================
     SEARCH LOCALITY
  ===================================================== */

  async function searchLocality(query) {
    const keyword = String(query || "").trim();

    if (!keyword || keyword.length < 3 || !mapReady) {
      return;
    }

    const cacheKey = keyword.toLowerCase();

    const cached = forwardCacheRef.current.get(cacheKey);

    if (cached) {
      await selectLocation(cached.latitude, cached.longitude, true);

      return;
    }

    forwardAbortRef.current?.abort();

    const controller = new AbortController();

    forwardAbortRef.current = controller;

    setSearchingLocation(true);

    setMapError("");

    try {
      const searchUrl = new URL(FORWARD_GEOCODING_URL);

      searchUrl.searchParams.set("q", keyword);

      searchUrl.searchParams.set("format", "jsonv2");

      searchUrl.searchParams.set("limit", "1");

      searchUrl.searchParams.set("addressdetails", "1");

      searchUrl.searchParams.set("countrycodes", "th");

      const response = await fetch(searchUrl.toString(), {
        method: "GET",

        cache: "no-store",

        headers: {
          Accept: "application/json",
        },

        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Forward geocoding failed: ${response.status}`);
      }

      const results = await response.json();

      if (!Array.isArray(results) || results.length === 0) {
        setMapError(m.notFound);

        return;
      }

      const latitude = Number(results[0]?.lat);

      const longitude = Number(results[0]?.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setMapError(m.notFound);

        return;
      }

      forwardCacheRef.current.set(cacheKey, {
        latitude,
        longitude,
      });

      await selectLocation(latitude, longitude, true);
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }

      console.error("Search locality error:", err);

      setMapError(m.searchError);
    } finally {
      if (forwardAbortRef.current === controller) {
        setSearchingLocation(false);
      }
    }
  }

  /* =====================================================
     AUTO SEARCH LOCALITY
     (อยู่หลัง searchLocality เพื่อให้ประกาศฟังก์ชันก่อนใช้)
  ===================================================== */

  useEffect(() => {
    if (!mapReady) {
      return;
    }

    const keyword = String(initialLocation?.locality || "").trim();

    /*
     * ถ้ามี Coordinates เดิมอยู่แล้ว
     * รอบแรกไม่ต้อง Search ใหม่
     */
    if (!didHandleInitialSearchRef.current) {
      didHandleInitialSearchRef.current = true;

      if (firstCoordinatesRef.current && keyword === firstLocalityRef.current) {
        return;
      }
    }

    if (forwardTimerRef.current) {
      window.clearTimeout(forwardTimerRef.current);
    }

    forwardAbortRef.current?.abort();

    if (keyword.length < 3) {
      setSearchingLocation(false);

      setMapError("");

      return;
    }

    forwardTimerRef.current = window.setTimeout(() => {
      searchLocality(keyword);
    }, 1000);

    return () => {
      if (forwardTimerRef.current) {
        window.clearTimeout(forwardTimerRef.current);
      }
    };
  }, [initialLocation?.locality, mapReady]);

  /* =====================================================
     CURRENT LOCATION
  ===================================================== */

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMapError(m.unsupported);

      return;
    }

    setMapError("");

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);

        selectLocation(
          position.coords.latitude,

          position.coords.longitude,

          true,
        );
      },

      (err) => {
        console.error("Geolocation error:", err);

        setLocating(false);

        setMapError(m.denied);
      },

      {
        enableHighAccuracy: true,

        timeout: 15000,

        maximumAge: 30000,
      },
    );
  }

  /* =====================================================
     ELEVATION
  ===================================================== */

  async function fetchElevation(latitude, longitude) {
    const lat = Number(latitude);

    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    try {
      const elevationUrl = new URL(ELEVATION_URL);

      elevationUrl.searchParams.set("latitude", String(lat));

      elevationUrl.searchParams.set("longitude", String(lng));

      const response = await fetch(elevationUrl.toString(), {
        method: "GET",

        cache: "no-store",

        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      const rawValue = Array.isArray(data?.elevation)
        ? data.elevation[0]
        : data?.elevation;

      const value = Number(rawValue);

      return Number.isFinite(value) ? value : null;
    } catch (err) {
      console.error("Elevation lookup error:", err);

      return null;
    }
  }

  const hasCoordinates = hasValidCoordinates(
    locationData.latitude,
    locationData.longitude,
  );

  /* =====================================================
     MAP UI
  ===================================================== */

  return (
    <FormSection number={number} title={title} description={description} flush>
      <div className="px-4 pt-5 sm:px-6 sm:pt-6">
        <Field
          label={m.locality}
          name="locality"
          value={initialLocation?.locality || ""}
          onChange={(name, value) => fieldChangeRef.current?.(name, value)}
          placeholder={m.localityPh}
        />

        {searchingLocation && (
          <p className="mt-2 flex items-center gap-2 text-[12px] text-muted">
            <LoadingIcon className="h-3.5 w-3.5 animate-spin" />

            {m.searching}
          </p>
        )}
      </div>

      {/* =================================================
          MAP
      ================================================= */}

      <div className="mx-4 mt-5 overflow-hidden rounded-[4px] border border-rule sm:mx-6">
        <div className="relative">
          <div
            ref={mapContainerRef}
            className="h-[240px] w-full sm:h-[290px] lg:h-[340px] dark:brightness-[0.78] dark:contrast-[1.05]"
          />

          {!mapReady && !shownMapError && (
            <div className="vh-skeleton absolute inset-0 flex items-center justify-center">
              <LoadingIcon className="h-6 w-6 animate-spin text-moss" />
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 border-t border-rule bg-paper-deep px-3.5 py-2.5 text-[12px] leading-5 text-muted">
          <HandIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />

          <span>{hasCoordinates ? m.hint : m.noSaved}</span>
        </div>
      </div>

      {/* =================================================
          COORDINATES
      ================================================= */}

      <div className="px-4 pb-5 pt-5 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating || !mapReady}
            className="vh-btn vh-btn-outline w-full sm:w-auto"
          >
            {locating ? (
              <LoadingIcon className="h-4 w-4 animate-spin" />
            ) : (
              <CurrentLocationIcon className="h-4 w-4" />
            )}

            {locating ? m.locating : m.current}
          </button>

          {readingElevation && (
            <p className="inline-flex items-center gap-2 text-[12px] text-muted">
              <LoadingIcon className="h-3.5 w-3.5 animate-spin" />

              {m.reading}
            </p>
          )}
        </div>

        {shownMapError && (
          <div className="mt-3 flex items-start gap-2 rounded-[4px] border border-ochre/30 bg-ochre-soft px-3 py-2.5 text-[13px] leading-5 text-ink-soft">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />

            <span>{shownMapError}</span>
          </div>
        )}

        <div className="vh-label-card mt-5">
          <p className="vh-eyebrow">{m.coordinates}</p>

          <dl className="mt-3 grid gap-3 sm:grid-cols-3 sm:gap-6">
            <CoordinateCard
              label={m.latitude}
              value={
                hasCoordinates
                  ? Number(locationData.latitude).toFixed(7)
                  : m.noValue
              }
            />

            <CoordinateCard
              label={m.longitude}
              value={
                hasCoordinates
                  ? Number(locationData.longitude).toFixed(7)
                  : m.noValue
              }
            />

            <CoordinateCard
              label={m.elevation}
              value={formatElevation(locationData.elevation, m)}
            />
          </dl>
        </div>
      </div>
    </FormSection>
  );
}

/* =========================================================
   LOCATION HELPERS
========================================================= */

function normalizeLocationData(value) {
  return {
    locality: value?.locality || "",

    latitude: toFiniteNumberOrNull(value?.latitude),

    longitude: toFiniteNumberOrNull(value?.longitude),

    elevation: normalizeElevationText(value?.elevation),
  };
}

/*
 * elevation เป็น text ในฐานข้อมูล และอาจเป็นช่วง เช่น "800–900 m"
 * ถ้าเป็นตัวเลขให้คงเป็นตัวเลข ถ้าไม่ใช่ให้คงข้อความเดิมไว้แสดงผล
 */
function normalizeElevationText(value) {
  const number = toFiniteNumberOrNull(value);

  if (number !== null) {
    return number;
  }

  const text = String(value ?? "").trim();

  return text || null;
}

function formatElevation(value, m) {
  if (value === null || value === undefined || value === "") {
    return m.noValue;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? `${Math.round(number)} ${m.meters}`
    : String(value);
}

/* =========================================================
   HELPERS
========================================================= */

function normalizePositiveInteger(value) {
  const text = String(value ?? "").trim();

  if (!text || !/^\d+$/.test(text)) {
    return null;
  }

  const number = Number(text);

  return Number.isSafeInteger(number) && number >= 1 ? number : null;
}

function toFiniteNumberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function hasValidCoordinates(latitude, longitude) {
  return (
    toFiniteNumberOrNull(latitude) !== null &&
    toFiniteNumberOrNull(longitude) !== null
  );
}

/* =========================================================
   PAGE SHELL
========================================================= */

function PageShell({ children }) {
  return (
    <main className="page min-h-screen overflow-x-clip text-ink">
      {children}
    </main>
  );
}

/* =========================================================
   FORM SECTION — numbered like a herbarium accession form
========================================================= */

function FormSection({ number, title, description, flush = false, children }) {
  return (
    <section className="vh-panel">
      <header className="flex items-start gap-4 border-b border-dashed border-rule-strong px-4 py-4 sm:px-6 sm:py-5">
        <span className="pt-1.5 font-mono text-[13px] text-ochre">{number}</span>

        <div className="min-w-0">
          <h2 className="font-serif text-[1.35rem] leading-snug text-ink sm:text-[1.5rem]">
            {title}
          </h2>

          {description && (
            <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-muted">
              {description}
            </p>
          )}
        </div>
      </header>

      <div className={flush ? "" : "px-4 py-5 sm:px-6 sm:py-6"}>{children}</div>
    </section>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  requiredText = "Required",
  disabled,
  min,
  step,
  inputMode,
  binomial = false,
  mono = false,
  error = "",
  className = "",
}) {
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={name} className="vh-field-label">
        {label}

        {required && (
          <>
            <span aria-hidden="true" className="ml-1 text-clay">
              *
            </span>

            <span className="sr-only"> ({requiredText})</span>
          </>
        )}
      </label>

      <input
        id={name}
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        step={step}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        onChange={(event) => onChange(name, event.target.value)}
        className={`vh-input ${
          binomial ? "font-serif text-[17px] italic" : ""
        } ${mono ? "font-mono tabular-nums" : ""} ${
          error ? "border-clay/60" : ""
        }`}
      />

      {error && (
        <p id={errorId} className="mt-1.5 text-[12px] leading-5 text-clay">
          {error}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   ALERT
========================================================= */

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
   COORDINATE CARD
========================================================= */

function CoordinateCard({ label, value }) {
  return (
    <div className="min-w-0 border-t border-dashed border-rule-strong pt-3 first:border-t-0 first:pt-0 sm:border-t-0 sm:pt-0">
      <dt className="text-[12px] leading-5 text-faint">{label}</dt>

      <dd
        className="mt-0.5 truncate font-mono text-[13px] tabular-nums text-ink-soft"
        title={String(value)}
      >
        {value}
      </dd>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function CameraIcon({ className = "" }) {
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
      <path d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />

      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function UploadIcon({ className = "" }) {
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
      <path d="M12 16V4" />

      <path d="m7 9 5-5 5 5" />

      <path d="M5 20h14" />
    </svg>
  );
}

function ImageIcon({ className = "" }) {
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
      <rect x="3" y="4" width="18" height="16" rx="2" />

      <circle cx="8.5" cy="9" r="1.5" />

      <path d="m21 15-5-5L5 20" />
    </svg>
  );
}

function CurrentLocationIcon({ className = "" }) {
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
      <circle cx="12" cy="12" r="3" />

      <circle cx="12" cy="12" r="7" />

      <path d="M12 2v3" />

      <path d="M12 19v3" />

      <path d="M2 12h3" />

      <path d="M19 12h3" />
    </svg>
  );
}

function SaveIcon({ className = "" }) {
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
      <path d="M5 4h12l2 2v14H5z" />

      <path d="M8 4v6h8V4" />

      <path d="M8 20v-6h8v6" />
    </svg>
  );
}

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

function InfoIcon({ className = "" }) {
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

      <path d="M12 11v5" />

      <path d="M12 8h.01" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />

      <path d="m8 12 2.6 2.6L16.5 9" />
    </svg>
  );
}

function HandIcon({ className = "" }) {
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
      <path d="M8 11V5a1.5 1.5 0 0 1 3 0v5" />

      <path d="M11 10V4a1.5 1.5 0 0 1 3 0v6" />

      <path d="M14 10V6a1.5 1.5 0 0 1 3 0v6" />

      <path d="M17 11v-1a1.5 1.5 0 0 1 3 0v5c0 4-2.5 6-6 6h-2.5a6 6 0 0 1-5-2.7L3.8 14a1.7 1.7 0 0 1 2.5-2.2L8 13" />
    </svg>
  );
}

function UndoIcon({ className = "" }) {
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
      <path d="M9 7 5 11l4 4" />

      <path d="M5 11h8a6 6 0 1 1 0 12" />
    </svg>
  );
}

function LoadingIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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
