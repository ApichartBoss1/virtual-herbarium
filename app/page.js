"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useSiteSettings } from "@/components/SiteSettingsContext";

export default function HomePage() {
  const { language } = useSiteSettings();

  const isEnglish = language === "EN";

  return (
    <main className="page">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-900/20" />

          <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-lime-200/30 blur-3xl dark:bg-lime-900/20" />
        </div>

        <div className="container relative">
          <div className="grid min-h-[calc(100vh-80px)] items-center gap-12 py-16 lg:grid-cols-2 lg:py-20">
            {/* LEFT */}
            <div>
              <span className="badge badge-green">
                🌿 {isEnglish ? "Virtual Herbarium" : "คลังพรรณไม้ดิจิทัล"}
              </span>

              <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                {isEnglish ? (
                  <>
                    Discover the
                    <span className="block text-emerald-600 dark:text-emerald-400">
                      World of Plants
                    </span>
                  </>
                ) : (
                  <>
                    สำรวจโลกของ
                    <span className="block text-emerald-600 dark:text-emerald-400">
                      พรรณไม้
                    </span>
                  </>
                )}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)] sm:text-xl">
                {isEnglish
                  ? "Explore botanical information and discover plant specimens collected and preserved in the Virtual Herbarium."
                  : "สำรวจข้อมูลทางพฤกษศาสตร์และค้นพบตัวอย่างพรรณไม้ที่ได้รับการรวบรวมและจัดเก็บไว้ใน Virtual Herbarium"}
              </p>

              {/* BUTTONS */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/plants"
                  className="btn btn-primary px-7 py-3.5 text-base"
                >
                  🌱 {isEnglish ? "Explore Plants" : "สำรวจพรรณไม้"}
                </Link>

                <a
                  href="#about"
                  className="btn btn-secondary px-7 py-3.5 text-base"
                >
                  {isEnglish ? "Learn More" : "เรียนรู้เพิ่มเติม"}
                </a>
              </div>

              {/* STATS */}
              <div className="mt-12 grid max-w-xl grid-cols-3 gap-4">
                <Stat
                  number="🌿"
                  label={isEnglish ? "Plant Collection" : "พรรณไม้"}
                />

                <Stat
                  number="🔬"
                  label={isEnglish ? "Botanical Data" : "ข้อมูลพฤกษศาสตร์"}
                />

                <Stat
                  number="🌎"
                  label={isEnglish ? "Digital Archive" : "คลังดิจิทัล"}
                />
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto aspect-square max-w-xl">
                <div className="absolute inset-8 rounded-[3rem] border border-white/60 bg-white/60 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5" />

                <div className="absolute inset-16 flex items-center justify-center">
                  <div className="flex h-full w-full items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-emerald-100 via-white to-lime-100 dark:from-emerald-950/50 dark:via-gray-900 dark:to-lime-950/40">
                    <div className="text-center">
                      <div className="text-[9rem] leading-none">🌿</div>

                      <p className="mt-6 text-xl font-bold text-emerald-800 dark:text-emerald-300">
                        Virtual Herbarium
                      </p>

                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {isEnglish
                          ? "Digital Plant Collection"
                          : "คลังพรรณไม้ดิจิทัล"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute left-0 top-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xl dark:bg-emerald-900/40">
                      🌱
                    </div>

                    <div>
                      <p className="text-xs text-[var(--muted)]">
                        {isEnglish ? "Collection" : "คลังข้อมูล"}
                      </p>

                      <p className="font-bold">Plants</p>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-20 right-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-100 text-xl dark:bg-lime-900/40">
                      🔬
                    </div>

                    <div>
                      <p className="text-xs text-[var(--muted)]">
                        {isEnglish ? "Information" : "ข้อมูล"}
                      </p>

                      <p className="font-bold">Botanical</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="section border-t border-[var(--border)] bg-[var(--surface-soft)]"
      >
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <span className="badge badge-green">
              🌿{" "}
              {isEnglish
                ? "About Virtual Herbarium"
                : "เกี่ยวกับ Virtual Herbarium"}
            </span>

            <h2 className="section-title mt-5">
              {isEnglish
                ? "A modern digital herbarium"
                : "คลังพรรณไม้ดิจิทัลที่ทันสมัย"}
            </h2>

            <p className="section-subtitle">
              {isEnglish
                ? "Virtual Herbarium provides an easy and beautiful way to explore plant specimens and botanical information through a digital platform."
                : "Virtual Herbarium ช่วยให้การค้นหาและศึกษาตัวอย่างพรรณไม้และข้อมูลทางพฤกษศาสตร์เป็นเรื่องง่าย ผ่านระบบคลังข้อมูลดิจิทัล"}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon="🌱"
              title={isEnglish ? "Plant Collection" : "คลังพรรณไม้"}
              description={
                isEnglish
                  ? "Browse plant specimens collected and preserved in the digital herbarium."
                  : "ค้นหาตัวอย่างพรรณไม้ที่รวบรวมและจัดเก็บไว้ในคลังดิจิทัล"
              }
            />

            <FeatureCard
              icon="🔬"
              title={isEnglish ? "Botanical Information" : "ข้อมูลพฤกษศาสตร์"}
              description={
                isEnglish
                  ? "Explore scientific names, families, locations and collection information."
                  : "ศึกษาชื่อวิทยาศาสตร์ วงศ์ สถานที่พบ และข้อมูลการเก็บตัวอย่าง"
              }
            />

            <FeatureCard
              icon="🌎"
              title={isEnglish ? "Easy Access" : "เข้าถึงง่าย"}
              description={
                isEnglish
                  ? "Access botanical information through a clean and user-friendly interface."
                  : "เข้าถึงข้อมูลทางพฤกษศาสตร์ผ่านระบบที่ใช้งานง่ายและสวยงาม"
              }
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container py-10">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-[var(--muted)] sm:flex-row">
            <div>
              <p className="font-bold text-[var(--foreground)]">
                🌿 Virtual Herbarium
              </p>

              <p className="mt-1">
                {isEnglish ? "Digital Plant Collection" : "คลังพรรณไม้ดิจิทัล"}
              </p>
            </div>

            <div className="flex gap-5">
              <Link href="/" className="hover:text-emerald-600">
                {isEnglish ? "Home" : "หน้าแรก"}
              </Link>

              <Link href="/plants" className="hover:text-emerald-600">
                {isEnglish ? "Plants" : "พรรณไม้"}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* =========================================
   STAT
========================================= */

function Stat({ number, label }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center shadow-sm">
      <div className="text-2xl">{number}</div>

      <p className="mt-2 text-xs font-semibold text-[var(--muted)]">{label}</p>
    </div>
  );
}

/* =========================================
   FEATURE CARD
========================================= */

function FeatureCard({ icon, title, description }) {
  return (
    <div className="card group p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl transition group-hover:scale-105 dark:bg-emerald-900/40">
        {icon}
      </div>

      <h3 className="mt-6 text-xl font-bold">{title}</h3>

      <p className="mt-3 leading-7 text-[var(--muted)]">{description}</p>
    </div>
  );
}
