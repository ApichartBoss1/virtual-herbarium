"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/components/SiteSettingsContext";

export default function PlantDetailPage() {
  const params = useParams();
  const plantId = params?.id;

  const { language, darkMode } = useSiteSettings();
  const isEnglish = language === "EN";

  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const text = {
    TH: {
      back: "กลับไปยังพรรณไม้",
      loading: "กำลังโหลดข้อมูล...",
      errorTitle: "ไม่สามารถโหลดข้อมูลพืชได้",
      retry: "ลองอีกครั้ง",
      specimen: "ข้อมูลตัวอย่างพรรณไม้",
      scientific: "ชื่อวิทยาศาสตร์",
      common: "ชื่อพรรณไม้",
      family: "วงศ์",
      province: "จังหวัด",
      district: "อำเภอ",
      location: "สถานที่พบ",
      elevation: "ระดับความสูง",
      collectionDate: "วันที่เก็บตัวอย่าง",
      habitat: "ถิ่นที่อยู่",
      collectedBy: "ผู้เก็บตัวอย่าง",
      specimenNumber: "หมายเลขตัวอย่าง",
      notes: "หมายเหตุ",
      description: "รายละเอียด",
      noData: "ไม่มีข้อมูล",
      image: "ภาพตัวอย่าง",
    },

    EN: {
      back: "Back to Plants",
      loading: "Loading plant information...",
      errorTitle: "Unable to load plant information",
      retry: "Try Again",
      specimen: "Specimen Information",
      scientific: "Scientific name",
      common: "Common name",
      family: "Family",
      province: "Province",
      district: "District",
      location: "Location",
      elevation: "Elevation",
      collectionDate: "Collection date",
      habitat: "Habitat",
      collectedBy: "Collected by",
      specimenNumber: "Specimen number",
      notes: "Notes",
      description: "Description",
      noData: "No information",
      image: "Specimen image",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  async function fetchPlant() {
    if (!plantId) return;

    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("plants")
        .select(`
          id,
          plant_id,
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
          created_at,
          image_url
        `)
        .eq("id", plantId)
        .single();

      if (error) {
        console.error("Fetch plant error:", error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("Plant not found");
      }

      setPlant(data);
    } catch (err) {
      console.error("Load plant failed:", err);
      setError(err?.message || t.errorTitle);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlant();
  }, [plantId]);

  function value(value) {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      return t.noData;
    }

    return value;
  }

  const pageClass = darkMode
    ? "min-h-screen bg-[#07110d] text-white"
    : "min-h-screen bg-[#f6faf8] text-slate-900";

  const cardClass = darkMode
    ? "border border-white/10 bg-[#0d1914]"
    : "border border-emerald-100 bg-white";

  const mutedClass = darkMode ? "text-gray-400" : "text-slate-500";

  if (loading) {
    return (
      <main className={pageClass}>
        <Navbar />

        <section className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-5 py-16">
          <div className="text-center">
            <div
              className={`mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent ${
                darkMode
                  ? "border-emerald-400"
                  : "border-emerald-600"
              }`}
            />

            <p className={mutedClass}>{t.loading}</p>
          </div>
        </section>
      </main>
    );
  }

  if (error || !plant) {
    return (
      <main className={pageClass}>
        <Navbar />

        <section className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-5 py-16">
          <div
            className={`w-full max-w-lg rounded-3xl p-8 text-center shadow-sm ${cardClass}`}
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
              <span className="text-2xl">!</span>
            </div>

            <h1 className="text-2xl font-bold">
              {t.errorTitle}
            </h1>

            <p className={`mt-3 text-sm ${mutedClass}`}>
              {error}
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={fetchPlant}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {t.retry}
              </button>

              <Link
                href="/plants"
                className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                  darkMode
                    ? "border-white/10 hover:bg-white/5"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {t.back}
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={pageClass}>
      <Navbar />

      {/* Header */}
      <section
        className={`border-b ${
          darkMode
            ? "border-white/10 bg-[#09150f]"
            : "border-emerald-100 bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
          <Link
            href="/plants"
            className={`mb-8 inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
              darkMode
                ? "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {t.back}
          </Link>

          <div className="max-w-4xl">
            <div className="mb-4 inline-flex rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500">
              {t.specimen}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              {value(plant.common_name)}
            </h1>

            <p className="mt-3 text-lg italic text-emerald-500">
              {value(plant.botanical_name)}
            </p>
          </div>
        </div>
      </section>

      {/* Main */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Image */}
          <div
            className={`overflow-hidden rounded-3xl shadow-sm ${cardClass}`}
          >
            <div className="relative aspect-[4/3] w-full">
              {plant.image_url ? (
                <Image
                  src={plant.image_url}
                  alt={plant.common_name || "Plant specimen"}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              ) : (
                <div
                  className={`flex h-full items-center justify-center ${
                    darkMode ? "bg-white/5" : "bg-slate-100"
                  }`}
                >
                  <div className="text-center">
                    <div className="mb-3 text-5xl opacity-30">
                      Plant
                    </div>

                    <p className={`text-sm ${mutedClass}`}>
                      {t.noData}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6">
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${mutedClass}`}
              >
                {t.image}
              </p>

              <p className="mt-2 font-semibold">
                {value(plant.common_name)}
              </p>
            </div>
          </div>

          {/* Basic information */}
          <div
            className={`rounded-3xl p-6 shadow-sm sm:p-8 ${cardClass}`}
          >
            <div className="mb-7">
              <p className="text-sm font-semibold text-emerald-500">
                {t.specimen}
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {value(plant.common_name)}
              </h2>

              <p className={`mt-1 italic ${mutedClass}`}>
                {value(plant.botanical_name)}
              </p>
            </div>

            <div className="divide-y divide-[var(--border)]">
              <InfoRow
                label={t.family}
                value={plant.family}
                darkMode={darkMode}
                fallback={t.noData}
              />

              <InfoRow
                label={t.province}
                value={plant.province}
                darkMode={darkMode}
                fallback={t.noData}
              />

              <InfoRow
                label={t.district}
                value={plant.district}
                darkMode={darkMode}
                fallback={t.noData}
              />

              <InfoRow
                label={t.location}
                value={plant.location}
                darkMode={darkMode}
                fallback={t.noData}
              />

              <InfoRow
                label={t.elevation}
                value={plant.elevation}
                darkMode={darkMode}
                fallback={t.noData}
              />

              <InfoRow
                label={t.collectionDate}
                value={plant.collection_date}
                darkMode={darkMode}
                fallback={t.noData}
              />

              <InfoRow
                label={t.habitat}
                value={plant.habitat}
                darkMode={darkMode}
                fallback={t.noData}
              />

              <InfoRow
                label={t.collectedBy}
                value={plant.collected_by}
                darkMode={darkMode}
                fallback={t.noData}
              />

              <InfoRow
                label={t.specimenNumber}
                value={plant.specimen_number}
                darkMode={darkMode}
                fallback={t.noData}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <InformationCard
            title={t.description}
            content={plant.notes}
            darkMode={darkMode}
            fallback={t.noData}
          />

          <InformationCard
            title={t.notes}
            content={plant.duplicates}
            darkMode={darkMode}
            fallback={t.noData}
          />
        </div>
      </section>
    </main>
  );
}

function InfoRow({ label, value, darkMode, fallback }) {
  const empty =
    value === null ||
    value === undefined ||
    String(value).trim() === "";

  return (
    <div className="grid grid-cols-[150px_1fr] gap-4 py-4 sm:grid-cols-[190px_1fr]">
      <dt
        className={`text-sm font-medium ${
          darkMode ? "text-gray-400" : "text-slate-500"
        }`}
      >
        {label}
      </dt>

      <dd
        className={`text-sm font-semibold break-words ${
          empty
            ? darkMode
              ? "text-gray-600"
              : "text-slate-300"
            : ""
        }`}
      >
        {empty ? fallback : value}
      </dd>
    </div>
  );
}

function InformationCard({
  title,
  content,
  darkMode,
  fallback,
}) {
  const empty =
    content === null ||
    content === undefined ||
    String(content).trim() === "";

  return (
    <section
      className={`rounded-3xl p-6 shadow-sm sm:p-8 ${
        darkMode
          ? "border border-white/10 bg-[#0d1914]"
          : "border border-emerald-100 bg-white"
      }`}
    >
      <h2 className="text-xl font-bold">{title}</h2>

      <div
        className={`mt-5 min-h-[100px] rounded-2xl p-5 text-sm leading-7 ${
          darkMode
            ? "bg-white/5 text-gray-300"
            : "bg-slate-50 text-slate-600"
        }`}
      >
        {empty ? (
          <span
            className={
              darkMode ? "text-gray-600" : "text-slate-400"
            }
          >
            {fallback}
          </span>
        ) : (
          content
        )}
      </div>
    </section>
  );
}