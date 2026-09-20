"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

/* =========================================================
   TODAY LOCAL DATE
========================================================= */

function getTodayForDateInput() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM = {
  common_name: "",
  botanical_name: "",
  family: "",

  province: "",
  district: "",
  location: "",
  elevation: "",

  collection_date: "",

  habitat: "",
  collected_by: "",
  specimen_number: "",
  duplicates: "",
  notes: "",
};

export default function NewPlantPage() {
  const router = useRouter();

  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const [user, setUser] = useState(null);

  const [checkingUser, setCheckingUser] = useState(true);

  const [saving, setSaving] = useState(false);

  const [processingImage, setProcessingImage] = useState(false);

  const [imageFile, setImageFile] = useState(null);

  const [preview, setPreview] = useState("");

  const [imageMenuOpen, setImageMenuOpen] = useState(false);

  const [canUseCamera, setCanUseCamera] = useState(false);

  const [imageNotice, setImageNotice] = useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(INITIAL_FORM);

  const fileInputRef = useRef(null);

  const cameraInputRef = useRef(null);

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "NEW SPECIMEN RECORD",

      heroTitle: "บันทึกพรรณไม้หนึ่งตัวอย่าง",

      heroDescription:
        "เพิ่มข้อมูลจากการสำรวจหรือการเก็บตัวอย่างเข้าสู่ Virtual Herbarium พร้อมภาพ สถานที่ และรายละเอียดทางพฤกษศาสตร์",

      imageLabel: "SPECIMEN IMAGE",

      image: "ภาพตัวอย่างพรรณไม้",

      imageDescription:
        "เพิ่มภาพจากเครื่องหรือถ่ายภาพใหม่จากกล้อง หากเป็น HEIC หรือ HEIF จาก iPhone ระบบจะแปลงเป็น JPEG ก่อนอัปโหลด",

      addImage: "เพิ่มรูปภาพ",

      changeImage: "เปลี่ยนรูปภาพ",

      imageSourceTitle: "เลือกวิธีเพิ่มรูปภาพ",

      imageSourceDescription: "เลือกรูปจากอุปกรณ์ หรือถ่ายภาพใหม่ด้วยกล้อง",

      chooseFromDevice: "เลือกรูปจากเครื่อง",

      chooseFromDeviceDescription: "รองรับ JPG, PNG, WEBP, HEIC และ HEIF",

      takePhoto: "ถ่ายรูป",

      takePhotoDescription: "เปิดกล้องหลังเพื่อถ่ายตัวอย่างพรรณไม้",

      cameraUnavailable: "สามารถถ่ายรูปได้จากมือถือหรือแท็บเล็ตเท่านั้น",

      imageHint:
        "JPG, PNG, WEBP ไม่เกิน 10MB • HEIC / HEIF จาก iPhone จะถูกแปลงเป็น JPEG",

      invalidImage: "รองรับเฉพาะ JPG, PNG, WEBP, HEIC และ HEIF",

      imageTooLarge: "รูปภาพหลังประมวลผลต้องมีขนาดไม่เกิน 10MB",

      heicSourceTooLarge: "ไฟล์ HEIC / HEIF ต้นฉบับต้องมีขนาดไม่เกิน 25MB",

      heicConversionError:
        "ไม่สามารถแปลงไฟล์ HEIC / HEIF ได้ กรุณาลองเลือกรูปอื่น",

      convertingImage: "กำลังเตรียมรูปภาพ...",

      heicConverted: "แปลงรูป HEIC / HEIF เป็น JPEG เรียบร้อยแล้ว",

      selectedFile: "ไฟล์ที่จะอัปโหลด",

      removeImage: "ลบรูป",

      close: "ปิด",

      basicLabel: "BOTANICAL IDENTITY",

      basic: "ข้อมูลพรรณไม้",

      basicDescription: "ระบุชื่อและวงศ์ของตัวอย่างพรรณไม้",

      commonName: "ชื่อพรรณไม้",

      commonPlaceholder: "เช่น มะม่วง",

      botanicalName: "ชื่อวิทยาศาสตร์",

      botanicalPlaceholder: "เช่น Mangifera indica",

      family: "วงศ์",

      familyPlaceholder: "เช่น Anacardiaceae",

      locationLabel: "FIELD LOCATION",

      locationTitle: "สถานที่พบ",

      locationDescription: "บันทึกพื้นที่และระดับความสูงที่พบตัวอย่าง",

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
        "บันทึกวันที่ ผู้เก็บ หมายเลขตัวอย่าง ถิ่นอาศัย และข้อสังเกต",

      date: "วันที่เก็บตัวอย่าง",

      dateHint: "ระบบใส่วันที่ปัจจุบันให้อัตโนมัติ แต่สามารถเปลี่ยนวันที่ได้",

      habitat: "ถิ่นอาศัย",

      habitatPlaceholder: "เช่น ป่าดิบแล้ง ริมลำธาร พื้นที่เกษตร...",

      collectedBy: "ชื่อผู้เก็บตัวอย่าง",

      collectedByPlaceholder: "ชื่อผู้เก็บตัวอย่าง",

      specimen: "หมายเลขตัวอย่าง",

      specimenPlaceholder: "เช่น VH-0001",

      duplicates: "จำนวนตัวอย่างซ้ำ",

      duplicatesPlaceholder: "เช่น 2",

      notes: "รายละเอียดเพิ่มเติม",

      notesPlaceholder:
        "ลักษณะเด่น สี กลิ่น การใช้ประโยชน์ หรือข้อสังเกตอื่น ๆ...",

      save: "บันทึกตัวอย่าง",

      saving: "กำลังบันทึก...",

      cancel: "ยกเลิก",

      required: "กรุณากรอกชื่อพรรณไม้",

      login: "กรุณาเข้าสู่ระบบก่อนเพิ่มข้อมูล",

      uploadError: "ไม่สามารถอัปโหลดรูปภาพได้",

      saveSuccess: "เพิ่มข้อมูลพรรณไม้เรียบร้อยแล้ว",

      saveError: "ไม่สามารถบันทึกข้อมูลพรรณไม้ได้",

      duplicateError: "จำนวนตัวอย่างซ้ำต้องเป็นเลขจำนวนเต็มตั้งแต่ 0 ขึ้นไป",

      loading: "กำลังเตรียมแบบบันทึกตัวอย่าง...",

      optional: "ข้อมูลอื่นสามารถเว้นว่างได้",

      mobile: "มือถือ / แท็บเล็ต",

      desktop: "ไม่รองรับบนคอมพิวเตอร์",
    },

    EN: {
      eyebrow: "NEW SPECIMEN RECORD",

      heroTitle: "Record a botanical specimen",

      heroDescription:
        "Add a plant specimen to the Virtual Herbarium with an image, location and botanical information.",

      imageLabel: "SPECIMEN IMAGE",

      image: "Plant Image",

      imageDescription:
        "Choose an image or take a new photo. HEIC and HEIF images from iPhone are converted to JPEG before upload.",

      addImage: "Add Image",

      changeImage: "Change Image",

      imageSourceTitle: "Choose Image Source",

      imageSourceDescription:
        "Choose an existing image or take a new photograph.",

      chooseFromDevice: "Choose from Device",

      chooseFromDeviceDescription: "Supports JPG, PNG, WEBP, HEIC and HEIF",

      takePhoto: "Take Photo",

      takePhotoDescription: "Open the rear camera to photograph the specimen.",

      cameraUnavailable: "Photo capture is available on mobile or tablet only.",

      imageHint:
        "JPG, PNG, WEBP up to 10MB • iPhone HEIC / HEIF images are converted to JPEG",

      invalidImage: "Supported formats: JPG, PNG, WEBP, HEIC and HEIF",

      imageTooLarge: "The processed image must be 10MB or smaller",

      heicSourceTooLarge:
        "The source HEIC / HEIF image must be 25MB or smaller",

      heicConversionError:
        "Unable to convert the HEIC / HEIF image. Please choose another image.",

      convertingImage: "Preparing image...",

      heicConverted: "HEIC / HEIF image converted to JPEG",

      selectedFile: "Upload file",

      removeImage: "Remove Image",

      close: "Close",

      basicLabel: "BOTANICAL IDENTITY",

      basic: "Plant Information",

      basicDescription: "Record the name and family of the plant specimen.",

      commonName: "Common Name",

      commonPlaceholder: "e.g. Mango",

      botanicalName: "Scientific Name",

      botanicalPlaceholder: "e.g. Mangifera indica",

      family: "Family",

      familyPlaceholder: "e.g. Anacardiaceae",

      locationLabel: "FIELD LOCATION",

      locationTitle: "Collection Location",

      locationDescription:
        "Record where the specimen was found and its elevation.",

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
        "Record the collection date, collector, specimen number, habitat and observations.",

      date: "Collection Date",

      dateHint:
        "Today's date is selected automatically, but you can change it.",

      habitat: "Habitat",

      habitatPlaceholder:
        "e.g. dry evergreen forest, stream bank or agricultural area...",

      collectedBy: "Collected By",

      collectedByPlaceholder: "Collector name",

      specimen: "Specimen Number",

      specimenPlaceholder: "e.g. VH-0001",

      duplicates: "Duplicates",

      duplicatesPlaceholder: "e.g. 2",

      notes: "Additional Notes",

      notesPlaceholder:
        "Distinctive characters, colour, scent, uses or other observations...",

      save: "Save Specimen",

      saving: "Saving...",

      cancel: "Cancel",

      required: "Please enter the plant name",

      login: "Please log in before adding a plant",

      uploadError: "Unable to upload image",

      saveSuccess: "Plant specimen added successfully",

      saveError: "Unable to save plant specimen",

      duplicateError:
        "Duplicates must be a whole number greater than or equal to 0",

      loading: "Preparing specimen record...",

      optional: "Other information can be left blank",

      mobile: "Mobile / Tablet",

      desktop: "Unavailable on computer",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     SET TODAY AFTER MOUNT

     ป้องกัน timezone ของ server
     ไม่ตรงกับ timezone ของอุปกรณ์
  ===================================================== */

  useEffect(() => {
    setForm((previous) => {
      if (previous.collection_date) {
        return previous;
      }

      return {
        ...previous,
        collection_date: getTodayForDateInput(),
      };
    });
  }, []);

  /* =====================================================
     MOBILE / TABLET CAMERA
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
     AUTH
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      try {
        const { data, error: userError } = await supabase.auth.getUser();

        if (!mounted) {
          return;
        }

        if (userError || !data?.user) {
          router.replace("/login");

          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error("Check user failed:", err);

        if (mounted) {
          router.replace("/login");
        }
      } finally {
        if (mounted) {
          setCheckingUser(false);
        }
      }
    }

    checkUser();

    return () => {
      mounted = false;
    };
  }, [router]);

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

  function handleChange(event) {
    const { name, value } = event.target;

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

    /*
     * ทำให้เลือกไฟล์เดิมซ้ำได้
     */

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

  function handleRemoveImage() {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setImageFile(null);
    setPreview("");
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
    if (!imageFile) {
      return {
        publicUrl: null,
        filePath: null,
      };
    }

    if (!user?.id) {
      throw new Error(t.login);
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
     SAVE
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
      setError(t.login);

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

        common_name: form.common_name.trim() || null,

        botanical_name: form.botanical_name.trim() || null,

        family: form.family.trim() || null,

        province: form.province.trim() || null,

        district: form.district.trim() || null,

        location: form.location.trim() || null,

        /*
         * elevation ใน DB = text
         */

        elevation: form.elevation.trim() || null,

        collection_date: form.collection_date || null,

        habitat: form.habitat.trim() || null,

        collected_by: form.collected_by.trim() || null,

        specimen_number: form.specimen_number.trim() || null,

        duplicates: duplicatesValue,

        notes: form.notes.trim() || null,

        image_url: imageUrl,
      };

      const { error: insertError } = await supabase
        .from("plants")
        .insert(plantData);

      if (insertError) {
        throw insertError;
      }

      setSuccess(t.saveSuccess);

      setTimeout(() => {
        router.push("/account/plants");

        router.refresh();
      }, 700);
    } catch (err) {
      console.error("Save plant error:", err);

      /*
       * ลบไฟล์ถ้า upload ผ่าน
       * แต่ insert DB ไม่ผ่าน
       */

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

  if (checkingUser) {
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

  return (
    <main className="page overflow-hidden">
      <Navbar />

      {/* =====================================================
          HERO
      ===================================================== */}

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

            <p
              className={`mt-5 max-w-2xl leading-8 ${
                darkMode ? "text-[#bdccc1]" : "text-[#475f4e]"
              }`}
            >
              {t.heroDescription}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          FORM
      ===================================================== */}

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
                        alt="Plant preview"
                        className="aspect-square h-full w-full object-cover"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={saving || processingImage}
                        className="absolute bottom-4 right-4 inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/15 bg-black/50 px-3 text-xs font-bold text-white backdrop-blur-xl"
                      >
                        <TrashIcon className="h-4 w-4" />

                        {t.removeImage}
                      </button>
                    </>
                  ) : (
                    <div className="flex aspect-square items-center justify-center">
                      <div className="text-center">
                        <CameraIcon
                          className={`mx-auto h-10 w-10 ${
                            darkMode ? "text-emerald-300" : "text-emerald-700"
                          }`}
                        />

                        <p className="mt-4 text-sm font-bold">{t.image}</p>

                        <p className="mt-2 max-w-[220px] text-xs leading-5 text-[var(--muted)]">
                          {t.imageHint}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setImageMenuOpen(true)}
                    disabled={saving || processingImage}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <div
                      className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
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
                      className={`mt-4 rounded-xl border px-4 py-3 ${
                        darkMode
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-emerald-950/10 bg-white"
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                        {t.selectedFile}
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold">
                        {imageFile.name}
                      </p>
                    </div>
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
                <Field
                  label={t.commonName}
                  name="common_name"
                  value={form.common_name}
                  onChange={handleChange}
                  placeholder={t.commonPlaceholder}
                  required
                  darkMode={darkMode}
                  disabled={saving}
                />

                <Field
                  label={t.botanicalName}
                  name="botanical_name"
                  value={form.botanical_name}
                  onChange={handleChange}
                  placeholder={t.botanicalPlaceholder}
                  italic
                  darkMode={darkMode}
                  disabled={saving}
                />

                <Field
                  label={t.family}
                  name="family"
                  value={form.family}
                  onChange={handleChange}
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
                <Field
                  label={t.province}
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  placeholder={t.provincePlaceholder}
                  darkMode={darkMode}
                  disabled={saving}
                />

                <Field
                  label={t.district}
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder={t.districtPlaceholder}
                  darkMode={darkMode}
                  disabled={saving}
                />

                <div className="md:col-span-2">
                  <Field
                    label={t.location}
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder={t.locationPlaceholder}
                    darkMode={darkMode}
                    disabled={saving}
                  />
                </div>

                <Field
                  label={t.elevation}
                  name="elevation"
                  value={form.elevation}
                  onChange={handleChange}
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
                <div>
                  <Field
                    label={t.date}
                    name="collection_date"
                    type="date"
                    value={form.collection_date}
                    onChange={handleChange}
                    darkMode={darkMode}
                    disabled={saving}
                  />

                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                    {t.dateHint}
                  </p>
                </div>

                <Field
                  label={t.collectedBy}
                  name="collected_by"
                  value={form.collected_by}
                  onChange={handleChange}
                  placeholder={t.collectedByPlaceholder}
                  darkMode={darkMode}
                  disabled={saving}
                />

                <Field
                  label={t.specimen}
                  name="specimen_number"
                  value={form.specimen_number}
                  onChange={handleChange}
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
                  value={form.duplicates}
                  onChange={handleChange}
                  placeholder={t.duplicatesPlaceholder}
                  darkMode={darkMode}
                  disabled={saving}
                />

                <div className="md:col-span-2">
                  <TextArea
                    label={t.habitat}
                    name="habitat"
                    value={form.habitat}
                    onChange={handleChange}
                    placeholder={t.habitatPlaceholder}
                    darkMode={darkMode}
                    disabled={saving}
                  />
                </div>

                <div className="md:col-span-2">
                  <TextArea
                    label={t.notes}
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={5}
                    placeholder={t.notesPlaceholder}
                    darkMode={darkMode}
                    disabled={saving}
                  />
                </div>
              </div>

              <p className="mt-6 text-xs text-[var(--muted)]">{t.optional}</p>
            </FormCard>

            {/* ERROR */}

            {error && (
              <AlertBox darkMode={darkMode} type="error">
                {error}
              </AlertBox>
            )}

            {/* SUCCESS */}

            {success && (
              <AlertBox darkMode={darkMode} type="success">
                {success}
              </AlertBox>
            )}

            {/* BUTTONS */}

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
                className="btn btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* =====================================================
          IMAGE SOURCE MODAL
      ===================================================== */}

      {imageMenuOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setImageMenuOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className={`w-full max-w-md rounded-[1.8rem] border p-5 shadow-2xl ${
              darkMode
                ? "border-white/10 bg-[#09150e]"
                : "border-emerald-950/10 bg-white"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black">{t.imageSourceTitle}</h3>

                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {t.imageSourceDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setImageMenuOpen(false)}
                aria-label={t.close}
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
              className="mt-4 min-h-11 w-full rounded-xl text-sm font-bold text-[var(--muted)] transition hover:bg-[var(--secondary)]"
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
      className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-xl sm:p-8 ${
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

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          {description}
        </p>
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
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        step={step}
        className={`h-[52px] w-full rounded-xl border px-4 text-sm outline-none transition ${
          italic ? "italic" : ""
        } ${
          darkMode
            ? "border-white/10 bg-black/20 text-white focus:border-emerald-400/45"
            : "border-emerald-950/10 bg-white/70 text-slate-900 focus:border-emerald-700/35"
        } disabled:opacity-60`}
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
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-bold">
        {label}
      </label>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full resize-none rounded-xl border px-4 py-3 text-sm leading-7 outline-none transition ${
          darkMode
            ? "border-white/10 bg-black/20 text-white focus:border-emerald-400/45"
            : "border-emerald-950/10 bg-white/70 text-slate-900 focus:border-emerald-700/35"
        } disabled:opacity-60`}
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
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
        disabled
          ? "cursor-not-allowed opacity-40"
          : darkMode
            ? "border-white/10 bg-white/[0.03] hover:bg-emerald-400/[0.07]"
            : "border-emerald-950/10 bg-[#f7faf6] hover:bg-emerald-50"
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/10 text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
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
      aria-hidden="true"
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
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m4 17 5-5 4 4" />
      <path d="M17 11v6M14 14h6" />
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
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
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
      aria-hidden="true"
    >
      <path d="M20 4C10 4 5 8 5 15c0 2.8 2 5 5 5 7 0 10-5 10-16Z" />
      <path d="M4 20c4-5 7-7 13-10" />
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
      aria-hidden="true"
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
      aria-hidden="true"
    >
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
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
      <path d="M4 7h16M9 7V4h6v3m-8 0 1 14h8l1-14M10 11v6M14 11v6" />
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
      aria-hidden="true"
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
      strokeLinejoin="round"
      aria-hidden="true"
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
      aria-hidden="true"
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
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
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
