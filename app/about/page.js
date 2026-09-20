"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   FOREST IMAGES
   ภายหลังสามารถเปลี่ยนเป็นไฟล์ใน public/images ได้
========================================================= */

const FOREST_HERO =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=90";

const FOREST_DETAIL =
  "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=2200&q=88";

export default function AboutPage() {
  const { language, darkMode } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      badge: "VIRTUAL HERBARIUM",

      heroSmall: "เรื่องราวของคลังพรรณไม้",
      titleTop: "พื้นที่ที่เชื่อม",
      titleHighlight: "ธรรมชาติกับข้อมูล",
      subtitle:
        "Virtual Herbarium คือพื้นที่ดิจิทัลสำหรับรวบรวม จัดเก็บ และเผยแพร่ข้อมูลพรรณไม้ โดยออกแบบประสบการณ์ให้การเรียนรู้ข้อมูลทางพฤกษศาสตร์รู้สึกเหมือนกำลังสำรวจธรรมชาติ",

      explore: "สำรวจพรรณไม้",
      start: "เพิ่มข้อมูลพรรณไม้",

      storyLabel: "OUR STORY",
      storyTitle: "จากตัวอย่างพรรณไม้ สู่เรื่องราวของผืนป่า",
      storyText:
        "ตัวอย่างพรรณไม้หนึ่งตัวอย่างสามารถบอกเราได้มากกว่าชื่อของพืช ทั้งสถานที่ที่พบ สภาพแวดล้อม ช่วงเวลาที่เก็บ และรายละเอียดทางพฤกษศาสตร์ Virtual Herbarium จึงถูกสร้างขึ้นเพื่อรวบรวมข้อมูลเหล่านี้ไว้ในรูปแบบที่ค้นหา เรียนรู้ และเข้าถึงได้ง่าย",

      specimenLabel: "BOTANICAL RECORD",
      specimenTitle: "ทุกข้อมูลมีที่มา",
      specimenText:
        "ข้อมูลในคลังสามารถประกอบด้วยชื่อสามัญ ชื่อวิทยาศาสตร์ วงศ์ สถานที่พบ วันที่เก็บตัวอย่าง ผู้เก็บตัวอย่าง ลักษณะถิ่นอาศัย และภาพประกอบ",

      purposeLabel: "OUR PURPOSE",
      purposeTitle: "สร้างพื้นที่สำหรับการเรียนรู้และการเก็บรักษาความรู้",

      purpose1Title: "จัดเก็บอย่างเป็นระบบ",
      purpose1Text:
        "รวบรวมข้อมูลพรรณไม้ให้อยู่ในโครงสร้างเดียวกัน เพื่อให้ง่ายต่อการค้นหา ตรวจสอบ และนำไปศึกษา",

      purpose2Title: "สนับสนุนการเรียนรู้",
      purpose2Text:
        "ช่วยให้นักเรียน นักศึกษา นักวิจัย และผู้ที่สนใจธรรมชาติสามารถเข้าถึงข้อมูลพรรณไม้ได้ง่ายขึ้น",

      purpose3Title: "แบ่งปันองค์ความรู้",
      purpose3Text:
        "เปลี่ยนข้อมูลตัวอย่างพรรณไม้ให้เป็นแหล่งความรู้ดิจิทัลที่สามารถสำรวจและเรียนรู้ร่วมกันได้",

      workflowLabel: "HOW IT WORKS",
      workflowTitle: "การเดินทางของข้อมูลหนึ่งตัวอย่าง",

      step1: "สร้างบัญชี",
      step1Text:
        "เริ่มต้นด้วยบัญชีของคุณ เพื่อให้สามารถจัดการข้อมูลที่เพิ่มไว้ได้",

      step2: "บันทึกตัวอย่าง",
      step2Text: "เพิ่มภาพ ชื่อพรรณไม้ สถานที่เก็บ และรายละเอียดทางพฤกษศาสตร์",

      step3: "ดูแลข้อมูล",
      step3Text:
        "กลับมาแก้ไขและปรับปรุงข้อมูลของตัวอย่างที่คุณเป็นผู้บันทึกได้ตลอดเวลา",

      step4: "เปิดให้สำรวจ",
      step4Text: "ตัวอย่างที่บันทึกไว้กลายเป็นส่วนหนึ่งของคลังพรรณไม้ดิจิทัล",

      finalLabel: "EXPLORE NATURE",
      finalTitle: "ความรู้เรื่องธรรมชาติ เริ่มได้จากการสังเกตพรรณไม้",
      finalText:
        "เริ่มสำรวจคลังพรรณไม้ หรือเพิ่มตัวอย่างของคุณเพื่อร่วมสร้างพื้นที่แห่งการเรียนรู้ด้านพฤกษศาสตร์",

      finalExplore: "เข้าสู่คลังพรรณไม้",
      finalAdd: "เพิ่มตัวอย่างของฉัน",

      home: "หน้าแรก",
      plants: "พรรณไม้",
      about: "เกี่ยวกับเรา",
      footer:
        "คลังพรรณไม้ดิจิทัลสำหรับการสำรวจ เรียนรู้ และเก็บรักษาข้อมูลทางพฤกษศาสตร์",
    },

    EN: {
      badge: "VIRTUAL HERBARIUM",

      heroSmall: "The story behind the collection",
      titleTop: "Where botanical",
      titleHighlight: "knowledge meets nature",
      subtitle:
        "Virtual Herbarium is a digital space for collecting, preserving and sharing plant information, designed so exploring botanical data feels like discovering nature itself.",

      explore: "Explore Plants",
      start: "Add Plant Record",

      storyLabel: "OUR STORY",
      storyTitle: "From a plant specimen to the story of a forest",
      storyText:
        "A single plant specimen can reveal more than a name. It can preserve where the plant was found, its environment, collection date and botanical characteristics. Virtual Herbarium brings these details together in a form that is easy to explore, learn from and preserve.",

      specimenLabel: "BOTANICAL RECORD",
      specimenTitle: "Every record has a story",
      specimenText:
        "A collection record can include common names, scientific names, families, locations, collection dates, collectors, habitat descriptions and specimen images.",

      purposeLabel: "OUR PURPOSE",
      purposeTitle: "A space for learning and preserving botanical knowledge",

      purpose1Title: "Organized Records",
      purpose1Text:
        "Keep botanical information in a consistent structure that is easier to search, review and study.",

      purpose2Title: "Support Learning",
      purpose2Text:
        "Make plant information more accessible to students, researchers and anyone interested in the natural world.",

      purpose3Title: "Share Knowledge",
      purpose3Text:
        "Transform specimen information into a digital knowledge resource that can be explored and learned from.",

      workflowLabel: "HOW IT WORKS",
      workflowTitle: "The journey of a plant record",

      step1: "Create an Account",
      step1Text:
        "Begin with your account so the records you create remain manageable by you.",

      step2: "Record a Specimen",
      step2Text:
        "Add an image, plant names, collection location and botanical details.",

      step3: "Maintain the Record",
      step3Text:
        "Return at any time to edit and improve the plant records you have created.",

      step4: "Open for Exploration",
      step4Text:
        "Your recorded specimens become part of the digital herbarium collection.",

      finalLabel: "EXPLORE NATURE",
      finalTitle: "Understanding nature can begin with a single plant",
      finalText:
        "Explore the herbarium or contribute your own specimen record to help build a shared space for botanical learning.",

      finalExplore: "Enter the Herbarium",
      finalAdd: "Add My Specimen",

      home: "Home",
      plants: "Plants",
      about: "About",
      footer:
        "A digital herbarium for exploring, learning and preserving botanical information.",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  return (
    <main className="page overflow-hidden">
      <Navbar />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative isolate min-h-[72vh] overflow-hidden">
        {/* FOREST IMAGE */}

        <div
          className="absolute inset-0 -z-30 bg-cover bg-center"
          style={{
            backgroundImage: `url("${FOREST_HERO}")`,
          }}
        />

        {/* THEME OVERLAY */}

        <div
          className={`absolute inset-0 -z-20 ${
            darkMode
              ? "bg-[linear-gradient(90deg,rgba(2,10,5,0.97)_0%,rgba(3,16,8,0.88)_50%,rgba(3,15,8,0.58)_100%)]"
              : "bg-[linear-gradient(90deg,rgba(239,247,237,0.97)_0%,rgba(239,247,237,0.88)_52%,rgba(235,245,233,0.62)_100%)]"
          }`}
        />

        {/* DEPTH */}

        <div
          className={`absolute inset-0 -z-10 ${
            darkMode
              ? "bg-[linear-gradient(180deg,rgba(2,8,4,0.20)_0%,transparent_55%,#07100b_100%)]"
              : "bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,transparent_55%,#f1f6f1_100%)]"
          }`}
        />

        {/* LIGHT RAYS */}

        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className={`absolute -top-40 right-[10%] h-[700px] w-24 rotate-[24deg] blur-2xl ${
              darkMode
                ? "bg-gradient-to-b from-emerald-100/10 to-transparent"
                : "bg-gradient-to-b from-white/60 to-transparent"
            }`}
          />

          <div className="forest-particle left-[12%] top-[28%]" />

          <div className="forest-particle right-[25%] top-[35%] [animation-delay:-3s]" />

          <div className="forest-particle right-[12%] top-[60%] [animation-delay:-5s]" />
        </div>

        {/* CONTENT */}

        <div className="container">
          <div className="flex min-h-[72vh] items-center py-16 lg:py-24">
            <div className="max-w-4xl page-enter">
              <div
                className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 backdrop-blur-xl ${
                  darkMode
                    ? "border-emerald-300/20 bg-black/20 text-emerald-200"
                    : "border-emerald-950/15 bg-white/55 text-emerald-900"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    darkMode
                      ? "bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.9)]"
                      : "bg-emerald-700"
                  }`}
                />

                <span className="text-[11px] font-extrabold tracking-[0.22em]">
                  {t.badge}
                </span>
              </div>

              <p
                className={`mt-7 text-xs font-extrabold uppercase tracking-[0.2em] ${
                  darkMode ? "text-emerald-400" : "text-emerald-800"
                }`}
              >
                {t.heroSmall}
              </p>

              <h1
                className={`mt-4 max-w-4xl text-5xl font-black leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl ${
                  darkMode ? "text-white" : "text-[#102218]"
                }`}
              >
                {t.titleTop}

                <span
                  className={`mt-2 block ${
                    darkMode
                      ? "bg-gradient-to-r from-emerald-200 via-emerald-400 to-lime-200 bg-clip-text text-transparent"
                      : "bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-800 bg-clip-text text-transparent"
                  }`}
                >
                  {t.titleHighlight}
                </span>
              </h1>

              <p
                className={`mt-7 max-w-3xl text-base leading-8 sm:text-lg ${
                  darkMode ? "text-[#cad7cd]" : "text-[#425b49]"
                }`}
              >
                {t.subtitle}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/plants"
                  className="inline-flex min-h-13 items-center justify-center gap-3 rounded-2xl bg-emerald-700 px-7 py-3.5 text-sm font-extrabold text-white shadow-[0_16px_45px_rgba(6,78,45,0.35)] transition duration-300 hover:-translate-y-1 hover:bg-emerald-600"
                >
                  <LeafIcon className="h-5 w-5" />

                  {t.explore}
                </Link>

                <Link
                  href="/account/plants/new"
                  className={`inline-flex min-h-13 items-center justify-center gap-3 rounded-2xl border px-7 py-3.5 text-sm font-extrabold backdrop-blur-xl transition duration-300 hover:-translate-y-1 ${
                    darkMode
                      ? "border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.11]"
                      : "border-emerald-950/15 bg-white/55 text-emerald-950 hover:bg-white/80"
                  }`}
                >
                  <PlusIcon className="h-5 w-5" />

                  {t.start}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          STORY
      ===================================================== */}

      <section className="relative py-24 sm:py-28">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
            {/* IMAGE */}

            <div className="relative">
              <div
                className={`absolute -inset-12 rounded-full blur-3xl ${
                  darkMode ? "bg-emerald-500/[0.05]" : "bg-emerald-800/[0.06]"
                }`}
              />

              <div
                className={`relative overflow-hidden rounded-[2rem] border p-2 ${
                  darkMode
                    ? "border-white/10 bg-white/[0.025]"
                    : "border-emerald-950/10 bg-white/60"
                }`}
              >
                <div className="relative min-h-[480px] overflow-hidden rounded-[1.6rem]">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url("${FOREST_DETAIL}")`,
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#021007]/90 via-[#04130a]/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-9">
                    <p className="text-[11px] font-extrabold tracking-[0.22em] text-emerald-300">
                      {t.specimenLabel}
                    </p>

                    <h3 className="mt-3 max-w-md text-2xl font-black text-white sm:text-3xl">
                      {t.specimenTitle}
                    </h3>

                    <p className="mt-4 max-w-md text-sm leading-7 text-gray-300">
                      {t.specimenText}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* TEXT */}

            <div>
              <SectionLabel text={t.storyLabel} darkMode={darkMode} />

              <h2
                className={`mt-6 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl ${
                  darkMode ? "text-white" : "text-[#102218]"
                }`}
              >
                {t.storyTitle}
              </h2>

              <p
                className={`mt-6 text-base leading-8 sm:text-lg ${
                  darkMode ? "text-[#9eafa3]" : "text-[#53685a]"
                }`}
              >
                {t.storyText}
              </p>

              <div className="mt-9 grid grid-cols-2 gap-3">
                <InfoTile
                  darkMode={darkMode}
                  icon={<LeafIcon className="h-5 w-5" />}
                  title={isEnglish ? "Plant Identity" : "ข้อมูลพรรณไม้"}
                  text={isEnglish ? "Names & family" : "ชื่อและวงศ์"}
                />

                <InfoTile
                  darkMode={darkMode}
                  icon={<MapPinIcon className="h-5 w-5" />}
                  title={isEnglish ? "Collection Site" : "สถานที่เก็บ"}
                  text={isEnglish ? "Location records" : "ข้อมูลพื้นที่พบ"}
                />

                <InfoTile
                  darkMode={darkMode}
                  icon={<ForestIcon className="h-5 w-5" />}
                  title={isEnglish ? "Habitat" : "ถิ่นอาศัย"}
                  text={isEnglish ? "Natural environment" : "สภาพแวดล้อม"}
                />

                <InfoTile
                  darkMode={darkMode}
                  icon={<ArchiveIcon className="h-5 w-5" />}
                  title={isEnglish ? "Digital Record" : "ข้อมูลดิจิทัล"}
                  text={isEnglish ? "Preserved online" : "จัดเก็บอย่างเป็นระบบ"}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PURPOSE
      ===================================================== */}

      <section
        className={`relative border-y py-24 sm:py-28 ${
          darkMode
            ? "border-white/10 bg-[#07130c]"
            : "border-emerald-950/10 bg-[#eaf2e9]"
        }`}
      >
        <div
          className={`pointer-events-none absolute left-1/2 top-0 h-[450px] w-[800px] -translate-x-1/2 rounded-full blur-3xl ${
            darkMode ? "bg-emerald-500/[0.04]" : "bg-emerald-800/[0.04]"
          }`}
        />

        <div className="container">
          <div className="max-w-3xl">
            <SectionLabel text={t.purposeLabel} darkMode={darkMode} />

            <h2
              className={`mt-6 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl ${
                darkMode ? "text-white" : "text-[#102218]"
              }`}
            >
              {t.purposeTitle}
            </h2>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <PurposeCard
              number="01"
              darkMode={darkMode}
              icon={<ArchiveIcon className="h-6 w-6" />}
              title={t.purpose1Title}
              text={t.purpose1Text}
            />

            <PurposeCard
              number="02"
              darkMode={darkMode}
              icon={<BookIcon className="h-6 w-6" />}
              title={t.purpose2Title}
              text={t.purpose2Text}
            />

            <PurposeCard
              number="03"
              darkMode={darkMode}
              icon={<ShareIcon className="h-6 w-6" />}
              title={t.purpose3Title}
              text={t.purpose3Text}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          WORKFLOW
      ===================================================== */}

      <section className="relative py-24 sm:py-28">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel text={t.workflowLabel} darkMode={darkMode} center />

            <h2
              className={`mt-6 text-3xl font-black tracking-[-0.04em] sm:text-5xl ${
                darkMode ? "text-white" : "text-[#102218]"
              }`}
            >
              {t.workflowTitle}
            </h2>
          </div>

          <div className="relative mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StepCard
              number="01"
              darkMode={darkMode}
              icon={<UserIcon className="h-5 w-5" />}
              title={t.step1}
              text={t.step1Text}
            />

            <StepCard
              number="02"
              darkMode={darkMode}
              icon={<PlusIcon className="h-5 w-5" />}
              title={t.step2}
              text={t.step2Text}
            />

            <StepCard
              number="03"
              darkMode={darkMode}
              icon={<EditIcon className="h-5 w-5" />}
              title={t.step3}
              text={t.step3Text}
            />

            <StepCard
              number="04"
              darkMode={darkMode}
              icon={<SearchIcon className="h-5 w-5" />}
              title={t.step4}
              text={t.step4Text}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL FOREST CTA
      ===================================================== */}

      <section className="container pb-24 sm:pb-28">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("${FOREST_HERO}")`,
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,12,6,0.95)_0%,rgba(3,18,9,0.83)_55%,rgba(3,18,9,0.55)_100%)]" />

          <div className="relative px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold tracking-[0.24em] text-emerald-300">
                {t.finalLabel}
              </p>

              <h2 className="mt-5 text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                {t.finalTitle}
              </h2>

              <p className="mt-5 max-w-xl text-base leading-8 text-gray-300">
                {t.finalText}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/plants"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-emerald-950 transition hover:-translate-y-1 hover:bg-emerald-50"
                >
                  <LeafIcon className="h-5 w-5" />

                  {t.finalExplore}
                </Link>

                <Link
                  href="/account/plants/new"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] px-6 py-3 text-sm font-extrabold text-white backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.12]"
                >
                  <PlusIcon className="h-5 w-5" />

                  {t.finalAdd}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        className={`border-t ${
          darkMode
            ? "border-white/10 bg-[#040b07]"
            : "border-emerald-950/10 bg-[#eaf1e9]"
        }`}
      >
        <div className="container py-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-emerald-800/10 text-emerald-800"
                  }`}
                >
                  <LeafIcon className="h-5 w-5" />
                </div>

                <div>
                  <p
                    className={`font-extrabold ${
                      darkMode ? "text-white" : "text-[#15331f]"
                    }`}
                  >
                    Virtual Herbarium
                  </p>

                  <p
                    className={`mt-0.5 text-xs ${
                      darkMode ? "text-gray-500" : "text-slate-500"
                    }`}
                  >
                    Digital Plant Collection
                  </p>
                </div>
              </div>

              <p
                className={`mt-4 text-sm leading-6 ${
                  darkMode ? "text-gray-500" : "text-slate-500"
                }`}
              >
                {t.footer}
              </p>
            </div>

            <div
              className={`flex flex-wrap gap-6 text-sm font-bold ${
                darkMode ? "text-gray-400" : "text-slate-600"
              }`}
            >
              <Link href="/" className="transition hover:text-emerald-500">
                {t.home}
              </Link>

              <Link
                href="/plants"
                className="transition hover:text-emerald-500"
              >
                {t.plants}
              </Link>

              <Link href="/about" className="transition hover:text-emerald-500">
                {t.about}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* =========================================================
   SECTION LABEL
========================================================= */

function SectionLabel({ text, darkMode, center = false }) {
  return (
    <div
      className={`flex items-center gap-3 ${center ? "justify-center" : ""}`}
    >
      <span
        className={`h-1.5 w-8 rounded-full ${
          darkMode ? "bg-emerald-400" : "bg-emerald-700"
        }`}
      />

      <span
        className={`text-xs font-black uppercase tracking-[0.18em] ${
          darkMode ? "text-emerald-300" : "text-emerald-800"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

/* =========================================================
   INFO TILE
========================================================= */

function InfoTile({ darkMode, icon, title, text }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        darkMode
          ? "border-white/10 bg-white/[0.025]"
          : "border-emerald-950/10 bg-white/65"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/10 text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <p
        className={`mt-3 text-sm font-extrabold ${
          darkMode ? "text-white" : "text-[#173321]"
        }`}
      >
        {title}
      </p>

      <p
        className={`mt-1 text-xs ${
          darkMode ? "text-gray-500" : "text-slate-500"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   PURPOSE CARD
========================================================= */

function PurposeCard({ number, darkMode, icon, title, text }) {
  return (
    <article
      className={`group relative overflow-hidden rounded-[1.7rem] border p-7 transition duration-300 hover:-translate-y-1 ${
        darkMode
          ? "border-white/10 bg-[#0c1810]/75 hover:border-emerald-400/20"
          : "border-emerald-950/10 bg-white/75 hover:border-emerald-800/20"
      }`}
    >
      <span
        className={`absolute right-6 top-5 text-5xl font-black ${
          darkMode ? "text-white/[0.025]" : "text-emerald-950/[0.04]"
        }`}
      >
        {number}
      </span>

      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl transition group-hover:scale-105 ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/10 text-emerald-800"
        }`}
      >
        {icon}
      </div>

      <h3
        className={`mt-6 text-xl font-black ${
          darkMode ? "text-white" : "text-[#173321]"
        }`}
      >
        {title}
      </h3>

      <p
        className={`mt-3 text-sm leading-7 ${
          darkMode ? "text-[#92a399]" : "text-[#5c6d62]"
        }`}
      >
        {text}
      </p>
    </article>
  );
}

/* =========================================================
   STEP CARD
========================================================= */

function StepCard({ number, darkMode, icon, title, text }) {
  return (
    <article
      className={`relative rounded-[1.6rem] border p-6 transition duration-300 hover:-translate-y-1 ${
        darkMode
          ? "border-white/10 bg-[#0b1710]"
          : "border-emerald-950/10 bg-white/80"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            darkMode
              ? "bg-emerald-400/10 text-emerald-300"
              : "bg-emerald-800/10 text-emerald-800"
          }`}
        >
          {icon}
        </div>

        <span
          className={`text-xs font-black tracking-[0.12em] ${
            darkMode ? "text-emerald-400" : "text-emerald-700"
          }`}
        >
          {number}
        </span>
      </div>

      <h3
        className={`mt-6 text-lg font-black ${
          darkMode ? "text-white" : "text-[#173321]"
        }`}
      >
        {title}
      </h3>

      <p
        className={`mt-3 text-sm leading-7 ${
          darkMode ? "text-gray-400" : "text-slate-600"
        }`}
      >
        {text}
      </p>
    </article>
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

function PlusIcon({ className = "" }) {
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ForestIcon({ className = "" }) {
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
      <path d="m7 3-4 7h3l-4 6h10l-4-6h3L7 3Z" />
      <path d="M7 16v5" />

      <path d="m17 6-3 5h2l-3 5h8l-3-5h2l-3-5Z" />
      <path d="M17 16v5" />
    </svg>
  );
}

function ArchiveIcon({ className = "" }) {
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
      <rect x="3" y="4" width="18" height="5" rx="1.5" />

      <path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
      <path d="M9 13h6" />
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
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />

      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z" />
    </svg>
  );
}

function ShareIcon({ className = "" }) {
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />

      <path d="m8.7 10.7 6.6-4.2" />
      <path d="m8.7 13.3 6.6 4.2" />
    </svg>
  );
}

function UserIcon({ className = "" }) {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function EditIcon({ className = "" }) {
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
      <path d="M12 20h9" />

      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function SearchIcon({ className = "" }) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}
