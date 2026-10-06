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

const REVERSE_GEOCODING_URL =
  process.env.NEXT_PUBLIC_REVERSE_GEOCODING_URL ||
  "https://nominatim.openstreetmap.org/reverse";

const MAP_TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const ELEVATION_URL =
  process.env.NEXT_PUBLIC_ELEVATION_URL ||
  "https://api.open-meteo.com/v1/elevation";

function getTodayLocalDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const INITIAL_FORM = {
  family: "",
  botanical_name: "",

  common_name_th: "",
  common_name_en: "",

  place_name_th: "",
  place_name_en: "",

  province_th: "",
  province_en: "",

  district_th: "",
  district_en: "",

  subdistrict_th: "",
  subdistrict_en: "",

  postcode: "",

  location_th: "",
  location_en: "",

  latitude: null,
  longitude: null,

  elevation: "",

  collection_date: getTodayLocalDate(),

  habitat_th: "",
  habitat_en: "",

  notes_th: "",
  notes_en: "",

  collected_by_th: "",
  collected_by_en: "",

  specimen_number: "",
  duplicates: "0",
};

export default function NewPlantPage() {
  const router = useRouter();

  const { language, darkMode } = useSiteSettings();

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
      eyebrow: "NEW SPECIMEN",

      heroTitle: "เพิ่มข้อมูลพรรณไม้",

      heroDescription:
        "บันทึกข้อมูลตัวอย่างพรรณไม้ รูปภาพ ตำแหน่งที่พบ และข้อมูลการเก็บตัวอย่างเข้าสู่ Virtual Herbarium",

      backCollection: "กลับคลังพรรณไม้",

      image: "รูปภาพตัวอย่าง",

      imageDescription:
        "เพิ่มภาพที่เห็นลักษณะของตัวอย่างได้ชัดเจน สามารถเลือกจากเครื่องหรือถ่ายด้วยกล้อง",

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

      basicDescription: "กรอกข้อมูลชื่อและอนุกรมวิธานของตัวอย่าง",

      commonName: "ชื่อพรรณไม้",

      commonPlaceholder: "ชื่อพรรณไม้ภาษาไทย",

      botanicalName: "ชื่อวิทยาศาสตร์",

      botanicalPlaceholder: "ชื่อวิทยาศาสตร์",

      family: "วงศ์",

      familyPlaceholder: "ชื่อวงศ์",

      locationTitle: "สถานที่พบ",

      locationDescription:
        "พิมพ์ข้อมูลสถานที่เองได้ หรือเลือกจุดบนแผนที่และใช้ตำแหน่งปัจจุบัน ระบบจะอ่านข้อมูลสถานที่ พิกัด และระดับความสูงให้อัตโนมัติ",

      collection: "ข้อมูลการเก็บตัวอย่าง",

      collectionDescription:
        "กรอกวันที่ ผู้เก็บ หมายเลขตัวอย่าง ถิ่นอาศัย และรายละเอียดเพิ่มเติม",

      date: "วันที่เก็บตัวอย่าง",

      collectedBy: "ชื่อผู้เก็บตัวอย่าง",

      collectedByPlaceholder: "ชื่อผู้เก็บตัวอย่างภาษาไทย",

      specimen: "หมายเลขตัวอย่าง",

      specimenPlaceholder: "หมายเลขตัวอย่าง",

      duplicates: "จำนวนตัวอย่างซ้ำ",

      duplicatesPlaceholder: "0",

      habitat: "ถิ่นอาศัย",

      habitatPlaceholder: "ถิ่นอาศัยภาษาไทย",

      notes: "รายละเอียดเพิ่มเติม",

      notesPlaceholder: "รายละเอียดเพิ่มเติมภาษาไทย",

      optional: "ข้อมูลอื่นสามารถเว้นว่างได้",

      save: "บันทึกข้อมูลพรรณไม้",

      saving: "กำลังบันทึก...",

      cancel: "ยกเลิก",

      loading: "กำลังเตรียมแบบฟอร์ม...",

      loginRequired: "กรุณาเข้าสู่ระบบก่อนเพิ่มข้อมูลพรรณไม้",

      saveError: "ไม่สามารถบันทึกข้อมูลพรรณไม้ได้",

      uploadError: "ไม่สามารถอัปโหลดรูปภาพได้",

      required: "กรุณากรอกชื่อพรรณไม้",

      requiredLabel: "จำเป็น",

      duplicateError: "จำนวนตัวอย่างซ้ำต้องเป็นเลขจำนวนเต็มตั้งแต่ 0 ขึ้นไป",

      postcodeError: "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก",

      saveSuccess: "บันทึกข้อมูลพรรณไม้เรียบร้อยแล้ว",
    },

    EN: {
      eyebrow: "NEW SPECIMEN",

      heroTitle: "Add Plant Record",

      heroDescription:
        "Add specimen information, image, collection location and field data to the Virtual Herbarium.",

      backCollection: "Back to Plant Collection",

      image: "Plant Image",

      imageDescription:
        "Add a clear specimen image. You can choose a file or capture a new photo.",

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

      basicDescription: "Enter the identity and taxonomic information.",

      commonName: "Common Name",

      commonPlaceholder: "Plant name in English",

      botanicalName: "Scientific Name",

      botanicalPlaceholder: "Scientific name",

      family: "Family",

      familyPlaceholder: "Family",

      locationTitle: "Collection Location",

      locationDescription:
        "Type the location details manually, or choose a point on the map and use your current location. Location data, coordinates and elevation are read automatically.",

      collection: "Collection Information",

      collectionDescription:
        "Enter the date, collector, specimen number, habitat and notes.",

      date: "Collection Date",

      collectedBy: "Collected By",

      collectedByPlaceholder: "Collector name in English",

      specimen: "Specimen Number",

      specimenPlaceholder: "Specimen number",

      duplicates: "Duplicates",

      duplicatesPlaceholder: "0",

      habitat: "Habitat",

      habitatPlaceholder: "Habitat in English",

      notes: "Additional Notes",

      notesPlaceholder: "Additional notes in English",

      optional: "Other information can be left blank",

      save: "Save Plant",

      saving: "Saving...",

      cancel: "Cancel",

      loading: "Preparing form...",

      loginRequired: "Please log in before adding a plant",

      saveError: "Unable to save plant",

      uploadError: "Unable to upload image",

      required: "Please enter the plant name",

      requiredLabel: "Required",

      duplicateError:
        "Duplicates must be a whole number greater than or equal to 0",

      postcodeError: "Postcode must contain exactly 5 digits",

      saveSuccess: "Plant added successfully",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  const commonNameField = isEnglish ? "common_name_en" : "common_name_th";
  const habitatField = isEnglish ? "habitat_en" : "habitat_th";
  const notesField = isEnglish ? "notes_en" : "notes_th";
  const collectedByField = isEnglish ? "collected_by_en" : "collected_by_th";

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
    setForm((previous) => {
      const next = {
        ...previous,
      };

      if (locationData.place_name_th !== undefined) {
        next.place_name_th = locationData.place_name_th || "";
      }

      if (locationData.place_name_en !== undefined) {
        next.place_name_en = locationData.place_name_en || "";
      }

      if (locationData.province_th !== undefined) {
        next.province_th = locationData.province_th || "";
      }

      if (locationData.province_en !== undefined) {
        next.province_en = locationData.province_en || "";
      }

      if (locationData.district_th !== undefined) {
        next.district_th = locationData.district_th || "";
      }

      if (locationData.district_en !== undefined) {
        next.district_en = locationData.district_en || "";
      }

      if (locationData.subdistrict_th !== undefined) {
        next.subdistrict_th = locationData.subdistrict_th || "";
      }

      if (locationData.subdistrict_en !== undefined) {
        next.subdistrict_en = locationData.subdistrict_en || "";
      }

      if (locationData.postcode !== undefined) {
        next.postcode = sanitizePostcodeInput(locationData.postcode);
      }

      if (locationData.location_th !== undefined) {
        next.location_th = locationData.location_th || "";
      }

      if (locationData.location_en !== undefined) {
        next.location_en = locationData.location_en || "";
      }

      if (locationData.latitude !== undefined) {
        next.latitude = toFiniteNumberOrNull(locationData.latitude);
      }

      if (locationData.longitude !== undefined) {
        next.longitude = toFiniteNumberOrNull(locationData.longitude);
      }

      if (locationData.elevation !== undefined) {
        next.elevation =
          locationData.elevation !== null &&
          Number.isFinite(Number(locationData.elevation))
            ? String(Math.round(Number(locationData.elevation)))
            : "";
      }

      return next;
    });

    setError("");
    setSuccess("");
  }

  function handleLocationFieldChange(name, value) {
    const nextValue =
      name === "postcode" ? sanitizePostcodeInput(value) : value;

    updateField(name, nextValue);
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

    if (!String(form[commonNameField] || "").trim()) {
      setError(t.required);

      return;
    }

    if (form.postcode.trim() && !normalizePostcode(form.postcode)) {
      setError(t.postcodeError);

      return;
    }

    if (!user?.id) {
      setError(t.loginRequired);

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
      let imageUrl = null;

      if (imageFile) {
        const uploaded = await uploadImage();

        imageUrl = uploaded.publicUrl;

        uploadedImagePath = uploaded.filePath;
      }

      const plantData = {
        id: crypto.randomUUID(),

        user_id: user.id,

        family: form.family.trim() || null,

        botanical_name: form.botanical_name.trim() || null,

        common_name_th: form.common_name_th.trim() || null,

        common_name_en: form.common_name_en.trim() || null,

        common_name:
          form.common_name_th.trim() || form.common_name_en.trim() || null,

        place_name_th: form.place_name_th.trim() || null,

        place_name_en: form.place_name_en.trim() || null,

        province_th: form.province_th.trim() || null,

        province_en: form.province_en.trim() || null,

        province: form.province_th.trim() || form.province_en.trim() || null,

        district_th: form.district_th.trim() || null,

        district_en: form.district_en.trim() || null,

        district: form.district_th.trim() || form.district_en.trim() || null,

        subdistrict_th: form.subdistrict_th.trim() || null,

        subdistrict_en: form.subdistrict_en.trim() || null,

        subdistrict:
          form.subdistrict_th.trim() || form.subdistrict_en.trim() || null,

        postcode: normalizePostcode(form.postcode) || null,

        address_th: form.location_th.trim() || null,

        address_en: form.location_en.trim() || null,

        location: form.location_th.trim() || form.location_en.trim() || null,

        latitude: toFiniteNumberOrNull(form.latitude),

        longitude: toFiniteNumberOrNull(form.longitude),

        elevation: form.elevation.trim() || null,

        collection_date: form.collection_date || null,

        habitat_th: form.habitat_th.trim() || null,

        habitat_en: form.habitat_en.trim() || null,

        habitat: form.habitat_th.trim() || form.habitat_en.trim() || null,

        notes_th: form.notes_th.trim() || null,

        notes_en: form.notes_en.trim() || null,

        notes: form.notes_th.trim() || form.notes_en.trim() || null,

        collected_by_th: form.collected_by_th.trim() || null,

        collected_by_en: form.collected_by_en.trim() || null,

        collected_by:
          form.collected_by_th.trim() || form.collected_by_en.trim() || null,

        specimen_number: form.specimen_number.trim() || null,

        duplicates: duplicatesValue,

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
      <main
        className={`page min-h-screen ${
          darkMode ? "bg-[#07100c] text-white" : "bg-[#f3f8f3] text-slate-900"
        }`}
      >
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
      </main>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main
      className={`page min-h-screen overflow-x-hidden transition-colors duration-300 ${
        darkMode ? "bg-[#07100c] text-white" : "bg-[#f3f8f3] text-slate-900"
      }`}
    >
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

            {t.backCollection}
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
              {t.heroTitle}
            </h1>

            <p
              className={`mt-2.5 max-w-2xl text-[12px] leading-[1.85] sm:mt-3 sm:text-[13px] lg:text-[14px] ${
                darkMode ? "text-[#aebeb3]" : "text-[#526858]"
              }`}
            >
              {t.heroDescription}
            </p>
          </div>
        </div>
      </section>

      {/* =================================================
          FORM
      ================================================= */}

      <section className="container pb-8 pt-5 sm:pb-10 sm:pt-7 lg:pb-12 lg:pt-8">
        <form onSubmit={handleSubmit}>
          <div className="mx-auto grid max-w-[1160px] gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* =================================================
                MAIN COLUMN
            ================================================= */}

            <div className="space-y-4 sm:space-y-5">
              {/* PLANT INFORMATION */}

              <FormCard darkMode={darkMode}>
                <SectionHeader
                  icon={<LeafIcon className="h-5 w-5" />}
                  title={t.basic}
                  description={t.basicDescription}
                  darkMode={darkMode}
                />

                <div className="mt-5 grid gap-4 sm:gap-5 md:grid-cols-2">
                  <Field
                    label={t.commonName}
                    name={commonNameField}
                    value={form[commonNameField]}
                    onChange={updateField}
                    placeholder={t.commonPlaceholder}
                    required
                    requiredText={t.requiredLabel}
                    darkMode={darkMode}
                    disabled={saving}
                  />

                  <Field
                    label={t.botanicalName}
                    name="botanical_name"
                    value={form.botanical_name}
                    onChange={updateField}
                    placeholder={t.botanicalPlaceholder}
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
                      placeholder={t.familyPlaceholder}
                      darkMode={darkMode}
                      disabled={saving}
                    />
                  </div>
                </div>
              </FormCard>

              {/* =================================================
                  MAP
              ================================================= */}

              <AutoLocationMap
                darkMode={darkMode}
                language={language}
                title={t.locationTitle}
                description={t.locationDescription}
                initialLocation={{
                  place_name_th: form.place_name_th,
                  place_name_en: form.place_name_en,

                  province_th: form.province_th,
                  province_en: form.province_en,

                  district_th: form.district_th,
                  district_en: form.district_en,

                  subdistrict_th: form.subdistrict_th,
                  subdistrict_en: form.subdistrict_en,

                  postcode: form.postcode,

                  location_th: form.location_th,
                  location_en: form.location_en,

                  latitude: form.latitude,
                  longitude: form.longitude,

                  elevation: toApproxNumberOrNull(form.elevation),
                }}
                onLocationResolved={handleLocationResolved}
                onLocationFieldChange={handleLocationFieldChange}
              />

              {/* =================================================
                  COLLECTION INFORMATION
              ================================================= */}

              <FormCard darkMode={darkMode}>
                <SectionHeader
                  icon={<DocumentIcon className="h-5 w-5" />}
                  title={t.collection}
                  description={t.collectionDescription}
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
                    label={t.collectedBy}
                    name={collectedByField}
                    value={form[collectedByField]}
                    onChange={updateField}
                    placeholder={t.collectedByPlaceholder}
                    darkMode={darkMode}
                    disabled={saving}
                  />

                  <Field
                    label={t.specimen}
                    name="specimen_number"
                    value={form.specimen_number}
                    onChange={updateField}
                    placeholder={t.specimenPlaceholder}
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
                    placeholder={t.duplicatesPlaceholder}
                    darkMode={darkMode}
                    disabled={saving}
                  />

                  <div className="md:col-span-2">
                    <TextArea
                      label={t.habitat}
                      name={habitatField}
                      value={form[habitatField]}
                      onChange={updateField}
                      placeholder={t.habitatPlaceholder}
                      rows={3}
                      darkMode={darkMode}
                      disabled={saving}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TextArea
                      label={t.notes}
                      name={notesField}
                      value={form[notesField]}
                      onChange={updateField}
                      placeholder={t.notesPlaceholder}
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
            ================================================= */}

            <aside className="order-first lg:order-none lg:sticky lg:top-24">
              <FormCard darkMode={darkMode} compact>
                <SectionHeader
                  icon={<CameraIcon className="h-5 w-5" />}
                  title={t.image}
                  description={t.imageDescription}
                  darkMode={darkMode}
                />

                <div
                  className={`relative mt-5 h-[250px] overflow-hidden rounded-[18px] border sm:h-[300px] lg:h-auto lg:aspect-square ${
                    darkMode
                      ? "border-white/10 bg-black/20"
                      : "border-emerald-950/[0.08] bg-[#f4f8f4]"
                  }`}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt={form[commonNameField] || "Plant preview"}
                      className="h-full w-full object-cover"
                    />
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

                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleChooseFile}
                    disabled={saving || processingImage}
                    className="inline-flex min-h-[46px] min-w-0 items-center justify-center gap-2 rounded-[13px] bg-emerald-700 px-2.5 text-[10px] font-black text-white shadow-[0_6px_16px_rgba(5,110,78,0.16)] transition hover:bg-emerald-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-[11px]"
                  >
                    {processingImage ? (
                      <LoadingIcon className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <UploadIcon className="h-4 w-4 shrink-0" />
                    )}

                    <span className="min-w-0 truncate">
                      {processingImage ? t.convertingImage : t.chooseFromDevice}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTakePhoto}
                    disabled={saving || processingImage || !canUseCamera}
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

                <p
                  className={`mt-2.5 text-[9px] leading-5 sm:text-[10px] ${
                    darkMode ? "text-gray-500" : "text-slate-400"
                  }`}
                >
                  {t.imageHint}
                </p>

                {!canUseCamera && (
                  <p
                    className={`mt-1 text-[9px] leading-5 ${
                      darkMode ? "text-gray-600" : "text-slate-400"
                    }`}
                  >
                    {t.cameraUnavailable}
                  </p>
                )}

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

                {imageFile && (
                  <div
                    className={`mt-3 rounded-xl border px-3 py-2.5 ${
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
                )}
              </FormCard>
            </aside>
          </div>

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
    </main>
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
  onLocationFieldChange,
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
  const fieldChangeRef = useRef(onLocationFieldChange);
  const initialLocationRef = useRef(initialLocation);

  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [mapError, setMapError] = useState("");

  const [locationData, setLocationData] = useState(() =>
    normalizeLocationData(initialLocation),
  );

  const mapText = isEnglish
    ? {
        placeName: "Place Name",
        placeNamePlaceholder: "Place name in English",

        province: "Province",
        provincePlaceholder: "Province in English",

        district: "District",
        districtPlaceholder: "District in English",

        subdistrict: "Subdistrict",
        subdistrictPlaceholder: "Subdistrict in English",

        postcode: "Postcode",
        postcodePlaceholder: "5-digit postcode",

        address: "Location Details",
        addressPlaceholder: "Location details in English",

        coordinates: "Coordinates",
        latitude: "Latitude",
        longitude: "Longitude",
        dms: "DMS Coordinates",

        elevation: "Approx. Elevation",
        meters: "m",

        currentLocation: "Use Current Location",
        locating: "Finding location...",
        reading: "Reading map data...",

        mapHint:
          "Tap the map or drag the marker to adjust the collection point.",

        emptyAddress: "Choose a point on the map to read its location details.",

        noValue: "—",

        geoUnsupported: "This browser does not support location services.",

        geoDenied:
          "Unable to access your location. Allow location access or choose a point on the map.",

        noSavedCoordinates: "Choose a point on the map to add coordinates.",
      }
    : {
        placeName: "ชื่อสถานที่",
        placeNamePlaceholder: "ชื่อสถานที่ภาษาไทย",

        province: "จังหวัด",
        provincePlaceholder: "ชื่อจังหวัดภาษาไทย",

        district: "อำเภอ / เขต",
        districtPlaceholder: "ชื่ออำเภอ / เขตภาษาไทย",

        subdistrict: "ตำบล / แขวง",
        subdistrictPlaceholder: "ชื่อตำบล / แขวงภาษาไทย",

        postcode: "รหัสไปรษณีย์",
        postcodePlaceholder: "รหัสไปรษณีย์ 5 หลัก",

        address: "ข้อมูลตำแหน่ง",
        addressPlaceholder: "รายละเอียดสถานที่ภาษาไทย",

        coordinates: "พิกัด",
        latitude: "ละติจูด",
        longitude: "ลองจิจูด",
        dms: "พิกัดแบบ DMS",

        elevation: "ระดับความสูงโดยประมาณ",
        meters: "ม.",

        currentLocation: "ใช้ตำแหน่งปัจจุบัน",
        locating: "กำลังค้นหาตำแหน่ง...",
        reading: "กำลังอ่านข้อมูลจากแผนที่...",

        mapHint: "แตะบนแผนที่หรือลากหมุดเพื่อปรับจุดที่พบตัวอย่าง",

        emptyAddress: "เลือกจุดบนแผนที่เพื่อให้ระบบอ่านรายละเอียดสถานที่",

        noValue: "—",

        geoUnsupported: "เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง",

        geoDenied:
          "ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้ กรุณาอนุญาต Location หรือเลือกจุดบนแผนที่แทน",

        noSavedCoordinates: "เลือกจุดบนแผนที่เพื่อเพิ่มพิกัดของตัวอย่าง",
      };

  const placeNameField = isEnglish ? "place_name_en" : "place_name_th";
  const provinceField = isEnglish ? "province_en" : "province_th";
  const districtField = isEnglish ? "district_en" : "district_th";
  const subdistrictField = isEnglish ? "subdistrict_en" : "subdistrict_th";
  const addressField = isEnglish ? "location_en" : "location_th";

  const activePlaceName = initialLocation?.[placeNameField] || "";
  const activeProvince = initialLocation?.[provinceField] || "";
  const activeDistrict = initialLocation?.[districtField] || "";
  const activeSubdistrict = initialLocation?.[subdistrictField] || "";
  const activeAddress = initialLocation?.[addressField] || "";

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

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
          selectLocation(event.latlng.lat, event.latlng.lng, true);
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

        window.setTimeout(() => map.invalidateSize(), 150);
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

    initializeMap();

    return () => {
      mounted = false;

      if (reverseTimerRef.current) {
        window.clearTimeout(reverseTimerRef.current);
      }

      reverseAbortRef.current?.abort();

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

  function selectLocation(latitude, longitude, moveMap = false) {
    const map = mapRef.current;

    if (!map || !leafletRef.current) {
      return;
    }

    setMapError("");

    placeMarker(latitude, longitude);

    if (moveMap) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), 16), {
        animate: true,
      });
    }

    const coordinateSnapshot = {
      latitude,
      longitude,

      latitudeDms: decimalToDms(latitude, true),
      longitudeDms: decimalToDms(longitude, false),

      elevation: null,
    };

    setLocationData(coordinateSnapshot);

    callbackRef.current?.(coordinateSnapshot);

    scheduleResolveLocation(latitude, longitude);
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

  async function fetchReverseData(latitude, longitude, locale, signal) {
    const elapsed = Date.now() - lastReverseRequestRef.current;

    if (elapsed < 1050) {
      await wait(1050 - elapsed);
    }

    lastReverseRequestRef.current = Date.now();

    const reverseUrl = new URL(REVERSE_GEOCODING_URL);

    reverseUrl.searchParams.set("format", "jsonv2");
    reverseUrl.searchParams.set("lat", String(latitude));
    reverseUrl.searchParams.set("lon", String(longitude));
    reverseUrl.searchParams.set("zoom", "18");
    reverseUrl.searchParams.set("addressdetails", "1");
    reverseUrl.searchParams.set("namedetails", "1");
    reverseUrl.searchParams.set("layer", "address");
    reverseUrl.searchParams.set("accept-language", locale);

    const response = await fetch(reverseUrl.toString(), {
      headers: {
        Accept: "application/json",
      },

      signal,
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    return response.json();
  }

  async function resolveLocation(latitude, longitude, sequence) {
    if (sequence !== resolveSequenceRef.current) {
      return;
    }

    const cacheKey = `${Number(latitude).toFixed(5)},${Number(
      longitude,
    ).toFixed(5)}`;

    const cached = reverseCacheRef.current.get(cacheKey);

    if (cached) {
      setLocationData(cached);

      callbackRef.current?.(cached);

      setResolving(false);

      return;
    }

    try {
      const controller = new AbortController();

      reverseAbortRef.current = controller;

      const thaiReverseData = await fetchReverseData(
        latitude,
        longitude,
        "th",
        controller.signal,
      );

      if (sequence !== resolveSequenceRef.current) {
        return;
      }

      const englishReverseData = await fetchReverseData(
        latitude,
        longitude,
        "en",
        controller.signal,
      );

      const elevation = await fetchElevation(latitude, longitude);

      if (sequence !== resolveSequenceRef.current) {
        return;
      }

      const parsed = parseMapLocation(
        thaiReverseData,
        englishReverseData,
        latitude,
        longitude,
        elevation,
        initialLocationRef.current?.postcode,
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

      setMapError(
        languageRef.current === "EN"
          ? "Coordinates were selected, but the address details could not be loaded."
          : "เลือกพิกัดแล้ว แต่ไม่สามารถอ่านรายละเอียดที่อยู่ได้ กรุณาลองเลือกจุดอีกครั้ง",
      );
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
    } catch {
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
      <div className="p-4 sm:p-5 lg:p-6">
        <SectionHeader
          icon={<MapPinIcon className="h-5 w-5" />}
          title={title}
          description={description}
          darkMode={darkMode}
        />

        <div className="mt-5 grid gap-4 sm:gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field
              label={mapText.placeName}
              name={placeNameField}
              value={activePlaceName}
              onChange={(name, value) => fieldChangeRef.current?.(name, value)}
              placeholder={mapText.placeNamePlaceholder}
              darkMode={darkMode}
            />
          </div>

          <Field
            label={mapText.province}
            name={provinceField}
            value={activeProvince}
            onChange={(name, value) => fieldChangeRef.current?.(name, value)}
            placeholder={mapText.provincePlaceholder}
            darkMode={darkMode}
          />

          <Field
            label={mapText.district}
            name={districtField}
            value={activeDistrict}
            onChange={(name, value) => fieldChangeRef.current?.(name, value)}
            placeholder={mapText.districtPlaceholder}
            darkMode={darkMode}
          />

          <Field
            label={mapText.subdistrict}
            name={subdistrictField}
            value={activeSubdistrict}
            onChange={(name, value) => fieldChangeRef.current?.(name, value)}
            placeholder={mapText.subdistrictPlaceholder}
            darkMode={darkMode}
          />

          <Field
            label={mapText.postcode}
            name="postcode"
            value={initialLocation?.postcode || ""}
            onChange={(name, value) => fieldChangeRef.current?.(name, value)}
            placeholder={mapText.postcodePlaceholder}
            inputMode="numeric"
            darkMode={darkMode}
          />

          <div className="md:col-span-2">
            <TextArea
              label={mapText.address}
              name={addressField}
              value={activeAddress}
              onChange={(name, value) => fieldChangeRef.current?.(name, value)}
              placeholder={mapText.addressPlaceholder}
              rows={3}
              darkMode={darkMode}
            />
          </div>
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

          <span>
            {hasCoordinates ? mapText.mapHint : mapText.noSavedCoordinates}
          </span>
        </div>
      </div>

      {/* MAP DETAILS */}

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

            {locating ? mapText.locating : mapText.currentLocation}
          </button>

          {resolving && (
            <div
              className={`inline-flex items-center gap-2 text-[10px] font-medium ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              <LoadingIcon className="h-3.5 w-3.5 animate-spin" />

              {mapText.reading}
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
          <p
            className={`text-[9px] font-black tracking-[0.15em] ${
              darkMode ? "text-emerald-400" : "text-emerald-700"
            }`}
          >
            {mapText.address.toUpperCase()}
          </p>

          <p
            className={`mt-2.5 break-words text-[12px] font-medium leading-[1.8] sm:text-[13px] ${
              darkMode ? "text-gray-300" : "text-slate-700"
            }`}
          >
            {activeAddress || mapText.emptyAddress}
          </p>

          <div className="mt-4">
            <p
              className={`text-[9px] font-black tracking-[0.15em] ${
                darkMode ? "text-emerald-400" : "text-emerald-700"
              }`}
            >
              {mapText.coordinates.toUpperCase()}
            </p>

            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:gap-3">
              <CoordinateCard
                label={mapText.latitude}
                value={
                  hasCoordinates
                    ? Number(locationData.latitude).toFixed(7)
                    : mapText.noValue
                }
                darkMode={darkMode}
              />

              <CoordinateCard
                label={mapText.longitude}
                value={
                  hasCoordinates
                    ? Number(locationData.longitude).toFixed(7)
                    : mapText.noValue
                }
                darkMode={darkMode}
              />
            </div>
          </div>

          <div className="mt-4">
            <p
              className={`text-[9px] font-black tracking-[0.15em] ${
                darkMode ? "text-emerald-400" : "text-emerald-700"
              }`}
            >
              {mapText.dms.toUpperCase()}
            </p>

            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:gap-3">
              <CoordinateCard
                label={mapText.latitude}
                value={locationData.latitudeDms || mapText.noValue}
                darkMode={darkMode}
              />

              <CoordinateCard
                label={mapText.longitude}
                value={locationData.longitudeDms || mapText.noValue}
                darkMode={darkMode}
              />
            </div>
          </div>

          <div className="mt-4">
            <MapInfoCard
              label={mapText.elevation}
              value={
                locationData.elevation !== null &&
                locationData.elevation !== undefined &&
                Number.isFinite(Number(locationData.elevation))
                  ? `${Math.round(
                      Number(locationData.elevation),
                    )} ${mapText.meters}`
                  : mapText.noValue
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
   LOCATION HELPERS
========================================================= */

function normalizeLocationData(value) {
  const latitude = toFiniteNumberOrNull(value?.latitude);
  const longitude = toFiniteNumberOrNull(value?.longitude);

  return {
    place_name_th: value?.place_name_th || "",
    place_name_en: value?.place_name_en || "",

    province_th: value?.province_th || "",
    province_en: value?.province_en || "",

    district_th: value?.district_th || "",
    district_en: value?.district_en || "",

    subdistrict_th: value?.subdistrict_th || "",
    subdistrict_en: value?.subdistrict_en || "",

    postcode: sanitizePostcodeInput(value?.postcode || ""),

    location_th: value?.location_th || "",
    location_en: value?.location_en || "",

    latitude,
    longitude,

    latitudeDms: latitude !== null ? decimalToDms(latitude, true) : "",

    longitudeDms: longitude !== null ? decimalToDms(longitude, false) : "",

    elevation: toApproxNumberOrNull(value?.elevation),
  };
}

function parseLocalizedMapLocation(data, locale) {
  const address = data?.address || {};
  const namedetails = data?.namedetails || {};

  const placeName =
    locale === "th"
      ? firstText(
          namedetails["name:th"],
          namedetails.name,
          data?.name,
          address.amenity,
          address.tourism,
          address.attraction,
          address.university,
          address.school,
          address.hospital,
          address.building,
          address.shop,
          address.office,
          address.leisure,
        )
      : firstText(
          namedetails["name:en"],
          namedetails.name,
          data?.name,
          address.amenity,
          address.tourism,
          address.attraction,
          address.university,
          address.school,
          address.hospital,
          address.building,
          address.shop,
          address.office,
          address.leisure,
        );

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

  const postcode = normalizePostcode(address.postcode);

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
    placeName,
    province,
    district,
    subdistrict,
    postcode,

    address: formattedAddress || data?.display_name || "",
  };
}

function parseMapLocation(
  thaiData,
  englishData,
  latitude,
  longitude,
  elevation,
  currentPostcode,
) {
  const thai = parseLocalizedMapLocation(thaiData, "th");

  const english = parseLocalizedMapLocation(englishData, "en");

  const postcode = chooseVerifiedPostcode(
    thai.postcode,
    english.postcode,
    currentPostcode,
  );

  return {
    place_name_th: thai.placeName,
    place_name_en: english.placeName,

    province_th: thai.province,
    province_en: english.province,

    district_th: thai.district,
    district_en: english.district,

    subdistrict_th: thai.subdistrict,
    subdistrict_en: english.subdistrict,

    postcode,

    location_th: thai.address,
    location_en: english.address,

    latitude,
    longitude,

    latitudeDms: decimalToDms(latitude, true),
    longitudeDms: decimalToDms(longitude, false),

    elevation,
  };
}

function decimalToDms(value, isLatitude) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  const absolute = Math.abs(numericValue);

  const degrees = Math.floor(absolute);

  const minutesFloat = (absolute - degrees) * 60;

  const minutes = Math.floor(minutesFloat);

  const seconds = ((minutesFloat - minutes) * 60).toFixed(1);

  const direction = isLatitude
    ? numericValue >= 0
      ? "N"
      : "S"
    : numericValue >= 0
      ? "E"
      : "W";

  return `${degrees}°${minutes}'${seconds}"${direction}`;
}

function sanitizePostcodeInput(value) {
  const thaiDigits = "๐๑๒๓๔๕๖๗๘๙";

  return String(value || "")
    .replace(/[๐-๙]/g, (digit) => String(thaiDigits.indexOf(digit)))
    .replace(/\D/g, "")
    .slice(0, 5);
}

function normalizePostcode(value) {
  const postcode = sanitizePostcodeInput(value);

  return /^\d{5}$/.test(postcode) ? postcode : "";
}

function chooseVerifiedPostcode(
  thaiPostcode,
  englishPostcode,
  currentPostcode,
) {
  const thai = normalizePostcode(thaiPostcode);
  const english = normalizePostcode(englishPostcode);
  const current = normalizePostcode(currentPostcode);

  /*
   * ถ้าทั้งข้อมูลไทยและอังกฤษส่งรหัสมา
   * จะใช้เฉพาะเมื่อทั้งสองตรงกัน
   *
   * ถ้าไม่ตรงกันจะไม่เดารหัสใหม่
   * และเก็บค่าที่ผู้ใช้กรอกเองไว้ ถ้ามี
   */
  if (thai && english) {
    return thai === english ? thai : current;
  }

  return thai || english || current || "";
}

/* =========================================================
   GENERAL HELPERS
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
   UI COMPONENTS
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
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        step={step}
        inputMode={inputMode}
        onChange={(event) => onChange(name, event.target.value)}
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
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        className={`w-full resize-y rounded-[12px] border px-3.5 py-3 text-[12px] leading-[1.7] outline-none transition focus:border-emerald-600/50 focus:ring-4 focus:ring-emerald-600/[0.06] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-[13px] ${
          darkMode
            ? "border-white/10 bg-black/20 text-white placeholder:text-gray-500"
            : "border-emerald-950/10 bg-[#f8faf7] text-slate-900 placeholder:text-slate-400 focus:bg-white"
        }`}
      />
    </div>
  );
}

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
      aria-hidden="true"
    >
      <path d="M20 4C10 4 5 8 5 15c0 2.8 2 5 5 5 7 0 10-5 10-16Z" />

      <path d="M4 20c4-5 7-7 13-10" />
    </svg>
  );
}

function MapPinIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle cx="12" cy="10" r="2.5" />
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
      aria-hidden="true"
    >
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
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
