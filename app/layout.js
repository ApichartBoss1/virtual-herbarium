import {
  Fraunces,
  IBM_Plex_Mono,
  IBM_Plex_Sans_Thai,
  Noto_Serif_Thai,
} from "next/font/google";

import "./globals.css";
import BioBackgroundMount from "@/components/BioBackgroundMount";
import { SiteSettingsProvider } from "@/components/SiteSettingsContext";

/* =========================================================
   FONTS
   Fraunces        – display serif + italic binomials
   Noto Serif Thai – Thai fallback for the serif stack
   IBM Plex Sans   – body text (Thai + Latin)
   IBM Plex Mono   – catalogue numbers, captions
========================================================= */

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--font-display",
  display: "swap",
});

const serifThai = Noto_Serif_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "600"],
  variable: "--font-serif-thai",
  display: "swap",
});

const text = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-text",
  display: "swap",
});

const code = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-code",
  display: "swap",
});

export const metadata = {
  title: "Virtual Herbarium",
  description: "Digital Plant Collection",
};

/* Apply the saved theme before paint to avoid a flash */
const themeScript = `try{var d=localStorage.getItem("vh-dark-mode")==="true";var h=document.documentElement;h.classList.add(d?"dark":"light");h.dataset.theme=d?"dark":"light";}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${display.variable} ${serifThai.variable} ${text.variable} ${code.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>

      <body>
        <BioBackgroundMount />

        <SiteSettingsProvider>{children}</SiteSettingsProvider>
      </body>
    </html>
  );
}
