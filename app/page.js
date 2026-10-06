"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Navbar from "@/components/Navbar";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import { supabase } from "@/lib/supabase";

/* =========================================================
   IMAGES
========================================================= */

const FOREST_HERO =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=95";

const FALLBACK_PLANT_IMAGE =
  "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=88";

/* =========================================================
   SETTINGS
========================================================= */

const FEATURE_INTERVAL = 5000;

/* =========================================================
   HOME
========================================================= */

export default function HomePage() {
  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  const [plants, setPlants] = useState([]);
  const [plantLoading, setPlantLoading] = useState(true);
  const [activePlantIndex, setActivePlantIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      welcome: "ยินดีต้อนรับสู่",

      titleLine1: "คลังพรรณไม้",
      titleLine2: "ดิจิทัล",

      intro: "สำรวจ เรียนรู้ และอนุรักษ์พรรณไม้ไทย",

      description:
        "เชื่อมโยงข้อมูลพรรณไม้ ภาพตัวอย่าง และเรื่องราวจากธรรมชาติไว้ในพื้นที่ดิจิทัลที่เข้าถึงได้ง่าย",

      explore: "สำรวจพรรณไม้",

      recommended: "พรรณไม้แนะนำ",
      noPlant: "ยังไม่มีพรรณไม้ในคลัง",

      specimen: "ตัวอย่างในคลัง",
      liveCollection: "LIVE COLLECTION",

      quote: "พรรณไม้... คือสมบัติของแผ่นดิน ที่เราต้องช่วยกันรักษา",

      card1: "ฐานข้อมูลพรรณไม้",
      card1Sub: "เก็บรวบรวมข้อมูลพรรณไม้ไทยอย่างเป็นระบบ",

      card2: "ภาพถ่ายจากธรรมชาติ",
      card2Sub: "บันทึกรูปลักษณ์ของพรรณไม้จากตัวอย่างจริง",

      card3: "ความรู้และการศึกษา",
      card3Sub: "เรียนรู้ลักษณะและข้อมูลทางพฤกษศาสตร์",

      card4: "ร่วมอนุรักษ์ธรรมชาติ",
      card4Sub: "ร่วมเก็บรักษาความหลากหลายของพรรณไม้",

      footer: "ธรรมชาติ...คือห้องเรียนที่ดีที่สุด",
    },

    EN: {
      welcome: "Welcome to",

      titleLine1: "Virtual",
      titleLine2: "Herbarium",

      intro: "Explore, learn and preserve Thai plants",

      description:
        "Connecting botanical records, specimen images and stories from nature in one accessible digital space.",

      explore: "Explore Plants",

      recommended: "Featured Plant",
      noPlant: "No plants in the collection yet",

      specimen: "Specimen in collection",
      liveCollection: "LIVE COLLECTION",

      quote:
        "Plants are treasures of the land that we all share a responsibility to preserve.",

      card1: "Plant Database",
      card1Sub: "Organized records of Thai plant specimens",

      card2: "Nature Photography",
      card2Sub: "Preserve plant appearances through real images",

      card3: "Knowledge & Education",
      card3Sub: "Learn botanical characteristics and plant information",

      card4: "Conserve Nature",
      card4Sub: "Take part in preserving botanical diversity",

      footer: "Nature is the greatest classroom.",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     LOAD PLANTS
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadPlants() {
      setPlantLoading(true);

      try {
        const { data, error } = await supabase
          .from("plants")
          .select(
            `
            id,
            common_name,
            image_url,
            created_at
          `,
          )
          .order("created_at", {
            ascending: false,
          });

        if (!mounted) return;

        if (error) {
          console.error("Load featured plants error:", error);

          setPlants([]);

          return;
        }

        const validPlants = (data || []).filter((plant) =>
          Boolean(plant?.id && plant?.common_name?.trim()),
        );

        setPlants(shufflePlants(validPlants));

        setActivePlantIndex(0);
      } catch (error) {
        console.error("Load featured plants failed:", error);

        if (mounted) {
          setPlants([]);
        }
      } finally {
        if (mounted) {
          setPlantLoading(false);
        }
      }
    }

    loadPlants();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     AUTO LOOP
  ===================================================== */

  useEffect(() => {
    if (plants.length <= 1) return;

    const interval = window.setInterval(() => {
      setImageLoaded(false);

      setActivePlantIndex((current) => (current + 1) % plants.length);
    }, FEATURE_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, [plants]);

  /* =====================================================
     ACTIVE PLANT
  ===================================================== */

  const activePlant = useMemo(() => {
    if (!plants.length) {
      return null;
    }

    return plants[activePlantIndex] || plants[0];
  }, [plants, activePlantIndex]);

  const featuredName = activePlant?.common_name?.trim() || t.noPlant;

  const featuredImage = activePlant?.image_url || FALLBACK_PLANT_IMAGE;

  const indicatorCount = Math.min(plants.length, 4);

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden bg-[#031008]">
      {/* =====================================================
          FOREST BACKGROUND
      ===================================================== */}

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 scale-[1.02] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("${FOREST_HERO}")`,
            backgroundPosition: "center top",
          }}
        />

        {/* MAIN OVERLAY */}

        <div
          className={`absolute inset-0 ${
            darkMode
              ? "bg-[linear-gradient(180deg,rgba(1,12,6,0.40)_0%,rgba(1,13,7,0.27)_30%,rgba(1,12,6,0.44)_64%,rgba(1,9,5,0.82)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(244,250,242,0.54)_0%,rgba(239,248,237,0.38)_42%,rgba(233,244,231,0.70)_100%)]"
          }`}
        />

        {/* DESKTOP LEFT SHADE */}

        <div
          className={`absolute inset-y-0 left-0 hidden w-[58%] md:block ${
            darkMode
              ? "bg-gradient-to-r from-[#011008]/72 via-[#011008]/24 to-transparent"
              : "bg-gradient-to-r from-white/50 via-white/12 to-transparent"
          }`}
        />

        {/* MOBILE DEPTH */}

        <div
          className={`absolute inset-0 md:hidden ${
            darkMode
              ? "bg-[linear-gradient(180deg,rgba(1,12,6,0.06)_0%,rgba(1,12,6,0.10)_30%,rgba(1,12,6,0.46)_72%,rgba(1,9,5,0.78)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_32%,rgba(231,242,229,0.42)_72%,rgba(226,238,224,0.72)_100%)]"
          }`}
        />

        {/* LIGHT RAYS */}

        <div
          className={`absolute -top-48 left-[58%] h-[720px] w-24 rotate-[16deg] blur-3xl ${
            darkMode
              ? "bg-gradient-to-b from-amber-50/15 via-white/6 to-transparent"
              : "bg-gradient-to-b from-white/80 via-white/28 to-transparent"
          }`}
        />

        <div
          className={`absolute -top-44 left-[68%] h-[580px] w-12 rotate-[19deg] blur-3xl ${
            darkMode
              ? "bg-gradient-to-b from-white/10 to-transparent"
              : "bg-gradient-to-b from-white/60 to-transparent"
          }`}
        />

        {/* LOWER DEPTH */}

        <div
          className={`absolute inset-x-0 bottom-0 h-[45%] ${
            darkMode
              ? "bg-gradient-to-t from-[#011008]/88 via-[#011008]/26 to-transparent"
              : "bg-gradient-to-t from-[#dceadb]/74 via-transparent to-transparent"
          }`}
        />
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <Navbar />

        {/* =====================================================
            MOBILE APP HOME
        ===================================================== */}

        <div className="md:hidden">
          <section className="container pb-5 pt-4">
            {/* ===============================================
                MOBILE HERO
            =============================================== */}

            <div>
              <p
                className={`text-[14px] font-black leading-6 tracking-[-0.01em] ${
                  darkMode ? "text-emerald-200" : "text-emerald-900"
                }`}
              >
                {t.welcome}
              </p>

              <h1
                className={`mt-2 font-black leading-[1.02] tracking-[-0.055em] [text-shadow:0_2px_18px_rgba(0,0,0,0.08)] ${
                  darkMode ? "text-white" : "text-[#0d2818]"
                }`}
              >
                <span className="block text-[2.5rem] min-[390px]:text-[2.8rem]">
                  {t.titleLine1}
                </span>

                <span
                  className={`mt-1 block text-[2.5rem] min-[390px]:text-[2.8rem] ${
                    darkMode ? "text-emerald-300" : "text-[#006e4e]"
                  }`}
                >
                  {t.titleLine2}
                </span>
              </h1>

              <p
                className={`mt-5 text-[16px] font-black leading-7 ${
                  darkMode ? "text-white" : "text-[#102d1b]"
                }`}
              >
                {t.intro}
              </p>

              <p
                className={`mt-2.5 max-w-[350px] text-[13px] font-medium leading-[1.8] ${
                  darkMode ? "text-white/78" : "text-[#334b3a]"
                }`}
              >
                {t.description}
              </p>

              <Link
                href="/plants"
                className="mt-5 inline-flex min-h-12 items-center justify-center gap-2.5 rounded-[16px] bg-emerald-700 px-5 text-[13px] font-black text-white shadow-[0_12px_30px_rgba(11,109,59,0.28)] transition active:scale-[0.98]"
              >
                <LeafIcon className="h-[18px] w-[18px]" />

                <span>{t.explore}</span>

                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            {/* ===============================================
                MOBILE FEATURED PLANT
            =============================================== */}

            <div
              className={`mt-7 overflow-hidden rounded-[22px] border shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl ${
                darkMode
                  ? "border-white/12 bg-[#04170d]/78"
                  : "border-white/75 bg-white/72"
              }`}
            >
              {/* HEADER */}

              <div className="flex min-h-11 items-center justify-between px-4">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      darkMode
                        ? "bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.85)]"
                        : "bg-emerald-700"
                    }`}
                  />

                  <span
                    className={`truncate text-[10px] font-black tracking-[0.15em] ${
                      darkMode ? "text-emerald-200" : "text-emerald-900"
                    }`}
                  >
                    {t.liveCollection}
                  </span>
                </div>

                {plants.length > 0 && (
                  <span
                    className={`shrink-0 text-[10px] font-bold ${
                      darkMode ? "text-white/55" : "text-emerald-950/60"
                    }`}
                  >
                    {String(activePlantIndex + 1).padStart(2, "0")}

                    {" / "}

                    {String(plants.length).padStart(2, "0")}
                  </span>
                )}
              </div>

              {/* IMAGE */}

              <div className="relative aspect-[16/10] overflow-hidden">
                {!imageLoaded && (
                  <div
                    className={`absolute inset-0 animate-pulse ${
                      darkMode ? "bg-emerald-950/80" : "bg-emerald-100"
                    }`}
                  />
                )}

                <Link
                  href="/plants"
                  aria-label={t.explore}
                  className="absolute inset-0 z-10 block"
                >
                  <img
                    key={activePlant?.id || "fallback"}
                    src={featuredImage}
                    alt={featuredName}
                    onLoad={() => setImageLoaded(true)}
                    className={`h-full w-full object-cover transition duration-[800ms] ${
                      imageLoaded
                        ? "scale-100 opacity-100"
                        : "scale-[1.025] opacity-0"
                    }`}
                  />
                </Link>

                <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-[#021008]/95 via-black/5 to-transparent" />

                {/* BADGE */}

                <div className="pointer-events-none absolute left-3 top-3 z-30">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0b4a2b]/82 px-2.5 py-1.5 text-[9px] font-black text-emerald-100 backdrop-blur-xl">
                    <LeafIcon className="h-3 w-3" />

                    {t.recommended}
                  </span>
                </div>

                {/* PLANT NAME */}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-4">
                  {plantLoading ? (
                    <div>
                      <div className="h-2.5 w-20 animate-pulse rounded-full bg-white/20" />

                      <div className="mt-2 h-6 w-32 animate-pulse rounded-lg bg-white/20" />
                    </div>
                  ) : (
                    <>
                      <p className="text-[9px] font-black tracking-[0.14em] text-emerald-300">
                        {t.specimen}
                      </p>

                      <h2 className="mt-1.5 line-clamp-2 text-[1.45rem] font-black leading-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]">
                        {featuredName}
                      </h2>
                    </>
                  )}
                </div>
              </div>

              {/* DOTS */}

              {!plantLoading && plants.length > 0 && (
                <div
                  className={`flex min-h-10 items-center justify-center px-4 ${
                    darkMode ? "bg-[#04180d]/96" : "bg-white/92"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {Array.from({
                      length: indicatorCount,
                    }).map((_, index) => {
                      const isActive =
                        activePlantIndex % Math.max(indicatorCount, 1) ===
                        index;

                      return (
                        <button
                          key={index}
                          type="button"
                          aria-label={`Plant ${index + 1}`}
                          onClick={() => {
                            if (plants[index]) {
                              setImageLoaded(false);

                              setActivePlantIndex(index);
                            }
                          }}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            isActive
                              ? darkMode
                                ? "w-6 bg-emerald-400"
                                : "w-6 bg-emerald-700"
                              : darkMode
                                ? "w-1.5 bg-white/20"
                                : "w-1.5 bg-emerald-950/15"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ===============================================
                MOBILE FEATURE GRID
                เหลือ 4 กล่อง
            =============================================== */}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <MobileFeatureCard
                darkMode={darkMode}
                icon={<LeafIcon className="h-5 w-5" />}
                title={t.card1}
                description={t.card1Sub}
              />

              <MobileFeatureCard
                darkMode={darkMode}
                icon={<ImageIcon className="h-5 w-5" />}
                title={t.card2}
                description={t.card2Sub}
              />

              <MobileFeatureCard
                darkMode={darkMode}
                icon={<BookIcon className="h-5 w-5" />}
                title={t.card3}
                description={t.card3Sub}
              />

              <MobileFeatureCard
                darkMode={darkMode}
                icon={<GlobeIcon className="h-5 w-5" />}
                title={t.card4}
                description={t.card4Sub}
              />
            </div>
          </section>
        </div>

        {/* =====================================================
            DESKTOP / TABLET HOME
        ===================================================== */}

        <div className="hidden flex-1 md:flex">
          <section className="container flex min-h-0 flex-1 flex-col">
            {/* ===============================================
                DESKTOP HERO
            =============================================== */}

            <div className="grid flex-1 content-center gap-10 py-7 md:gap-12 md:py-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-20 lg:py-10">
              {/* LEFT */}

              <div className="mx-auto w-full max-w-[680px] lg:mx-0">
                <p
                  className={`text-[1.65rem] font-bold leading-tight lg:text-[1.85rem] xl:text-[2rem] ${
                    darkMode ? "text-emerald-200" : "text-emerald-900"
                  }`}
                >
                  {t.welcome}
                </p>

                <h1
                  className={`mt-3 font-black tracking-[-0.05em] [text-shadow:0_2px_20px_rgba(0,0,0,0.08)] ${
                    darkMode ? "text-[#f7fcf7]" : "text-[#0d2617]"
                  }`}
                >
                  <span className="block text-[4rem] leading-[1.06] lg:text-[4.8rem] xl:text-[5.15rem]">
                    {t.titleLine1}
                  </span>

                  <span
                    className={`mt-1 block text-[4rem] leading-[1.06] lg:text-[4.8rem] xl:text-[5.15rem] ${
                      darkMode ? "text-emerald-300" : "text-[#006e4e]"
                    }`}
                  >
                    {t.titleLine2}
                  </span>
                </h1>

                <div className="mt-7 lg:mt-8">
                  <p
                    className={`text-[1.2rem] font-black leading-8 lg:text-[1.35rem] ${
                      darkMode ? "text-white" : "text-[#12301d]"
                    }`}
                  >
                    {t.intro}
                  </p>

                  <p
                    className={`mt-3 max-w-[640px] text-[16px] font-medium leading-8 lg:text-[17px] ${
                      darkMode ? "text-white/82" : "text-[#304a38]"
                    }`}
                  >
                    {t.description}
                  </p>
                </div>

                <div className="mt-8 lg:mt-9">
                  <Link
                    href="/plants"
                    className="group inline-flex min-h-[50px] items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-6 text-[14px] font-black text-white shadow-[0_14px_36px_rgba(16,185,129,0.30)] ring-1 ring-emerald-300/25 transition duration-300 hover:-translate-y-0.5 hover:from-emerald-400 hover:to-green-400 hover:shadow-[0_18px_44px_rgba(16,185,129,0.38)]"
                  >
                    <LeafIcon className="h-[18px] w-[18px]" />

                    <span className="whitespace-nowrap">{t.explore}</span>
                  </Link>
                </div>
              </div>

              {/* ===============================================
                  LIVE COLLECTION
              =============================================== */}

              <div className="relative mx-auto w-full max-w-[420px] lg:max-w-[470px] xl:max-w-[490px]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-10 rounded-full bg-emerald-300/[0.06] blur-3xl"
                />

                <div
                  className={`relative rounded-[1.7rem] border p-3 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl ${
                    darkMode
                      ? "border-white/15 bg-[#04170d]/76"
                      : "border-white/75 bg-white/72"
                  }`}
                >
                  {/* HEADER */}

                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          darkMode
                            ? "bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.95)]"
                            : "bg-emerald-700"
                        }`}
                      />

                      <span
                        className={`text-[10px] font-black tracking-[0.16em] ${
                          darkMode ? "text-emerald-200" : "text-emerald-900"
                        }`}
                      >
                        {t.liveCollection}
                      </span>
                    </div>

                    {plants.length > 0 && (
                      <span
                        className={`text-[10px] font-bold ${
                          darkMode ? "text-white/55" : "text-emerald-950/60"
                        }`}
                      >
                        {String(activePlantIndex + 1).padStart(2, "0")}

                        {" / "}

                        {String(plants.length).padStart(2, "0")}
                      </span>
                    )}
                  </div>

                  {/* IMAGE */}

                  <div className="overflow-hidden rounded-[1.15rem]">
                    <div className="relative aspect-[16/11] overflow-hidden">
                      {!imageLoaded && (
                        <div
                          className={`absolute inset-0 animate-pulse ${
                            darkMode ? "bg-emerald-950/80" : "bg-emerald-100"
                          }`}
                        />
                      )}

                      <Link
                        href="/plants"
                        aria-label={t.explore}
                        className="group absolute inset-0 z-10 block"
                      >
                        <img
                          key={activePlant?.id || "fallback"}
                          src={featuredImage}
                          alt={featuredName}
                          onLoad={() => setImageLoaded(true)}
                          className={`h-full w-full object-cover transition duration-[900ms] group-hover:scale-[1.035] ${
                            imageLoaded
                              ? "scale-100 opacity-100"
                              : "scale-[1.03] opacity-0"
                          }`}
                        />
                      </Link>

                      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-[#011007] via-transparent to-transparent" />

                      {/* BADGE */}

                      <div className="pointer-events-none absolute left-3 top-3 z-30">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0b4a2b]/82 px-3 py-1.5 text-[9px] font-black text-emerald-100 backdrop-blur-xl">
                          <LeafIcon className="h-3 w-3" />

                          {t.recommended}
                        </span>
                      </div>

                      {/* NAME */}

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-4">
                        {plantLoading ? (
                          <div>
                            <div className="h-2.5 w-20 animate-pulse rounded-full bg-white/20" />

                            <div className="mt-2 h-6 w-32 animate-pulse rounded-lg bg-white/20" />
                          </div>
                        ) : (
                          <>
                            <p className="text-[9px] font-black tracking-[0.14em] text-emerald-300">
                              {t.specimen}
                            </p>

                            <h2 className="mt-1.5 line-clamp-2 text-[1.4rem] font-black leading-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.5)] lg:text-[1.6rem]">
                              {featuredName}
                            </h2>
                          </>
                        )}
                      </div>
                    </div>

                    {/* DOTS */}

                    {!plantLoading && plants.length > 0 && (
                      <div
                        className={`flex min-h-[40px] items-center justify-start px-4 ${
                          darkMode ? "bg-[#04180d]/96" : "bg-white/92"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {Array.from({
                            length: indicatorCount,
                          }).map((_, index) => {
                            const isActive =
                              activePlantIndex % Math.max(indicatorCount, 1) ===
                              index;

                            return (
                              <button
                                key={index}
                                type="button"
                                aria-label={`Plant ${index + 1}`}
                                onClick={() => {
                                  if (plants[index]) {
                                    setImageLoaded(false);

                                    setActivePlantIndex(index);
                                  }
                                }}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  isActive
                                    ? darkMode
                                      ? "w-6 bg-emerald-400"
                                      : "w-6 bg-emerald-700"
                                    : darkMode
                                      ? "w-1.5 bg-white/25"
                                      : "w-1.5 bg-emerald-950/18"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ===============================================
                DESKTOP LOWER BLOCKS
                เหลือ 4 กล่อง
            =============================================== */}

            <div className="pb-5 pt-3 md:pb-6 md:pt-4 lg:pb-8 lg:pt-5">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-4 xl:gap-5">
                <InfoBlock
                  darkMode={darkMode}
                  icon={<LeafIcon className="h-6 w-6" />}
                  title={t.card1}
                  description={t.card1Sub}
                />

                <InfoBlock
                  darkMode={darkMode}
                  icon={<ImageIcon className="h-6 w-6" />}
                  title={t.card2}
                  description={t.card2Sub}
                />

                <InfoBlock
                  darkMode={darkMode}
                  icon={<BookIcon className="h-6 w-6" />}
                  title={t.card3}
                  description={t.card3Sub}
                />

                <InfoBlock
                  darkMode={darkMode}
                  icon={<GlobeIcon className="h-6 w-6" />}
                  title={t.card4}
                  description={t.card4Sub}
                />
              </div>
            </div>
          </section>
        </div>

        {/* =====================================================
            DESKTOP FOOTER
            ไม่แก้ส่วนนี้
        ===================================================== */}

        <footer
          className={`mt-auto hidden w-full border-t md:block ${
            darkMode ? "border-white/15" : "border-emerald-950/15"
          }`}
        >
          <div
            className={`container flex items-center justify-between gap-4 py-5 text-xs ${
              darkMode ? "text-white/60" : "text-emerald-950/70"
            }`}
          >
            <p>© 2026 Virtual Herbarium. All rights reserved.</p>

            <div className="flex items-center gap-2">
              <LeafIcon className="h-3.5 w-3.5 text-emerald-400" />

              <span>{t.footer}</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

/* =========================================================
   SHUFFLE
========================================================= */

function shufflePlants(plants) {
  const result = [...plants];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

/* =========================================================
   MOBILE FEATURE CARD
========================================================= */

function MobileFeatureCard({ darkMode, icon, title, description }) {
  return (
    <article
      className={`min-w-0 rounded-[18px] border p-3.5 backdrop-blur-xl ${
        darkMode
          ? "border-white/10 bg-[#04170c]/68"
          : "border-white/70 bg-white/68"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-[12px] ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/10 text-emerald-700"
        }`}
      >
        {icon}
      </div>

      <h3
        className={`mt-3 text-[12px] font-black leading-5 ${
          darkMode ? "text-white" : "text-[#122d1c]"
        }`}
      >
        {title}
      </h3>

      <p
        className={`mt-1.5 text-[10px] font-medium leading-[1.7] min-[390px]:text-[10.5px] ${
          darkMode ? "text-white/72" : "text-[#52665a]"
        }`}
      >
        {description}
      </p>
    </article>
  );
}

/* =========================================================
   DESKTOP INFO BLOCK
========================================================= */

function InfoBlock({ darkMode, icon, title, description, quote = false }) {
  return (
    <div
      className={`group relative flex min-h-[168px] min-w-0 flex-col items-center justify-center overflow-hidden rounded-[22px] border px-5 py-5 text-center backdrop-blur-xl transition duration-300 md:min-h-[172px] lg:min-h-[180px] lg:px-5 lg:py-6 xl:min-h-[188px] xl:px-6 xl:py-6 lg:hover:-translate-y-1 ${
        darkMode
          ? "border-white/12 bg-[#04170c]/72 shadow-[0_14px_38px_rgba(0,0,0,0.16)] hover:border-emerald-300/25 hover:bg-[#082114]/82"
          : "border-white/80 bg-white/78 shadow-[0_14px_34px_rgba(25,55,34,0.07)] hover:border-emerald-800/20 hover:bg-white/92"
      }`}
    >
      {/* SOFT GLOW */}

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-12 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full blur-3xl ${
          darkMode ? "bg-emerald-400/[0.08]" : "bg-emerald-600/[0.08]"
        }`}
      />

      {/* ICON */}

      <div
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-200"
            : "bg-emerald-800/[0.08] text-emerald-800"
        }`}
      >
        {icon}
      </div>

      {/* TITLE */}

      {title && (
        <h3
          className={`relative mt-3 text-[13px] font-black leading-5 lg:text-[14px] xl:text-[15px] ${
            darkMode ? "text-white" : "text-[#15301e]"
          }`}
        >
          {title}
        </h3>
      )}

      {/* DESCRIPTION */}

      <p
        className={`relative mx-auto ${
          title ? "mt-2" : "mt-3"
        } max-w-[200px] font-medium ${
          quote
            ? "text-[11.5px] leading-[1.75] lg:text-[12px] xl:text-[12.5px]"
            : "text-[11px] leading-[1.7] lg:text-[12px] xl:text-[12.5px]"
        } ${
          quote
            ? darkMode
              ? "text-white/88"
              : "text-[#284633]"
            : darkMode
              ? "text-white/74"
              : "text-[#53685a]"
        }`}
      >
        {description}
      </p>

      {/* BOTTOM ACCENT */}

      <div
        className={`absolute inset-x-10 bottom-0 h-px scale-x-0 transition duration-500 group-hover:scale-x-100 ${
          darkMode
            ? "bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent"
            : "bg-gradient-to-r from-transparent via-emerald-700/35 to-transparent"
        }`}
      />
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function LeafIcon({ className = "" }) {
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
      <path d="M20.5 3.5C14 3.8 8.2 6 5.2 10.1c-2.2 3-1.9 6.4.1 8.6 2.2 2.4 6.1 2.4 9-.1 3.8-3.3 5.6-8.9 6.2-15.1Z" />

      <path d="M4 20c3.2-4.9 7.1-8.4 12.7-11.2" />
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

      <circle cx="9" cy="9" r="2" />

      <path d="m21 15-5-5L5 20" />
    </svg>
  );
}

function BookIcon({ className = "" }) {
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
      <path d="M4 5a4 4 0 0 1 4-2h4v17H8a4 4 0 0 0-4 2Z" />

      <path d="M20 5a4 4 0 0 0-4-2h-4v17h4a4 4 0 0 1 4 2Z" />
    </svg>
  );
}

function GlobeIcon({ className = "" }) {
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

      <path d="M3 12h18" />

      <path d="M12 3a15 15 0 0 1 0 18" />

      <path d="M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

function ArrowRightIcon({ className = "" }) {
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
      <path d="M5 12h14" />

      <path d="m15 8 4 4-4 4" />
    </svg>
  );
}
