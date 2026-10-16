"use client";

import dynamic from "next/dynamic";

/* =========================================================
   BIO HERO (lazy)
   Client-only import of the 3D featured specimen.
========================================================= */

const BioHeroLazy = dynamic(() => import("@/components/BioHero"), {
  ssr: false,
});

export default BioHeroLazy;
