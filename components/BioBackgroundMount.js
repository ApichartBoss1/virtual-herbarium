"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

/* =========================================================
   BIO BACKGROUND MOUNT
   Client wrapper so the root layout (a server component) can
   load the WebGL background without SSR. Pages with tables or
   forms get the calmer setting.
========================================================= */

const BioBackground = dynamic(() => import("@/components/BioBackground"), {
  ssr: false,
});

const CALM_ROUTES = [
  /^\/account\/plants$/,
  /^\/account\/plants\/new$/,
  /^\/account\/plants\/[^/]+\/edit$/,
  /^\/account\/edit$/,
];

export default function BioBackgroundMount() {
  const pathname = usePathname() || "";

  const calm = CALM_ROUTES.some((route) => route.test(pathname));

  return <BioBackground intensity={calm ? "calm" : "normal"} />;
}
