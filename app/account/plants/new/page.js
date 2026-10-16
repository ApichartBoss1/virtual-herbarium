"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import {
  IMAGE_INPUT_ACCEPT,
  getImageExtension,
  preparePlantImage,
} from "@/lib/plantImage";

const IMAGE_BUCKET = "plant-images";

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

export default function NewPlantPage() {
  const router = useRouter();

  const { language } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const [user, setUser] = useState(null);

  const [form, setForm] = useState(INITIAL_FORM);

  const [imageFile, setImageFile] = useState(null);

  const [preview, setPreview] = useState("");

  const [canUseCamera, setCanUseCamera] = useState(false);

  const [processingImage, setProcessingImage] = useState(false);

  const [imageNotice, setImageNotice] = useState("");

  const [dragActive, setDragActive] = useState(false);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const fileInputRef = useRef(null);

  const cameraInputRef = useRef(null);

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "ตัวอย่างพรรณไม้ใหม่",

      heroTitle: "เพิ่มข้อมูลพรรณไม้",

      heroDescription:
        "เพิ่มข้อมูลตัวอย่างพรรณไม้ รูปภาพ ตำแหน่งพิกัด และระดับความสูงจากน้ำทะเลเข้าสู่ Virtual Herbarium",

      backCollection: "กลับคลังพรรณไม้",

      image: "รูปภาพตัวอย่าง",

      imageDescription: "เพิ่มภาพตัวอย่างพรรณไม้จากเครื่องหรือถ่ายด้วยกล้อง",

      noImage: "ยังไม่ได้เลือกรูปภาพ",

      chooseFromDevice: "เลือกรูปจากเครื่อง",

      takePhoto: "ถ่ายด้วยกล้อง",

      cameraUnavailable: "สามารถถ่ายรูปได้จากมือถือหรือแท็บเล็ตเท่านั้น",

      imageHint: "JPG, PNG, WEBP ไม่เกิน 10MB • HEIC / HEIF จะถูกแปลงเป็น JPEG",

      invalidImage: "รองรับเฉพาะ JPG, PNG, WEBP, HEIC และ HEIF",

      imageTooLarge: "รูปภาพหลังประมวลผลต้องมีขนาดไม่เกิน 10MB",

      heicSourceTooLarge: "ไฟล์ HEIC / HEIF ต้นฉบับต้องมีขนาดไม่เกิน 25MB",

      heicConversionError:
        "ไม่สามารถแปลงไฟล์ HEIC / HEIF ได้ กรุณาลองเลือกรูปอื่น",

      convertingImage: "กำลังเตรียมรูปภาพ...",

      heicConverted: "แปลงรูป HEIC / HEIF เป็น JPEG เรียบร้อยแล้ว",

      selectedFile: "ไฟล์ที่เลือก",

      basic: "ข้อมูลพรรณไม้",

      basicDescription: "กรอกข้อมูลตัวอย่างพรรณไม้ตามชุดข้อมูล PNU",

      pnuNo: "หมายเลข PNU",

      pnuNoPlaceholder: "เช่น 5001",

      artificialGroup: "กลุ่มพืช",

      artificialGroupPlaceholder: "เช่น angiosperm",

      family: "วงศ์",

      familyPlaceholder: "เช่น Euphorbiaceae",

      botanicalName: "ชื่อวิทยาศาสตร์",

      botanicalPlaceholder: "เช่น Chaetocarpus castanocarpus (Roxb.) Thw.",

      locationTitle: "สถานที่และพิกัด",

      locationDescription:
        "พิมพ์สถานที่แล้วหยุดประมาณ 1 วินาที ระบบจะค้นหาและเลื่อนหมุดบนแผนที่ให้อัตโนมัติ",

      collection: "ข้อมูลผู้เก็บตัวอย่าง",

      collectionDescription: "กรอกชื่อผู้เก็บตัวอย่างและหมายเลขผู้เก็บ",

      collectedBy: "ผู้เก็บตัวอย่าง",

      collectedByPlaceholder: "เช่น A. Boonkongchart",

      collectorNo: "หมายเลขผู้เก็บ",

      collectorNoPlaceholder: "เช่น 175 หรือ 584(2)",

      save: "บันทึกข้อมูลพรรณไม้",

      saving: "กำลังบันทึก...",

      cancel: "ยกเลิก",

      loading: "กำลังเตรียมแบบฟอร์ม...",

      loginRequired: "กรุณาเข้าสู่ระบบก่อนเพิ่มข้อมูลพรรณไม้",

      saveError: "ไม่สามารถบันทึกข้อมูลพรรณไม้ได้",

      uploadError: "ไม่สามารถอัปโหลดรูปภาพได้",

      saveSuccess: "บันทึกข้อมูลพรรณไม้เรียบร้อยแล้ว",

      requiredLabel: "จำเป็น",

      pnuRequired: "กรุณากรอกหมายเลข PNU",

      pnuError: "หมายเลข PNU ต้องเป็นเลขจำนวนเต็มตั้งแต่ 1 ขึ้นไป",

      botanicalRequired: "กรุณากรอกชื่อวิทยาศาสตร์",

      identification: "การระบุชนิด",

      collectionShort: "การเก็บตัวอย่าง",

      localityShort: "แหล่งที่เก็บ",

      dropHint: "คลิกเพื่อเลือก หรือลากรูปภาพมาวางที่นี่",

      replaceImage: "เปลี่ยนรูป",

      removeImage: "นำรูปออก",
    },

    EN: {
      eyebrow: "NEW SPECIMEN",

      heroTitle: "Add Plant Record",

      heroDescription:
        "Add specimen information, image, coordinates and elevation above sea level to the Virtual Herbarium.",

      backCollection: "Back to Plant Collection",

      image: "Plant Image",

      imageDescription:
        "Add a specimen image from your device or take a new photo.",

      noImage: "No image selected",

      chooseFromDevice: "Choose Image",

      takePhoto: "Take Photo",

      cameraUnavailable: "Photo capture is available on mobile or tablet only.",

      imageHint: "JPG, PNG, WEBP up to 10MB • HEIC / HEIF is converted to JPEG",

      invalidImage: "Supported formats: JPG, PNG, WEBP, HEIC and HEIF",

      imageTooLarge: "The processed image must be 10MB or smaller",

      heicSourceTooLarge:
        "The source HEIC / HEIF image must be 25MB or smaller",

      heicConversionError:
        "Unable to convert the HEIC / HEIF image. Please choose another image.",

      convertingImage: "Preparing image...",

      heicConverted: "HEIC / HEIF image converted to JPEG",

      selectedFile: "Selected file",

      basic: "Plant Information",

      basicDescription:
        "Enter the specimen information used by the PNU dataset.",

      pnuNo: "PNU No.",

      pnuNoPlaceholder: "e.g. 5001",

      artificialGroup: "Artificial Group",

      artificialGroupPlaceholder: "e.g. angiosperm",

      family: "Family",

      familyPlaceholder: "e.g. Euphorbiaceae",

      botanicalName: "Botanical Name",

      botanicalPlaceholder: "e.g. Chaetocarpus castanocarpus (Roxb.) Thw.",

      locationTitle: "Location & Coordinates",

      locationDescription:
        "Type the locality and pause for about one second. The map will automatically find the location and move the marker.",

      collection: "Collector Information",

      collectionDescription: "Enter the collector name and collector number.",

      collectedBy: "Collector",

      collectedByPlaceholder: "e.g. A. Boonkongchart",

      collectorNo: "Collector No.",

      collectorNoPlaceholder: "e.g. 175 or 584(2)",

      save: "Save Plant",

      saving: "Saving...",

      cancel: "Cancel",

      loading: "Preparing form...",

      loginRequired: "Please log in before adding a plant",

      saveError: "Unable to save plant",

      uploadError: "Unable to upload image",

      saveSuccess: "Plant added successfully",

      requiredLabel: "Required",

      pnuRequired: "Please enter the PNU No.",

      pnuError: "PNU No. must be a whole number greater than or equal to 1",

      botanicalRequired: "Please enter the Botanical Name",

      identification: "Identification",

      collectionShort: "Collection",

      localityShort: "Locality",

      dropHint: "Click to choose, or drop an image here",

      replaceImage: "Replace",

      removeImage: "Remove",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

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
     LOAD USER ONLY
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) {
          return;
        }

        if (userError || !currentUser) {
          router.replace("/login");

          return;
        }

        setUser(currentUser);
      } catch (err) {
        console.error("Load user error:", err);

        if (mounted) {
          setError(t.loginRequired);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [router, t.loginRequired]);

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
     LOCATION RESULT
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

  function handleChooseFile() {
    fileInputRef.current?.click();
  }

  function handleTakePhoto() {
    if (!canUseCamera) {
      return;
    }

    cameraInputRef.current?.click();
  }

  /* =====================================================
     IMAGE CHANGE
  ===================================================== */

  async function handleImageChange(event) {
    const input = event.target;

    const selectedFile = input.files?.[0];

    input.value = "";

    await processSelectedFile(selectedFile);
  }

  /* =====================================================
     DRAG & DROP / REMOVE
  ===================================================== */

  function handleDragOver(event) {
    event.preventDefault();

    if (saving || processingImage) {
      return;
    }

    setDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();

    setDragActive(false);
  }

  async function handleDrop(event) {
    event.preventDefault();

    setDragActive(false);

    if (saving || processingImage) {
      return;
    }

    await processSelectedFile(event.dataTransfer?.files?.[0]);
  }

  function handleRemoveImage() {
    if (saving || processingImage) {
      return;
    }

    setImageFile(null);

    setPreview("");

    setImageNotice("");
  }

  async function processSelectedFile(selectedFile) {
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

      setPreview((previous) => {
        if (previous?.startsWith("blob:")) {
          URL.revokeObjectURL(previous);
        }

        return objectUrl;
      });

      if (converted) {
        setImageNotice(t.heicConverted);
      }
    } catch (err) {
      console.error("Prepare image error:", err);

      switch (err?.code) {
        case "HEIC_SOURCE_TOO_LARGE":
          setError(t.heicSourceTooLarge);
          break;

        case "HEIC_CONVERSION_FAILED":
          setError(t.heicConversionError);
          break;

        case "IMAGE_TOO_LARGE":
          setError(t.imageTooLarge);
          break;

        case "INVALID_IMAGE_TYPE":
          setError(t.invalidImage);
          break;

        default:
          setError(t.uploadError);
      }
    } finally {
      setProcessingImage(false);
    }
  }

  /* =====================================================
     CLEAN OBJECT URL
  ===================================================== */

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /* =====================================================
     UPLOAD IMAGE
  ===================================================== */

  async function uploadImage() {
    if (!imageFile || !user?.id) {
      return {
        publicUrl: null,

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
     CREATE / INSERT
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

    setSaving(true);

    let uploadedImagePath = null;

    try {
      let imageUrl = null;

      if (imageFile) {
        const uploaded = await uploadImage();

        imageUrl = uploaded.publicUrl;

        uploadedImagePath = uploaded.filePath;
      }

      const plantData = {
        id: crypto.randomUUID(),

        user_id: user.id,

        pnu_no: pnuValue,

        artificial_group: String(form.artificial_group || "").trim() || null,

        family: String(form.family || "").trim() || null,

        botanical_name: String(form.botanical_name || "").trim() || null,

        collected_by: String(form.collected_by || "").trim() || null,

        collector_no: String(form.collector_no || "").trim() || null,

        locality: String(form.locality || "").trim() || null,

        latitude: toFiniteNumberOrNull(form.latitude),

        longitude: toFiniteNumberOrNull(form.longitude),

        elevation: toFiniteNumberOrNull(form.elevation),

        image_url: imageUrl,
      };

      const {
        data: insertedPlant,

        error: insertError,
      } = await supabase.from("plants").insert(plantData).select().single();

      if (insertError || !insertedPlant) {
        throw new Error(insertError?.message || t.saveError);
      }

      setSuccess(t.saveSuccess);

      window.setTimeout(() => {
        router.push("/account/plants");

        router.refresh();
      }, 700);
    } catch (err) {
      console.error("Create plant error:", err);

      if (uploadedImagePath) {
        try {
          await supabase.storage.from(IMAGE_BUCKET).remove([uploadedImagePath]);
        } catch (removeError) {
          console.error("Remove unused image failed:", removeError);
        }
      }

      setError(err?.message || t.saveError);
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="page min-h-screen text-ink">
        <Navbar />

        <div className="flex min-h-[65dvh] items-center justify-center px-5">
          <div className="text-center">
            <LoadingIcon className="mx-auto h-6 w-6 animate-spin text-moss" />

            <p className="mt-4 font-serif text-[15px] italic text-muted">
              {t.loading}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const pnuFieldError =
    error && (error === t.pnuRequired || error === t.pnuError) ? error : "";

  const botanicalFieldError =
    error && error === t.botanicalRequired ? error : "";

  const pnuPreview = String(form.pnu_no || "").trim();

  const botanicalPreview = String(form.botanical_name || "").trim();

  const familyPreview = String(form.family || "").trim();

  const imageBusy = saving || processingImage;

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="page min-h-screen overflow-x-hidden text-ink">
      <Navbar />

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="vh-container page-enter pb-6 pt-6 sm:pt-10 lg:pb-10 lg:pt-12">
        <Link
          href="/account/plants"
          className="vh-btn vh-btn-ghost vh-btn-sm -ml-3 hidden md:inline-flex"
        >
          <ArrowLeftIcon className="h-4 w-4" />

          {t.backCollection}
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-6 md:mt-6">
          <div className="min-w-0 max-w-2xl">
            <p className="vh-eyebrow flex items-center gap-3">
              <span className="h-px w-6 bg-ochre" />

              {t.eyebrow}
            </p>

            <h1 className="vh-display mt-3 text-[2.1rem] sm:text-[2.6rem] lg:text-[3.1rem]">
              {t.heroTitle}
            </h1>

            <p className="mt-4 max-w-xl text-[15px] leading-[1.8] text-ink-soft">
              {t.heroDescription}
            </p>
          </div>

          {/* Live accession label preview */}

          <div className="vh-label-card hidden w-[260px] shrink-0 sm:block">
            <p className="vh-catalog">{t.pnuNo}</p>

            <p className="mt-1 font-mono text-[20px] tabular-nums text-ink">
              PNU {pnuPreview || "—"}
            </p>

            <div className="mt-3 border-t border-dashed border-rule-strong pt-3">
              <p
                className={`truncate text-[16px] ${
                  botanicalPreview ? "vh-binomial text-ink-soft" : "text-faint"
                }`}
                title={botanicalPreview || undefined}
              >
                {botanicalPreview || "—"}
              </p>

              <p className="vh-family mt-1.5 truncate">
                {familyPreview || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="vh-rule-double mt-8" />
      </header>

      {/* =================================================
          FORM
      ================================================= */}

      <form
        onSubmit={handleSubmit}
        className="vh-container pb-6 md:pb-20"
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-14">
          {/* =================================================
              IMAGE
          ================================================= */}

          <aside className="min-w-0 lg:sticky lg:top-24">
            <p className="vh-eyebrow flex items-center gap-3">
              <span className="h-px w-6 bg-ochre" />

              {t.image}
            </p>

            <p className="mt-2 text-[14px] leading-[1.7] text-muted">
              {t.imageDescription}
            </p>

            <div
              onDragEnter={handleDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative mt-5 aspect-[4/3] overflow-hidden rounded-[6px] border transition-colors sm:aspect-[4/3] lg:aspect-[4/5] ${
                dragActive
                  ? "border-dashed border-moss bg-moss-soft"
                  : preview
                    ? "border-rule bg-paper-deep"
                    : "border-dashed border-rule-strong bg-paper-deep"
              }`}
            >
              {preview ? (
                <img
                  src={preview}
                  alt={
                    form.botanical_name ||
                    (form.pnu_no ? `PNU ${form.pnu_no}` : "Plant preview")
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <button
                  type="button"
                  onClick={handleChooseFile}
                  disabled={imageBusy}
                  className="flex h-full w-full cursor-pointer items-center justify-center px-6 text-center"
                >
                  <span className="block">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rule-strong text-muted">
                      <ImageIcon className="h-5 w-5" />
                    </span>

                    <span className="mt-4 block font-serif text-[17px] italic text-ink-soft">
                      {t.noImage}
                    </span>

                    <span className="mt-1.5 block text-[13px] text-muted">
                      {t.dropHint}
                    </span>
                  </span>
                </button>
              )}

              {processingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-paper/85">
                  <p className="flex items-center gap-2 text-[13px] text-ink-soft">
                    <LoadingIcon className="h-4 w-4 animate-spin text-moss" />

                    {t.convertingImage}
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_INPUT_ACCEPT}
              onChange={handleImageChange}
              disabled={imageBusy}
              className="hidden"
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              disabled={imageBusy || !canUseCamera}
              className="hidden"
            />

            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleChooseFile}
                disabled={imageBusy}
                className="vh-btn vh-btn-outline vh-btn-sm min-w-0 flex-1 sm:flex-none"
              >
                {processingImage ? (
                  <LoadingIcon className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <UploadIcon className="h-4 w-4 shrink-0" />
                )}

                <span className="min-w-0 truncate">
                  {processingImage
                    ? t.convertingImage
                    : preview
                      ? t.replaceImage
                      : t.chooseFromDevice}
                </span>
              </button>

              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={imageBusy || !canUseCamera}
                className="vh-btn vh-btn-outline vh-btn-sm min-w-0 flex-1 sm:flex-none"
              >
                <CameraIcon className="h-4 w-4 shrink-0" />

                <span className="min-w-0 truncate">{t.takePhoto}</span>
              </button>

              {preview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={imageBusy}
                  className="vh-btn vh-btn-ghost vh-btn-sm text-clay hover:text-clay"
                >
                  <TrashIcon className="h-4 w-4 shrink-0" />

                  {t.removeImage}
                </button>
              )}
            </div>

            <p className="mt-3 text-[12px] leading-5 text-faint">
              {t.imageHint}
            </p>

            {!canUseCamera && (
              <p className="mt-1 text-[12px] leading-5 text-faint">
                {t.cameraUnavailable}
              </p>
            )}

            {imageNotice && (
              <p
                role="status"
                className="mt-3 flex items-start gap-2 rounded-[4px] bg-moss-soft px-3 py-2.5 text-[13px] leading-5 text-moss"
              >
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />

                {imageNotice}
              </p>
            )}

            {imageFile && (
              <dl className="mt-4 border-t border-dashed border-rule-strong pt-3">
                <dt className="text-[12px] text-faint">{t.selectedFile}</dt>

                <dd
                  className="mt-1 truncate font-mono text-[12.5px] text-ink-soft"
                  title={imageFile.name}
                >
                  {imageFile.name}
                </dd>
              </dl>
            )}
          </aside>

          {/* =================================================
              FORM SECTIONS
          ================================================= */}

          <div className="min-w-0 space-y-12">
            {/* 01 IDENTIFICATION */}

            <FormSection
              number="01"
              title={t.identification}
              description={t.basicDescription}
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
                  placeholder={t.pnuNoPlaceholder}
                  required
                  requiredText={t.requiredLabel}
                  error={pnuFieldError}
                  mono
                  disabled={saving}
                />

                <Field
                  label={t.family}
                  name="family"
                  value={form.family}
                  onChange={updateField}
                  placeholder={t.familyPlaceholder}
                  disabled={saving}
                />

                <div className="sm:col-span-2">
                  <Field
                    label={t.botanicalName}
                    name="botanical_name"
                    value={form.botanical_name}
                    onChange={updateField}
                    placeholder={t.botanicalPlaceholder}
                    italic
                    required
                    requiredText={t.requiredLabel}
                    error={botanicalFieldError}
                    disabled={saving}
                  />
                </div>

                <Field
                  label={t.artificialGroup}
                  name="artificial_group"
                  value={form.artificial_group}
                  onChange={updateField}
                  placeholder={t.artificialGroupPlaceholder}
                  disabled={saving}
                />
              </div>
            </FormSection>

            {/* 02 COLLECTION */}

            <FormSection
              number="02"
              title={t.collectionShort}
              description={t.collectionDescription}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label={t.collectedBy}
                  name="collected_by"
                  value={form.collected_by}
                  onChange={updateField}
                  placeholder={t.collectedByPlaceholder}
                  disabled={saving}
                />

                <Field
                  label={t.collectorNo}
                  name="collector_no"
                  value={form.collector_no}
                  onChange={updateField}
                  placeholder={t.collectorNoPlaceholder}
                  mono
                  disabled={saving}
                />
              </div>
            </FormSection>

            {/* 03 LOCALITY */}

            <AutoLocationMap
              language={language}
              number="03"
              title={t.localityShort}
              description={t.locationDescription}
              initialLocation={{
                locality: form.locality,

                latitude: form.latitude,

                longitude: form.longitude,

                elevation: toFiniteNumberOrNull(form.elevation),
              }}
              onLocationResolved={handleLocationResolved}
              onLocationFieldChange={handleLocationFieldChange}
            />

            {/* MESSAGES + ACTIONS */}

            <div>
              {error && (
                <AlertBox type="error">{error}</AlertBox>
              )}

              {success && (
                <AlertBox type="success">{success}</AlertBox>
              )}

              <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-rule bg-paper/90 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm md:static md:mx-0 md:mt-8 md:bg-transparent md:px-0 md:pb-0 md:pt-6 md:backdrop-blur-none">
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 md:flex md:items-center md:justify-end">
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
                    className="vh-btn vh-btn-primary min-w-0 md:min-w-[210px]"
                  >
                    {saving ? (
                      <LoadingIcon className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <SaveIcon className="h-4 w-4 shrink-0" />
                    )}

                    <span className="min-w-0 truncate">
                      {saving ? t.saving : t.save}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}

/* =========================================================
   AUTO LOCATION MAP
========================================================= */

function AutoLocationMap({
  language,
  number,
  title,
  description,
  initialLocation,
  onLocationResolved,
  onLocationFieldChange,
}) {
  const isEnglish = language === "EN";

  const mapContainerRef = useRef(null);

  const mapRef = useRef(null);

  const markerRef = useRef(null);

  const leafletRef = useRef(null);

  const forwardTimerRef = useRef(null);

  const forwardAbortRef = useRef(null);

  const forwardCacheRef = useRef(new Map());

  const selectionSequenceRef = useRef(0);

  const callbackRef = useRef(onLocationResolved);

  const fieldChangeRef = useRef(onLocationFieldChange);

  const initialLocationRef = useRef(initialLocation);

  const [mapReady, setMapReady] = useState(false);

  const [locating, setLocating] = useState(false);

  const [searchingLocation, setSearchingLocation] = useState(false);

  const [readingElevation, setReadingElevation] = useState(false);

  const [mapError, setMapError] = useState("");

  const [locationData, setLocationData] = useState(() =>
    normalizeLocationData(initialLocation),
  );

  const mapText = isEnglish
    ? {
        locality: "Locality / NP / Province",

        localityPlaceholder: "e.g. Khao Yai National Park, Mo Singto area",

        searchingLocation: "Searching location...",

        locationNotFound: "Location not found.",

        locationSearchError: "Unable to search for this location.",

        coordinates: "Coordinates",

        latitude: "Latitude",

        longitude: "Longitude",

        elevation: "Elevation Above Sea Level",

        meters: "m",

        currentLocation: "Use Current Location",

        locating: "Finding location...",

        readingElevation: "Reading elevation...",

        mapHint:
          "Tap the map or drag the marker to adjust the specimen location.",

        noSavedCoordinates: "Type the locality or choose a point on the map.",

        noValue: "—",

        geoUnsupported: "This browser does not support location services.",

        geoDenied:
          "Unable to access your location. Allow location access or choose a point on the map.",
      }
    : {
        locality: "สถานที่ / อุทยาน / จังหวัด",

        localityPlaceholder: "เช่น Khao Yai National Park, Mo Singto area",

        searchingLocation: "กำลังค้นหาสถานที่...",

        locationNotFound: "ไม่พบสถานที่ที่พิมพ์",

        locationSearchError: "ไม่สามารถค้นหาสถานที่นี้ได้",

        coordinates: "พิกัด",

        latitude: "ละติจูด",

        longitude: "ลองจิจูด",

        elevation: "ระดับความสูงจากน้ำทะเล",

        meters: "ม.",

        currentLocation: "ใช้ตำแหน่งปัจจุบัน",

        locating: "กำลังค้นหาตำแหน่ง...",

        readingElevation: "กำลังอ่านระดับความสูง...",

        mapHint: "แตะบนแผนที่หรือลากหมุดเพื่อปรับตำแหน่งตัวอย่าง",

        noSavedCoordinates: "พิมพ์สถานที่หรือเลือกจุดบนแผนที่เพื่อเพิ่มพิกัด",

        noValue: "—",

        geoUnsupported: "เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง",

        geoDenied:
          "ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้ กรุณาอนุญาต Location หรือเลือกจุดบนแผนที่แทน",
      };

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
     AUTO SEARCH LOCALITY
  ===================================================== */

  useEffect(() => {
    if (!mapReady) {
      return;
    }

    const keyword = String(initialLocation?.locality || "").trim();

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
     INITIALIZE MAP
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function initializeMap() {
      try {
        const leafletModule = await import("leaflet");

        if (!mounted || !mapContainerRef.current) {
          return;
        }

        const L = leafletModule.default || leafletModule;

        leafletRef.current = L;

        const map = L.map(mapContainerRef.current, {
          zoomControl: true,

          attributionControl: true,

          preferCanvas: true,
        }).setView(
          [DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude],
          DEFAULT_MAP_ZOOM,
        );

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

        mapRef.current = map;

        const initial = normalizeLocationData(initialLocationRef.current);

        setLocationData(initial);

        if (hasValidCoordinates(initial.latitude, initial.longitude)) {
          placeMarker(initial.latitude, initial.longitude);

          map.setView([initial.latitude, initial.longitude], 16, {
            animate: false,
          });
        }

        setMapReady(true);

        window.setTimeout(() => {
          if (mounted && mapRef.current === map) map.invalidateSize();
        }, 150);
      } catch (err) {
        console.error("Initialize map error:", err);

        if (mounted) {
          setMapError(
            isEnglish ? "Unable to load the map." : "ไม่สามารถโหลดแผนที่ได้",
          );
        }
      }
    }

    initializeMap();

    return () => {
      mounted = false;

      if (forwardTimerRef.current) {
        window.clearTimeout(forwardTimerRef.current);
      }

      forwardAbortRef.current?.abort();

      if (mapRef.current) {
        mapRef.current.remove();

        mapRef.current = null;
      }

      markerRef.current = null;

      leafletRef.current = null;
    };
  }, []);

  /* =====================================================
     MARKER
  ===================================================== */

  function createMarkerIcon() {
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
            background:var(--sheet-raised);
          "></div>
        </div>
      `,

      iconSize: [38, 38],

      iconAnchor: [19, 36],
    });
  }

  function placeMarker(latitude, longitude) {
    const L = leafletRef.current;

    const map = mapRef.current;

    if (!L || !map) {
      return;
    }

    if (!markerRef.current) {
      const marker = L.marker([latitude, longitude], {
        draggable: true,

        icon: createMarkerIcon(),
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

    const coordinateSnapshot = {
      latitude: lat,

      longitude: lng,

      elevation: null,
    };

    setLocationData(coordinateSnapshot);

    callbackRef.current?.(coordinateSnapshot);

    setReadingElevation(true);

    try {
      const elevation = await fetchElevation(lat, lng);

      if (sequence !== selectionSequenceRef.current) {
        return;
      }

      const resolvedData = {
        latitude: lat,

        longitude: lng,

        elevation,
      };

      setLocationData(resolvedData);

      callbackRef.current?.(resolvedData);
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
      selectLocation(cached.latitude, cached.longitude, true);

      return;
    }

    forwardAbortRef.current?.abort();

    const controller = new AbortController();

    forwardAbortRef.current = controller;

    setSearchingLocation(true);

    setMapError("");

    try {
      const searchUrl = new URL(FORWARD_GEOCODING_URL);
      const cleanKeyword = keyword
        .replace(/\(.*?\)/g, "")
        .split(",")[0]
        .trim();

      // บังคับค้นหาในประเทศไทย
      searchUrl.searchParams.set("q", `${cleanKeyword}, Thailand`);

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
        setMapError(mapText.locationNotFound);

        return;
      }

      const latitude = Number(results[0]?.lat);

      const longitude = Number(results[0]?.lon);

      // จำกัดเฉพาะประเทศไทย
      // ตรวจสอบให้อยู่ในประเทศไทยเท่านั้น
      if (
        latitude < 5.5 ||
        latitude > 20.5 ||
        longitude < 97 ||
        longitude > 105.8
      ) {
        setMapError(
          isEnglish
            ? "Only locations in Thailand are allowed."
            : "รองรับเฉพาะสถานที่ในประเทศไทยเท่านั้น",
        );

        return;
      }

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setMapError(mapText.locationNotFound);

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

      setMapError(mapText.locationSearchError);
    } finally {
      if (forwardAbortRef.current === controller) {
        setSearchingLocation(false);
      }
    }
  }

  /* =====================================================
     CURRENT LOCATION
  ===================================================== */

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMapError(mapText.geoUnsupported);

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

      (geoError) => {
        console.error("Geolocation error:", geoError);

        setLocating(false);

        setMapError(mapText.geoDenied);
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

      const elevation = Number(rawValue);

      return Number.isFinite(elevation) ? elevation : null;
    } catch (err) {
      console.error("Elevation error:", err);

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

  const elevationText =
    locationData.elevation !== null &&
    locationData.elevation !== undefined &&
    Number.isFinite(Number(locationData.elevation))
      ? `${Math.round(Number(locationData.elevation))} ${mapText.meters}`
      : mapText.noValue;

  return (
    <FormSection number={number} title={title} description={description}>
      <Field
        label={mapText.locality}
        name="locality"
        value={initialLocation?.locality || ""}
        onChange={(name, value) => fieldChangeRef.current?.(name, value)}
        placeholder={mapText.localityPlaceholder}
      />

      {searchingLocation && (
        <p className="mt-2 flex items-center gap-2 text-[12px] text-muted">
          <LoadingIcon className="h-3.5 w-3.5 animate-spin" />

          {mapText.searchingLocation}
        </p>
      )}

      {/* MAP */}

      <div className="mt-5 overflow-hidden rounded-[6px] border border-rule bg-sheet">
        <div className="relative">
          <div
            ref={mapContainerRef}
            className="h-[240px] w-full sm:h-[300px] lg:h-[340px] dark:brightness-[0.78] dark:contrast-[1.05]"
          />

          {!mapReady && !mapError && (
            <div className="vh-skeleton absolute inset-0 flex items-center justify-center">
              <LoadingIcon className="h-6 w-6 animate-spin text-moss" />
            </div>
          )}
        </div>

        <p className="flex items-start gap-2 border-t border-rule bg-paper-deep px-4 py-2.5 text-[12px] leading-5 text-muted">
          <HandIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />

          <span>
            {hasCoordinates ? mapText.mapHint : mapText.noSavedCoordinates}
          </span>
        </p>
      </div>

      {/* CURRENT LOCATION */}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating || !mapReady}
          className="vh-btn vh-btn-outline vh-btn-sm w-full sm:w-auto"
        >
          {locating ? (
            <LoadingIcon className="h-4 w-4 animate-spin" />
          ) : (
            <CurrentLocationIcon className="h-4 w-4" />
          )}

          {locating ? mapText.locating : mapText.currentLocation}
        </button>

        {readingElevation && (
          <p className="inline-flex items-center gap-2 text-[12px] text-muted">
            <LoadingIcon className="h-3.5 w-3.5 animate-spin" />

            {mapText.readingElevation}
          </p>
        )}
      </div>

      {mapError && (
        <div className="mt-3 flex items-start gap-2 rounded-[4px] border border-ochre/30 bg-ochre-soft px-3 py-2.5 text-[13px] leading-5 text-ink-soft">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />

          <span>{mapError}</span>
        </div>
      )}

      {/* COORDINATES — herbarium label style */}

      <div className="vh-label-card mt-5">
        <p className="vh-eyebrow">{mapText.coordinates}</p>

        <dl className="mt-3 grid gap-x-6 sm:grid-cols-3">
          <CoordinateItem
            label={mapText.latitude}
            value={
              hasCoordinates
                ? Number(locationData.latitude).toFixed(7)
                : mapText.noValue
            }
          />

          <CoordinateItem
            label={mapText.longitude}
            value={
              hasCoordinates
                ? Number(locationData.longitude).toFixed(7)
                : mapText.noValue
            }
          />

          <CoordinateItem label={mapText.elevation} value={elevationText} />
        </dl>
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

    elevation: toFiniteNumberOrNull(value?.elevation),
  };
}

/* =========================================================
   GENERAL HELPERS
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
   UI COMPONENTS
========================================================= */

function FormSection({ number, title, description, children }) {
  return (
    <section className="border-t border-rule pt-6">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[13px] tabular-nums text-ochre">
          {number}
        </span>

        <div className="min-w-0">
          <h2 className="vh-display text-[1.55rem] sm:text-[1.8rem]">
            {title}
          </h2>

          {description && (
            <p className="mt-2 max-w-2xl text-[14px] leading-[1.7] text-muted">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 sm:pl-[2.1rem]">{children}</div>
    </section>
  );
}

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
  italic = false,
  mono = false,
  error = "",
}) {
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className="min-w-0">
      <label htmlFor={name} className="vh-field-label">
        {label}

        {required && (
          <>
            <span className="ml-1 text-clay" aria-hidden="true">
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
          italic ? "vh-binomial text-[17px]" : ""
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

function AlertBox({ type, children }) {
  const isSuccess = type === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`mt-4 flex items-start gap-3 rounded-[6px] border px-4 py-3 text-[14px] leading-6 ${
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

function CoordinateItem({ label, value }) {
  return (
    <div className="min-w-0 border-t border-dashed border-rule-strong py-2.5 first:border-t-0 sm:border-t-0 sm:py-0">
      <dt className="text-[12px] leading-5 text-faint">{label}</dt>

      <dd
        className="mt-1 truncate font-mono text-[14px] tabular-nums text-ink-soft"
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
      <path d="M4 7h16" />

      <path d="M9 7V4h6v3" />

      <path d="M6 7l1 13h10l1-13" />
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
