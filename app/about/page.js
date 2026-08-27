"use client";

import Link from "next/link";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import Navbar from "@/components/Navbar";

export default function AboutPage() {
  const { language, darkMode } = useSiteSettings();
  const isEnglish = language === "EN";

  const text = {
    TH: {
      badge: "VIRTUAL HERBARIUM",
      title: "คลังข้อมูลพรรณไม้ดิจิทัล",
      subtitle:
        "พื้นที่สำหรับรวบรวม จัดเก็บ และเผยแพร่ข้อมูลพรรณไม้อย่างเป็นระบบ เพื่อให้การเรียนรู้และการศึกษาพรรณไม้เข้าถึงได้ง่ายขึ้น",

      explore: "สำรวจพรรณไม้",
      start: "เริ่มเพิ่มข้อมูล",

      overview: "เกี่ยวกับโครงการ",
      overviewText:
        "Virtual Herbarium คือระบบคลังข้อมูลพรรณไม้ในรูปแบบดิจิทัลที่ออกแบบมาเพื่อจัดเก็บข้อมูลตัวอย่างพรรณไม้ พร้อมรายละเอียดสำคัญ เช่น ชื่อวิทยาศาสตร์ วงศ์ สถานที่พบ ถิ่นที่อยู่ และข้อมูลการเก็บตัวอย่าง",

      purpose: "จุดประสงค์ของเรา",

      purpose1Title: "จัดเก็บข้อมูลอย่างเป็นระบบ",
      purpose1Text:
        "รวบรวมข้อมูลพรรณไม้ให้อยู่ในรูปแบบเดียวกัน ค้นหาและเข้าถึงข้อมูลได้สะดวก",

      purpose2Title: "สนับสนุนการเรียนรู้",
      purpose2Text:
        "ช่วยให้นักเรียน นักศึกษา และผู้ที่สนใจสามารถศึกษาข้อมูลพรรณไม้ได้ง่ายขึ้น",

      purpose3Title: "เผยแพร่องค์ความรู้",
      purpose3Text:
        "สร้างพื้นที่สำหรับแบ่งปันข้อมูลและองค์ความรู้เกี่ยวกับพรรณไม้ในรูปแบบดิจิทัล",

      workflow: "ระบบทำงานอย่างไร",

      step1: "สร้างบัญชี",
      step1Text: "สมัครสมาชิกเพื่อจัดการข้อมูลพรรณไม้ของคุณ",

      step2: "เพิ่มข้อมูล",
      step2Text: "บันทึกข้อมูลตัวอย่าง พร้อมภาพและรายละเอียดต่าง ๆ",

      step3: "จัดการข้อมูล",
      step3Text: "แก้ไขและดูแลข้อมูลพรรณไม้ที่คุณเพิ่มไว้",

      step4: "สำรวจคลังข้อมูล",
      step4Text: "ค้นหาและเรียนรู้ข้อมูลพรรณไม้จากคลังข้อมูล",

      collection: "คลังพรรณไม้",
      collectionText:
        "ค้นพบข้อมูลพรรณไม้จากสถานที่และพื้นที่ต่าง ๆ ผ่านระบบคลังข้อมูลออนไลน์",

      browse: "เข้าสู่คลังพรรณไม้",

      ready: "พร้อมเริ่มต้นหรือยัง?",
      readyText: "เริ่มสำรวจข้อมูลพรรณไม้ หรือสร้างข้อมูลของคุณเองได้ทันที",

      about: "เกี่ยวกับเรา",
    },

    EN: {
      badge: "VIRTUAL HERBARIUM",
      title: "Digital Plant Collection",
      subtitle:
        "A digital space for collecting, organizing, and sharing plant information in an accessible and structured way.",

      explore: "Explore Plants",
      start: "Add Plant",

      overview: "About the Project",
      overviewText:
        "Virtual Herbarium is a digital plant information system designed to organize specimen records together with important details such as scientific names, families, locations, habitats, and collection information.",

      purpose: "Our Purpose",

      purpose1Title: "Organized Information",
      purpose1Text:
        "Keep plant information in a consistent structure that is easy to access and explore.",

      purpose2Title: "Support Learning",
      purpose2Text:
        "Make plant information easier to explore for students, researchers, and anyone interested in plants.",

      purpose3Title: "Share Knowledge",
      purpose3Text:
        "Provide a digital space for sharing plant information and botanical knowledge.",

      workflow: "How It Works",

      step1: "Create an Account",
      step1Text: "Register an account to manage your plant records.",

      step2: "Add Information",
      step2Text:
        "Create a specimen record with images and detailed information.",

      step3: "Manage Records",
      step3Text: "Edit and maintain the plant records you have created.",

      step4: "Explore Collection",
      step4Text: "Search and learn from the digital plant collection.",

      collection: "Plant Collection",
      collectionText:
        "Discover plant records from different locations through the online collection.",

      browse: "Browse Collection",

      ready: "Ready to get started?",
      readyText:
        "Explore plant records or create your own digital specimen record.",

      about: "About Us",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-[#07110d] text-white" : "bg-[#f7faf8] text-slate-900"
      }`}
    >
      <Navbar />

      {/* HERO */}
      <section
        className={`relative overflow-hidden ${
          darkMode ? "bg-[#09150f]" : "bg-white"
        }`}
      >
        <div
          className={`absolute left-1/2 top-0 h-[420px] w-[800px] -translate-x-1/2 rounded-full blur-3xl ${
            darkMode ? "bg-emerald-900/20" : "bg-emerald-100/60"
          }`}
        />

        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="max-w-4xl">
            <span
              className={`inline-flex rounded-full border px-4 py-2 text-xs font-bold tracking-[0.18em] ${
                darkMode
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {t.badge}
            </span>

            <h1
              className={`mt-7 text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl ${
                darkMode ? "text-white" : "text-slate-950"
              }`}
            >
              {t.title}
            </h1>

            <p
              className={`mt-6 max-w-3xl text-base leading-8 sm:text-lg ${
                darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              {t.subtitle}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/plants"
                className="rounded-xl bg-emerald-600 px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-700"
              >
                {t.explore}
              </Link>

              <Link
                href="/plants/add"
                className={`rounded-xl border px-6 py-3.5 text-center text-sm font-bold transition ${
                  darkMode
                    ? "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {t.start}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <SectionLabel text={t.overview} darkMode={darkMode} />

            <h2
              className={`mt-5 text-3xl font-black sm:text-4xl ${
                darkMode ? "text-white" : "text-slate-950"
              }`}
            >
              {isEnglish
                ? "A digital home for botanical knowledge."
                : "พื้นที่ดิจิทัลสำหรับองค์ความรู้ด้านพรรณไม้"}
            </h2>
          </div>

          <div
            className={`rounded-3xl border p-7 sm:p-9 ${
              darkMode
                ? "border-white/10 bg-[#0d1914]"
                : "border-emerald-100 bg-white shadow-sm"
            }`}
          >
            <p
              className={`text-base leading-8 sm:text-lg ${
                darkMode ? "text-gray-300" : "text-slate-600"
              }`}
            >
              {t.overviewText}
            </p>
          </div>
        </div>
      </section>

      {/* PURPOSE */}
      <section
        className={`border-y ${
          darkMode
            ? "border-white/10 bg-[#09150f]"
            : "border-emerald-100 bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="max-w-2xl">
            <SectionLabel text={t.purpose} darkMode={darkMode} />

            <h2
              className={`mt-5 text-3xl font-black sm:text-4xl ${
                darkMode ? "text-white" : "text-slate-950"
              }`}
            >
              {isEnglish
                ? "Built with people and knowledge in mind."
                : "ออกแบบมาเพื่อการเรียนรู้และการแบ่งปันความรู้"}
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <PurposeCard
              number="01"
              title={t.purpose1Title}
              text={t.purpose1Text}
              darkMode={darkMode}
            />

            <PurposeCard
              number="02"
              title={t.purpose2Title}
              text={t.purpose2Text}
              darkMode={darkMode}
            />

            <PurposeCard
              number="03"
              title={t.purpose3Title}
              text={t.purpose3Text}
              darkMode={darkMode}
            />
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="text-center">
          <SectionLabel text={t.workflow} darkMode={darkMode} center />

          <h2
            className={`mt-5 text-3xl font-black sm:text-4xl ${
              darkMode ? "text-white" : "text-slate-950"
            }`}
          >
            {isEnglish
              ? "Simple from start to finish."
              : "ใช้งานง่ายตั้งแต่เริ่มต้นจนจบ"}
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StepCard
            number="01"
            title={t.step1}
            text={t.step1Text}
            darkMode={darkMode}
          />

          <StepCard
            number="02"
            title={t.step2}
            text={t.step2Text}
            darkMode={darkMode}
          />

          <StepCard
            number="03"
            title={t.step3}
            text={t.step3Text}
            darkMode={darkMode}
          />

          <StepCard
            number="04"
            title={t.step4}
            text={t.step4Text}
            darkMode={darkMode}
          />
        </div>
      </section>

      {/* COLLECTION */}
      <section
        className={`mx-5 overflow-hidden rounded-[2rem] sm:mx-8 lg:mx-auto lg:max-w-7xl ${
          darkMode ? "bg-[#0d1914]" : "bg-emerald-900"
        }`}
      >
        <div className="grid items-center gap-10 px-7 py-12 sm:px-12 sm:py-16 lg:grid-cols-[1fr_auto] lg:px-16">
          <div>
            <p className="text-sm font-bold text-emerald-300">{t.collection}</p>

            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
              {isEnglish ? "Explore the collection." : "ออกสำรวจคลังพรรณไม้"}
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
              {t.collectionText}
            </p>
          </div>

          <Link
            href="/plants"
            className="rounded-xl bg-white px-6 py-3.5 text-center text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
          >
            {t.browse}
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8 lg:py-24">
        <h2
          className={`text-3xl font-black sm:text-4xl ${
            darkMode ? "text-white" : "text-slate-950"
          }`}
        >
          {t.ready}
        </h2>

        <p
          className={`mx-auto mt-4 max-w-2xl leading-7 ${
            darkMode ? "text-gray-400" : "text-slate-500"
          }`}
        >
          {t.readyText}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/plants"
            className="rounded-xl bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            {t.explore}
          </Link>

          <Link
            href="/register"
            className={`rounded-xl border px-7 py-3.5 text-sm font-bold transition ${
              darkMode
                ? "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t.start}
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className={`border-t ${
          darkMode
            ? "border-white/10 bg-[#050b08]"
            : "border-emerald-100 bg-white"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-center text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left">
          <span className={darkMode ? "text-gray-500" : "text-gray-500"}>
            © 2026 Virtual Herbarium
          </span>

          <Link
            href="/plants"
            className={
              darkMode
                ? "font-semibold text-emerald-400"
                : "font-semibold text-emerald-700"
            }
          >
            {t.collection}
          </Link>
        </div>
      </footer>
    </main>
  );
}

/* =========================
   SECTION LABEL
========================= */

function SectionLabel({ text, darkMode, center = false }) {
  return (
    <div
      className={`flex items-center gap-3 ${center ? "justify-center" : ""}`}
    >
      <span
        className={`h-1.5 w-8 rounded-full ${
          darkMode ? "bg-emerald-400" : "bg-emerald-600"
        }`}
      />

      <span
        className={`text-xs font-black uppercase tracking-[0.16em] ${
          darkMode ? "text-emerald-300" : "text-emerald-700"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

/* =========================
   PURPOSE CARD
========================= */

function PurposeCard({ number, title, text, darkMode }) {
  return (
    <article
      className={`rounded-3xl border p-7 transition duration-200 ${
        darkMode
          ? "border-white/10 bg-white/[0.025] hover:border-emerald-500/20 hover:bg-emerald-500/5"
          : "border-gray-100 bg-gray-50/70 hover:border-emerald-100 hover:bg-emerald-50/40"
      }`}
    >
      <span
        className={`text-sm font-black ${
          darkMode ? "text-emerald-400" : "text-emerald-600"
        }`}
      >
        {number}
      </span>

      <h3 className="mt-6 text-xl font-bold">{title}</h3>

      <p
        className={`mt-3 text-sm leading-7 ${
          darkMode ? "text-gray-400" : "text-slate-500"
        }`}
      >
        {text}
      </p>
    </article>
  );
}

/* =========================
   STEP CARD
========================= */

function StepCard({ number, title, text, darkMode }) {
  return (
    <article
      className={`relative rounded-3xl border p-6 ${
        darkMode
          ? "border-white/10 bg-[#0d1914]"
          : "border-emerald-100 bg-white shadow-sm"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl text-xs font-black ${
          darkMode
            ? "bg-emerald-500/10 text-emerald-300"
            : "bg-emerald-50 text-emerald-700"
        }`}
      >
        {number}
      </div>

      <h3 className="mt-6 font-bold">{title}</h3>

      <p
        className={`mt-2 text-sm leading-6 ${
          darkMode ? "text-gray-400" : "text-slate-500"
        }`}
      >
        {text}
      </p>
    </article>
  );
}
