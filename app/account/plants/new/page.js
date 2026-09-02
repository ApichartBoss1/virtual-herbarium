"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

export default function NewPlantPage() {
  const router = useRouter();

  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =========================
     STATE
  ========================= */

  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
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
  });

  /* =========================
     LANGUAGE
  ========================= */

  const text = {
    TH: {
      title: "เพิ่มข้อมูลพรรณไม้",

      subtitle: "เพิ่มตัวอย่างพรรณไม้เข้าสู่คลังข้อมูล Virtual Herbarium",

      basic: "ข้อมูลพรรณไม้",

      commonName: "ชื่อพรรณไม้",

      botanicalName: "ชื่อวิทยาศาสตร์",

      family: "วงศ์",

      locationTitle: "สถานที่พบ",

      province: "จังหวัด",

      district: "อำเภอ / เขต",

      location: "สถานที่เก็บตัวอย่าง",

      elevation: "ระดับความสูง",

      collection: "ข้อมูลการเก็บตัวอย่าง",

      date: "วันที่เก็บตัวอย่าง",

      habitat: "ถิ่นอาศัย",

      collectedBy: "ชื่อผู้เก็บตัวอย่าง",

      specimen: "หมายเลขตัวอย่าง",

      duplicates: "จำนวนตัวอย่างซ้ำ",

      notes: "รายละเอียดเพิ่มเติม",

      image: "รูปภาพตัวอย่าง",

      chooseImage: "เลือกรูปภาพ",

      changeImage: "เปลี่ยนรูปภาพ",

      imageHint: "รองรับไฟล์ JPG, PNG และ WEBP",

      save: "บันทึกข้อมูล",

      saving: "กำลังบันทึก...",

      cancel: "ยกเลิก",

      back: "ย้อนกลับ",

      required: "กรุณากรอกชื่อพรรณไม้",

      login: "กรุณาเข้าสู่ระบบก่อนเพิ่มข้อมูล",

      uploadError: "ไม่สามารถอัปโหลดรูปภาพได้",

      saveSuccess: "เพิ่มข้อมูลพรรณไม้เรียบร้อยแล้ว",

      saveError: "ไม่สามารถบันทึกข้อมูลพรรณไม้ได้",

      duplicateError: "จำนวนตัวอย่างซ้ำต้องเป็นตัวเลขจำนวนเต็ม",
    },

    EN: {
      title: "Add Plant",

      subtitle: "Add a plant specimen to the Virtual Herbarium collection",

      basic: "Plant Information",

      commonName: "Common Name",

      botanicalName: "Scientific Name",

      family: "Family",

      locationTitle: "Collection Location",

      province: "Province",

      district: "District",

      location: "Collection Location",

      elevation: "Elevation",

      collection: "Collection Information",

      date: "Collection Date",

      habitat: "Habitat",

      collectedBy: "Collected By",

      specimen: "Specimen Number",

      duplicates: "Duplicates",

      notes: "Additional Notes",

      image: "Plant Image",

      chooseImage: "Choose Image",

      changeImage: "Change Image",

      imageHint: "JPG, PNG or WEBP",

      save: "Save Plant",

      saving: "Saving...",

      cancel: "Cancel",

      back: "Back",

      required: "Please enter the plant name",

      login: "Please log in before adding a plant",

      uploadError: "Unable to upload image",

      saveSuccess: "Plant added successfully",

      saveError: "Unable to save plant",

      duplicateError: "Duplicates must be a whole number",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =========================
     CHECK USER
  ========================= */

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      try {
        const { data, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error("Get user error:", userError);
        }

        if (!mounted) return;

        if (!data?.user) {
          router.replace("/login");
          return;
        }

        setUser(data.user);

        setCheckingUser(false);
      } catch (err) {
        console.error("Check user failed:", err);

        if (mounted) {
          router.replace("/login");
        }
      }
    }

    checkUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  /* =========================
     FORM CHANGE
  ========================= */

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  /* =========================
     IMAGE CHANGE
  ========================= */

  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t.uploadError);
      return;
    }

    setError("");

    setImageFile(file);

    const objectUrl = URL.createObjectURL(file);

    setPreview((oldPreview) => {
      if (oldPreview) {
        URL.revokeObjectURL(oldPreview);
      }

      return objectUrl;
    });
  }

  /* =========================
     UPLOAD IMAGE
  ========================= */

  async function uploadImage() {
    if (!imageFile) {
      return null;
    }

    if (!user?.id) {
      throw new Error(t.login);
    }

    const extension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${crypto.randomUUID()}.${extension}`;

    const filePath = `${user.id}/${fileName}`;

    console.log("Uploading image:", filePath);

    const { error: uploadError } = await supabase.storage
      .from("plant-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error("Image upload error:", {
        message: uploadError.message,

        details: uploadError.details,

        hint: uploadError.hint,

        name: uploadError.name,
      });

      throw new Error(uploadError.message || t.uploadError);
    }

    const { data: publicUrlData } = supabase.storage
      .from("plant-images")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      throw new Error(t.uploadError);
    }

    console.log("Image uploaded:", publicUrl);

    return publicUrl;
  }

  /* =========================
     SUBMIT
  ========================= */

  async function handleSubmit(e) {
    e.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    /* =====================
       VALIDATE
    ===================== */

    if (!form.common_name.trim()) {
      setError(t.required);
      return;
    }

    if (!user?.id) {
      setError(t.login);
      return;
    }

    setSaving(true);

    try {
      let imageUrl = null;

      /* =====================
         DUPLICATES

         DATABASE:
         integer
      ===================== */

      let duplicatesValue = null;

      if (form.duplicates.trim() !== "") {
        duplicatesValue = Number(form.duplicates);

        if (!Number.isInteger(duplicatesValue)) {
          throw new Error(t.duplicateError);
        }
      }

      /* =====================
         UPLOAD IMAGE
      ===================== */

      if (imageFile) {
        imageUrl = await uploadImage();
      }

      /* =====================
         CREATE PLANT DATA

         DATABASE COLUMNS:

         plant_id → identity
         ❌ DON'T SEND

         id → uuid
         user_id → uuid
      ===================== */

      const plantData = {
        /*
          UUID PRIMARY ID
        */

        id: crypto.randomUUID(),

        /*
          USER ID
        */

        user_id: user.id,

        /*
          BASIC
        */

        common_name: form.common_name.trim() || null,

        botanical_name: form.botanical_name.trim() || null,

        family: form.family.trim() || null,

        /*
          LOCATION
        */

        province: form.province.trim() || null,

        district: form.district.trim() || null,

        location: form.location.trim() || null,

        /*
          DATABASE = TEXT

          ดังนั้นส่ง string
        */

        elevation: form.elevation.trim() || null,

        /*
          COLLECTION
        */

        collection_date: form.collection_date || null,

        habitat: form.habitat.trim() || null,

        collected_by: form.collected_by.trim() || null,

        specimen_number: form.specimen_number.trim() || null,

        /*
          DATABASE = INTEGER
        */

        duplicates: duplicatesValue,

        notes: form.notes.trim() || null,

        /*
          IMAGE
        */

        image_url: imageUrl,
      };

      console.log("================================");

      console.log("INSERTING PLANT DATA:");

      console.log(plantData);

      console.log("USER ID:", user.id);

      console.log("================================");

      /* =====================
         INSERT
      ===================== */

      const { data: insertedPlant, error: insertError } = await supabase
        .from("plants")
        .insert(plantData)
        .select()
        .single();

      /* =====================
         INSERT ERROR
      ===================== */

      if (insertError) {
        console.error("================================");

        console.error("INSERT PLANT ERROR");

        console.error("MESSAGE:", insertError.message);

        console.error("DETAILS:", insertError.details);

        console.error("HINT:", insertError.hint);

        console.error("CODE:", insertError.code);

        console.error("FULL ERROR:", insertError);

        console.error("================================");

        throw new Error(
          insertError.message || insertError.details || t.saveError,
        );
      }

      /* =====================
         SUCCESS
      ===================== */

      console.log("================================");

      console.log("PLANT INSERTED SUCCESSFULLY");

      console.log(insertedPlant);

      console.log("================================");

      setSuccess(t.saveSuccess);

      setTimeout(() => {
        router.push("/account");

        router.refresh();
      }, 700);
    } catch (err) {
      console.error("SAVE PLANT ERROR:", err);

      setError(err?.message || t.saveError);
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     CLEAN IMAGE PREVIEW
  ========================= */

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /* =========================
     LOADING
  ========================= */

  if (checkingUser) {
    return (
      <main
        className={`min-h-screen ${
          darkMode ? "bg-[#07100c] text-white" : "bg-[#f5faf7] text-slate-900"
        }`}
      >
        <Navbar />

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div
              className={`mx-auto h-10 w-10 animate-spin rounded-full border-4 ${
                darkMode
                  ? "border-white/10 border-t-emerald-400"
                  : "border-emerald-100 border-t-emerald-600"
              }`}
            />

            <p
              className={`mt-4 text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {isEnglish ? "Loading..." : "กำลังโหลด..."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     PAGE
  ========================= */

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-[#07100c] text-white" : "bg-[#f5faf7] text-slate-900"
      }`}
    >
      <Navbar />

      {/* =========================
         HERO
      ========================= */}

      <section
        className={`border-b ${
          darkMode
            ? "border-white/10 bg-[#09150f]"
            : "border-emerald-100 bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="max-w-3xl">
            <div
              className={`mb-4 inline-flex rounded-full border px-3 py-1 text-sm font-medium ${
                darkMode
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              Virtual Herbarium
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              {t.title}
            </h1>

            <p
              className={`mt-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              {t.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* =========================
         CONTENT
      ========================= */}

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        {/* BACK */}

        <button
          type="button"
          onClick={() => router.back()}
          className={`mb-6 inline-flex items-center rounded-xl border px-5 py-3 text-sm font-semibold transition ${
            darkMode
              ? "border-white/10 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          ← {t.back}
        </button>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* =====================
               IMAGE
            ===================== */}

            <FormCard darkMode={darkMode}>
              <div className="mb-6">
                <h2 className="text-xl font-bold">{t.image}</h2>

                <p
                  className={`mt-1 text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {t.imageHint}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-[260px_1fr]">
                <div
                  className={`overflow-hidden rounded-2xl border ${
                    darkMode
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Plant preview"
                      className="aspect-square h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center">
                      <div className="text-center">
                        <div
                          className={`text-5xl ${
                            darkMode ? "text-gray-500" : "text-gray-300"
                          }`}
                        >
                          +
                        </div>

                        <p
                          className={`mt-2 text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {t.image}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center">
                  <label
                    htmlFor="plant-image"
                    className="inline-flex w-fit cursor-pointer items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {preview ? t.changeImage : t.chooseImage}
                  </label>

                  <input
                    id="plant-image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <p
                    className={`mt-3 text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {imageFile?.name || t.imageHint}
                  </p>
                </div>
              </div>
            </FormCard>

            {/* =====================
               BASIC
            ===================== */}

            <FormCard darkMode={darkMode}>
              <h2 className="mb-6 text-xl font-bold">{t.basic}</h2>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label={t.commonName}
                  name="common_name"
                  value={form.common_name}
                  onChange={handleChange}
                  required
                  placeholder={isEnglish ? "e.g. Mango" : "เช่น มะม่วง"}
                  darkMode={darkMode}
                />

                <Field
                  label={t.botanicalName}
                  name="botanical_name"
                  value={form.botanical_name}
                  onChange={handleChange}
                  placeholder="Mangifera indica"
                  darkMode={darkMode}
                />

                <Field
                  label={t.family}
                  name="family"
                  value={form.family}
                  onChange={handleChange}
                  placeholder="Anacardiaceae"
                  darkMode={darkMode}
                />
              </div>
            </FormCard>

            {/* =====================
               LOCATION
            ===================== */}

            <FormCard darkMode={darkMode}>
              <h2 className="mb-6 text-xl font-bold">{t.locationTitle}</h2>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label={t.province}
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  darkMode={darkMode}
                />

                <Field
                  label={t.district}
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  darkMode={darkMode}
                />

                <div className="md:col-span-2">
                  <Field
                    label={t.location}
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    darkMode={darkMode}
                  />
                </div>

                <Field
                  label={t.elevation}
                  name="elevation"
                  value={form.elevation}
                  onChange={handleChange}
                  placeholder="100"
                  darkMode={darkMode}
                />
              </div>
            </FormCard>

            {/* =====================
               COLLECTION
            ===================== */}

            <FormCard darkMode={darkMode}>
              <h2 className="mb-6 text-xl font-bold">{t.collection}</h2>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label={t.date}
                  name="collection_date"
                  type="date"
                  value={form.collection_date}
                  onChange={handleChange}
                  darkMode={darkMode}
                />

                <Field
                  label={t.collectedBy}
                  name="collected_by"
                  value={form.collected_by}
                  onChange={handleChange}
                  darkMode={darkMode}
                />

                <Field
                  label={t.specimen}
                  name="specimen_number"
                  value={form.specimen_number}
                  onChange={handleChange}
                  placeholder="VH-0001"
                  darkMode={darkMode}
                />

                <Field
                  label={t.duplicates}
                  name="duplicates"
                  type="number"
                  min="0"
                  value={form.duplicates}
                  onChange={handleChange}
                  placeholder="0"
                  darkMode={darkMode}
                />

                {/* HABITAT */}

                <div className="md:col-span-2">
                  <TextArea
                    label={t.habitat}
                    name="habitat"
                    value={form.habitat}
                    onChange={handleChange}
                    placeholder={
                      isEnglish
                        ? "Describe the habitat..."
                        : "อธิบายถิ่นอาศัย..."
                    }
                    darkMode={darkMode}
                  />
                </div>

                {/* NOTES */}

                <div className="md:col-span-2">
                  <TextArea
                    label={t.notes}
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={5}
                    placeholder={
                      isEnglish
                        ? "Additional information..."
                        : "รายละเอียดเพิ่มเติม..."
                    }
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </FormCard>

            {/* =====================
               ERROR
            ===================== */}

            {error && (
              <div
                className={`rounded-2xl border px-5 py-4 text-sm ${
                  darkMode
                    ? "border-red-500/20 bg-red-500/10 text-red-300"
                    : "border-red-200 bg-red-50 text-red-600"
                }`}
              >
                {error}
              </div>
            )}

            {/* =====================
               SUCCESS
            ===================== */}

            {success && (
              <div
                className={`rounded-2xl border px-5 py-4 text-sm ${
                  darkMode
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {success}
              </div>
            )}

            {/* =====================
               BUTTONS
            ===================== */}

            <div className="flex flex-col-reverse gap-3 pb-10 sm:flex-row sm:justify-end">
              <Link
                href="/account/plants"
                className={`inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold transition ${
                  darkMode
                    ? "border-white/10 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {t.cancel}
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? t.saving : t.save}
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

/* =========================================
   FORM CARD
========================================= */

function FormCard({ children, darkMode }) {
  return (
    <div
      className={`rounded-3xl border p-6 shadow-sm sm:p-8 ${
        darkMode
          ? "border-white/10 bg-[#0c1712]"
          : "border-emerald-100 bg-white"
      }`}
    >
      {children}
    </div>
  );
}

/* =========================================
   FIELD
========================================= */

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  darkMode,
  min,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
          darkMode
            ? "border-white/10 bg-[#07100c] text-white"
            : "border-gray-200 bg-white text-slate-900"
        }`}
      />
    </div>
  );
}

/* =========================================
   TEXT AREA
========================================= */

function TextArea({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  rows = 4,
  darkMode,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
          darkMode
            ? "border-white/10 bg-[#07100c] text-white"
            : "border-gray-200 bg-white text-slate-900"
        }`}
      />
    </div>
  );
}
