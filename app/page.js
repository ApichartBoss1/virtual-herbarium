"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import { supabase } from "@/lib/supabase";

/* =========================================================
   IMAGES
========================================================= */

const FALLBACK_PLANT_IMAGE =
  "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=88";

/* =========================================================
   SETTINGS
========================================================= */

const FEATURE_INTERVAL = 6000;

const RECENT_COUNT = 4;

const FAMILY_COUNT = 12;

/* =========================================================
   HOME
========================================================= */

export default function HomePage() {
  const { language } = useSiteSettings();

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
      eyebrow: "คลังตัวอย่างพรรณไม้ดิจิทัล",

      titleLine1: "คลังพรรณไม้",
      titleLine2: "ดิจิทัล",

      intro: "สำรวจ เรียนรู้ และอนุรักษ์พรรณไม้ไทย",

      description:
        "เชื่อมโยงข้อมูลพรรณไม้ ภาพตัวอย่าง และเรื่องราวจากธรรมชาติไว้ในพื้นที่ดิจิทัลที่เข้าถึงได้ง่าย",

      explore: "สำรวจพรรณไม้",
      about: "เกี่ยวกับโครงการ",

      statSpecimens: "ตัวอย่าง",
      statFamilies: "วงศ์",
      statCollectors: "ผู้เก็บตัวอย่าง",

      featured: "ตัวอย่างแนะนำ",
      noPlant: "ยังไม่มีพรรณไม้ในคลัง",
      viewSpecimen: "ดูระเบียนตัวอย่าง",

      labelNo: "เลขทะเบียน",
      labelFamily: "วงศ์",
      labelLocality: "สถานที่เก็บ",
      labelCollector: "ผู้เก็บ",

      recentEyebrow: "ทะเบียนล่าสุด",
      recentTitle: "ตัวอย่างที่เพิ่งเข้าคลัง",
      viewAll: "ดูทั้งหมด",

      familiesEyebrow: "ดัชนีอนุกรมวิธาน",
      familiesTitle: "เรียกดูตามวงศ์",

      pillarsEyebrow: "พันธกิจ",
      pillarsTitle: "บันทึกธรรมชาติอย่างเป็นระบบ",

      card1: "ฐานข้อมูลพรรณไม้",
      card1Sub: "เก็บรวบรวมข้อมูลพรรณไม้ไทยอย่างเป็นระบบ",

      card2: "ภาพถ่ายจากธรรมชาติ",
      card2Sub: "บันทึกรูปลักษณ์ของพรรณไม้จากตัวอย่างจริง",

      card3: "ความรู้และการศึกษา",
      card3Sub: "เรียนรู้ลักษณะและข้อมูลทางพฤกษศาสตร์",

      card4: "ร่วมอนุรักษ์ธรรมชาติ",
      card4Sub: "ร่วมเก็บรักษาความหลากหลายของพรรณไม้",

      quote: "พรรณไม้... คือสมบัติของแผ่นดิน ที่เราต้องช่วยกันรักษา",
    },

    EN: {
      eyebrow: "Digital Specimen Collection",

      titleLine1: "Virtual",
      titleLine2: "Herbarium",

      intro: "Explore, learn and preserve Thai plants",

      description:
        "Connecting botanical records, specimen images and stories from nature in one accessible digital space.",

      explore: "Explore the collection",
      about: "About the project",

      statSpecimens: "Specimens",
      statFamilies: "Families",
      statCollectors: "Collectors",

      featured: "Featured specimen",
      noPlant: "No plants in the collection yet",
      viewSpecimen: "View specimen record",

      labelNo: "Accession",
      labelFamily: "Family",
      labelLocality: "Locality",
      labelCollector: "Collector",

      recentEyebrow: "Latest accessions",
      recentTitle: "Recently added specimens",
      viewAll: "View all",

      familiesEyebrow: "Taxonomic index",
      familiesTitle: "Browse by family",

      pillarsEyebrow: "Our mission",
      pillarsTitle: "Recording nature, systematically",

      card1: "Plant Database",
      card1Sub: "Organized records of Thai plant specimens",

      card2: "Nature Photography",
      card2Sub: "Preserve plant appearances through real images",

      card3: "Knowledge & Education",
      card3Sub: "Learn botanical characteristics and plant information",

      card4: "Conserve Nature",
      card4Sub: "Take part in preserving botanical diversity",

      quote:
        "Plants are treasures of the land that we all share a responsibility to preserve.",
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
          .select("*")
          .order("created_at", {
            ascending: false,
          });

        if (!mounted) return;

        if (error) {
          console.error("Load featured plants error:", error);

          setPlants([]);

          return;
        }

        setPlants((data || []).filter((plant) => Boolean(plant?.id)));

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
     FEATURED ROTATION
     Shuffled once, only plants that have a photo
  ===================================================== */

  const featuredPlants = useMemo(
    () => shufflePlants(plants.filter((plant) => hasText(plant.image_url))),
    [plants],
  );

  useEffect(() => {
    if (featuredPlants.length <= 1) return;

    const interval = window.setInterval(() => {
      setImageLoaded(false);

      setActivePlantIndex(
        (current) => (current + 1) % featuredPlants.length,
      );
    }, FEATURE_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, [featuredPlants]);

  function showFeatured(index) {
    if (index === activePlantIndex) return;

    setImageLoaded(false);
    setActivePlantIndex(index);
  }

  const activePlant =
    featuredPlants[activePlantIndex] || featuredPlants[0] || plants[0] || null;

  /* =====================================================
     DERIVED DATA
  ===================================================== */

  const recentPlants = plants.slice(0, RECENT_COUNT);

  const families = useMemo(() => {
    const counts = new Map();

    plants.forEach((plant) => {
      const family = plant.family?.trim();

      if (!family) return;

      counts.set(family, (counts.get(family) || 0) + 1);
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [plants]);

  const collectorCount = useMemo(
    () =>
      new Set(
        plants
          .map((plant) => getCollector(plant, isEnglish).toLowerCase())
          .filter(Boolean),
      ).size,
    [plants, isEnglish],
  );

  const stats = [
    { value: plants.length, label: t.statSpecimens },
    { value: families.length, label: t.statFamilies },
    { value: collectorCount, label: t.statCollectors },
  ];

  const pillars = [
    { title: t.card1, description: t.card1Sub },
    { title: t.card2, description: t.card2Sub },
    { title: t.card3, description: t.card3Sub },
    { title: t.card4, description: t.card4Sub },
  ];

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="flex min-h-[100dvh] flex-col">
      <Navbar />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden border-b border-rule">
        <div
          aria-hidden="true"
          className="vh-grid-paper pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]"
        />

        <div className="vh-container relative grid gap-12 py-12 md:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-20">
          {/* LEFT */}

          <div className="page-enter">
            <p className="vh-eyebrow flex items-center gap-3">
              <span className="h-px w-8 bg-ochre" />
              {t.eyebrow}
            </p>

            <h1 className="vh-display mt-6 text-[3.1rem] min-[390px]:text-[3.5rem] md:text-[4.6rem] xl:text-[5.4rem]">
              <span className="block">{t.titleLine1}</span>

              <span className="block italic text-moss">{t.titleLine2}</span>
            </h1>

            <p className="mt-7 font-serif text-[1.3rem] leading-snug text-ink md:text-[1.5rem]">
              {t.intro}
            </p>

            <p className="vh-prose mt-3 max-w-[540px]">{t.description}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/plants" className="vh-btn vh-btn-primary group">
                <span>{t.explore}</span>

                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link href="/about" className="vh-btn vh-btn-outline">
                {t.about}
              </Link>
            </div>

            {/* STATS */}

            <dl className="mt-12 grid max-w-[520px] grid-cols-3 border-t border-rule">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`pt-5 ${index > 0 ? "border-l border-rule pl-5" : ""}`}
                >
                  <dt className="vh-eyebrow !text-[10px]">{stat.label}</dt>

                  <dd className="mt-2 font-serif text-[2rem] leading-none text-ink tabular-nums md:text-[2.4rem]">
                    {plantLoading ? (
                      <span className="vh-skeleton inline-block h-8 w-12 rounded" />
                    ) : (
                      stat.value.toLocaleString()
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* RIGHT – FEATURED HERBARIUM SHEET */}

          <FeaturedSheet
            t={t}
            isEnglish={isEnglish}
            plant={activePlant}
            loading={plantLoading}
            imageLoaded={imageLoaded}
            onImageLoad={() => setImageLoaded(true)}
            count={featuredPlants.length}
            activeIndex={activePlantIndex}
            onSelect={showFeatured}
          />
        </div>
      </section>

      {/* =====================================================
          RECENT ACCESSIONS
      ===================================================== */}

      <section className="vh-container py-16 md:py-20">
        <SectionHeading
          eyebrow={t.recentEyebrow}
          title={t.recentTitle}
          action={
            <Link
              href="/plants"
              className="group inline-flex items-center gap-2 text-sm text-moss transition hover:text-moss-hover"
            >
              {t.viewAll}
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          }
        />

        <div className="mt-10 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {plantLoading
            ? Array.from({ length: RECENT_COUNT }).map((_, index) => (
                <div key={index} className="vh-specimen">
                  <div className="vh-skeleton aspect-[4/5]" />

                  <div className="space-y-2 p-4">
                    <div className="vh-skeleton h-3 w-16 rounded" />
                    <div className="vh-skeleton h-5 w-3/4 rounded" />
                  </div>
                </div>
              ))
            : recentPlants.map((plant) => (
                <SpecimenCard
                  key={plant.id}
                  plant={plant}
                  isEnglish={isEnglish}
                />
              ))}
        </div>

        {!plantLoading && recentPlants.length === 0 && (
          <p className="vh-panel mt-10 p-10 text-center font-serif text-lg italic text-muted">
            {t.noPlant}
          </p>
        )}
      </section>

      {/* =====================================================
          FAMILY INDEX
      ===================================================== */}

      {families.length > 0 && (
        <section className="border-y border-rule bg-sheet/60">
          <div className="vh-container py-16 md:py-20">
            <SectionHeading eyebrow={t.familiesEyebrow} title={t.familiesTitle} />

            <ul className="mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {families.slice(0, FAMILY_COUNT).map((family) => (
                <li key={family.name}>
                  <Link
                    href={`/plants?family=${encodeURIComponent(family.name)}`}
                    className="group flex items-baseline gap-3 border-b border-rule py-3.5 transition"
                  >
                    <span className="font-serif text-[17px] text-ink transition group-hover:text-moss">
                      {family.name}
                    </span>

                    <span
                      aria-hidden="true"
                      className="flex-1 translate-y-[-3px] border-b border-dotted border-rule-strong"
                    />

                    <span className="vh-catalog tabular-nums">
                      {String(family.count).padStart(2, "0")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* =====================================================
          MISSION
      ===================================================== */}

      <section className="vh-container py-16 md:py-20">
        <SectionHeading eyebrow={t.pillarsEyebrow} title={t.pillarsTitle} />

        <ol className="mt-10 grid border-t border-rule sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, index) => (
            <li
              key={pillar.title}
              className="border-b border-rule py-7 sm:px-6 sm:[&:nth-child(odd)]:pl-0 lg:border-b-0 lg:border-r lg:last:border-r-0 lg:[&:nth-child(odd)]:pl-6 lg:first:!pl-0"
            >
              <span className="font-mono text-[12px] text-ochre">
                {String(index + 1).padStart(2, "0")}
              </span>

              <h3 className="mt-4 font-serif text-[1.35rem] leading-tight text-ink">
                {pillar.title}
              </h3>

              <p className="mt-2 text-[14px] leading-7 text-muted">
                {pillar.description}
              </p>
            </li>
          ))}
        </ol>

        <figure className="mx-auto mt-20 max-w-3xl text-center">
          <LeafIcon className="mx-auto h-6 w-6 text-moss" />

          <blockquote className="mt-6 font-serif text-[1.6rem] italic leading-snug text-ink md:text-[2rem]">
            “{t.quote}”
          </blockquote>
        </figure>
      </section>

      <SiteFooter />
    </main>
  );
}

/* =========================================================
   FEATURED SHEET
   A photo mounted on a sheet with a herbarium label
========================================================= */

function FeaturedSheet({
  t,
  isEnglish,
  plant,
  loading,
  imageLoaded,
  onImageLoad,
  count,
  activeIndex,
  onSelect,
}) {
  const image = plant?.image_url || FALLBACK_PLANT_IMAGE;

  const botanicalName = plant?.botanical_name?.trim();

  const commonName = getCommonName(plant, isEnglish);

  const locality = getLocality(plant, isEnglish);

  const collector = getCollector(plant, isEnglish);

  const dotCount = Math.min(count, 6);

  return (
    <div className="page-enter relative mx-auto w-full max-w-[500px] min-[1800px]:max-w-[560px] min-[2200px]:max-w-[620px] [animation-delay:120ms]">
      <div className="vh-sheet relative rotate-[0.6deg] p-3 pb-0 md:p-4 md:pb-0">
        {/* SHEET HEADER */}

        <div className="flex items-center justify-between px-1 pb-3">
          <span className="vh-eyebrow flex items-center gap-2 !text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-moss" />
            {t.featured}
          </span>

          {count > 0 && (
            <span className="vh-catalog">
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(count).padStart(2, "0")}
            </span>
          )}
        </div>

        {/* PHOTO */}

        <Link
          href={plant ? `/plants/${plant.id}` : "/plants"}
          aria-label={t.viewSpecimen}
          className="group relative block aspect-[4/5] overflow-hidden rounded-[3px] bg-paper-deep"
        >
          {(loading || !imageLoaded) && (
            <div className="vh-skeleton absolute inset-0" />
          )}

          {!loading && (
            <img
              key={plant?.id || "fallback"}
              src={image}
              alt={botanicalName || commonName || t.featured}
              onLoad={onImageLoad}
              className={`h-full w-full object-cover transition duration-[900ms] group-hover:scale-[1.03] ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
        </Link>

        {/* HERBARIUM LABEL */}

        <div className="relative z-10 -mt-24 ml-auto w-[86%] translate-x-2 translate-y-8 -rotate-[0.6deg] md:w-[78%] md:translate-x-6 lg:translate-x-3 xl:translate-x-6">
          <div className="vh-label-card shadow-lift">
            {loading ? (
              <div className="space-y-2.5">
                <div className="vh-skeleton h-3 w-24 rounded" />
                <div className="vh-skeleton h-6 w-3/4 rounded" />
                <div className="vh-skeleton h-3 w-1/2 rounded" />
              </div>
            ) : plant ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="vh-family truncate">
                    {plant.family || "—"}
                  </span>

                  {hasText(plant.pnu_no) && (
                    <span className="vh-catalog shrink-0">
                      PNU {plant.pnu_no}
                    </span>
                  )}
                </div>

                <p className="vh-binomial mt-2 line-clamp-2 text-[1.4rem] leading-tight text-ink md:text-[1.55rem]">
                  {botanicalName || commonName || "—"}
                </p>

                {botanicalName && commonName && (
                  <p className="mt-1 truncate text-[13px] text-ink-soft">
                    {commonName}
                  </p>
                )}

                {(locality || collector) && (
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-dashed border-rule-strong pt-3 text-[12px]">
                    {locality && (
                      <>
                        <dt className="text-faint">{t.labelLocality}</dt>
                        <dd className="truncate text-ink-soft">{locality}</dd>
                      </>
                    )}

                    {collector && (
                      <>
                        <dt className="text-faint">{t.labelCollector}</dt>
                        <dd className="truncate text-ink-soft">{collector}</dd>
                      </>
                    )}
                  </dl>
                )}
              </>
            ) : (
              <p className="font-serif italic text-muted">{t.noPlant}</p>
            )}
          </div>
        </div>
      </div>

      {/* PAGER */}

      {dotCount > 1 && (
        <div className="mt-14 flex items-center justify-center gap-2">
          {Array.from({ length: dotCount }).map((_, index) => {
            const active = activeIndex % dotCount === index;

            return (
              <button
                key={index}
                type="button"
                aria-label={`${t.featured} ${index + 1}`}
                onClick={() => onSelect(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  active ? "w-8 bg-moss" : "w-1.5 bg-rule-strong hover:bg-muted"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SPECIMEN CARD
========================================================= */

function SpecimenCard({ plant, isEnglish }) {
  const botanicalName = plant.botanical_name?.trim();

  const commonName = getCommonName(plant, isEnglish);

  return (
    <Link href={`/plants/${plant.id}`} className="vh-specimen group">
      <div className="vh-specimen-media aspect-[4/5]">
        <img
          src={plant.image_url || FALLBACK_PLANT_IMAGE}
          alt={botanicalName || commonName || "Specimen"}
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="vh-family truncate">{plant.family || "—"}</span>

          {hasText(plant.pnu_no) && (
            <span className="vh-catalog hidden shrink-0 sm:inline">
              {plant.pnu_no}
            </span>
          )}
        </div>

        <h3 className="vh-binomial mt-2 line-clamp-2 text-[1.1rem] leading-snug text-ink transition group-hover:text-moss">
          {botanicalName || commonName || "—"}
        </h3>

        {botanicalName && commonName && (
          <p className="mt-1 truncate text-[13px] text-muted">{commonName}</p>
        )}
      </div>
    </Link>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="vh-eyebrow flex items-center gap-3">
          <span className="h-px w-6 bg-ochre" />
          {eyebrow}
        </p>

        <h2 className="vh-display mt-3 text-[2rem] md:text-[2.6rem]">{title}</h2>
      </div>

      {action}
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function hasText(value) {
  return typeof value === "string" ? value.trim() !== "" : value != null;
}

function localized(isEnglish, th, en, legacy) {
  const values = isEnglish ? [en, th, legacy] : [th, en, legacy];

  return values.find((value) => hasText(value))?.trim() || "";
}

function getCommonName(plant, isEnglish) {
  if (!plant) return "";

  return localized(
    isEnglish,
    plant.common_name_th,
    plant.common_name_en,
    plant.common_name,
  );
}

function getCollector(plant, isEnglish) {
  if (!plant) return "";

  return localized(
    isEnglish,
    plant.collected_by_th,
    plant.collected_by_en,
    plant.collected_by,
  );
}

function getLocality(plant, isEnglish) {
  if (!plant) return "";

  if (hasText(plant.locality)) return plant.locality.trim();

  return localized(isEnglish, plant.province_th, plant.province_en, plant.province);
}

/* =========================================================
   SHUFFLE
========================================================= */

function shufflePlants(plants) {
  const shuffled = [...plants];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
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
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.5 3.5C14 3.8 8.2 6 5.2 10.1c-2.2 3-1.9 6.4.1 8.6 2.2 2.4 6.1 2.4 9-.1 3.8-3.3 5.6-8.9 6.2-15.1Z" />
      <path d="M4 20c3.2-4.9 7.1-8.4 12.7-11.2" />
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
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
