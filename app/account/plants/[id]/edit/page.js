"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

export default function EditPlantPage() {
  const router = useRouter();
  const params = useParams();

  const { language } = useSiteSettings();
  const isEnglish = language === "EN";

  const plantId = params?.id;

  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
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
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [oldImageUrl, setOldImageUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const text = {
    TH: {
      title: "แก้ไขข้อมูลพรรณไม้",
      subtitle: "แก้ไขข้อมูลพรรณไม้ของคุณ",

      image: "รูปภาพตัวอย่าง",
      chooseImage: "เลือกรูปภาพ",
      changeImage: "เปลี่ยนรูปภาพ",
      imageHint: "รองรับ JPG, PNG หรือ WEBP",
      noImage: "ยังไม่มีรูปภาพ",

      family: "วงศ์",
      commonName: "ชื่อพรรณไม้",
      botanicalName: "ชื่อวิทยาศาสตร์",
      province: "จังหวัด",
      district: "อำเภอ / เขต",
      location: "สถานที่พบ",
      elevation: "ระดับความสูง (เมตร)",
      collectionDate: "วันที่เก็บตัวอย่าง",
      habitat: "ถิ่นอาศัย",
      notes: "รายละเอียดเพิ่มเติม",
      collectedBy: "ผู้เก็บตัวอย่าง",
      specimenNumber: "หมายเลขตัวอย่าง",
      duplicates: "จำนวนตัวอย่างซ้ำ",

      save: "บันทึกการแก้ไข",
      saving: "กำลังบันทึก...",

      back: "ย้อนกลับ",

      loading: "กำลังโหลดข้อมูล...",
      notFound: "ไม่พบข้อมูลพรรณไม้",
      loginRequired: "กรุณาเข้าสู่ระบบ",
      updateError: "ไม่สามารถแก้ไขข้อมูลได้",
      uploadError: "ไม่สามารถอัปโหลดรูปภาพได้",
      invalidImage: "กรุณาเลือกไฟล์รูปภาพ JPG, PNG หรือ WEBP",
      required: "กรุณากรอกชื่อพรรณไม้",
      success: "แก้ไขข้อมูลสำเร็จ",
    },

    EN: {
      title: "Edit Plant",
      subtitle: "Edit your plant information",

      image: "Specimen Image",
      chooseImage: "Choose Image",
      changeImage: "Change Image",
      imageHint: "JPG, PNG or WEBP",
      noImage: "No image",

      family: "Family",
      commonName: "Common Name",
      botanicalName: "Scientific Name",
      province: "Province",
      district: "District",
      location: "Location",
      elevation: "Elevation (meters)",
      collectionDate: "Collection Date",
      habitat: "Habitat",
      notes: "Additional Notes",
      collectedBy: "Collected By",
      specimenNumber: "Specimen Number",
      duplicates: "Duplicates",

      save: "Save Changes",
      saving: "Saving...",

      back: "Go Back",

      loading: "Loading plant...",
      notFound: "Plant not found",
      loginRequired: "Please login",
      updateError: "Unable to update plant",
      uploadError: "Unable to upload image",
      invalidImage: "Please select a JPG, PNG or WEBP image",
      required: "Please enter the plant name",
      success: "Plant updated successfully",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  // =========================================================
  // UPDATE FIELD
  // =========================================================

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // =========================================================
  // LOAD USER + PLANT
  // =========================================================

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        // -----------------------------------------------
        // USER
        // -----------------------------------------------

        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (userError || !currentUser) {
          router.replace("/login");
          return;
        }

        setUser(currentUser);

        // -----------------------------------------------
        // PLANT ID
        // -----------------------------------------------

        if (!plantId) {
          throw new Error(t.notFound);
        }

        // -----------------------------------------------
        // LOAD PLANT
        // -----------------------------------------------

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
          .single();

        if (!mounted) return;

        if (plantError) {
          console.error("Load plant error:", plantError);
          throw new Error(t.notFound);
        }

        if (!plant) {
          throw new Error(t.notFound);
        }

        // -----------------------------------------------
        // SET FORM
        // -----------------------------------------------

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

        // -----------------------------------------------
        // EXISTING IMAGE
        // -----------------------------------------------

        setOldImageUrl(plant.image_url || "");
        setPreview(plant.image_url || "");
      } catch (err) {
        console.error("Load edit page error:", err);

        if (mounted) {
          setError(err?.message || t.notFound);
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

  // =========================================================
  // IMAGE CHANGE
  // =========================================================

  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    // -----------------------------------------------
    // CHECK IMAGE TYPE
    // -----------------------------------------------

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError(t.invalidImage);
      return;
    }

    // -----------------------------------------------
    // CHECK FILE SIZE
    // 10 MB
    // -----------------------------------------------

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        isEnglish
          ? "Image size must be less than 10 MB"
          : "ขนาดรูปภาพต้องไม่เกิน 10 MB",
      );
      return;
    }

    setError("");
    setSuccess("");

    // -----------------------------------------------
    // REMOVE OLD PREVIEW URL
    // -----------------------------------------------

    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    // -----------------------------------------------
    // CREATE NEW PREVIEW
    // -----------------------------------------------

    const objectUrl = URL.createObjectURL(file);

    setImageFile(file);
    setPreview(objectUrl);
  }

  // =========================================================
  // UPLOAD IMAGE
  // =========================================================

  async function uploadImage() {
    if (!imageFile || !user?.id) {
      return oldImageUrl || null;
    }

    const extension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${crypto.randomUUID()}.${extension}`;

    const filePath = `${user.id}/${fileName}`;

    // -----------------------------------------------
    // UPLOAD
    // -----------------------------------------------

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

    // -----------------------------------------------
    // GET PUBLIC URL
    // -----------------------------------------------

    const {
      data: { publicUrl },
    } = supabase.storage.from("plant-images").getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error(t.uploadError);
    }

    return publicUrl;
  }

  // =========================================================
  // SUBMIT
  // =========================================================

  async function handleSubmit(e) {
    e.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    // -----------------------------------------------
    // REQUIRED
    // -----------------------------------------------

    if (!form.common_name.trim()) {
      setError(t.required);
      return;
    }

    if (!user?.id) {
      setError(t.loginRequired);
      return;
    }

    if (!plantId) {
      setError(t.notFound);
      return;
    }

    setSaving(true);

    try {
      // -----------------------------------------------
      // IMAGE
      // -----------------------------------------------

      let imageUrl = oldImageUrl || null;

      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // -----------------------------------------------
      // UPDATE DATA
      // -----------------------------------------------

      const updateData = {
        family: form.family.trim() || null,

        common_name: form.common_name.trim(),

        botanical_name: form.botanical_name.trim() || null,

        province: form.province.trim() || null,

        district: form.district.trim() || null,

        location: form.location.trim() || null,

        elevation: form.elevation ? Number(form.elevation) : null,

        collection_date: form.collection_date || null,

        habitat: form.habitat.trim() || null,

        notes: form.notes.trim() || null,

        collected_by: form.collected_by.trim() || null,

        specimen_number: form.specimen_number.trim() || null,

        duplicates: form.duplicates ? Number(form.duplicates) : null,

        image_url: imageUrl,
      };

      // -----------------------------------------------
      // UPDATE SUPABASE
      // -----------------------------------------------

      const { data, error: updateError } = await supabase
        .from("plants")
        .update(updateData)
        .eq("id", plantId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        console.error("Update plant error:", updateError);

        throw new Error(updateError.message || t.updateError);
      }

      if (!data) {
        throw new Error(t.updateError);
      }

      // -----------------------------------------------
      // SUCCESS
      // -----------------------------------------------

      setSuccess(t.success);

      setTimeout(() => {
        router.push("/account");
        router.refresh();
      }, 700);
    } catch (err) {
      console.error("Update plant failed:", err);

      setError(err?.message || t.updateError);
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // BACK
  // =========================================================

  function handleBack() {
    if (saving) return;

    router.back();
  }

  // =========================================================
  // CLEANUP PREVIEW
  // =========================================================

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="page">
        <Navbar />

        <section className="hero">
          <div className="container">
            <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />

                <p className="text-[var(--muted)]">{t.loading}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="page">
      <Navbar />

      <section className="hero">
        <div className="container py-12">
          <div className="mx-auto max-w-3xl">
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-8">
              <span className="badge badge-green">🌿 Virtual Herbarium</span>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {t.title}
              </h1>

              <p className="mt-3 text-[var(--muted)]">{t.subtitle}</p>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                ❌ {error}
              </div>
            )}

            {/* =================================================
                FORM
            ================================================= */}

            {!error && (
              <div className="card p-6 shadow-xl sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* =================================================
                      IMAGE
                  ================================================= */}

                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold">
                        {t.image}
                      </label>

                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {t.imageHint}
                      </p>
                    </div>

                    {/* PREVIEW */}

                    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
                      {preview ? (
                        <img
                          src={preview}
                          alt={form.common_name || "Plant preview"}
                          className="h-72 w-full object-cover sm:h-96"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-72 items-center justify-center sm:h-96">
                          <div className="text-center">
                            <div className="text-6xl">🌿</div>

                            <p className="mt-3 text-sm text-[var(--muted)]">
                              {t.noImage}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* IMAGE BUTTON */}

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <label
                        htmlFor="plant-image"
                        className={`btn btn-primary cursor-pointer justify-center ${
                          saving ? "pointer-events-none opacity-50" : ""
                        }`}
                      >
                        📷 {imageFile ? t.changeImage : t.chooseImage}
                      </label>

                      <input
                        id="plant-image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        disabled={saving}
                        className="hidden"
                      />

                      <p className="text-sm text-[var(--muted)]">
                        {imageFile?.name ||
                          (oldImageUrl
                            ? isEnglish
                              ? "Current image"
                              : "รูปภาพปัจจุบัน"
                            : t.noImage)}
                      </p>
                    </div>
                  </div>

                  {/* =================================================
                      COMMON NAME
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      {t.commonName}

                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      value={form.common_name}
                      onChange={(e) =>
                        updateField("common_name", e.target.value)
                      }
                      className="input"
                      disabled={saving}
                      required
                    />
                  </div>

                  {/* =================================================
                      BOTANICAL NAME
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      {t.botanicalName}
                    </label>

                    <input
                      type="text"
                      value={form.botanical_name}
                      onChange={(e) =>
                        updateField("botanical_name", e.target.value)
                      }
                      className="input"
                      disabled={saving}
                    />
                  </div>

                  {/* =================================================
                      FAMILY
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      {t.family}
                    </label>

                    <input
                      type="text"
                      value={form.family}
                      onChange={(e) => updateField("family", e.target.value)}
                      className="input"
                      disabled={saving}
                    />
                  </div>

                  {/* =================================================
                      PROVINCE / DISTRICT
                  ================================================= */}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        {t.province}
                      </label>

                      <input
                        type="text"
                        value={form.province}
                        onChange={(e) =>
                          updateField("province", e.target.value)
                        }
                        className="input"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        {t.district}
                      </label>

                      <input
                        type="text"
                        value={form.district}
                        onChange={(e) =>
                          updateField("district", e.target.value)
                        }
                        className="input"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  {/* =================================================
                      LOCATION
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      {t.location}
                    </label>

                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      className="input"
                      disabled={saving}
                    />
                  </div>

                  {/* =================================================
                      ELEVATION / DATE
                  ================================================= */}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        {t.elevation}
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={form.elevation}
                        onChange={(e) =>
                          updateField("elevation", e.target.value)
                        }
                        className="input"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        {t.collectionDate}
                      </label>

                      <input
                        type="date"
                        value={form.collection_date}
                        onChange={(e) =>
                          updateField("collection_date", e.target.value)
                        }
                        className="input"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  {/* =================================================
                      HABITAT
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      {t.habitat}
                    </label>

                    <textarea
                      rows={4}
                      value={form.habitat}
                      onChange={(e) => updateField("habitat", e.target.value)}
                      className="input resize-none"
                      disabled={saving}
                    />
                  </div>

                  {/* =================================================
                      COLLECTED BY
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      {t.collectedBy}
                    </label>

                    <input
                      type="text"
                      value={form.collected_by}
                      onChange={(e) =>
                        updateField("collected_by", e.target.value)
                      }
                      className="input"
                      disabled={saving}
                    />
                  </div>

                  {/* =================================================
                      SPECIMEN / DUPLICATES
                  ================================================= */}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        {t.specimenNumber}
                      </label>

                      <input
                        type="text"
                        value={form.specimen_number}
                        onChange={(e) =>
                          updateField("specimen_number", e.target.value)
                        }
                        className="input"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        {t.duplicates}
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={form.duplicates}
                        onChange={(e) =>
                          updateField("duplicates", e.target.value)
                        }
                        className="input"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  {/* =================================================
                      NOTES
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      {t.notes}
                    </label>

                    <textarea
                      rows={6}
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      className="input resize-none"
                      disabled={saving}
                    />
                  </div>

                  {/* =================================================
                      SUCCESS
                  ================================================= */}

                  {success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
                      ✅ {success}
                    </div>
                  )}

                  {/* =================================================
                      BUTTONS
                      มีแค่ปุ่มย้อนกลับ + บันทึก
                  ================================================= */}

                  <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-6 sm:flex-row">
                    {/* BACK */}

                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={saving}
                      className="btn btn-secondary flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ← {t.back}
                    </button>

                    {/* SAVE */}

                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? `⏳ ${t.saving}` : `💾 ${t.save}`}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
