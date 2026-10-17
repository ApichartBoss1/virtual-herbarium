"use client";

import BioHeroLazy from "@/components/BioHeroLazy";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
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
  const { language } = useSiteSettings();

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

        record1Text: "Scientific name, family, and plant group",

        record2Title: "Collection location",

        record2Text: "Locality, latitude, and longitude",

        record3Title: "Field information",

        record3Text: "Elevation, map location, and specimen photo",

        record4Title: "Specimen information",

        record4Text: "Collector, collector number, and PNU number",

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

        step1Title: "System Administrator",

        step1Text: "Manage plant specimen records.",

        step2Title: "Add information",

        step2Text: "Attach image, names, place, and key details.",

        step3Title: "Admin data storage",

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
          "ตัวอย่างพรรณไม้หนึ่งตัวอย่างสามารถเก็บข้อมูลสำคัญไว้ได้มากมาย ไม่ว่าจะเป็นชื่อวิทยาศาสตร์ วงศ์ สถานที่และพิกัดที่พบ ระดับความสูง ภาพถ่าย และผู้เก็บตัวอย่าง",

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

        record1Text: "ชื่อวิทยาศาสตร์ วงศ์ และกลุ่มพืช",

        record2Title: "พื้นที่เก็บตัวอย่าง",

        record2Text: "สถานที่ ละติจูด และลองจิจูด",

        record3Title: "ข้อมูลภาคสนาม",

        record3Text: "ระดับความสูง ตำแหน่งบนแผนที่ และภาพถ่ายตัวอย่าง",

        record4Title: "ข้อมูลตัวอย่าง",

        record4Text: "ผู้เก็บ หมายเลขผู้เก็บ และหมายเลข PNU",

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

        step1Title: "แอดมินจัดการระบบ",

        step1Text: "จัดการบันทึกตัวอย่างพรรณไม้",

        step2Title: "แอดมินเพิ่มข้อมูลพรรณไม้",

        step2Text: "ใส่ภาพ ชื่อ สถานที่ และรายละเอียดสำคัญ",

        step3Title: "แอดมินจัดเก็บข้อมูล",

        step3Text: "บันทึกข้อมูลให้อยู่ในโครงสร้างเดียวกัน",

        step4Title: "ค้นหาและเรียนรู้",

        step4Text: "ค้นหาและเปิดดูรายละเอียดจากคลังพรรณไม้",

        footerText: "ธรรมชาติคือห้องเรียนที่งดงามและมีชีวิต",
      };

  /* =====================================================
     DATA
  ===================================================== */

  const records = [
    { icon: LeafIcon, title: t.record1Title, text: t.record1Text },
    { icon: PinIcon, title: t.record2Title, text: t.record2Text },
    { icon: FieldIcon, title: t.record3Title, text: t.record3Text },
    { icon: ArchiveIcon, title: t.record4Title, text: t.record4Text },
  ];

  const benefits = [
    { icon: DatabaseIcon, title: t.benefit1Title, text: t.benefit1Text },
    { icon: SearchIcon, title: t.benefit2Title, text: t.benefit2Text },
    { icon: BookIcon, title: t.benefit3Title, text: t.benefit3Text },
    { icon: EditIcon, title: t.benefit4Title, text: t.benefit4Text },
  ];

  const steps = [
    { icon: LeafIcon, title: t.step1Title, text: t.step1Text },
    { icon: ImageIcon, title: t.step2Title, text: t.step2Text },
    { icon: DatabaseIcon, title: t.step3Title, text: t.step3Text },
    { icon: SearchIcon, title: t.step4Title, text: t.step4Text },
  ];

  /* Thai script needs more line height than Latin display type */
  const displayLeading = isEN ? "" : "!leading-[1.3]";

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="flex min-h-[100dvh] flex-col overflow-x-hidden">
      <Navbar />

      {/* =====================================================
          HERO
      ===================================================== */}

      <header className="relative overflow-hidden border-b border-rule">
        <div
          aria-hidden="true"
          className="vh-grid-paper pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_30%_30%,black,transparent_70%)]"
        />

        <div className="vh-container relative py-14 md:py-20 lg:py-24">
          <div className="relative">
            {/* 3D leaf – right of the title, kept above the rule below it */}
            <div className="pointer-events-none absolute -bottom-12 -top-24 left-[max(60%,780px)] right-0 hidden xl:block">
              <BioHeroLazy variant="leaf" minWidth={1280} />
            </div>

            <div className="page-enter relative z-10 max-w-[860px]">
              <p className="vh-eyebrow flex items-center gap-3">
                <span className="h-px w-8 bg-ochre" />
                {t.heroEyebrow}
              </p>

              <p className="mt-6 font-serif text-[1.15rem] italic text-muted md:text-[1.3rem]">
                {t.heroMini}
              </p>

              <h1
                className={`vh-display mt-4 text-[2.6rem] min-[390px]:text-[3rem] md:text-[4.2rem] xl:text-[5rem] ${displayLeading}`}
              >
                <span className="block">{t.heroTitle1}</span>

                <span className="block italic text-moss">{t.heroTitle2}</span>
              </h1>
            </div>
          </div>

          <div className="mt-10 grid gap-8 border-t border-rule pt-8 md:mt-14 md:grid-cols-[180px_1fr] md:gap-12">
            <p className="vh-catalog pt-1">PL. I — VH</p>

            <p className="max-w-[640px] font-serif text-[1.2rem] leading-[1.7] text-ink-soft md:text-[1.35rem]">
              {t.heroText}
            </p>
          </div>
        </div>
      </header>

      {/* =====================================================
          PLATE
      ===================================================== */}

      <section className="vh-container pt-12 md:pt-16">
        <figure>
          <div className="relative aspect-[16/10] overflow-hidden rounded-[4px] border border-rule bg-paper-deep md:aspect-[21/8]">
            <img
              src={FOREST_HERO}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </figure>
      </section>

      {/* =====================================================
          STORY
      ===================================================== */}

      <section className="vh-container py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* HEADING */}

          <div>
            <div className="lg:sticky lg:top-28">
              <p className="vh-eyebrow flex items-center gap-3">
                <span className="h-px w-6 bg-ochre" />
                {t.storyEyebrow}
              </p>

              <h2
                className={`vh-display mt-4 text-[2rem] md:text-[2.6rem] ${displayLeading}`}
              >
                {t.storyTitle}
              </h2>
            </div>
          </div>

          {/* PROSE */}

          <div className="min-w-0">
            <div className="vh-prose max-w-[620px] space-y-5 md:text-[16px]">
              <p
                className={
                  isEN
                    ? "first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-[3.4rem] first-letter:leading-[0.9] first-letter:text-moss"
                    : ""
                }
              >
                {t.storyText1}
              </p>

              <p>{t.storyText2}</p>
            </div>

            {/* PULL QUOTE */}

            <blockquote className="my-10 max-w-[620px] border-l-2 border-ochre py-1 pl-6 md:my-12 md:pl-8">
              <p className="font-serif text-[1.6rem] italic leading-[1.35] text-ink md:text-[2rem]">
                {t.storyImageTitle}
              </p>

              <footer className="vh-eyebrow mt-4 !text-[10px]">
                {t.storyImageLabel}
              </footer>
            </blockquote>

            <p className="vh-prose max-w-[620px] md:text-[16px]">
              {t.storyText3}
            </p>

            {/* FIGURE */}

            <figure className="mt-10 max-w-[620px]">
              <div className="aspect-[4/3] overflow-hidden rounded-[4px] border border-rule bg-paper-deep">
                <img
                  src={STORY_IMAGE}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>

              <figcaption className="mt-3 flex items-center gap-3 border-t border-dashed border-rule-strong pt-3">
                <span className="vh-catalog">FIG. 1</span>

                <span className="text-[13px] italic text-muted">
                  {t.storyImageLabel}
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHAT WE RECORD
      ===================================================== */}

      <section className="border-y border-rule bg-sheet/60">
        <div className="vh-container py-16 md:py-24">
          <SectionHeading
            eyebrow={t.recordEyebrow}
            title={t.recordTitle}
            desc={t.recordDesc}
            leading={displayLeading}
          />

          <div className="vh-label-card mt-10 !p-0 md:mt-12">
            <dl className="relative grid sm:grid-cols-2">
              {records.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className={`flex gap-4 border-dashed border-rule-strong p-5 md:p-7 ${
                      index > 0 ? "border-t" : ""
                    } ${index === 1 ? "sm:border-t-0" : ""} ${
                      index % 2 === 1 ? "sm:border-l" : ""
                    }`}
                  >
                    <span className="font-mono text-[12px] text-ochre tabular-nums">
                      {String.fromCharCode(65 + index)}
                    </span>

                    <div className="min-w-0">
                      <dt className="flex items-center gap-2 font-serif text-[1.15rem] text-ink">
                        <Icon className="h-[18px] w-[18px] shrink-0 text-moss" />
                        {item.title}
                      </dt>

                      <dd className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
                        {item.text}
                      </dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </section>

      {/* =====================================================
          SYSTEM BENEFITS
      ===================================================== */}

      <section className="vh-container py-16 md:py-24">
        <SectionHeading
          eyebrow={t.benefitEyebrow}
          title={t.benefitTitle}
          desc={t.benefitDesc}
          leading={displayLeading}
        />

        <div className="mt-10 grid gap-x-10 sm:grid-cols-2 md:mt-12 lg:grid-cols-4">
          {benefits.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="border-t border-rule-strong py-6"
              >
                <Icon className="h-5 w-5 text-moss" />

                <h3 className="mt-4 font-serif text-[1.25rem] leading-snug text-ink">
                  {item.title}
                </h3>

                <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                  {item.text}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section className="border-t border-rule">
        <div className="vh-container py-16 md:py-24">
          <SectionHeading
            eyebrow={t.workEyebrow}
            title={t.workTitle}
            desc={t.workDesc}
            leading={displayLeading}
          />

          <ol className="mt-10 border-b border-rule md:mt-14">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <li
                  key={step.title}
                  className="grid grid-cols-[3rem_1fr] items-baseline gap-x-4 border-t border-rule py-7 md:grid-cols-[6rem_1fr_1.3fr_auto] md:gap-x-10 md:py-9"
                >
                  <span className="font-mono text-[1.1rem] text-ochre tabular-nums md:text-[1.4rem]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <h3 className="font-serif text-[1.4rem] leading-snug text-ink md:text-[1.75rem]">
                    {step.title}
                  </h3>

                  <p className="col-start-2 mt-2 text-[14px] leading-relaxed text-ink-soft md:col-start-auto md:mt-0 md:text-[15px]">
                    {step.text}
                  </p>

                  <Icon className="hidden h-5 w-5 self-center text-faint md:block" />
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* =====================================================
          CLOSING
      ===================================================== */}

      <section className="vh-container pb-20 pt-4 md:pb-28">
        <div className="mx-auto max-w-[720px] text-center">
          <div className="flex items-center justify-center gap-4 text-ochre">
            <span className="h-px w-10 bg-ochre" />
            <LeafIcon className="h-[18px] w-[18px]" />
            <span className="h-px w-10 bg-ochre" />
          </div>

          <p className="mt-6 font-serif text-[1.8rem] italic leading-[1.35] text-ink md:text-[2.4rem]">
            {t.footerText}
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({ eyebrow, title, desc, leading = "" }) {
  return (
    <div className="grid gap-5 md:grid-cols-[1fr_0.8fr] md:items-end md:gap-12">
      <div>
        <p className="vh-eyebrow flex items-center gap-3">
          <span className="h-px w-6 bg-ochre" />
          {eyebrow}
        </p>

        <h2 className={`vh-display mt-4 text-[2rem] md:text-[2.6rem] ${leading}`}>
          {title}
        </h2>
      </div>

      <p className="vh-prose max-w-[460px]">{desc}</p>
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
      strokeWidth="1.7"
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
      strokeWidth="1.7"
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
      strokeWidth="1.7"
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
      strokeWidth="1.7"
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
      strokeWidth="1.7"
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
      strokeWidth="1.7"
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
      strokeWidth="1.7"
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
      strokeWidth="1.7"
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
      strokeWidth="1.7"
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
