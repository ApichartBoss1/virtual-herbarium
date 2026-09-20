"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

import {
  IMAGE_INPUT_ACCEPT,
  getImageExtension,
  preparePlantImage,
} from "@/lib/plantImage";

/* =========================================================
   CONFIG
========================================================= */

const FOREST_IMAGE =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=88";

const IMAGE_BUCKET = "plant-images";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const INITIAL_FORM = {
  family: "",
  common_name: "",
  botanical_name: "",

  province: "",
  district: "",
  location: "",
  elevation: "",

  collection_date: "",
  habitat: "",
  notes: "",

  collected_by: "",
  specimen_number: "",
  duplicates: "",
};

export default function EditPlantPage() {
  const router = useRouter();

  const params = useParams();

  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  const plantId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  /* =====================================================
     STATE
  ===================================================== */

  const [user, setUser] = useState(null);

  const [form, setForm] = useState(INITIAL_FORM);

  const [imageFile, setImageFile] = useState(null);

  const [preview, setPreview] = useState("");

  const [oldImageUrl, setOldImageUrl] = useState("");

  const [imageMenuOpen, setImageMenuOpen] = useState(false);

  const [canUseCamera, setCanUseCamera] = useState(false);

  const [processingImage, setProcessingImage] = useState(false);

  const [imageNotice, setImageNotice] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [fatalError, setFatalError] = useState("");

  const [success, setSuccess] = useState("");

  const fileInputRef = useRef(null);

  const cameraInputRef = useRef(null);

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "EDIT SPECIMEN RECORD",

      heroTitle: "แก้ไขบันทึกพรรณไม้",

      heroDescription:
        "ปรับปรุงข้อมูล ภาพถ่าย สถานที่ และบันทึกภาคสนามของตัวอย่างพรรณไม้",

      imageLabel: "SPECIMEN IMAGE",

      image: "ภาพตัวอย่างพรรณไม้",

      imageDescription:
        "สามารถใช้รูปเดิม เลือกรูปใหม่ หรือถ่ายภาพใหม่ หากเป็น HEIC / HEIF ระบบจะแปลงเป็น JPEG ก่อนอัปโหลด",

      addImage: "เพิ่มรูปภาพ",

      changeImage: "เปลี่ยนรูปภาพ",

      currentImage: "รูปภาพปัจจุบัน",

      newImage: "รูปภาพใหม่",

      noImage: "ยังไม่มีรูปภาพ",

      imageSourceTitle: "เลือกวิธีเปลี่ยนรูป",

      imageSourceDescription: "เลือกรูปจากอุปกรณ์ หรือถ่ายภาพใหม่ด้วยกล้อง",

      chooseFromDevice: "เลือกรูปจากเครื่อง",

      chooseFromDeviceDescription: "รองรับ JPG, PNG, WEBP, HEIC และ HEIF",

      takePhoto: "ถ่ายรูป",

      takePhotoDescription: "เปิดกล้องหลังเพื่อถ่ายตัวอย่างพรรณไม้",

      cameraUnavailable: "สามารถถ่ายรูปได้จากมือถือหรือแท็บเล็ตเท่านั้น",

      imageHint: "JPG, PNG, WEBP ไม่เกิน 10MB • HEIC / HEIF จะถูกแปลงเป็น JPEG",

      invalidImage: "รองรับเฉพาะ JPG, PNG, WEBP, HEIC และ HEIF",

      imageTooLarge: "รูปภาพหลังประมวลผลต้องมีขนาดไม่เกิน 10MB",

      heicSourceTooLarge: "ไฟล์ HEIC / HEIF ต้นฉบับต้องมีขนาดไม่เกิน 25MB",

      heicConversionError:
        "ไม่สามารถแปลงไฟล์ HEIC / HEIF ได้ กรุณาลองเลือกรูปอื่น",

      convertingImage: "กำลังเตรียมรูปภาพ...",

      heicConverted: "แปลงรูป HEIC / HEIF เป็น JPEG เรียบร้อยแล้ว",

      selectedFile: "ไฟล์ใหม่ที่จะอัปโหลด",

      restoreImage: "ใช้รูปเดิม",

      close: "ปิด",

      basicLabel: "BOTANICAL IDENTITY",

      basic: "ข้อมูลพรรณไม้",

      basicDescription: "แก้ไขชื่อและข้อมูลอนุกรมวิธาน",

      commonName: "ชื่อพรรณไม้",

      commonPlaceholder: "เช่น มะม่วง",

      botanicalName: "ชื่อวิทยาศาสตร์",

      botanicalPlaceholder: "เช่น Mangifera indica",

      family: "วงศ์",

      familyPlaceholder: "เช่น Anacardiaceae",

      locationLabel: "FIELD LOCATION",

      locationTitle: "สถานที่พบ",

      locationDescription: "แก้ไขสถานที่และระดับความสูงที่พบตัวอย่าง",

      province: "จังหวัด",

      provincePlaceholder: "เช่น อุตรดิตถ์",

      district: "อำเภอ / เขต",

      districtPlaceholder: "เช่น ลับแล",

      location: "สถานที่เก็บตัวอย่าง",

      locationPlaceholder: "รายละเอียดพื้นที่ จุดสำรวจ หรือชื่อสถานที่",

      elevation: "ระดับความสูง",

      elevationPlaceholder: "เช่น 350 เมตร",

      collectionLabel: "FIELD COLLECTION",

      collection: "ข้อมูลการเก็บตัวอย่าง",

      collectionDescription:
        "แก้ไขวันที่ ผู้เก็บ หมายเลขตัวอย่าง ถิ่นอาศัย และรายละเอียดเพิ่มเติม",

      date: "วันที่เก็บตัวอย่าง",

      collectedBy: "ผู้เก็บตัวอย่าง",

      collectedByPlaceholder: "ชื่อผู้เก็บตัวอย่าง",

      specimen: "หมายเลขตัวอย่าง",

      specimenPlaceholder: "เช่น VH-0001",

      duplicates: "จำนวนตัวอย่างซ้ำ",

      duplicatesPlaceholder: "เช่น 2",

      habitat: "ถิ่นอาศัย",

      habitatPlaceholder: "เช่น ป่าดิบแล้ง ริมลำธาร พื้นที่เกษตร...",

      notes: "รายละเอียดเพิ่มเติม",

      notesPlaceholder:
        "ลักษณะเด่น สี กลิ่น การใช้ประโยชน์ หรือข้อสังเกตอื่น ๆ...",

      save: "บันทึกการแก้ไข",

      saving: "กำลังบันทึก...",

      cancel: "ยกเลิก",

      loading: "กำลังโหลดข้อมูลพรรณไม้...",

      notFound: "ไม่พบข้อมูลพรรณไม้ หรือคุณไม่มีสิทธิ์แก้ไขรายการนี้",

      loginRequired: "กรุณาเข้าสู่ระบบ",

      updateError: "ไม่สามารถแก้ไขข้อมูลได้",

      uploadError: "ไม่สามารถอัปโหลดรูปภาพได้",

      required: "กรุณากรอกชื่อพรรณไม้",

      duplicateError: "จำนวนตัวอย่างซ้ำต้องเป็นเลขจำนวนเต็มตั้งแต่ 0 ขึ้นไป",

      success: "แก้ไขข้อมูลพรรณไม้เรียบร้อยแล้ว",

      backCollection: "กลับไปคลังพรรณไม้",

      optional: "ข้อมูลอื่นสามารถเว้นว่างได้",

      mobile: "มือถือ / แท็บเล็ต",

      desktop: "ไม่รองรับบนคอมพิวเตอร์",
    },

    EN: {
      eyebrow: "EDIT SPECIMEN RECORD",

      heroTitle: "Edit Botanical Record",

      heroDescription:
        "Update the image, location and field information of this botanical specimen.",

      imageLabel: "SPECIMEN IMAGE",

      image: "Plant Image",

      imageDescription:
        "Keep the current image, choose another image, or take a new photo. HEIC / HEIF images are converted to JPEG before upload.",

      addImage: "Add Image",

      changeImage: "Change Image",

      currentImage: "Current image",

      newImage: "New image",

      noImage: "No image",

      imageSourceTitle: "Choose Image Source",

      imageSourceDescription:
        "Select an existing image or take a new photograph.",

      chooseFromDevice: "Choose from Device",

      chooseFromDeviceDescription: "Supports JPG, PNG, WEBP, HEIC and HEIF",

      takePhoto: "Take Photo",

      takePhotoDescription: "Open the rear camera to photograph the specimen.",

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

      selectedFile: "New upload file",

      restoreImage: "Use Current Image",

      close: "Close",

      basicLabel: "BOTANICAL IDENTITY",

      basic: "Plant Information",

      basicDescription: "Update the identity and taxonomic information.",

      commonName: "Common Name",

      commonPlaceholder: "e.g. Mango",

      botanicalName: "Scientific Name",

      botanicalPlaceholder: "e.g. Mangifera indica",

      family: "Family",

      familyPlaceholder: "e.g. Anacardiaceae",

      locationLabel: "FIELD LOCATION",

      locationTitle: "Collection Location",

      locationDescription:
        "Update where the specimen was found and its elevation.",

      province: "Province",

      provincePlaceholder: "e.g. Uttaradit",

      district: "District",

      districtPlaceholder: "e.g. Lap Lae",

      location: "Collection Location",

      locationPlaceholder: "Site, survey point or location details",

      elevation: "Elevation",

      elevationPlaceholder: "e.g. 350 m",

      collectionLabel: "FIELD COLLECTION",

      collection: "Collection Information",

      collectionDescription:
        "Update the date, collector, specimen number, habitat and notes.",

      date: "Collection Date",

      collectedBy: "Collected By",

      collectedByPlaceholder: "Collector name",

      specimen: "Specimen Number",

      specimenPlaceholder: "e.g. VH-0001",

      duplicates: "Duplicates",

      duplicatesPlaceholder: "e.g. 2",

      habitat: "Habitat",

      habitatPlaceholder:
        "e.g. dry evergreen forest, stream bank or agricultural area...",

      notes: "Additional Notes",

      notesPlaceholder:
        "Distinctive characters, colour, scent, uses or other observations...",

      save: "Save Changes",

      saving: "Saving...",

      cancel: "Cancel",

      loading: "Loading plant record...",

      notFound:
        "Plant record not found or you do not have permission to edit it.",

      loginRequired: "Please log in",

      updateError: "Unable to update plant",

      uploadError: "Unable to upload image",

      required: "Please enter the plant name",

      duplicateError:
        "Duplicates must be a whole number greater than or equal to 0",

      success: "Plant record updated successfully",

      backCollection: "Back to Plant Collection",

      optional: "Other information can be left blank",

      mobile: "Mobile / Tablet",

      desktop: "Unavailable on computer",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     CAMERA DETECTION
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
     LOAD USER + PLANT
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setFatalError("");

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

        if (!plantId || !UUID_PATTERN.test(plantId)) {
          throw new Error(t.notFound);
        }

        const { data: plant, error: plantError } = await supabase
          .from("plants")
          .select(
            `
                id,
                user_id,
                family,
                common_name,
                botanical_name,
                province,
                district,
                location,
                elevation,
                collection_date,
                habitat,
                notes,
                collected_by,
                specimen_number,
                duplicates,
                image_url
              `,
          )
          .eq("id", plantId)
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (!mounted) {
          return;
        }

        if (plantError || !plant) {
          throw new Error(t.notFound);
        }

        setForm({
          family: plant.family || "",

          common_name: plant.common_name || "",

          botanical_name: plant.botanical_name || "",

          province: plant.province || "",

          district: plant.district || "",

          location: plant.location || "",

          elevation:
            plant.elevation !== null && plant.elevation !== undefined
              ? String(plant.elevation)
              : "",

          collection_date: plant.collection_date || "",

          habitat: plant.habitat || "",

          notes: plant.notes || "",

          collected_by: plant.collected_by || "",

          specimen_number: plant.specimen_number || "",

          duplicates:
            plant.duplicates !== null && plant.duplicates !== undefined
              ? String(plant.duplicates)
              : "",
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

    loadData();

    return () => {
      mounted = false;
    };
  }, [plantId, router, t.notFound]);

  /* =====================================================
     MODAL ESC
  ===================================================== */

  useEffect(() => {
    if (!imageMenuOpen) {
      return;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setImageMenuOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [imageMenuOpen]);

  /* =====================================================
     FORM
  ===================================================== */

  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  /* =====================================================
     IMAGE SOURCE
  ===================================================== */

  function handleChooseFile() {
    setImageMenuOpen(false);

    fileInputRef.current?.click();
  }

  function handleTakePhoto() {
    if (!canUseCamera) {
      return;
    }

    setImageMenuOpen(false);

    cameraInputRef.current?.click();
  }

  /* =====================================================
     PREPARE IMAGE
  ===================================================== */

  async function handleImageChange(event) {
    const input = event.target;

    const selectedFile = input.files?.[0];

    input.value = "";

    if (!selectedFile) {
      return;
    }

    setError("");
    setImageNotice("");
    setProcessingImage(true);

    try {
      const { file: preparedFile, converted } =
        await preparePlantImage(selectedFile);

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

  function restoreOldImage() {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setImageFile(null);

    setPreview(oldImageUrl || "");

    setImageNotice("");
    setError("");
  }

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /* =====================================================
     UPLOAD
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
     UPDATE
  ===================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || processingImage) {
      return;
    }

    setError("");
    setSuccess("");

    if (!form.common_name.trim()) {
      setError(t.required);

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

    let duplicatesValue = null;

    if (form.duplicates.trim() !== "") {
      duplicatesValue = Number(form.duplicates);

      if (!Number.isInteger(duplicatesValue) || duplicatesValue < 0) {
        setError(t.duplicateError);

        return;
      }
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
        family: form.family.trim() || null,

        common_name: form.common_name.trim(),

        botanical_name: form.botanical_name.trim() || null,

        province: form.province.trim() || null,

        district: form.district.trim() || null,

        location: form.location.trim() || null,

        /*
         * Database = TEXT
         */

        elevation: form.elevation.trim() || null,

        collection_date: form.collection_date || null,

        habitat: form.habitat.trim() || null,

        notes: form.notes.trim() || null,

        collected_by: form.collected_by.trim() || null,

        specimen_number: form.specimen_number.trim() || null,

        duplicates: duplicatesValue,

        image_url: imageUrl,
      };

      const { data, error: updateError } = await supabase
        .from("plants")
        .update(updateData)
        .eq("id", plantId)
        .eq("user_id", user.id)
        .select()
        .maybeSingle();

      if (updateError || !data) {
        throw new Error(updateError?.message || t.updateError);
      }

      setSuccess(t.success);

      setTimeout(() => {
        router.push("/account/plants");

        router.refresh();
      }, 700);
    } catch (err) {
      console.error("Update plant error:", err);

      /*
       * upload ใหม่ผ่าน แต่ DB update ไม่ผ่าน
       * ลบรูปใหม่
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
      <main className="page">
        <Navbar />

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <LoadingIcon
              className={`mx-auto h-8 w-8 animate-spin ${
                darkMode ? "text-emerald-300" : "text-emerald-700"
              }`}
            />

            <p className="mt-4 text-sm text-[var(--muted)]">{t.loading}</p>
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     NOT FOUND
  ===================================================== */

  if (fatalError) {
    return (
      <main className="page">
        <Navbar />

        <div className="container flex min-h-[70vh] items-center justify-center py-12">
          <div className="card max-w-lg p-8 text-center">
            <AlertIcon className="mx-auto h-10 w-10 text-red-400" />

            <h1 className="mt-5 text-2xl font-black">{t.notFound}</h1>

            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              {fatalError}
            </p>

            <Link
              href="/account/plants"
              className="btn btn-primary mt-6 justify-center"
            >
              {t.backCollection}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page overflow-hidden">
      <Navbar />

      {/* HERO */}

      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-30 bg-cover bg-center"
          style={{
            backgroundImage: `url("${FOREST_IMAGE}")`,
          }}
        />

        <div
          className={`absolute inset-0 -z-20 ${
            darkMode
              ? "bg-[linear-gradient(90deg,rgba(2,9,5,0.97),rgba(3,14,7,0.72))]"
              : "bg-[linear-gradient(90deg,rgba(238,246,236,0.97),rgba(235,244,233,0.76))]"
          }`}
        />

        <div
          className={`absolute inset-x-0 bottom-0 -z-10 h-32 ${
            darkMode
              ? "bg-gradient-to-t from-[#07100b] to-transparent"
              : "bg-gradient-to-t from-[#f1f6f1] to-transparent"
          }`}
        />

        <div className="container py-14 sm:py-20">
          <div className="max-w-3xl">
            <div
              className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 backdrop-blur-xl ${
                darkMode
                  ? "border-emerald-300/20 bg-black/20 text-emerald-200"
                  : "border-emerald-950/15 bg-white/55 text-emerald-900"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-[10px] font-black tracking-[0.22em]">
                {t.eyebrow}
              </span>
            </div>

            <h1
              className={`mt-6 text-4xl font-black tracking-[-0.05em] sm:text-6xl ${
                darkMode ? "text-white" : "text-[#102218]"
              }`}
            >
              {t.heroTitle}
            </h1>

            <p className="mt-5 max-w-2xl leading-8 text-[var(--muted)]">
              {t.heroDescription}
            </p>
          </div>
        </div>
      </section>

      {/* FORM */}

      <section className="container py-10 sm:py-14">
        <form onSubmit={handleSubmit}>
          <div className="mx-auto max-w-5xl space-y-6">
            {/* IMAGE */}

            <FormCard darkMode={darkMode}>
              <SectionHeading
                darkMode={darkMode}
                label={t.imageLabel}
                title={t.image}
                description={t.imageDescription}
                icon={<ImageIcon className="h-5 w-5" />}
              />

              <div className="mt-8 grid gap-7 md:grid-cols-[300px_1fr] md:items-center">
                <div
                  className={`relative overflow-hidden rounded-[1.7rem] border ${
                    darkMode
                      ? "border-white/10 bg-[#07120b]"
                      : "border-emerald-950/10 bg-[#eef5ed]"
                  }`}
                >
                  {preview ? (
                    <>
                      <img
                        src={preview}
                        alt={form.common_name || "Plant preview"}
                        className="aspect-square h-full w-full object-cover"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                      <span className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1.5 text-[9px] font-black text-white backdrop-blur-xl">
                        {imageFile ? t.newImage : t.currentImage}
                      </span>
                    </>
                  ) : (
                    <div className="flex aspect-square items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-10 w-10 text-emerald-500" />

                        <p className="mt-4 text-sm font-bold">{t.noImage}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setImageMenuOpen(true)}
                    disabled={saving || processingImage}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-black text-white transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {processingImage ? (
                      <>
                        <LoadingIcon className="h-5 w-5 animate-spin" />

                        {t.convertingImage}
                      </>
                    ) : (
                      <>
                        <ImageAddIcon className="h-5 w-5" />

                        {preview ? t.changeImage : t.addImage}
                      </>
                    )}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={IMAGE_INPUT_ACCEPT}
                    onChange={handleImageChange}
                    disabled={saving || processingImage}
                    className="hidden"
                  />

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    disabled={saving || processingImage || !canUseCamera}
                    className="hidden"
                  />

                  <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
                    {t.imageHint}
                  </p>

                  {imageNotice && (
                    <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-500">
                      {imageNotice}
                    </div>
                  )}

                  {imageFile && (
                    <>
                      <div className="mt-4 rounded-xl border border-[var(--border)] px-4 py-3">
                        <p className="text-[10px] font-bold uppercase text-[var(--muted)]">
                          {t.selectedFile}
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold">
                          {imageFile.name}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={restoreOldImage}
                        disabled={saving}
                        className="btn btn-secondary mt-3 justify-center"
                      >
                        <UndoIcon className="h-4 w-4" />

                        {t.restoreImage}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </FormCard>

            {/* BASIC */}

            <FormCard darkMode={darkMode}>
              <SectionHeading
                darkMode={darkMode}
                label={t.basicLabel}
                title={t.basic}
                description={t.basicDescription}
                icon={<LeafIcon className="h-5 w-5" />}
              />

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <EditField
                  label={t.commonName}
                  name="common_name"
                  value={form.common_name}
                  onChange={updateField}
                  placeholder={t.commonPlaceholder}
                  required
                  darkMode={darkMode}
                  disabled={saving}
                />

                <EditField
                  label={t.botanicalName}
                  name="botanical_name"
                  value={form.botanical_name}
                  onChange={updateField}
                  placeholder={t.botanicalPlaceholder}
                  italic
                  darkMode={darkMode}
                  disabled={saving}
                />

                <EditField
                  label={t.family}
                  name="family"
                  value={form.family}
                  onChange={updateField}
                  placeholder={t.familyPlaceholder}
                  darkMode={darkMode}
                  disabled={saving}
                />
              </div>
            </FormCard>

            {/* LOCATION */}

            <FormCard darkMode={darkMode}>
              <SectionHeading
                darkMode={darkMode}
                label={t.locationLabel}
                title={t.locationTitle}
                description={t.locationDescription}
                icon={<PinIcon className="h-5 w-5" />}
              />

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <EditField
                  label={t.province}
                  name="province"
                  value={form.province}
                  onChange={updateField}
                  placeholder={t.provincePlaceholder}
                  darkMode={darkMode}
                  disabled={saving}
                />

                <EditField
                  label={t.district}
                  name="district"
                  value={form.district}
                  onChange={updateField}
                  placeholder={t.districtPlaceholder}
                  darkMode={darkMode}
                  disabled={saving}
                />

                <div className="md:col-span-2">
                  <EditField
                    label={t.location}
                    name="location"
                    value={form.location}
                    onChange={updateField}
                    placeholder={t.locationPlaceholder}
                    darkMode={darkMode}
                    disabled={saving}
                  />
                </div>

                <EditField
                  label={t.elevation}
                  name="elevation"
                  value={form.elevation}
                  onChange={updateField}
                  placeholder={t.elevationPlaceholder}
                  darkMode={darkMode}
                  disabled={saving}
                />
              </div>
            </FormCard>

            {/* COLLECTION */}

            <FormCard darkMode={darkMode}>
              <SectionHeading
                darkMode={darkMode}
                label={t.collectionLabel}
                title={t.collection}
                description={t.collectionDescription}
                icon={<DocumentIcon className="h-5 w-5" />}
              />

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <EditField
                  label={t.date}
                  name="collection_date"
                  type="date"
                  value={form.collection_date}
                  onChange={updateField}
                  darkMode={darkMode}
                  disabled={saving}
                />

                <EditField
                  label={t.collectedBy}
                  name="collected_by"
                  value={form.collected_by}
                  onChange={updateField}
                  placeholder={t.collectedByPlaceholder}
                  darkMode={darkMode}
                  disabled={saving}
                />

                <EditField
                  label={t.specimen}
                  name="specimen_number"
                  value={form.specimen_number}
                  onChange={updateField}
                  placeholder={t.specimenPlaceholder}
                  darkMode={darkMode}
                  disabled={saving}
                />

                <EditField
                  label={t.duplicates}
                  name="duplicates"
                  type="number"
                  min="0"
                  step="1"
                  value={form.duplicates}
                  onChange={updateField}
                  placeholder={t.duplicatesPlaceholder}
                  darkMode={darkMode}
                  disabled={saving}
                />

                <div className="md:col-span-2">
                  <EditTextArea
                    label={t.habitat}
                    name="habitat"
                    value={form.habitat}
                    onChange={updateField}
                    placeholder={t.habitatPlaceholder}
                    darkMode={darkMode}
                    disabled={saving}
                  />
                </div>

                <div className="md:col-span-2">
                  <EditTextArea
                    label={t.notes}
                    name="notes"
                    value={form.notes}
                    onChange={updateField}
                    rows={6}
                    placeholder={t.notesPlaceholder}
                    darkMode={darkMode}
                    disabled={saving}
                  />
                </div>
              </div>

              <p className="mt-6 text-xs text-[var(--muted)]">{t.optional}</p>
            </FormCard>

            {error && (
              <AlertBox darkMode={darkMode} type="error">
                {error}
              </AlertBox>
            )}

            {success && (
              <AlertBox darkMode={darkMode} type="success">
                {success}
              </AlertBox>
            )}

            {/* BOTTOM ACTIONS */}

            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pb-8 pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/account/plants"
                className="btn btn-secondary justify-center"
              >
                {t.cancel}
              </Link>

              <button
                type="submit"
                disabled={saving || processingImage || Boolean(success)}
                className="btn btn-primary justify-center disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoadingIcon className="h-5 w-5 animate-spin" />

                    {t.saving}
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-5 w-5" />

                    {t.save}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* IMAGE MODAL */}

      {imageMenuOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setImageMenuOpen(false)}
        >
          <div
            className={`w-full max-w-md rounded-[1.8rem] border p-5 shadow-2xl ${
              darkMode
                ? "border-white/10 bg-[#09150e]"
                : "border-emerald-950/10 bg-white"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between gap-4">
              <div>
                <h3 className="text-xl font-black">{t.imageSourceTitle}</h3>

                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {t.imageSourceDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setImageMenuOpen(false)}
                className="icon-btn"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <SourceButton
                darkMode={darkMode}
                icon={<UploadIcon className="h-6 w-6" />}
                title={t.chooseFromDevice}
                description={t.chooseFromDeviceDescription}
                onClick={handleChooseFile}
              />

              <SourceButton
                darkMode={darkMode}
                icon={<CameraIcon className="h-6 w-6" />}
                title={t.takePhoto}
                description={
                  canUseCamera ? t.takePhotoDescription : t.cameraUnavailable
                }
                disabled={!canUseCamera}
                onClick={handleTakePhoto}
                badge={canUseCamera ? t.mobile : t.desktop}
              />
            </div>

            <button
              type="button"
              onClick={() => setImageMenuOpen(false)}
              className="mt-4 min-h-11 w-full rounded-xl text-sm font-bold text-[var(--muted)]"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function FormCard({ children, darkMode }) {
  return (
    <section
      className={`rounded-[2rem] border p-6 shadow-xl sm:p-8 ${
        darkMode
          ? "border-white/10 bg-[#0a1710]"
          : "border-emerald-950/10 bg-white/85"
      }`}
    >
      {children}
    </section>
  );
}

function SectionHeading({ darkMode, label, title, description, icon }) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/10 text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <div>
        <p
          className={`text-[9px] font-black tracking-[0.17em] ${
            darkMode ? "text-emerald-400" : "text-emerald-700"
          }`}
        >
          {label}
        </p>

        <h2 className="mt-1 text-xl font-black sm:text-2xl">{title}</h2>

        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}

function EditField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  darkMode,
  disabled,
  min,
  step,
  italic = false,
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-bold">
        {label}

        {required && <span className="ml-1 text-red-400">*</span>}
      </label>

      <input
        id={name}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        step={step}
        onChange={(event) => onChange(name, event.target.value)}
        className={`h-[52px] w-full rounded-xl border px-4 text-sm outline-none ${
          italic ? "italic" : ""
        } ${
          darkMode
            ? "border-white/10 bg-black/20 text-white"
            : "border-emerald-950/10 bg-white/70 text-slate-900"
        }`}
      />
    </div>
  );
}

function EditTextArea({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  rows = 4,
  darkMode,
  disabled,
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-bold">
        {label}
      </label>

      <textarea
        id={name}
        value={value}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        className={`w-full resize-none rounded-xl border px-4 py-3 text-sm leading-7 outline-none ${
          darkMode
            ? "border-white/10 bg-black/20 text-white"
            : "border-emerald-950/10 bg-white/70 text-slate-900"
        }`}
      />
    </div>
  );
}

function SourceButton({
  darkMode,
  icon,
  title,
  description,
  onClick,
  disabled = false,
  badge = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left ${
        disabled
          ? "cursor-not-allowed opacity-40"
          : darkMode
            ? "border-white/10 bg-white/[0.03]"
            : "border-emerald-950/10 bg-[#f7faf6]"
      }`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
        {icon}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-black">{title}</p>

          {badge && (
            <span className="rounded-full bg-[var(--secondary)] px-2 py-1 text-[8px] font-black">
              {badge}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          {description}
        </p>
      </div>
    </button>
  );
}

function AlertBox({ darkMode, type, children }) {
  const success = type === "success";

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm ${
        success
          ? darkMode
            ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-200"
            : "border-emerald-200 bg-emerald-50 text-emerald-800"
          : darkMode
            ? "border-red-400/15 bg-red-400/[0.06] text-red-200"
            : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {success ? (
        <CheckIcon className="h-5 w-5 shrink-0" />
      ) : (
        <AlertIcon className="h-5 w-5 shrink-0" />
      )}

      {children}
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
    >
      <path d="M8 6 9.5 4h5L16 6h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function ImageAddIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m4 17 5-5 4 4M17 11v6M14 14h6" />
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
    >
      <path d="M12 16V4m-5 5 5-5 5 5M5 20h14" />
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
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 20" />
    </svg>
  );
}

function LeafIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 4C10 4 5 8 5 15c0 2.8 2 5 5 5 7 0 10-5 10-16ZM4 20c4-5 7-7 13-10" />
    </svg>
  );
}

function PinIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function DocumentIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h8l4 4v14H6zM14 3v5h5M9 13h6M9 17h6" />
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
    >
      <path d="M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6" />
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
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 3h12l3 3v15H4V4a1 1 0 0 1 1-1Z" />
      <path d="M8 3v6h8V3" />
      <rect x="8" y="14" width="8" height="7" rx="1" />
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
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5h.01" />
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
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16.5 9" />
    </svg>
  );
}

function CloseIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function LoadingIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
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
