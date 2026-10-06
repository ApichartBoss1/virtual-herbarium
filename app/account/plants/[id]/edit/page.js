"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";

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

const IMAGE_BUCKET = "plant-images";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFAULT_MAP_CENTER = {
  latitude: 15.87,
  longitude: 100.99,
};

const DEFAULT_MAP_ZOOM = 5;

const REVERSE_GEOCODING_URL =
  process.env.NEXT_PUBLIC_REVERSE_GEOCODING_URL ||
  "https://nominatim.openstreetmap.org/reverse";

const MAP_TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const ELEVATION_URL =
  process.env.NEXT_PUBLIC_ELEVATION_URL ||
  "https://api.open-meteo.com/v1/elevation";

const INITIAL_FORM = {
  family: "",
  common_name: "",
  botanical_name: "",

  province: "",
  district: "",
  subdistrict: "",
  postcode: "",
  location: "",

  latitude: null,
  longitude: null,

  elevation: "",

  collection_date: "",
  habitat: "",
  notes: "",

  collected_by: "",
  specimen_number: "",
  duplicates: "",
};

/* =========================================================
   COPY
========================================================= */

const COPY = {
  TH: {
    eyebrow: "EDIT SPECIMEN",

    title: "แก้ไขข้อมูลพรรณไม้",

    subtitle:
      "ปรับปรุงข้อมูลตัวอย่าง รูปภาพ ตำแหน่งที่พบ และข้อมูลการเก็บตัวอย่าง",

    back: "กลับคลังพรรณไม้",

    plant: "ข้อมูลพรรณไม้",

    plantDesc: "แก้ไขชื่อและข้อมูลอนุกรมวิธานของตัวอย่าง",

    common: "ชื่อพรรณไม้",

    commonPh: "เช่น มะม่วง",

    botanical: "ชื่อวิทยาศาสตร์",

    botanicalPh: "เช่น Mangifera indica",

    family: "วงศ์",

    familyPh: "เช่น Anacardiaceae",

    location: "สถานที่พบ",

    locationDesc:
      "ตำแหน่งเดิมจะแสดงบนแผนที่ หากต้องการเปลี่ยนให้แตะแผนที่ ลากหมุด หรือใช้ตำแหน่งปัจจุบัน",

    collection: "ข้อมูลการเก็บตัวอย่าง",

    collectionDesc:
      "แก้ไขวันที่ ผู้เก็บ หมายเลขตัวอย่าง ถิ่นอาศัย และรายละเอียดเพิ่มเติม",

    date: "วันที่เก็บตัวอย่าง",

    collector: "ชื่อผู้เก็บตัวอย่าง",

    collectorPh: "ชื่อผู้เก็บตัวอย่าง",

    specimen: "หมายเลขตัวอย่าง",

    specimenPh: "เช่น VH-0001",

    duplicates: "จำนวนตัวอย่างซ้ำ",

    duplicatesPh: "เช่น 2",

    habitat: "ถิ่นอาศัย",

    habitatPh: "เช่น ป่าดิบแล้ง ริมลำธาร พื้นที่เกษตร...",

    notes: "รายละเอียดเพิ่มเติม",

    notesPh: "ลักษณะเด่น สี กลิ่น การใช้ประโยชน์ หรือข้อสังเกตอื่น ๆ...",

    optional: "ข้อมูลอื่นสามารถเว้นว่างได้",

    image: "รูปภาพตัวอย่าง",

    imageDesc:
      "เพิ่มภาพที่เห็นลักษณะของตัวอย่างได้ชัดเจน สามารถเลือกจากเครื่องหรือถ่ายด้วยกล้อง",

    currentImage: "รูปภาพปัจจุบัน",

    newImage: "รูปภาพใหม่",

    noImage: "ยังไม่ได้เลือกรูปภาพ",

    chooseImage: "เลือกรูปจากเครื่อง",

    takePhoto: "ถ่ายด้วยกล้อง",

    imageHint: "JPG, PNG, WEBP, HEIC และ HEIFv ไม่เกิน 10MB",

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

    required: "กรุณากรอกชื่อพรรณไม้",

    duplicateError: "จำนวนตัวอย่างซ้ำต้องเป็นเลขจำนวนเต็มตั้งแต่ 0 ขึ้นไป",

    loginRequired: "กรุณาเข้าสู่ระบบ",

    uploadError: "ไม่สามารถอัปโหลดรูปภาพได้",

    updateError: "ไม่สามารถแก้ไขข้อมูลได้",

    success: "แก้ไขข้อมูลพรรณไม้เรียบร้อยแล้ว",

    loading: "กำลังโหลดข้อมูลพรรณไม้...",

    notFound: "ไม่พบข้อมูลพรรณไม้ หรือคุณไม่มีสิทธิ์แก้ไขรายการนี้",

    cancel: "ยกเลิก",

    save: "บันทึกการแก้ไข",

    saving: "กำลังบันทึก...",
  },

  EN: {
    eyebrow: "EDIT SPECIMEN",

    title: "Edit Plant Record",

    subtitle:
      "Update specimen information, image, collection location and field data.",

    back: "Back to Plant Collection",

    plant: "Plant Information",

    plantDesc: "Update the identity and taxonomic information.",

    common: "Common Name",

    commonPh: "e.g. Mango",

    botanical: "Scientific Name",

    botanicalPh: "e.g. Mangifera indica",

    family: "Family",

    familyPh: "e.g. Anacardiaceae",

    location: "Collection Location",

    locationDesc:
      "The saved point is shown on the map. Tap the map, drag the marker, or use your current location to change it.",

    collection: "Collection Information",

    collectionDesc:
      "Update the date, collector, specimen number, habitat and notes.",

    date: "Collection Date",

    collector: "Collected By",

    collectorPh: "Collector name",

    specimen: "Specimen Number",

    specimenPh: "e.g. VH-0001",

    duplicates: "Duplicates",

    duplicatesPh: "e.g. 2",

    habitat: "Habitat",

    habitatPh: "e.g. evergreen forest, stream bank or agricultural area...",

    notes: "Additional Notes",

    notesPh:
      "Distinctive characters, colour, scent, uses or other observations...",

    optional: "Other information can be left blank",

    image: "Plant Image",

    imageDesc:
      "Add a clear specimen image. You can choose a file or capture a new photo.",

    currentImage: "Current image",

    newImage: "New image",

    noImage: "No image selected",

    chooseImage: "Choose Image",

    takePhoto: "Take Photo",

    imageHint: "JPG, PNG, WEBP, HEIC and HEIF up to 10MB",

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

    required: "Please enter the plant name",

    duplicateError:
      "Duplicates must be a whole number greater than or equal to 0",

    loginRequired: "Please log in",

    uploadError: "Unable to upload image",

    updateError: "Unable to update plant",

    success: "Plant record updated successfully",

    loading: "Loading plant record...",

    notFound:
      "Plant record not found or you do not have permission to edit it.",

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

  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  const t = isEnglish ? COPY.EN : COPY.TH;

  const plantId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  /* =====================================================
     STATE
  ===================================================== */

  const [user, setUser] = useState(null);

  const [form, setForm] = useState(INITIAL_FORM);

  const [imageFile, setImageFile] = useState(null);

  const [preview, setPreview] = useState("");

  const [oldImageUrl, setOldImageUrl] = useState("");

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
     LOAD USER + PLANT
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadPlant() {
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

        const {
          data: plant,

          error: plantError,
        } = await supabase
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
                subdistrict,
                postcode,
                location,
                latitude,
                longitude,
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

        /*
         * รองรับข้อมูลเก่าที่เคยเก็บ
         * Coordinates ไว้ใน location
         */
        const legacy = extractLegacyCoordinates(plant.location);

        setForm({
          family: plant.family || "",

          common_name: plant.common_name || "",

          botanical_name: plant.botanical_name || "",

          province: plant.province || "",

          district: plant.district || "",

          subdistrict: plant.subdistrict || "",

          postcode: plant.postcode || "",

          location: cleanLegacyLocation(plant.location),

          latitude: toFiniteNumberOrNull(plant.latitude) ?? legacy.latitude,

          longitude: toFiniteNumberOrNull(plant.longitude) ?? legacy.longitude,

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

    loadPlant();

    return () => {
      mounted = false;
    };
  }, [plantId, router, t.notFound]);

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

      province: locationData.province || "",

      district: locationData.district || "",

      subdistrict: locationData.subdistrict || "",

      postcode: locationData.postcode || "",

      location: locationData.address || "",

      latitude: toFiniteNumberOrNull(locationData.latitude),

      longitude: toFiniteNumberOrNull(locationData.longitude),

      elevation:
        locationData.elevation !== null &&
        locationData.elevation !== undefined &&
        Number.isFinite(Number(locationData.elevation))
          ? String(Math.round(Number(locationData.elevation)))
          : "",
    }));

    setError("");
    setSuccess("");
  }

  /* =====================================================
     IMAGE BUTTONS

     ทั้งสองปุ่มแยกกันจริง:
     - ปุ่มเลือกรูป -> fileInputRef
     - ปุ่มถ่ายกล้อง -> cameraInputRef
  ===================================================== */

  function handleChooseImage() {
    fileInputRef.current?.click();
  }

  function handleTakePhoto() {
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

        subdistrict: form.subdistrict.trim() || null,

        postcode: form.postcode.trim() || null,

        location: form.location.trim() || null,

        latitude: toFiniteNumberOrNull(form.latitude),

        longitude: toFiniteNumberOrNull(form.longitude),

        /*
         * elevation ในฐานข้อมูลเดิมเป็น text
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

      window.setTimeout(() => {
        router.push("/account/plants");

        router.refresh();
      }, 700);
    } catch (err) {
      console.error("Update plant error:", err);

      /*
       * ถ้า upload รูปใหม่สำเร็จ
       * แต่ update database ไม่สำเร็จ
       * ให้ลบรูปใหม่ที่ไม่ได้ใช้งานออก
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
      <PageShell darkMode={darkMode}>
        <Navbar />

        <div className="flex min-h-[65dvh] items-center justify-center px-5">
          <div className="text-center">
            <LoadingIcon
              className={`mx-auto h-7 w-7 animate-spin ${
                darkMode ? "text-emerald-300" : "text-emerald-700"
              }`}
            />

            <p
              className={`mt-4 text-[13px] font-medium ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              {t.loading}
            </p>
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
      <PageShell darkMode={darkMode}>
        <Navbar />

        <div className="container flex min-h-[65dvh] items-center justify-center py-10">
          <div
            className={`w-full max-w-md rounded-[20px] border p-6 text-center shadow-sm sm:p-8 ${
              darkMode
                ? "border-white/[0.08] bg-[#0a1710]"
                : "border-emerald-950/[0.07] bg-white"
            }`}
          >
            <AlertIcon className="mx-auto h-9 w-9 text-red-400" />

            <h1 className="mt-4 text-xl font-black sm:text-2xl">
              {t.notFound}
            </h1>

            <p
              className={`mt-3 text-[12px] leading-6 sm:text-[13px] ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              {fatalError}
            </p>

            <Link
              href="/account/plants"
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-emerald-700 px-5 text-[12px] font-black text-white transition hover:bg-emerald-600"
            >
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

  return (
    <PageShell darkMode={darkMode}>
      <Navbar />

      {/* =================================================
          HERO
      ================================================= */}

      <section
        className={`border-b ${
          darkMode
            ? "border-white/[0.08] bg-[#09150f]"
            : "border-emerald-950/[0.06] bg-white/85"
        }`}
      >
        <div className="container py-5 sm:py-7 lg:py-9">
          <Link
            href="/account/plants"
            className={`hidden min-h-10 w-fit items-center gap-2 rounded-xl border px-4 text-xs font-bold transition md:inline-flex ${
              darkMode
                ? "border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]"
                : "border-emerald-950/10 bg-white text-slate-600 hover:bg-emerald-50"
            }`}
          >
            <ArrowLeftIcon className="h-4 w-4" />

            {t.back}
          </Link>

          <div className="max-w-3xl md:mt-5">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 ${
                darkMode
                  ? "border-emerald-300/15 bg-emerald-400/[0.05] text-emerald-300"
                  : "border-emerald-900/10 bg-emerald-50 text-emerald-800"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  darkMode ? "bg-emerald-400" : "bg-emerald-700"
                }`}
              />

              <span className="text-[8px] font-black tracking-[0.2em] sm:text-[9px]">
                {t.eyebrow}
              </span>
            </div>

            <h1
              className={`mt-3 font-black tracking-[-0.035em] ${
                isEnglish
                  ? "text-[1.85rem] leading-[1.18] sm:text-[2.35rem] lg:text-[2.65rem]"
                  : "text-[1.9rem] leading-[1.32] sm:text-[2.4rem] sm:leading-[1.28] lg:text-[2.7rem]"
              } ${darkMode ? "text-white" : "text-[#102218]"}`}
            >
              {t.title}
            </h1>

            <p
              className={`mt-2.5 max-w-2xl text-[12px] leading-[1.85] sm:mt-3 sm:text-[13px] lg:text-[14px] ${
                darkMode ? "text-[#aebeb3]" : "text-[#526858]"
              }`}
            >
              {t.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="container pb-8 pt-5 sm:pb-10 sm:pt-7 lg:pb-12 lg:pt-8">
        <form onSubmit={handleSubmit}>
          <div className="mx-auto grid max-w-[1160px] gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* =================================================
                MAIN
            ================================================= */}

            <div className="space-y-4 sm:space-y-5">
              {/* PLANT */}

              <FormCard darkMode={darkMode}>
                <SectionHeader
                  icon={<LeafIcon className="h-5 w-5" />}
                  title={t.plant}
                  description={t.plantDesc}
                  darkMode={darkMode}
                />

                <div className="mt-5 grid gap-4 sm:gap-5 md:grid-cols-2">
                  <Field
                    label={t.common}
                    name="common_name"
                    value={form.common_name}
                    onChange={updateField}
                    placeholder={t.commonPh}
                    required
                    requiredText={t.requiredLabel}
                    darkMode={darkMode}
                    disabled={saving}
                  />

                  <Field
                    label={t.botanical}
                    name="botanical_name"
                    value={form.botanical_name}
                    onChange={updateField}
                    placeholder={t.botanicalPh}
                    italic
                    darkMode={darkMode}
                    disabled={saving}
                  />

                  <div className="md:col-span-2">
                    <Field
                      label={t.family}
                      name="family"
                      value={form.family}
                      onChange={updateField}
                      placeholder={t.familyPh}
                      darkMode={darkMode}
                      disabled={saving}
                    />
                  </div>
                </div>
              </FormCard>

              {/* MAP */}

              <AutoLocationMap
                darkMode={darkMode}
                language={language}
                title={t.location}
                description={t.locationDesc}
                initialLocation={{
                  province: form.province,

                  district: form.district,

                  subdistrict: form.subdistrict,

                  postcode: form.postcode,

                  address: form.location,

                  latitude: form.latitude,

                  longitude: form.longitude,

                  elevation: toApproxNumberOrNull(form.elevation),
                }}
                onLocationResolved={handleLocationResolved}
              />

              {/* COLLECTION */}

              <FormCard darkMode={darkMode}>
                <SectionHeader
                  icon={<DocumentIcon className="h-5 w-5" />}
                  title={t.collection}
                  description={t.collectionDesc}
                  darkMode={darkMode}
                />

                <div className="mt-5 grid gap-4 sm:gap-5 md:grid-cols-2">
                  <Field
                    label={t.date}
                    name="collection_date"
                    type="date"
                    value={form.collection_date}
                    onChange={updateField}
                    darkMode={darkMode}
                    disabled={saving}
                  />

                  <Field
                    label={t.collector}
                    name="collected_by"
                    value={form.collected_by}
                    onChange={updateField}
                    placeholder={t.collectorPh}
                    darkMode={darkMode}
                    disabled={saving}
                  />

                  <Field
                    label={t.specimen}
                    name="specimen_number"
                    value={form.specimen_number}
                    onChange={updateField}
                    placeholder={t.specimenPh}
                    darkMode={darkMode}
                    disabled={saving}
                  />

                  <Field
                    label={t.duplicates}
                    name="duplicates"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={form.duplicates}
                    onChange={updateField}
                    placeholder={t.duplicatesPh}
                    darkMode={darkMode}
                    disabled={saving}
                  />

                  <div className="md:col-span-2">
                    <TextArea
                      label={t.habitat}
                      name="habitat"
                      value={form.habitat}
                      onChange={updateField}
                      placeholder={t.habitatPh}
                      rows={3}
                      darkMode={darkMode}
                      disabled={saving}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TextArea
                      label={t.notes}
                      name="notes"
                      value={form.notes}
                      onChange={updateField}
                      placeholder={t.notesPh}
                      rows={4}
                      darkMode={darkMode}
                      disabled={saving}
                    />
                  </div>
                </div>

                <p
                  className={`mt-4 text-[10px] leading-5 sm:text-[11px] ${
                    darkMode ? "text-gray-500" : "text-slate-400"
                  }`}
                >
                  {t.optional}
                </p>
              </FormCard>
            </div>

            {/* =================================================
                IMAGE

                ปุ่มเป็น 2 ปุ่มแยกกันจริง
            ================================================= */}

            <aside className="order-first lg:order-none lg:sticky lg:top-24">
              <FormCard darkMode={darkMode} compact>
                <SectionHeader
                  icon={<CameraIcon className="h-5 w-5" />}
                  title={t.image}
                  description={t.imageDesc}
                  darkMode={darkMode}
                />

                {/* PREVIEW */}

                <div
                  className={`relative mt-5 h-[250px] overflow-hidden rounded-[18px] border sm:h-[300px] lg:h-auto lg:aspect-square ${
                    darkMode
                      ? "border-white/10 bg-black/20"
                      : "border-emerald-950/[0.08] bg-[#f4f8f4]"
                  }`}
                >
                  {preview ? (
                    <>
                      <img
                        src={preview}
                        alt={form.common_name || "Plant preview"}
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                      <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[8px] font-black text-white backdrop-blur-md sm:text-[9px]">
                        {imageFile ? t.newImage : t.currentImage}
                      </span>
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-5 text-center">
                      <div>
                        <div
                          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] sm:h-16 sm:w-16 ${
                            darkMode
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-emerald-800/[0.08] text-emerald-700"
                          }`}
                        >
                          <ImageIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>

                        <p
                          className={`mt-3 text-[12px] font-black sm:text-[13px] ${
                            darkMode ? "text-gray-300" : "text-slate-700"
                          }`}
                        >
                          {t.noImage}
                        </p>

                        <p
                          className={`mt-1.5 text-[9px] leading-5 sm:text-[10px] ${
                            darkMode ? "text-gray-500" : "text-slate-400"
                          }`}
                        >
                          {t.imageHint}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* =================================================
                    INPUT 1 : เลือกรูปจากเครื่อง
                ================================================= */}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_INPUT_ACCEPT}
                  onChange={handleImageChange}
                  disabled={saving || processingImage}
                  className="hidden"
                />

                {/* =================================================
                    INPUT 2 : กล้อง

                    เป็นคนละ input กับเลือกรูป
                ================================================= */}

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  disabled={saving || processingImage}
                  className="hidden"
                />

                {/* =================================================
                    TWO SEPARATE BUTTONS
                ================================================= */}

                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {/* BUTTON 1 */}

                  <button
                    type="button"
                    onClick={handleChooseImage}
                    disabled={saving || processingImage}
                    className="
                      inline-flex
                      min-h-[46px]
                      min-w-0
                      items-center
                      justify-center
                      gap-2
                      rounded-[13px]
                      bg-emerald-700
                      px-2.5
                      text-[10px]
                      font-black
                      text-white
                      shadow-[0_6px_16px_rgba(5,110,78,0.16)]
                      transition
                      hover:bg-emerald-600
                      active:scale-[0.99]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      sm:px-3
                      sm:text-[11px]
                    "
                  >
                    {processingImage ? (
                      <LoadingIcon className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <UploadIcon className="h-4 w-4 shrink-0" />
                    )}

                    <span className="min-w-0 truncate">
                      {processingImage ? t.converting : t.chooseImage}
                    </span>
                  </button>

                  {/* BUTTON 2 */}

                  <button
                    type="button"
                    onClick={handleTakePhoto}
                    disabled={saving || processingImage}
                    className={`inline-flex min-h-[46px] min-w-0 items-center justify-center gap-2 rounded-[13px] border px-2.5 text-[10px] font-black transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:px-3 sm:text-[11px] ${
                      darkMode
                        ? "border-white/10 bg-white/[0.04] text-emerald-300 hover:bg-white/[0.08]"
                        : "border-emerald-950/10 bg-white text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    <CameraIcon className="h-4 w-4 shrink-0" />

                    <span className="min-w-0 truncate">{t.takePhoto}</span>
                  </button>
                </div>

                {/* HINT */}

                <p
                  className={`mt-2.5 text-[9px] leading-5 sm:text-[10px] ${
                    darkMode ? "text-gray-500" : "text-slate-400"
                  }`}
                >
                  {t.imageHint}
                </p>

                {/* HEIC NOTICE */}

                {imageNotice && (
                  <div
                    className={`mt-3 rounded-xl border px-3 py-2.5 text-[10px] leading-5 ${
                      darkMode
                        ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-200"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {imageNotice}
                  </div>
                )}

                {/* NEW FILE */}

                {imageFile && (
                  <div className="mt-3">
                    <div
                      className={`rounded-xl border px-3 py-2.5 ${
                        darkMode
                          ? "border-white/[0.08] bg-white/[0.025]"
                          : "border-emerald-950/[0.07] bg-[#f8faf7]"
                      }`}
                    >
                      <p
                        className={`text-[8px] font-bold uppercase tracking-[0.08em] ${
                          darkMode ? "text-gray-500" : "text-slate-400"
                        }`}
                      >
                        {t.selectedFile}
                      </p>

                      <p
                        className={`mt-1 truncate text-[10px] font-bold ${
                          darkMode ? "text-gray-200" : "text-slate-700"
                        }`}
                        title={imageFile.name}
                      >
                        {imageFile.name}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={restoreOldImage}
                      disabled={saving}
                      className={`mt-2.5 inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-[11px] border px-3 text-[10px] font-bold transition ${
                        darkMode
                          ? "border-white/10 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]"
                          : "border-emerald-950/10 bg-white text-slate-700 hover:bg-emerald-50"
                      }`}
                    >
                      <UndoIcon className="h-3.5 w-3.5" />

                      {t.restoreImage}
                    </button>
                  </div>
                )}
              </FormCard>
            </aside>
          </div>

          {/* =================================================
              ERROR / SUCCESS
          ================================================= */}

          <div className="mx-auto max-w-[1160px]">
            {error && (
              <div className="mt-5">
                <AlertBox darkMode={darkMode} type="error">
                  {error}
                </AlertBox>
              </div>
            )}

            {success && (
              <div className="mt-5">
                <AlertBox darkMode={darkMode} type="success">
                  {success}
                </AlertBox>
              </div>
            )}

            {/* =================================================
                SAVE ACTIONS

                มือถือ = sticky
                Desktop = อยู่ตรงกลาง
            ================================================= */}

            <div
              className={`sticky bottom-0 z-30 -mx-4 mt-5 border-t px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl
                sm:-mx-0 sm:rounded-[18px] sm:border sm:p-3
                lg:static lg:mt-7 lg:flex lg:justify-center lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none
                ${
                  darkMode
                    ? "border-white/10 bg-[#07100c]/94"
                    : "border-emerald-950/[0.08] bg-[#f3f8f3]/94"
                }`}
            >
              <div
                className={`grid grid-cols-[0.8fr_1.2fr] gap-2.5
                  sm:flex sm:items-center sm:justify-center
                  lg:w-auto lg:rounded-[16px] lg:border lg:p-2
                  ${
                    darkMode
                      ? "lg:border-white/[0.08] lg:bg-[#0a1710]"
                      : "lg:border-emerald-950/[0.07] lg:bg-white"
                  }`}
              >
                <Link
                  href="/account/plants"
                  className={`inline-flex min-h-[46px] items-center justify-center rounded-[12px] border px-4 text-[12px] font-bold transition lg:min-w-[110px] ${
                    darkMode
                      ? "border-white/10 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]"
                      : "border-emerald-950/10 bg-white text-slate-700 hover:bg-emerald-50"
                  }`}
                >
                  {t.cancel}
                </Link>

                <button
                  type="submit"
                  disabled={saving || processingImage || Boolean(success)}
                  aria-busy={saving}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[12px] bg-emerald-700 px-5 text-[12px] font-black text-white shadow-[0_7px_18px_rgba(5,110,78,0.18)] transition hover:bg-emerald-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 sm:min-w-[190px] lg:min-w-[210px]"
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
        </form>
      </section>
    </PageShell>
  );
}

/* =========================================================
   AUTO LOCATION MAP
========================================================= */

function AutoLocationMap({
  darkMode,
  language,
  title,
  description,
  initialLocation,
  onLocationResolved,
}) {
  const isEnglish = language === "EN";

  const mapContainerRef = useRef(null);

  const mapRef = useRef(null);

  const markerRef = useRef(null);

  const leafletRef = useRef(null);

  const reverseTimerRef = useRef(null);

  const reverseAbortRef = useRef(null);

  const reverseCacheRef = useRef(new Map());

  const lastReverseRequestRef = useRef(0);

  const resolveSequenceRef = useRef(0);

  const languageRef = useRef(language);

  const callbackRef = useRef(onLocationResolved);

  const initialLocationRef = useRef(initialLocation);

  const [mapReady, setMapReady] = useState(false);

  const [locating, setLocating] = useState(false);

  const [resolving, setResolving] = useState(false);

  const [mapError, setMapError] = useState("");

  const [locationData, setLocationData] = useState(() =>
    normalizeLocationData(initialLocation),
  );

  /* =====================================================
     MAP COPY
  ===================================================== */

  const m = isEnglish
    ? {
        province: "Province",

        district: "District",

        subdistrict: "Subdistrict",

        postcode: "Postcode",

        address: "Location Details",

        coordinates: "Coordinates",

        latitude: "Latitude",

        longitude: "Longitude",

        dms: "DMS Coordinates",

        elevation: "Approx. Elevation",

        meters: "m",

        current: "Use Current Location",

        locating: "Finding location...",

        reading: "Reading map data...",

        hint: "Tap the map or drag the marker to adjust the collection point.",

        noSaved:
          "This record has no saved coordinates yet. Choose a point on the map to add them.",

        emptyAddress: "Choose a point on the map to read its location details.",

        noValue: "—",

        unsupported: "This browser does not support location services.",

        denied:
          "Unable to access your location. Allow location access or choose a point on the map.",

        reverseError:
          "Coordinates were selected, but the address details could not be loaded.",
      }
    : {
        province: "จังหวัด",

        district: "อำเภอ / เขต",

        subdistrict: "ตำบล / แขวง",

        postcode: "รหัสไปรษณีย์",

        address: "ข้อมูลตำแหน่ง",

        coordinates: "พิกัด",

        latitude: "ละติจูด",

        longitude: "ลองจิจูด",

        dms: "พิกัดแบบ DMS",

        elevation: "ระดับความสูงโดยประมาณ",

        meters: "ม.",

        current: "ใช้ตำแหน่งปัจจุบัน",

        locating: "กำลังค้นหาตำแหน่ง...",

        reading: "กำลังอ่านข้อมูลจากแผนที่...",

        hint: "แตะบนแผนที่หรือลากหมุดเพื่อปรับจุดที่พบตัวอย่าง",

        noSaved:
          "รายการนี้ยังไม่มีพิกัดเดิม กรุณาเลือกจุดบนแผนที่เพื่อเพิ่มพิกัด",

        emptyAddress: "เลือกจุดบนแผนที่เพื่อให้ระบบอ่านรายละเอียดสถานที่",

        noValue: "—",

        unsupported: "เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง",

        denied:
          "ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้ กรุณาอนุญาต Location หรือเลือกจุดบนแผนที่แทน",

        reverseError:
          "เลือกพิกัดแล้ว แต่ไม่สามารถอ่านรายละเอียดที่อยู่ได้ กรุณาลองเลือกจุดอีกครั้ง",
      };

  /* =====================================================
     KEEP REFS CURRENT
  ===================================================== */

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    callbackRef.current = onLocationResolved;
  }, [onLocationResolved]);

  useEffect(() => {
    initialLocationRef.current = initialLocation;
  }, [initialLocation]);

  /* =====================================================
     INITIALIZE MAP
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function initMap() {
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
          selectLocation(event.latlng.lat, event.latlng.lng, true);
        });

        mapRef.current = map;

        const initial = normalizeLocationData(initialLocationRef.current);

        setLocationData(initial);

        if (hasValidCoordinates(initial.latitude, initial.longitude)) {
          placeMarker(initial.latitude, initial.longitude);

          map.setView(
            [initial.latitude, initial.longitude],

            16,

            {
              animate: false,
            },
          );
        }

        setMapReady(true);

        window.setTimeout(() => {
          map.invalidateSize();
        }, 150);
      } catch (err) {
        console.error("Initialize map error:", err);

        if (mounted) {
          setMapError(
            languageRef.current === "EN"
              ? "Unable to load the map."
              : "ไม่สามารถโหลดแผนที่ได้",
          );
        }
      }
    }

    initMap();

    return () => {
      mounted = false;

      if (reverseTimerRef.current) {
        window.clearTimeout(reverseTimerRef.current);
      }

      reverseAbortRef.current?.abort();

      if (mapRef.current) {
        mapRef.current.remove();
      }

      mapRef.current = null;

      markerRef.current = null;

      leafletRef.current = null;
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
          background:#047857;
          border:4px solid rgba(255,255,255,.96);
          box-shadow:0 8px 20px rgba(0,0,0,.28);
          display:flex;
          align-items:center;
          justify-content:center;
        ">
          <div style="
            width:10px;
            height:10px;
            border-radius:999px;
            background:white;
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

  function selectLocation(latitude, longitude, moveMap = false) {
    const map = mapRef.current;

    if (!map || !leafletRef.current) {
      return;
    }

    setMapError("");

    placeMarker(latitude, longitude);

    if (moveMap) {
      map.setView(
        [latitude, longitude],

        Math.max(map.getZoom(), 16),

        {
          animate: true,
        },
      );
    }

    const snapshot = {
      province: "",
      district: "",
      subdistrict: "",
      postcode: "",
      address: "",

      latitude,
      longitude,

      latitudeDms: decimalToDms(latitude, true),

      longitudeDms: decimalToDms(longitude, false),

      elevation: null,
    };

    setLocationData(snapshot);

    callbackRef.current?.(snapshot);

    scheduleResolveLocation(latitude, longitude);
  }

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
     REVERSE GEOCODING
  ===================================================== */

  function scheduleResolveLocation(latitude, longitude) {
    if (reverseTimerRef.current) {
      window.clearTimeout(reverseTimerRef.current);
    }

    reverseAbortRef.current?.abort();

    const sequence = resolveSequenceRef.current + 1;

    resolveSequenceRef.current = sequence;

    setResolving(true);

    reverseTimerRef.current = window.setTimeout(() => {
      resolveLocation(latitude, longitude, sequence);
    }, 1100);
  }

  async function resolveLocation(latitude, longitude, sequence) {
    if (sequence !== resolveSequenceRef.current) {
      return;
    }

    const cacheKey = `${Number(latitude).toFixed(5)},${Number(
      longitude,
    ).toFixed(5)},${languageRef.current}`;

    const cached = reverseCacheRef.current.get(cacheKey);

    if (cached) {
      setLocationData(cached);

      callbackRef.current?.(cached);

      setResolving(false);

      return;
    }

    try {
      const elapsed = Date.now() - lastReverseRequestRef.current;

      if (elapsed < 1000) {
        await wait(1000 - elapsed);
      }

      if (sequence !== resolveSequenceRef.current) {
        return;
      }

      const controller = new AbortController();

      reverseAbortRef.current = controller;

      lastReverseRequestRef.current = Date.now();

      const reverseUrl = new URL(REVERSE_GEOCODING_URL);

      reverseUrl.searchParams.set("format", "jsonv2");

      reverseUrl.searchParams.set("lat", String(latitude));

      reverseUrl.searchParams.set("lon", String(longitude));

      reverseUrl.searchParams.set("zoom", "18");

      reverseUrl.searchParams.set("addressdetails", "1");

      reverseUrl.searchParams.set("layer", "address");

      reverseUrl.searchParams.set(
        "accept-language",

        languageRef.current === "EN" ? "en,th" : "th,en",
      );

      const reverseResponse = await fetch(reverseUrl.toString(), {
        headers: {
          Accept: "application/json",
        },

        signal: controller.signal,
      });

      if (!reverseResponse.ok) {
        throw new Error(`Reverse geocoding failed: ${reverseResponse.status}`);
      }

      const reverseData = await reverseResponse.json();

      const elevation = await fetchElevation(latitude, longitude);

      if (sequence !== resolveSequenceRef.current) {
        return;
      }

      const parsed = parseMapLocation(
        reverseData,
        latitude,
        longitude,
        elevation,
      );

      reverseCacheRef.current.set(cacheKey, parsed);

      setLocationData(parsed);

      callbackRef.current?.(parsed);

      setMapError("");
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }

      console.error("Resolve map location error:", err);

      setMapError(m.reverseError);
    } finally {
      if (sequence === resolveSequenceRef.current) {
        setResolving(false);
      }
    }
  }

  /* =====================================================
     ELEVATION
  ===================================================== */

  async function fetchElevation(latitude, longitude) {
    try {
      const elevationUrl = new URL(ELEVATION_URL);

      elevationUrl.searchParams.set("latitude", String(latitude));

      elevationUrl.searchParams.set("longitude", String(longitude));

      const response = await fetch(elevationUrl.toString(), {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      const raw = Array.isArray(data?.elevation)
        ? data.elevation[0]
        : data?.elevation;

      const value = Number(raw);

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
    <section
      className={`overflow-hidden rounded-[18px] border shadow-sm sm:rounded-[20px] ${
        darkMode
          ? "border-white/[0.08] bg-[#0a1710]"
          : "border-emerald-950/[0.07] bg-white"
      }`}
    >
      {/* HEADER */}

      <div className="p-4 sm:p-5 lg:p-6">
        <SectionHeader
          icon={<MapPinIcon className="h-5 w-5" />}
          title={title}
          description={description}
          darkMode={darkMode}
        />

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          <MapInfoCard
            label={m.province}
            value={locationData.province || m.noValue}
            darkMode={darkMode}
          />

          <MapInfoCard
            label={m.district}
            value={locationData.district || m.noValue}
            darkMode={darkMode}
          />

          <MapInfoCard
            label={m.subdistrict}
            value={locationData.subdistrict || m.noValue}
            darkMode={darkMode}
          />

          <MapInfoCard
            label={m.postcode}
            value={locationData.postcode || m.noValue}
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* MAP */}

      <div
        className={`border-y ${
          darkMode ? "border-white/[0.08]" : "border-emerald-950/[0.07]"
        }`}
      >
        <div className="relative">
          <div
            ref={mapContainerRef}
            className={`h-[225px] w-full sm:h-[275px] lg:h-[330px] ${
              darkMode ? "brightness-[0.78] contrast-[1.05]" : ""
            }`}
          />

          {!mapReady && !mapError && (
            <div
              className={`absolute inset-0 flex items-center justify-center ${
                darkMode ? "bg-[#0d1a12]" : "bg-[#edf5ed]"
              }`}
            >
              <LoadingIcon
                className={`h-6 w-6 animate-spin ${
                  darkMode ? "text-emerald-300" : "text-emerald-700"
                }`}
              />
            </div>
          )}
        </div>

        <div
          className={`flex items-start gap-2 px-4 py-2.5 text-[10px] leading-5 sm:px-5 ${
            darkMode
              ? "bg-black/20 text-gray-500"
              : "bg-[#f7faf7] text-slate-500"
          }`}
        >
          <HandIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />

          <span>{hasCoordinates ? m.hint : m.noSaved}</span>
        </div>
      </div>

      {/* DETAILS */}

      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating || !mapReady}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[12px] bg-emerald-700 px-4 text-[12px] font-black text-white shadow-[0_7px_18px_rgba(6,78,45,0.18)] transition hover:bg-emerald-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
          >
            {locating ? (
              <LoadingIcon className="h-4 w-4 animate-spin" />
            ) : (
              <CurrentLocationIcon className="h-4 w-4" />
            )}

            {locating ? m.locating : m.current}
          </button>

          {resolving && (
            <div
              className={`inline-flex items-center gap-2 text-[10px] font-medium ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              <LoadingIcon className="h-3.5 w-3.5 animate-spin" />

              {m.reading}
            </div>
          )}
        </div>

        {mapError && (
          <div
            className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[10px] leading-5 sm:text-[11px] ${
              darkMode
                ? "border-amber-400/15 bg-amber-400/[0.06] text-amber-200"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />

            <span>{mapError}</span>
          </div>
        )}

        <div
          className={`mt-4 rounded-[16px] border p-3.5 sm:p-4 lg:p-5 ${
            darkMode
              ? "border-white/[0.08] bg-white/[0.025]"
              : "border-emerald-950/[0.07] bg-[#f8faf7]"
          }`}
        >
          {/* ADDRESS */}

          <DetailTitle darkMode={darkMode}>{m.address}</DetailTitle>

          <p
            className={`mt-2.5 break-words text-[12px] font-medium leading-[1.8] sm:text-[13px] ${
              darkMode ? "text-gray-300" : "text-slate-700"
            }`}
          >
            {locationData.address || m.emptyAddress}
          </p>

          {/* DECIMAL */}

          <div className="mt-4">
            <DetailTitle darkMode={darkMode}>{m.coordinates}</DetailTitle>

            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:gap-3">
              <CoordinateCard
                label={m.latitude}
                value={
                  hasCoordinates
                    ? Number(locationData.latitude).toFixed(7)
                    : m.noValue
                }
                darkMode={darkMode}
              />

              <CoordinateCard
                label={m.longitude}
                value={
                  hasCoordinates
                    ? Number(locationData.longitude).toFixed(7)
                    : m.noValue
                }
                darkMode={darkMode}
              />
            </div>
          </div>

          {/* DMS */}

          <div className="mt-4">
            <DetailTitle darkMode={darkMode}>{m.dms}</DetailTitle>

            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:gap-3">
              <CoordinateCard
                label={m.latitude}
                value={locationData.latitudeDms || m.noValue}
                darkMode={darkMode}
              />

              <CoordinateCard
                label={m.longitude}
                value={locationData.longitudeDms || m.noValue}
                darkMode={darkMode}
              />
            </div>
          </div>

          {/* ELEVATION */}

          <div className="mt-4">
            <MapInfoCard
              label={m.elevation}
              value={
                locationData.elevation !== null &&
                locationData.elevation !== undefined &&
                Number.isFinite(Number(locationData.elevation))
                  ? `${Math.round(Number(locationData.elevation))} ${m.meters}`
                  : m.noValue
              }
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   LOCATION NORMALIZE
========================================================= */

function normalizeLocationData(value) {
  const latitude = toFiniteNumberOrNull(value?.latitude);

  const longitude = toFiniteNumberOrNull(value?.longitude);

  return {
    province: value?.province || "",

    district: value?.district || "",

    subdistrict: value?.subdistrict || "",

    postcode: value?.postcode || "",

    address: value?.address || "",

    latitude,

    longitude,

    latitudeDms: latitude !== null ? decimalToDms(latitude, true) : "",

    longitudeDms: longitude !== null ? decimalToDms(longitude, false) : "",

    elevation: toApproxNumberOrNull(value?.elevation),
  };
}

/* =========================================================
   MAP PARSER
========================================================= */

function parseMapLocation(data, latitude, longitude, elevation) {
  const address = data?.address || {};

  const province = firstText(address.state, address.province, address.region);

  const district = firstText(
    address.county,
    address.state_district,
    address.city_district,
    address.district,
    address.city,
    address.town,
  );

  const subdistrict = firstText(
    address.municipality,
    address.suburb,
    address.quarter,
    address.village,
    address.hamlet,
    address.neighbourhood,
  );

  const postcode = firstText(address.postcode);

  const locality = firstText(
    address.house_number && address.road
      ? `${address.house_number} ${address.road}`
      : "",

    address.road,

    address.village,

    address.hamlet,

    address.neighbourhood,
  );

  const formattedAddress = uniqueText([
    locality,
    subdistrict,
    district,
    province,
    postcode,
  ]).join(" ");

  return {
    province,

    district,

    subdistrict,

    postcode,

    address: formattedAddress || data?.display_name || "",

    latitude,

    longitude,

    latitudeDms: decimalToDms(latitude, true),

    longitudeDms: decimalToDms(longitude, false),

    elevation,
  };
}

/* =========================================================
   LEGACY SUPPORT
========================================================= */

function extractLegacyCoordinates(location) {
  const match = String(location || "").match(
    /Coordinates:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i,
  );

  if (!match) {
    return {
      latitude: null,

      longitude: null,
    };
  }

  return {
    latitude: toFiniteNumberOrNull(match[1]),

    longitude: toFiniteNumberOrNull(match[2]),
  };
}

function cleanLegacyLocation(location) {
  return String(location || "")
    .split(/\s*\|\s*Coordinates:/i)[0]
    .split(/\s*\|\s*DMS:/i)[0]
    .trim();
}

/* =========================================================
   DMS
========================================================= */

function decimalToDms(value, isLatitude) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  const absolute = Math.abs(number);

  const degrees = Math.floor(absolute);

  const minutesFloat = (absolute - degrees) * 60;

  const minutes = Math.floor(minutesFloat);

  const seconds = ((minutesFloat - minutes) * 60).toFixed(1);

  const direction = isLatitude
    ? number >= 0
      ? "N"
      : "S"
    : number >= 0
      ? "E"
      : "W";

  return `${degrees}°${minutes}'${seconds}"${direction}`;
}

/* =========================================================
   HELPERS
========================================================= */

function toFiniteNumberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function toApproxNumberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const match = String(value)
    .replace(/,/g, "")
    .match(/-?\d+(?:\.\d+)?/);

  if (!match) {
    return null;
  }

  const number = Number(match[0]);

  return Number.isFinite(number) ? number : null;
}

function hasValidCoordinates(latitude, longitude) {
  return (
    toFiniteNumberOrNull(latitude) !== null &&
    toFiniteNumberOrNull(longitude) !== null
  );
}

function firstText(...values) {
  for (const value of values) {
    const text = String(value || "").trim();

    if (text) {
      return text;
    }
  }

  return "";
}

function uniqueText(values) {
  const result = [];

  for (const raw of values) {
    const value = String(raw || "").trim();

    if (!value) {
      continue;
    }

    const normalized = value.toLocaleLowerCase();

    const exists = result.some(
      (item) => item.toLocaleLowerCase() === normalized,
    );

    if (!exists) {
      result.push(value);
    }
  }

  return result;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/* =========================================================
   PAGE SHELL
========================================================= */

function PageShell({ children, darkMode }) {
  return (
    <main
      className={`page min-h-screen overflow-x-hidden transition-colors duration-300 ${
        darkMode ? "bg-[#07100c] text-white" : "bg-[#f3f8f3] text-slate-900"
      }`}
    >
      {children}
    </main>
  );
}

/* =========================================================
   CARD
========================================================= */

function FormCard({ children, darkMode, compact = false }) {
  return (
    <section
      className={`rounded-[18px] border shadow-sm sm:rounded-[20px] ${
        compact ? "p-4 sm:p-5" : "p-4 sm:p-5 lg:p-6"
      } ${
        darkMode
          ? "border-white/[0.08] bg-[#0a1710]"
          : "border-emerald-950/[0.07] bg-white"
      }`}
    >
      {children}
    </section>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({ icon, title, description, darkMode }) {
  return (
    <div className="flex items-start gap-3.5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] sm:h-11 sm:w-11 ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/[0.08] text-emerald-700"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 pt-0.5">
        <h2
          className={`text-[17px] font-black leading-[1.45] sm:text-[18px] ${
            darkMode ? "text-white" : "text-[#14271a]"
          }`}
        >
          {title}
        </h2>

        {description && (
          <p
            className={`mt-1.5 max-w-2xl text-[11px] leading-[1.75] sm:text-[12px] ${
              darkMode ? "text-gray-400" : "text-slate-500"
            }`}
          >
            {description}
          </p>
        )}
      </div>
    </div>
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
  darkMode,
  disabled,
  min,
  step,
  inputMode,
  italic = false,
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2.5 flex min-h-5 items-center gap-2">
        <label
          htmlFor={name}
          className={`text-[11px] font-bold leading-5 sm:text-xs ${
            darkMode ? "text-gray-200" : "text-slate-700"
          }`}
        >
          {label}
        </label>

        {required && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[8px] font-black ${
              darkMode ? "bg-red-400/10 text-red-300" : "bg-red-50 text-red-600"
            }`}
          >
            {requiredText}
          </span>
        )}
      </div>

      <input
        id={name}
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        step={step}
        inputMode={inputMode}
        className={`h-[46px] w-full rounded-[12px] border px-3.5 text-[12px] leading-normal outline-none transition focus:border-emerald-600/50 focus:ring-4 focus:ring-emerald-600/[0.06] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[48px] sm:px-4 sm:text-[13px] ${
          italic ? "italic" : ""
        } ${
          darkMode
            ? "border-white/10 bg-black/20 text-white placeholder:text-gray-500"
            : "border-emerald-950/10 bg-[#f8faf7] text-slate-900 placeholder:text-slate-400 focus:bg-white"
        }`}
      />
    </div>
  );
}

/* =========================================================
   TEXT AREA
========================================================= */

function TextArea({
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
    <div className="min-w-0">
      <label
        htmlFor={name}
        className={`mb-2.5 block text-[11px] font-bold leading-5 sm:text-xs ${
          darkMode ? "text-gray-200" : "text-slate-700"
        }`}
      >
        {label}
      </label>

      <textarea
        id={name}
        value={value ?? ""}
        onChange={(event) => onChange(name, event.target.value)}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full resize-y rounded-[12px] border px-3.5 py-3 text-[12px] leading-[1.7] outline-none transition focus:border-emerald-600/50 focus:ring-4 focus:ring-emerald-600/[0.06] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-[13px] ${
          darkMode
            ? "border-white/10 bg-black/20 text-white placeholder:text-gray-500"
            : "border-emerald-950/10 bg-[#f8faf7] text-slate-900 placeholder:text-slate-400 focus:bg-white"
        }`}
      />
    </div>
  );
}

/* =========================================================
   ALERT
========================================================= */

function AlertBox({ darkMode, type, children }) {
  const isSuccess = type === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-[16px] border px-4 py-3.5 text-[12px] leading-5 sm:px-5 ${
        isSuccess
          ? darkMode
            ? "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-200"
            : "border-emerald-200 bg-emerald-50 text-emerald-800"
          : darkMode
            ? "border-red-400/15 bg-red-400/[0.06] text-red-200"
            : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {isSuccess ? (
        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
      )}

      <span>{children}</span>
    </div>
  );
}

/* =========================================================
   MAP INFO CARD
========================================================= */

function MapInfoCard({ label, value, darkMode }) {
  return (
    <div
      className={`min-w-0 rounded-[13px] border px-3 py-2.5 sm:px-3.5 sm:py-3 ${
        darkMode
          ? "border-white/[0.08] bg-white/[0.025]"
          : "border-emerald-950/[0.07] bg-[#f8faf7]"
      }`}
    >
      <p
        className={`text-[8px] font-bold leading-4 tracking-[0.04em] ${
          darkMode ? "text-gray-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 truncate text-[12px] font-black leading-5 sm:text-[13px] ${
          darkMode ? "text-white" : "text-[#173321]"
        }`}
        title={String(value)}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   COORDINATE CARD
========================================================= */

function CoordinateCard({ label, value, darkMode }) {
  return (
    <div
      className={`min-w-0 rounded-[13px] border px-3 py-2.5 ${
        darkMode
          ? "border-white/[0.08] bg-black/15"
          : "border-emerald-950/[0.07] bg-white"
      }`}
    >
      <p
        className={`text-[8px] font-bold leading-4 ${
          darkMode ? "text-gray-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10px] font-bold leading-5 sm:text-[11px] ${
          darkMode ? "text-gray-200" : "text-slate-700"
        }`}
        title={String(value)}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   DETAIL TITLE
========================================================= */

function DetailTitle({ children, darkMode }) {
  return (
    <p
      className={`text-[9px] font-black uppercase tracking-[0.15em] ${
        darkMode ? "text-emerald-400" : "text-emerald-700"
      }`}
    >
      {children}
    </p>
  );
}

/* =========================================================
   ICON BASE
========================================================= */

function Icon({ className = "", children, viewBox = "0 0 24 24" }) {
  return (
    <svg
      className={className}
      viewBox={viewBox}
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

/* =========================================================
   ICONS
========================================================= */

function CameraIcon({ className = "" }) {
  return (
    <Icon className={className}>
      <path d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />

      <circle cx="12" cy="13" r="4" />
    </Icon>
  );
}

function UploadIcon({ className = "" }) {
  return (
    <Icon className={className}>
      <path d="M12 16V4" />

      <path d="m7 9 5-5 5 5" />

      <path d="M5 20h14" />
    </Icon>
  );
}

function ImageIcon({ className = "" }) {
  return (
    <Icon className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />

      <circle cx="8.5" cy="9" r="1.5" />

      <path d="m21 15-5-5L5 20" />
    </Icon>
  );
}

function LeafIcon({ className = "" }) {
  return (
    <Icon className={className}>
      <path d="M20 4C10 4 5 8 5 15c0 2.8 2 5 5 5 7 0 10-5 10-16Z" />

      <path d="M4 20c4-5 7-7 13-10" />
    </Icon>
  );
}

function MapPinIcon({ className = "" }) {
  return (
    <Icon className={className}>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle cx="12" cy="10" r="2.5" />
    </Icon>
  );
}

function CurrentLocationIcon({ className = "" }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="3" />

      <circle cx="12" cy="12" r="7" />

      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </Icon>
  );
}

function DocumentIcon({ className = "" }) {
  return (
    <Icon className={className}>
      <path d="M6 3h8l4 4v14H6z" />

      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </Icon>
  );
}

function UndoIcon({ className = "" }) {
  return (
    <Icon className={className}>
      <path d="M9 7 4 12l5 5" />

      <path d="M5 12h8a6 6 0 0 1 6 6" />
    </Icon>
  );
}

function SaveIcon({ className = "" }) {
  return (
    <Icon className={className}>
      <path d="M5 4h12l2 2v14H5z" />

      <path d="M8 4v6h8V4M8 20v-6h8v6" />
    </Icon>
  );
}

function ArrowLeftIcon({ className = "" }) {
  return (
    <Icon className={className}>
      <path d="m15 18-6-6 6-6M9 12h10" />
    </Icon>
  );
}

function AlertIcon({ className = "" }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />

      <path d="M12 8v5M12 16.5h.01" />
    </Icon>
  );
}

function InfoIcon({ className = "" }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />

      <path d="M12 11v5M12 8h.01" />
    </Icon>
  );
}

function CheckIcon({ className = "" }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />

      <path d="m8 12 2.6 2.6L16.5 9" />
    </Icon>
  );
}

function HandIcon({ className = "" }) {
  return (
    <Icon className={className}>
      <path d="M8 11V5a1.5 1.5 0 0 1 3 0v5" />

      <path d="M11 10V4a1.5 1.5 0 0 1 3 0v6" />

      <path d="M14 10V6a1.5 1.5 0 0 1 3 0v6" />

      <path d="M17 11v-1a1.5 1.5 0 0 1 3 0v5c0 4-2.5 6-6 6h-2.5a6 6 0 0 1-5-2.7L3.8 14a1.7 1.7 0 0 1 2.5-2.2L8 13" />
    </Icon>
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
