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

  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

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
    notes: "",
    collected_by: "",
    specimen_number: "",
    duplicates: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      elevation: "ระดับความสูง (เมตร)",

      collection: "ข้อมูลการเก็บตัวอย่าง",
      date: "วันที่เก็บตัวอย่าง",
      habitat: "ถิ่นอาศัย",
      collectedBy: "ชื่อผู้เก็บตัวอย่าง",
      specimen: "หมายเลขตัวอย่าง",
      duplicates: "ตัวอย่างซ้ำ",
      notes: "รายละเอียดเพิ่มเติม",

      image: "รูปภาพตัวอย่าง",
      chooseImage: "เลือกรูปภาพ",
      changeImage: "เปลี่ยนรูปภาพ",
      imageHint: "รองรับ JPG, PNG หรือ WEBP",

      save: "บันทึกข้อมูล",
      saving: "กำลังบันทึก...",
      cancel: "ยกเลิก",
      back: "ย้อนกลับ",

      required: "กรุณากรอกชื่อพรรณไม้",
      login: "กรุณาเข้าสู่ระบบก่อนเพิ่มข้อมูล",
      uploadError: "ไม่สามารถอัปโหลดรูปภาพได้",
      saveSuccess: "เพิ่มข้อมูลพรรณไม้เรียบร้อยแล้ว",
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
      elevation: "Elevation (meters)",

      collection: "Collection Information",
      date: "Collection Date",
      habitat: "Habitat",
      collectedBy: "Collected By",
      specimen: "Specimen Number",
      duplicates: "Duplicates",
      notes: "Additional Notes",

      image: "Specimen Image",
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
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     CHECK USER
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Get user error:", error);
        }

        if (!mounted) return;

        if (!user) {
          router.replace("/login");
          return;
        }

        setUser(user);
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

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /* =====================================================
     IMAGE CHANGE
  ===================================================== */

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

  /* =====================================================
     UPLOAD IMAGE
  ===================================================== */

  async function uploadImage() {
    if (!imageFile) return null;

    const extension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${crypto.randomUUID()}.${extension}`;

    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("plant-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error("Image upload error:", uploadError);

      throw new Error(t.uploadError);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("plant-images").getPublicUrl(filePath);

    return publicUrl;
  }

  /* =====================================================
     SUBMIT
  ===================================================== */

  async function handleSubmit(e) {
    e.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    if (!form.common_name.trim()) {
      setError(t.required);
      return;
    }

    if (!user) {
      setError(t.login);
      return;
    }

    setSaving(true);

    try {
      let imageUrl = null;

      /* UPLOAD IMAGE */

      if (imageFile) {
        imageUrl = await uploadImage();
      }

      /* PLANT DATA */

      const plantData = {
        user_id: user.id,

        common_name: form.common_name.trim() || null,

        botanical_name: form.botanical_name.trim() || null,

        family: form.family.trim() || null,

        province: form.province.trim() || null,

        district: form.district.trim() || null,

        location: form.location.trim() || null,

        elevation: form.elevation ? Number(form.elevation) : null,

        collection_date: form.collection_date || null,

        habitat: form.habitat.trim() || null,

        notes: form.notes.trim() || null,

        collected_by: form.collected_by.trim() || null,

        specimen_number: form.specimen_number.trim() || null,

        duplicates: form.duplicates.trim() || null,

        image_url: imageUrl,
      };

      /* INSERT */

      const { error: insertError } = await supabase
        .from("plants")
        .insert([plantData]);

      if (insertError) {
        console.error("Insert plant error:", insertError);

        throw new Error(insertError.message);
      }

      setSuccess(t.saveSuccess);

      setTimeout(() => {
        router.push("/account/plants");
        router.refresh();
      }, 700);
    } catch (err) {
      console.error("Save plant error:", err);

      setError(err?.message || t.uploadError);
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     CLEAN PREVIEW URL
  ===================================================== */

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /* =====================================================
     LOADING USER
  ===================================================== */

  if (checkingUser) {
    return (
      <main
        className={`min-h-screen transition-colors ${
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

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-[#07100c] text-white" : "bg-[#f5faf7] text-slate-900"
      }`}
    >
      <Navbar />

      {/* =================================================
         HERO
      ================================================= */}

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

      {/* =================================================
         CONTENT
      ================================================= */}

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        {/* BACK BUTTON */}

        <button
          type="button"
          onClick={() => router.back()}
          className={`mb-6 inline-flex items-center rounded-xl border px-5 py-3 text-sm font-semibold transition ${
            darkMode
              ? "border-white/10 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08] hover:text-white"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-emerald-700"
          }`}
        >
          {t.back}
        </button>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* =================================================
               IMAGE
            ================================================= */}

            <div
              className={`rounded-3xl border p-6 shadow-sm sm:p-8 ${
                darkMode
                  ? "border-white/10 bg-[#0c1712]"
                  : "border-emerald-100 bg-white"
              }`}
            >
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
                {/* PREVIEW */}

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
                      alt={isEnglish ? "Plant preview" : "ตัวอย่างรูปพรรณไม้"}
                      className="aspect-square h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center">
                      <div className="text-center">
                        <div
                          className={`text-5xl font-light ${
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

                {/* UPLOAD */}

                <div className="flex flex-col justify-center">
                  <label
                    htmlFor="plant-image"
                    className="inline-flex w-fit cursor-pointer items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
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
            </div>

            {/* =================================================
               BASIC INFORMATION
            ================================================= */}

            <div
              className={`rounded-3xl border p-6 shadow-sm sm:p-8 ${
                darkMode
                  ? "border-white/10 bg-[#0c1712]"
                  : "border-emerald-100 bg-white"
              }`}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold">{t.basic}</h2>
              </div>

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
                  placeholder={
                    isEnglish ? "e.g. Anacardiaceae" : "เช่น Anacardiaceae"
                  }
                  darkMode={darkMode}
                />
              </div>
            </div>

            {/* =================================================
               LOCATION
            ================================================= */}

            <div
              className={`rounded-3xl border p-6 shadow-sm sm:p-8 ${
                darkMode
                  ? "border-white/10 bg-[#0c1712]"
                  : "border-emerald-100 bg-white"
              }`}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold">{t.locationTitle}</h2>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label={t.province}
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  placeholder={isEnglish ? "Province" : "จังหวัด"}
                  darkMode={darkMode}
                />

                <Field
                  label={t.district}
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder={isEnglish ? "District" : "อำเภอ / เขต"}
                  darkMode={darkMode}
                />

                <div className="md:col-span-2">
                  <Field
                    label={t.location}
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder={
                      isEnglish
                        ? "Specific collection location"
                        : "ระบุสถานที่เก็บตัวอย่าง"
                    }
                    darkMode={darkMode}
                  />
                </div>

                <Field
                  label={t.elevation}
                  name="elevation"
                  type="number"
                  value={form.elevation}
                  onChange={handleChange}
                  placeholder="0"
                  darkMode={darkMode}
                />
              </div>
            </div>

            {/* =================================================
               COLLECTION
            ================================================= */}

            <div
              className={`rounded-3xl border p-6 shadow-sm sm:p-8 ${
                darkMode
                  ? "border-white/10 bg-[#0c1712]"
                  : "border-emerald-100 bg-white"
              }`}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold">{t.collection}</h2>
              </div>

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
                  placeholder={
                    isEnglish ? "Collector name" : "ชื่อผู้เก็บตัวอย่าง"
                  }
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
                  value={form.duplicates}
                  onChange={handleChange}
                  placeholder={
                    isEnglish ? "Duplicate information" : "ข้อมูลตัวอย่างซ้ำ"
                  }
                  darkMode={darkMode}
                />

                {/* HABITAT */}

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">
                    {t.habitat}
                  </label>

                  <textarea
                    name="habitat"
                    value={form.habitat}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
                      darkMode
                        ? "border-white/10 bg-[#07100c] text-white"
                        : "border-gray-200 bg-white text-slate-900"
                    }`}
                    placeholder={
                      isEnglish
                        ? "Describe the habitat..."
                        : "อธิบายถิ่นอาศัยของพรรณไม้..."
                    }
                  />
                </div>

                {/* NOTES */}

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">
                    {t.notes}
                  </label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={5}
                    className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
                      darkMode
                        ? "border-white/10 bg-[#07100c] text-white"
                        : "border-gray-200 bg-white text-slate-900"
                    }`}
                    placeholder={
                      isEnglish
                        ? "Additional information..."
                        : "รายละเอียดเพิ่มเติม..."
                    }
                  />
                </div>
              </div>
            </div>

            {/* =================================================
               MESSAGE
            ================================================= */}

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

            {/* =================================================
               ACTIONS
            ================================================= */}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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

/* =====================================================
   FIELD COMPONENT
===================================================== */

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  darkMode,
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
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
          darkMode
            ? "border-white/10 bg-[#07100c] text-white"
            : "border-gray-200 bg-white text-slate-900"
        }`}
      />
    </div>
  );
}
