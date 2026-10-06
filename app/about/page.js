"use client";

import Navbar from "@/components/Navbar";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   IMAGES
========================================================= */

const FOREST_HERO =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2200&q=90";

const STORY_IMAGE =
  "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&q=90";

/* =========================================================
   PAGE
========================================================= */

export default function AboutPage() {
  const { language, darkMode } = useSiteSettings();

  const isEN = language === "EN";

  /* =====================================================
     TEXT
  ===================================================== */

  const t = isEN
    ? {
        heroEyebrow: "ABOUT VIRTUAL HERBARIUM",

        heroMini: "The story behind the digital herbarium",

        heroTitle1: "From plant specimens",

        heroTitle2: "to digital knowledge",

        heroText:
          "Virtual Herbarium brings together plant specimens, photographs, field data, and botanical details in one place so information from nature becomes easier to search, study, and use again.",

        storyEyebrow: "OUR STORY",

        storyTitle:
          "A specimen can tell a bigger story than a plant name alone.",

        storyText1:
          "Each specimen carries more than identification. It keeps information about where it was found, when it was collected, the habitat it came from, and who collected it.",

        storyText2:
          "When these details are scattered, they become difficult to find and use. Virtual Herbarium gathers everything into one clear digital structure.",

        storyText3:
          "This makes botanical information easier to access for students, researchers, and anyone interested in nature.",

        storyImageLabel: "BOTANICAL STORY",

        storyImageTitle: "Nature contains knowledge waiting to be connected.",

        recordEyebrow: "WHAT WE RECORD",

        recordTitle: "Information inside one specimen record",

        recordDesc:
          "Each record is divided into clear groups, making information easier to read, review, and search.",

        record1Title: "Plant information",

        record1Text: "Common name, scientific name, and family",

        record2Title: "Collection location",

        record2Text: "Province, district, and collection site details",

        record3Title: "Field information",

        record3Text: "Date, elevation, and habitat details",

        record4Title: "Specimen information",

        record4Text: "Collector, specimen number, duplicates, and notes",

        benefitEyebrow: "SYSTEM BENEFITS",

        benefitTitle: "Benefits of Virtual Herbarium",

        benefitDesc:
          "The system keeps specimen data organized, searchable, and easy to use for learning.",

        benefit1Title: "Organized records",

        benefit1Text:
          "All specimen data is stored in one consistent structure.",

        benefit2Title: "Easy search",

        benefit2Text: "Search quickly by name, family, or location.",

        benefit3Title: "Easy learning",

        benefit3Text: "View images and plant information in one place.",

        benefit4Title: "Continuous updates",

        benefit4Text: "Information can be revised and maintained over time.",

        workEyebrow: "HOW IT WORKS",

        workTitle: "From recording to discovery",

        workDesc:
          "A simple flow turns raw specimen data into useful digital knowledge.",

        step1Title: "Create a record",

        step1Text: "Start a specimen record in the system.",

        step2Title: "Add information",

        step2Text: "Attach image, names, place, and key details.",

        step3Title: "Store data",

        step3Text: "Save information in a clear structured format.",

        step4Title: "Search and learn",

        step4Text: "Browse records and open detailed information easily.",

        footerText: "Nature is one of the best classrooms.",
      }
    : {
        heroEyebrow: "ABOUT VIRTUAL HERBARIUM",

        heroMini: "เรื่องราวของคลังพรรณไม้ดิจิทัล",

        heroTitle1: "จากตัวอย่างพรรณไม้",

        heroTitle2: "สู่องค์ความรู้ดิจิทัล",

        heroText:
          "Virtual Herbarium ถูกสร้างขึ้นเพื่อเชื่อมโยงตัวอย่างพรรณไม้ ภาพถ่าย ข้อมูลภาคสนาม และรายละเอียดทางพฤกษศาสตร์ให้อยู่ในพื้นที่เดียว เพื่อให้ข้อมูลจากธรรมชาติสามารถค้นหา เรียนรู้ และนำกลับมาใช้งานได้ง่ายขึ้น",

        storyEyebrow: "OUR STORY",

        storyTitle: "หนึ่งตัวอย่างพรรณไม้ บอกเรื่องราวได้มากกว่าชื่อของพืช",

        storyText1:
          "ตัวอย่างพรรณไม้หนึ่งตัวอย่างสามารถเก็บข้อมูลสำคัญไว้ได้มากมาย ไม่ว่าจะเป็นชื่อพรรณไม้ ชื่อวิทยาศาสตร์ วงศ์ สถานที่เก็บ วันที่เก็บ ระดับความสูง ถิ่นอาศัย และผู้เก็บตัวอย่าง",

        storyText2:
          "เมื่อข้อมูลเหล่านี้กระจัดกระจาย การค้นหาและการนำกลับมาใช้ย่อมทำได้ยาก Virtual Herbarium จึงรวบรวมทุกองค์ประกอบให้อยู่ในรูปแบบดิจิทัลที่เป็นระบบเดียวกัน",

        storyText3:
          "ผลลัพธ์คือข้อมูลพรรณไม้ที่เข้าถึงง่ายขึ้น เหมาะทั้งกับการเรียนรู้ งานวิจัย และผู้ที่สนใจธรรมชาติทั่วไป",

        storyImageLabel: "BOTANICAL STORY",

        storyImageTitle: "ธรรมชาติหนึ่งพื้นที่ มีเรื่องราวและองค์ความรู้อีกมาก",

        recordEyebrow: "WHAT WE RECORD",

        recordTitle: "ข้อมูลที่อยู่ภายในหนึ่งระเบียน",

        recordDesc:
          "ทุกตัวอย่างถูกแบ่งข้อมูลออกเป็นหมวดที่ชัดเจน ทำให้อ่านง่าย ตรวจสอบง่าย และค้นหาสิ่งที่ต้องการได้รวดเร็ว",

        record1Title: "ข้อมูลพรรณไม้",

        record1Text: "ชื่อพรรณไม้ ชื่อวิทยาศาสตร์ และวงศ์",

        record2Title: "พื้นที่เก็บตัวอย่าง",

        record2Text: "จังหวัด อำเภอ และรายละเอียดของสถานที่",

        record3Title: "ข้อมูลภาคสนาม",

        record3Text: "วันที่เก็บ ระดับความสูง และลักษณะถิ่นอาศัย",

        record4Title: "ข้อมูลตัวอย่าง",

        record4Text: "ผู้เก็บ หมายเลขตัวอย่าง จำนวนสำเนา และบันทึกเพิ่มเติม",

        benefitEyebrow: "SYSTEM BENEFITS",

        benefitTitle: "ข้อดีของ Virtual Herbarium",

        benefitDesc:
          "ระบบช่วยให้ข้อมูลพรรณไม้เป็นระเบียบ ค้นหาได้ง่าย และนำกลับมาใช้เพื่อการเรียนรู้ได้สะดวก",

        benefit1Title: "ข้อมูลเป็นระบบ",

        benefit1Text: "จัดเก็บข้อมูลทุกตัวอย่างในรูปแบบเดียวกัน",

        benefit2Title: "ค้นหาได้ง่าย",

        benefit2Text: "ค้นหาจากชื่อ วงศ์ หรือสถานที่ได้รวดเร็ว",

        benefit3Title: "เรียนรู้ได้สะดวก",

        benefit3Text: "ดูภาพและข้อมูลพรรณไม้ได้ในหน้าเดียว",

        benefit4Title: "ดูแลข้อมูลต่อเนื่อง",

        benefit4Text: "สามารถกลับมาแก้ไขและปรับปรุงข้อมูลได้",

        workEyebrow: "HOW IT WORKS",

        workTitle: "จากการบันทึก สู่การค้นพบ",

        workDesc:
          "ข้อมูลหนึ่งระเบียนผ่านขั้นตอนที่เรียบง่าย ก่อนกลายเป็นองค์ความรู้ที่สามารถค้นหาและเปิดดูได้ง่าย",

        step1Title: "สร้างระเบียน",

        step1Text: "เริ่มต้นบันทึกตัวอย่างพรรณไม้เข้าสู่ระบบ",

        step2Title: "เพิ่มข้อมูล",

        step2Text: "ใส่ภาพ ชื่อ สถานที่ และรายละเอียดสำคัญ",

        step3Title: "จัดเก็บข้อมูล",

        step3Text: "บันทึกข้อมูลให้อยู่ในโครงสร้างเดียวกัน",

        step4Title: "ค้นหาและเรียนรู้",

        step4Text: "ค้นหาและเปิดดูรายละเอียดจากคลังพรรณไม้",

        footerText: "ธรรมชาติคือห้องเรียนที่งดงามและมีชีวิต",
      };

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#eef4ec]">
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("${FOREST_HERO}")`,
        }}
      />

      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 ${
          darkMode
            ? "bg-[linear-gradient(180deg,rgba(3,12,8,0.86)_0%,rgba(7,19,13,0.74)_35%,rgba(5,13,10,0.88)_100%)]"
            : "bg-[linear-gradient(180deg,rgba(244,248,241,0.86)_0%,rgba(240,246,237,0.80)_38%,rgba(232,240,230,0.92)_100%)]"
        }`}
      />

      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-0 h-52 ${
          darkMode
            ? "bg-gradient-to-t from-[#031008] via-[#031008]/70 to-transparent"
            : "bg-gradient-to-t from-[#edf4ec] via-[#edf4ec]/78 to-transparent"
        }`}
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="relative z-10">
        <Navbar />

        <div className="container mx-auto max-w-7xl px-4 pb-8 pt-5 md:px-6 md:pb-10 md:pt-8 lg:px-8">
          {/* =================================================
              HERO
          ================================================= */}

          <section className="mb-5 md:mb-8 lg:mb-10">
            <div
              className={`relative overflow-hidden rounded-[24px] border px-5 py-6 shadow-[0_20px_55px_rgba(0,0,0,0.07)] backdrop-blur-xl md:rounded-[26px] md:px-7 md:py-8 lg:px-9 lg:py-9 ${
                darkMode
                  ? "border-white/10 bg-[#07130d]/70"
                  : "border-white/70 bg-white/68"
              }`}
            >
              {/* GLOW */}

              <div
                aria-hidden="true"
                className={`pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-3xl ${
                  darkMode ? "bg-emerald-400/[0.07]" : "bg-emerald-600/[0.06]"
                }`}
              />

              <div className="relative">
                <SectionEyebrow darkMode={darkMode} text={t.heroEyebrow} />

                <div className="mt-5 grid gap-5 md:mt-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-10">
                  {/* LEFT */}

                  <div className="min-w-0">
                    <p
                      className={`mb-2.5 text-[10px] font-bold tracking-[0.13em] md:mb-3 md:text-[11px] ${
                        darkMode ? "text-emerald-300" : "text-emerald-800"
                      }`}
                    >
                      {t.heroMini}
                    </p>

                    <h1
                      className={`max-w-3xl text-[2.05rem] font-black leading-[1.04] tracking-[-0.05em] min-[390px]:text-[2.25rem] md:text-[3rem] lg:text-[3.8rem] ${
                        darkMode ? "text-white" : "text-[#132818]"
                      }`}
                    >
                      <span className="block">{t.heroTitle1}</span>

                      <span
                        className={`mt-1 block ${
                          darkMode ? "text-emerald-300" : "text-emerald-800"
                        }`}
                      >
                        {t.heroTitle2}
                      </span>
                    </h1>
                  </div>

                  {/* RIGHT */}

                  <div
                    className={`min-w-0 border-t pt-4 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0 ${
                      darkMode ? "border-white/10" : "border-emerald-950/10"
                    }`}
                  >
                    <p
                      className={`max-w-xl text-[12px] leading-[1.9] min-[390px]:text-[13px] md:text-[14px] md:leading-7 lg:text-[15px] lg:leading-8 ${
                        darkMode ? "text-white/70" : "text-[#516557]"
                      }`}
                    >
                      {t.heroText}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              STORY
          ================================================= */}

          <section className="mb-5 md:mb-8 lg:mb-10">
            <div className="grid items-stretch gap-3.5 md:gap-4 lg:grid-cols-2 lg:gap-5">
              {/* IMAGE */}

              <GlassPanel darkMode={darkMode} className="overflow-hidden p-1.5">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] md:aspect-[16/11] md:rounded-[20px] lg:h-full lg:min-h-[430px] lg:aspect-auto">
                  <img
                    src={STORY_IMAGE}
                    alt=""
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,15,9,0.04)_12%,rgba(4,15,9,0.88)_100%)]" />

                  <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                    <p className="text-[8px] font-extrabold tracking-[0.18em] text-emerald-300 md:text-[9px]">
                      {t.storyImageLabel}
                    </p>

                    <h3 className="mt-2.5 max-w-md text-[17px] font-black leading-7 text-white md:mt-3 md:text-[1.45rem] md:leading-8">
                      {t.storyImageTitle}
                    </h3>
                  </div>
                </div>
              </GlassPanel>

              {/* CONTENT */}

              <GlassPanel
                darkMode={darkMode}
                className="flex flex-col justify-center p-5 md:p-7 lg:min-h-[430px] lg:p-8"
              >
                <SectionEyebrow darkMode={darkMode} text={t.storyEyebrow} />

                <h2
                  className={`mt-4 text-[1.6rem] font-black leading-[1.18] tracking-[-0.04em] min-[390px]:text-[1.72rem] md:mt-5 md:text-[2.15rem] ${
                    darkMode ? "text-white" : "text-[#132818]"
                  }`}
                >
                  {t.storyTitle}
                </h2>

                <div
                  className={`mt-4 space-y-3.5 text-[11px] leading-[1.9] min-[390px]:text-[12px] md:mt-5 md:space-y-4 md:text-[13px] md:leading-7 lg:text-[14px] ${
                    darkMode ? "text-white/66" : "text-[#526658]"
                  }`}
                >
                  <p>{t.storyText1}</p>

                  <p>{t.storyText2}</p>

                  <p>{t.storyText3}</p>
                </div>
              </GlassPanel>
            </div>
          </section>

          {/* =================================================
              WHAT WE RECORD
          ================================================= */}

          <section className="mb-5 md:mb-8 lg:mb-10">
            <SectionBlock
              darkMode={darkMode}
              eyebrow={t.recordEyebrow}
              title={t.recordTitle}
              desc={t.recordDesc}
            >
              <div className="mt-5 grid grid-cols-2 items-stretch gap-2.5 md:mt-7 md:gap-3 lg:grid-cols-4 lg:gap-3.5">
                <FeatureCard
                  darkMode={darkMode}
                  icon={
                    <LeafIcon className="h-[17px] w-[17px] lg:h-5 lg:w-5" />
                  }
                  title={t.record1Title}
                  text={t.record1Text}
                />

                <FeatureCard
                  darkMode={darkMode}
                  icon={<PinIcon className="h-[17px] w-[17px] lg:h-5 lg:w-5" />}
                  title={t.record2Title}
                  text={t.record2Text}
                />

                <FeatureCard
                  darkMode={darkMode}
                  icon={
                    <FieldIcon className="h-[17px] w-[17px] lg:h-5 lg:w-5" />
                  }
                  title={t.record3Title}
                  text={t.record3Text}
                />

                <FeatureCard
                  darkMode={darkMode}
                  icon={
                    <ArchiveIcon className="h-[17px] w-[17px] lg:h-5 lg:w-5" />
                  }
                  title={t.record4Title}
                  text={t.record4Text}
                />
              </div>
            </SectionBlock>
          </section>

          {/* =================================================
              SYSTEM BENEFITS
          ================================================= */}

          <section className="mb-5 md:mb-8 lg:mb-10">
            <SectionBlock
              darkMode={darkMode}
              eyebrow={t.benefitEyebrow}
              title={t.benefitTitle}
              desc={t.benefitDesc}
            >
              <div className="mt-5 grid grid-cols-2 items-stretch gap-2.5 md:mt-7 md:gap-3 lg:grid-cols-4 lg:gap-3.5">
                <FeatureCard
                  darkMode={darkMode}
                  icon={
                    <DatabaseIcon className="h-[17px] w-[17px] lg:h-5 lg:w-5" />
                  }
                  title={t.benefit1Title}
                  text={t.benefit1Text}
                />

                <FeatureCard
                  darkMode={darkMode}
                  icon={
                    <SearchIcon className="h-[17px] w-[17px] lg:h-5 lg:w-5" />
                  }
                  title={t.benefit2Title}
                  text={t.benefit2Text}
                />

                <FeatureCard
                  darkMode={darkMode}
                  icon={
                    <BookIcon className="h-[17px] w-[17px] lg:h-5 lg:w-5" />
                  }
                  title={t.benefit3Title}
                  text={t.benefit3Text}
                />

                <FeatureCard
                  darkMode={darkMode}
                  icon={
                    <EditIcon className="h-[17px] w-[17px] lg:h-5 lg:w-5" />
                  }
                  title={t.benefit4Title}
                  text={t.benefit4Text}
                />
              </div>
            </SectionBlock>
          </section>

          {/* =================================================
              HOW IT WORKS
          ================================================= */}

          <section className="mb-6 md:mb-8 lg:mb-10">
            <SectionBlock
              darkMode={darkMode}
              eyebrow={t.workEyebrow}
              title={t.workTitle}
              desc={t.workDesc}
            >
              <div className="mt-5 grid grid-cols-2 items-stretch gap-2.5 md:mt-7 md:gap-3 lg:grid-cols-4 lg:gap-3.5">
                <WorkflowCard
                  darkMode={darkMode}
                  number="01"
                  icon={
                    <LeafIcon className="h-[17px] w-[17px] lg:h-5 lg:w-5" />
                  }
                  title={t.step1Title}
                  text={t.step1Text}
                />

                <WorkflowCard
                  darkMode={darkMode}
                  number="02"
                  icon={
                    <ImageIcon className="h-[17px] w-[17px] lg:h-5 lg:w-5" />
                  }
                  title={t.step2Title}
                  text={t.step2Text}
                />

                <WorkflowCard
                  darkMode={darkMode}
                  number="03"
                  icon={
                    <DatabaseIcon className="h-[17px] w-[17px] lg:h-5 lg:w-5" />
                  }
                  title={t.step3Title}
                  text={t.step3Text}
                />

                <WorkflowCard
                  darkMode={darkMode}
                  number="04"
                  icon={
                    <SearchIcon className="h-[17px] w-[17px] lg:h-5 lg:w-5" />
                  }
                  title={t.step4Title}
                  text={t.step4Text}
                />
              </div>
            </SectionBlock>
          </section>
        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer
          className={`border-t ${
            darkMode ? "border-white/10" : "border-emerald-950/10"
          }`}
        >
          <div className="container mx-auto max-w-7xl px-4 py-5 md:px-6 lg:px-8">
            <div
              className={`rounded-[18px] border px-4 py-3.5 md:px-5 ${
                darkMode
                  ? "border-white/10 bg-[#07130d]/70"
                  : "border-white/70 bg-white/68"
              }`}
            >
              <div className="flex flex-col items-center justify-between gap-2.5 text-center md:flex-row md:text-left">
                <div>
                  <p
                    className={`text-[12px] font-bold md:text-sm ${
                      darkMode ? "text-white" : "text-[#132818]"
                    }`}
                  >
                    Virtual Herbarium
                  </p>

                  <p
                    className={`mt-0.5 text-[9px] md:text-[10px] ${
                      darkMode ? "text-white/50" : "text-[#5e7062]"
                    }`}
                  >
                    © 2026 Virtual Herbarium. All rights reserved.
                  </p>
                </div>

                <div
                  className={`flex items-center gap-2 text-[9px] md:text-[11px] ${
                    darkMode ? "text-white/60" : "text-[#5b6e5f]"
                  }`}
                >
                  <LeafIcon className="h-3.5 w-3.5 text-emerald-600" />

                  <span>{t.footerText}</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

/* =========================================================
   GLASS PANEL
========================================================= */

function GlassPanel({ darkMode, className = "", children }) {
  return (
    <div
      className={`rounded-[22px] border shadow-[0_14px_40px_rgba(0,0,0,0.05)] backdrop-blur-xl md:rounded-[24px] ${
        darkMode
          ? "border-white/10 bg-[#07130d]/70"
          : "border-white/70 bg-white/68"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* =========================================================
   SECTION BLOCK
========================================================= */

function SectionBlock({ darkMode, eyebrow, title, desc, children }) {
  return (
    <GlassPanel
      darkMode={darkMode}
      className="p-4 min-[390px]:p-[18px] md:p-5 lg:p-7"
    >
      <SectionEyebrow darkMode={darkMode} text={eyebrow} />

      <div className="mt-3.5 max-w-4xl md:mt-4">
        <h2
          className={`text-[1.5rem] font-black leading-[1.16] tracking-[-0.04em] min-[390px]:text-[1.65rem] md:text-[1.95rem] lg:text-[2.15rem] ${
            darkMode ? "text-white" : "text-[#132818]"
          }`}
        >
          {title}
        </h2>

        <p
          className={`mt-2 max-w-3xl text-[11px] leading-5 min-[390px]:text-[12px] md:mt-2.5 md:text-[13px] md:leading-6 ${
            darkMode ? "text-white/60" : "text-[#536759]"
          }`}
        >
          {desc}
        </p>
      </div>

      {children}
    </GlassPanel>
  );
}

/* =========================================================
   SECTION EYEBROW
========================================================= */

function SectionEyebrow({ darkMode, text }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
      <span
        className={`h-1 w-8 shrink-0 rounded-full md:h-[5px] md:w-10 ${
          darkMode ? "bg-emerald-400" : "bg-emerald-700"
        }`}
      />

      <span
        className={`min-w-0 text-[8px] font-extrabold uppercase tracking-[0.19em] min-[390px]:text-[9px] md:text-[10px] md:tracking-[0.22em] ${
          darkMode ? "text-emerald-300" : "text-emerald-800"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({ darkMode, icon, title, text }) {
  return (
    <article
      className={`group flex h-full min-h-[142px] min-w-0 flex-col rounded-[16px] border p-3 transition duration-300 min-[390px]:min-h-[146px] min-[390px]:p-3.5 md:min-h-[150px] md:rounded-[18px] md:p-4 lg:min-h-[158px] lg:rounded-[20px] lg:p-5 lg:hover:-translate-y-1 ${
        darkMode
          ? "border-white/10 bg-white/[0.035] hover:border-emerald-300/20 hover:bg-white/[0.055]"
          : "border-emerald-950/[0.07] bg-white/78 shadow-[0_8px_24px_rgba(25,55,34,0.04)] hover:border-emerald-800/20 hover:bg-white/90"
      }`}
    >
      {/* ICON */}

      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] min-[390px]:h-9 min-[390px]:w-9 min-[390px]:rounded-[11px] lg:h-10 lg:w-10 lg:rounded-[12px] ${
          darkMode
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-emerald-800/[0.075] text-emerald-800"
        }`}
      >
        {icon}
      </div>

      {/* CONTENT */}

      <div className="mt-3 min-w-0 min-[390px]:mt-3.5 lg:mt-4">
        <h3
          className={`break-words text-[10.5px] font-black leading-[1.45] min-[390px]:text-[11px] md:text-[12px] lg:text-[13px] ${
            darkMode ? "text-white" : "text-[#192d20]"
          }`}
        >
          {title}
        </h3>

        <p
          className={`mt-1 break-words text-[8.5px] leading-[1.55] min-[390px]:text-[9px] md:text-[10px] lg:mt-1.5 lg:text-[11px] lg:leading-[1.65] ${
            darkMode ? "text-white/52" : "text-[#718078]"
          }`}
        >
          {text}
        </p>
      </div>
    </article>
  );
}

/* =========================================================
   WORKFLOW CARD
========================================================= */

function WorkflowCard({ darkMode, icon, number, title, text }) {
  return (
    <article
      className={`group flex h-full min-h-[142px] min-w-0 flex-col rounded-[16px] border p-3 transition duration-300 min-[390px]:min-h-[146px] min-[390px]:p-3.5 md:min-h-[150px] md:rounded-[18px] md:p-4 lg:min-h-[158px] lg:rounded-[20px] lg:p-5 lg:hover:-translate-y-1 ${
        darkMode
          ? "border-white/10 bg-white/[0.035] hover:border-emerald-300/20 hover:bg-white/[0.055]"
          : "border-emerald-950/[0.07] bg-white/78 shadow-[0_8px_24px_rgba(25,55,34,0.04)] hover:border-emerald-800/20 hover:bg-white/90"
      }`}
    >
      {/* TOP */}

      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] min-[390px]:h-9 min-[390px]:w-9 min-[390px]:rounded-[11px] lg:h-10 lg:w-10 lg:rounded-[12px] ${
            darkMode
              ? "bg-emerald-400/10 text-emerald-300"
              : "bg-emerald-800/[0.075] text-emerald-800"
          }`}
        >
          {icon}
        </div>

        <span
          className={`pt-0.5 text-[7px] font-black tracking-[0.15em] min-[390px]:text-[8px] lg:text-[9px] lg:tracking-[0.18em] ${
            darkMode ? "text-emerald-300/65" : "text-emerald-700/65"
          }`}
        >
          {number}
        </span>
      </div>

      {/* CONTENT */}

      <div className="mt-3 min-w-0 min-[390px]:mt-3.5 lg:mt-4">
        <h3
          className={`break-words text-[10.5px] font-black leading-[1.45] min-[390px]:text-[11px] md:text-[12px] lg:text-[13px] ${
            darkMode ? "text-white" : "text-[#192d20]"
          }`}
        >
          {title}
        </h3>

        <p
          className={`mt-1 break-words text-[8.5px] leading-[1.55] min-[390px]:text-[9px] md:text-[10px] lg:mt-1.5 lg:text-[11px] lg:leading-[1.65] ${
            darkMode ? "text-white/52" : "text-[#718078]"
          }`}
        >
          {text}
        </p>
      </div>
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

function PinIcon({ className = "" }) {
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

function FieldIcon({ className = "" }) {
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
      <path d="m4 20 4-8 4 5 3-4 5 7Z" />

      <path d="M5 7h14" />

      <path d="M8 4v6" />

      <path d="M16 4v6" />
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
      <path d="M4 7h16" />

      <path d="M5 7v13h14V7" />

      <path d="M3 3h18v4H3z" />

      <path d="M9 11h6" />
    </svg>
  );
}

function DatabaseIcon({ className = "" }) {
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
      <ellipse cx="12" cy="5" rx="8" ry="3" />

      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />

      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
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
