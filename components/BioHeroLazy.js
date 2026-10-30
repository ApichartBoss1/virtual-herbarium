"use client";

import dynamic from "next/dynamic";

import { useBio3D } from "@/components/bio/bio3dGate";

/* =========================================================
   BIO HERO (lazy)
   Client-only import of the 3D featured specimen.

   โหลดตามกติกาใน bio3dGate (ไม่โหลดบนจอแคบ / reduced motion /
   data saver และโหลดหลังหน้าเสร็จแล้วเท่านั้น)
   ระหว่างรอ หรือเมื่อไม่โหลด แสดงพื้นหลังเรียบ (ลายกระดาษกราฟจางๆ)
   แบบเดียวกับ fallback ใน BioHero
========================================================= */

/* เท่ากับ FADE_MASK ใน BioHero (ไฟล์นี้ import BioHero ตรงๆ ไม่ได้ เพราะจะดึง three มาด้วย) */
const FADE_MASK =
  "radial-gradient(ellipse 50% 50% at 50% 50%, black 55%, transparent 100%)";

const BioHero = dynamic(() => import("@/components/BioHero"), {
  ssr: false,
  loading: () => <BioHeroFallback />,
});

export default function BioHeroLazy({ minWidth = 768, opacity = 1, ...props }) {
  const show3D = useBio3D(minWidth);

  if (!show3D) return <BioHeroFallback opacity={opacity} />;

  return <BioHero minWidth={minWidth} opacity={opacity} {...props} />;
}

function BioHeroFallback({ opacity = 1 }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative h-full w-full"
      style={{ opacity, maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
    >
      <div className="vh-grid-paper absolute inset-0 opacity-40" />
    </div>
  );
}
