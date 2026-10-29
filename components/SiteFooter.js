"use client";

import Link from "next/link";

import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   SITE FOOTER
   Shared colophon for public pages
========================================================= */

export default function SiteFooter() {
  const { language } = useSiteSettings();

  const isEnglish = language === "EN";

  const t = isEnglish
    ? {
        tagline: "Nature is the greatest classroom.",
        collection: "Collection",
        about: "About",
        admin: "For administrators",
        rights: "All rights reserved.",
      }
    : {
        tagline: "ธรรมชาติ...คือห้องเรียนที่ดีที่สุด",
        collection: "คลังพรรณไม้",
        about: "เกี่ยวกับเรา",
        admin: "สำหรับผู้ดูแลระบบ",
        rights: "สงวนลิขสิทธิ์",
      };

  return (
    <footer className="mt-auto border-t border-rule">
      <div className="vh-container flex flex-col gap-6 py-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-serif text-[22px] leading-none text-ink">
            Virtual Herbarium
          </p>

          <p className="mt-2 font-serif text-[15px] italic text-muted">
            {t.tagline}
          </p>
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            <Link href="/plants" className="transition hover:text-moss">
              {t.collection}
            </Link>

            <Link href="/about" className="transition hover:text-moss">
              {t.about}
            </Link>
          </nav>

          <p className="vh-catalog">
            © {new Date().getFullYear()} Virtual Herbarium · {t.rights}
            {" · "}
            {/* ผู้ใช้ทั่วไปไม่ต้องล็อกอิน มีเพียงลิงก์เล็กสำหรับผู้ดูแลระบบ */}
            <Link href="/login" className="underline-offset-2 transition hover:text-moss hover:underline">
              {t.admin}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
