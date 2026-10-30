"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { useBio3D } from "@/components/bio/bio3dGate";

/* =========================================================
   BIO BACKGROUND MOUNT
   Client wrapper so the root layout (a server component) can
   load the WebGL background without SSR. Pages with tables or
   forms get the calmer setting.

   โหลดตามกติกาใน bio3dGate (ไม่โหลดบนจอแคบ / reduced motion /
   data saver และโหลดหลังหน้าเสร็จแล้วเท่านั้น)
   ตอนไม่มี 3D หน้าใช้พื้นหลังเรียบของ html/body
   (สีกระดาษตามธีม + ลายกระดาษใน globals.css)
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

  const show3D = useBio3D();

  if (!show3D) return null;

  const calm = CALM_ROUTES.some((route) => route.test(pathname));

  return <BioBackground intensity={calm ? "calm" : "normal"} />;
}
