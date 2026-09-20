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

      quoteTitle: "บันทึกจากธรรมชาติ",
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

      quoteTitle: "Nature Note",
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
    if (!plants.length) return null;

    return plants[activePlantIndex] || plants[0];
  }, [plants, activePlantIndex]);

  const featuredName = activePlant?.common_name?.trim() || t.noPlant;

  const featuredImage = activePlant?.image_url || FALLBACK_PLANT_IMAGE;

  /* =====================================================
     INDICATORS

     แสดงสูงสุด 4 จุด แต่เลื่อนตาม plant จริง
  ===================================================== */

  const indicatorIndexes = useMemo(() => {
    const total = plants.length;

    if (!total) return [];

    if (total <= 4) {
      return Array.from({ length: total }, (_, index) => index);
    }

    const maxStart = total - 4;

    const start = Math.min(Math.max(activePlantIndex - 1, 0), maxStart);

    return Array.from({ length: 4 }, (_, index) => start + index);
  }, [plants.length, activePlantIndex]);

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-[#031008]">
      {/* =====================================================
          FOREST BACKGROUND
      ===================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("${FOREST_HERO}")`,
            backgroundPosition: "center top",
          }}
        />

        {/* MAIN SHADE */}

        <div
          className={`absolute inset-0 ${
            darkMode
              ? "bg-[linear-gradient(180deg,rgba(1,12,6,0.28)_0%,rgba(1,13,7,0.18)_27%,rgba(1,12,6,0.38)_66%,rgba(1,9,5,0.76)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(244,250,242,0.44)_0%,rgba(239,248,237,0.28)_42%,rgba(233,244,231,0.62)_100%)]"
          }`}
        />

        {/* DESKTOP LEFT SHADE */}

        <div
          className={`absolute inset-y-0 left-0 hidden w-[60%] lg:block ${
            darkMode
              ? "bg-gradient-to-r from-[#011008]/70 via-[#011008]/24 to-transparent"
              : "bg-gradient-to-r from-white/50 via-white/12 to-transparent"
          }`}
        />

        {/* MOBILE TOP SHADE */}

        <div
          className={`absolute inset-x-0 top-0 h-[660px] lg:hidden ${
            darkMode
              ? "bg-gradient-to-b from-[#011008]/16 via-[#011008]/20 to-transparent"
              : "bg-gradient-to-b from-white/30 to-transparent"
          }`}
        />

        {/* LIGHT RAY */}

        <div
          className={`absolute -top-48 left-[58%] h-[720px] w-24 rotate-[16deg] blur-3xl ${
            darkMode
              ? "bg-gradient-to-b from-amber-50/14 via-white/5 to-transparent"
              : "bg-gradient-to-b from-white/80 via-white/28 to-transparent"
          }`}
        />

        <div
          className={`absolute -top-44 left-[70%] h-[560px] w-12 rotate-[20deg] blur-3xl ${
            darkMode
              ? "bg-gradient-to-b from-white/9 to-transparent"
              : "bg-gradient-to-b from-white/60 to-transparent"
          }`}
        />

        {/* BOTTOM DEPTH */}

        <div
          className={`absolute inset-x-0 bottom-0 h-[40%] ${
            darkMode
              ? "bg-gradient-to-t from-[#011008]/84 via-[#011008]/20 to-transparent"
              : "bg-gradient-to-t from-[#dceadb]/68 via-transparent to-transparent"
          }`}
        />
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="relative z-10">
        <Navbar />

        <section className="container">
          {/* =================================================
              HERO
          ================================================= */}

          <div className="pb-9 pt-8 sm:pb-12 sm:pt-12 lg:pb-16 lg:pt-14">
            {/* =================================================
                WELCOME
            ================================================= */}

            <p
              className={`mb-3 text-base font-semibold sm:mb-4 sm:text-xl lg:text-2xl ${
                darkMode ? "text-emerald-200" : "text-emerald-900"
              }`}
            >
              {t.welcome}
            </p>

            {/* =================================================
                TITLE + LIVE COLLECTION
            ================================================= */}

            <div className="grid grid-cols-[minmax(0,1fr)_138px] items-center gap-4 min-[390px]:grid-cols-[minmax(0,1fr)_152px] sm:grid-cols-[minmax(0,1fr)_230px] sm:gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-16">
              {/* TITLE */}

              <div className="min-w-0 self-center">
                <h1
                  className={`font-black tracking-[-0.052em] ${
                    darkMode ? "text-[#f2f9f2]" : "text-[#102819]"
                  }`}
                >
                  <span className="block whitespace-nowrap text-[clamp(2.15rem,9.1vw,4.9rem)] leading-[1.03]">
                    {t.titleLine1}
                  </span>

                  <span className="mt-1 block whitespace-nowrap text-[clamp(2.15rem,9.1vw,4.9rem)] leading-[1.03]">
                    {t.titleLine2}
                  </span>
                </h1>
              </div>

              {/* =================================================
                  LIVE COLLECTION
              ================================================= */}

              <div className="relative w-full">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-4 rounded-full bg-emerald-300/[0.06] blur-2xl sm:-inset-8 sm:blur-3xl"
                />

                <div
                  className={`relative overflow-hidden rounded-[1rem] border p-2 shadow-[0_18px_45px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:rounded-[1.35rem] sm:p-3 lg:rounded-[1.55rem] ${
                    darkMode
                      ? "border-white/15 bg-[#03160b]/78"
                      : "border-white/75 bg-white/74"
                  }`}
                >
                  {/* LIVE HEADER */}

                  <div className="mb-1.5 flex items-center justify-between gap-1 px-0.5 sm:mb-2.5 sm:px-1">
                    <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          darkMode
                            ? "bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.95)]"
                            : "bg-emerald-700"
                        }`}
                      />

                      <span
                        className={`truncate text-[6px] font-black tracking-[0.1em] min-[390px]:text-[7px] sm:text-[8px] sm:tracking-[0.16em] lg:text-[9px] ${
                          darkMode ? "text-emerald-200" : "text-emerald-800"
                        }`}
                      >
                        {t.liveCollection}
                      </span>
                    </div>

                    {plants.length > 0 && (
                      <span
                        className={`shrink-0 text-[6px] font-semibold min-[390px]:text-[7px] sm:text-[8px] lg:text-[9px] ${
                          darkMode ? "text-white/40" : "text-emerald-950/45"
                        }`}
                      >
                        {String(activePlantIndex + 1).padStart(2, "0")}

                        <span className="hidden min-[390px]:inline">
                          {" / "}
                          {String(plants.length).padStart(2, "0")}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* IMAGE */}

                  <div className="overflow-hidden rounded-[0.72rem] sm:rounded-[1rem]">
                    <div className="relative aspect-[4/3] overflow-hidden">
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
                          className={`h-full w-full object-cover transition duration-[900ms] group-hover:scale-[1.04] ${
                            imageLoaded
                              ? "scale-100 opacity-100"
                              : "scale-[1.025] opacity-0"
                          }`}
                        />
                      </Link>

                      <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(180deg,transparent_24%,rgba(1,15,7,0.06)_52%,rgba(1,13,6,0.95)_100%)]" />

                      {/* BADGE */}

                      <div className="pointer-events-none absolute left-1.5 top-1.5 z-30 min-[390px]:left-2 min-[390px]:top-2 sm:left-3 sm:top-3">
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#0b4a2b]/84 px-1.5 py-1 text-[5px] font-extrabold text-emerald-100 backdrop-blur-xl min-[390px]:px-2 min-[390px]:text-[6px] sm:px-2.5 sm:text-[8px]">
                          <LeafIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />

                          <span className="hidden min-[390px]:inline">
                            {t.recommended}
                          </span>
                        </span>
                      </div>

                      {/* NAME */}

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-2 min-[390px]:p-2.5 sm:p-3.5 lg:p-4">
                        {plantLoading ? (
                          <>
                            <div className="h-2 w-12 animate-pulse rounded-full bg-white/20 sm:w-20" />
                            <div className="mt-1.5 h-4 w-20 animate-pulse rounded-md bg-white/20 sm:h-6 sm:w-32" />
                          </>
                        ) : (
                          <>
                            <p className="hidden text-[6px] font-black tracking-[0.13em] text-emerald-300 min-[390px]:block sm:text-[7px] lg:text-[8px]">
                              {t.specimen}
                            </p>

                            <h2 className="line-clamp-2 text-[11px] font-black leading-tight text-white min-[390px]:mt-0.5 min-[390px]:text-[13px] sm:mt-1 sm:text-lg lg:text-xl">
                              {featuredName}
                            </h2>
                          </>
                        )}
                      </div>
                    </div>

                    {/* DOTS */}

                    {!plantLoading && plants.length > 0 && (
                      <div
                        className={`flex min-h-[24px] items-center justify-center px-2 min-[390px]:min-h-[28px] sm:min-h-[36px] sm:px-3 ${
                          darkMode ? "bg-[#04180d]/96" : "bg-white/92"
                        }`}
                      >
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          {indicatorIndexes.map((plantIndex) => {
                            const isActive = plantIndex === activePlantIndex;

                            return (
                              <button
                                key={plants[plantIndex]?.id || plantIndex}
                                type="button"
                                aria-label={`Plant ${plantIndex + 1}`}
                                onClick={() => {
                                  setImageLoaded(false);
                                  setActivePlantIndex(plantIndex);
                                }}
                                className={`h-1 rounded-full transition-all duration-300 ${
                                  isActive
                                    ? darkMode
                                      ? "w-4 bg-emerald-400 sm:w-5"
                                      : "w-4 bg-emerald-700 sm:w-5"
                                    : darkMode
                                      ? "w-1 bg-white/25 hover:bg-white/40"
                                      : "w-1 bg-emerald-950/18 hover:bg-emerald-950/30"
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

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div className="mt-9 max-w-[650px] sm:mt-11 lg:mt-12">
              <p
                className={`text-lg font-extrabold leading-8 sm:text-xl lg:text-[1.4rem] ${
                  darkMode ? "text-white" : "text-[#163421]"
                }`}
              >
                {t.intro}
              </p>

              <p
                className={`mt-2.5 max-w-[620px] text-sm leading-7 sm:text-base sm:leading-8 lg:text-lg ${
                  darkMode ? "text-white/76" : "text-[#354f3d]"
                }`}
              >
                {t.description}
              </p>

              {/* EXPLORE */}

              <div className="mt-6 sm:mt-7">
                <Link
                  href="/plants"
                  className="group inline-flex min-h-[46px] items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(16,185,129,0.28)] ring-1 ring-emerald-300/25 transition duration-300 hover:-translate-y-0.5 hover:from-emerald-400 hover:to-green-400 hover:shadow-[0_18px_42px_rgba(16,185,129,0.38)] sm:min-h-[48px] sm:px-6"
                >
                  <LeafIcon className="h-4 w-4" />

                  <span className="whitespace-nowrap">{t.explore}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* =================================================
              LOWER BLOCKS
          ================================================= */}

          <div className="pb-8 pt-4 sm:pb-10 sm:pt-6 lg:pb-12 lg:pt-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              <InfoBlock
                darkMode={darkMode}
                icon={<LeafIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                title={t.quoteTitle}
                description={`“${t.quote}”`}
                quote
              />

              <InfoBlock
                darkMode={darkMode}
                icon={<LeafIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                title={t.card1}
                description={t.card1Sub}
              />

              <InfoBlock
                darkMode={darkMode}
                icon={<ImageIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                title={t.card2}
                description={t.card2Sub}
              />

              <InfoBlock
                darkMode={darkMode}
                icon={<BookIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                title={t.card3}
                description={t.card3Sub}
              />

              <InfoBlock
                darkMode={darkMode}
                icon={<GlobeIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                title={t.card4}
                description={t.card4Sub}
                className="col-span-2 w-[calc(50%-6px)] justify-self-center sm:col-span-1 sm:w-full"
              />
            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <footer
              className={`mt-8 border-t sm:mt-9 ${
                darkMode ? "border-white/15" : "border-emerald-950/15"
              }`}
            >
              <div
                className={`flex flex-col items-center gap-2 py-5 text-center text-[10px] sm:flex-row sm:justify-between sm:text-left sm:text-xs ${
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
        </section>
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
   INFO BLOCK
========================================================= */

function InfoBlock({
  darkMode,
  icon,
  title,
  description,
  quote = false,
  className = "",
}) {
  return (
    <div
      className={`group relative flex min-h-[148px] w-full flex-col items-center justify-center overflow-hidden rounded-[1.35rem] border px-3 py-4 text-center shadow-[0_14px_35px_rgba(0,0,0,0.15)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 sm:min-h-[160px] sm:rounded-[1.5rem] sm:px-4 sm:py-5 lg:min-h-[170px] ${className} ${
        darkMode
          ? "border-white/15 bg-[#04170c]/74 hover:border-emerald-300/30 hover:bg-[#082114]/84"
          : "border-white/70 bg-white/70 hover:border-emerald-800/20 hover:bg-white/84"
      }`}
    >
      {/* GLOW */}

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-14 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full blur-3xl ${
          darkMode ? "bg-emerald-400/[0.08]" : "bg-emerald-600/[0.09]"
        }`}
      />

      {/* ICON */}

      <div
        className={`relative flex h-8 w-8 items-center justify-center sm:h-9 sm:w-9 ${
          darkMode ? "text-emerald-200" : "text-emerald-800"
        }`}
      >
        {icon}
      </div>

      {/* TITLE */}

      <h3
        className={`relative mt-2 text-[10px] font-black leading-5 sm:mt-2.5 sm:text-xs lg:text-sm ${
          darkMode ? "text-white" : "text-emerald-950"
        }`}
      >
        {title}
      </h3>

      {/* DESCRIPTION */}

      <p
        className={`relative mx-auto mt-1 max-w-[155px] text-[8.5px] leading-[1.65] sm:mt-1.5 sm:max-w-[175px] sm:text-[10px] lg:text-[11px] ${
          quote
            ? darkMode
              ? "text-white/80"
              : "text-emerald-950/85"
            : darkMode
              ? "text-white/65"
              : "text-slate-600"
        }`}
      >
        {description}
      </p>

      {/* HOVER LINE */}

      <div
        className={`absolute inset-x-8 bottom-0 h-px scale-x-0 transition duration-500 group-hover:scale-x-100 ${
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
