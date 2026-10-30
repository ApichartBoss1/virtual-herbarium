"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import { fetchMapPoints } from "@/lib/mapQueries";
import { useLeafletMap } from "@/lib/useLeafletMap";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

/* =========================================================
   COLLECTION MAP (/map)
   หมุดของพรรณไม้ทุกรายการที่มีพิกัด จัดกลุ่มด้วย leaflet.markercluster
   - แผนที่สร้างด้วย useLeafletMap เท่านั้น
   - markercluster เป็นปลั๊กอินแบบเก่าที่หา L จาก global
     จึงตั้ง window.L ก่อน import("leaflet.markercluster")
   - หลายรายการที่พิกัดเดียวกันกางออกด้วย spiderfy
========================================================= */

/* ขอบเขตประเทศไทยสำหรับมุมมองเริ่มต้น */
const THAILAND_BOUNDS = [
  [5.6, 97.3],
  [20.5, 105.7],
];

const TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const TILE_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

const text = {
  TH: {
    title: "แผนที่พรรณไม้",
    summary: (shown, total) =>
      `แสดง ${shown} รายการที่มีพิกัด จากทั้งหมด ${total} รายการ`,
    loading: "กำลังโหลดตำแหน่งพรรณไม้...",
    empty: "ยังไม่มีรายการที่มีพิกัด",
    emptyDescription: "รายการที่บันทึกละติจูดและลองจิจูดไว้จะแสดงบนแผนที่นี้",
    error: "ไม่สามารถโหลดข้อมูลแผนที่ได้",
    retry: "ลองอีกครั้ง",
    mapLabel: "แผนที่ตำแหน่งเก็บตัวอย่างพรรณไม้",
    viewDetails: "ดูรายละเอียด",
    unknownName: "ไม่ระบุชื่อ",
  },
  EN: {
    title: "Collection Map",
    summary: (shown, total) =>
      `Showing ${shown} records with coordinates out of ${total}`,
    loading: "Loading specimen locations...",
    empty: "No records with coordinates yet",
    emptyDescription: "Records with latitude and longitude will appear on this map.",
    error: "Unable to load map data",
    retry: "Try Again",
    mapLabel: "Map of specimen collection locations",
    viewDetails: "View details",
    unknownName: "Unnamed",
  },
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

export default function CollectionMapPage() {
  const router = useRouter();

  const { language } = useSiteSettings();

  const t = language === "EN" ? text.EN : text.TH;

  /* popup สร้างตอนเปิด จึงอ่านข้อความและ router ล่าสุดจาก ref */
  const popupContextRef = useRef({ t, router });

  useEffect(() => {
    popupContextRef.current = { t, router };
  });

  /* =====================================================
     DATA
  ===================================================== */

  /* { status: "loading" | "ready" | "error", points, total, invalidCount } */
  const [data, setData] = useState({ status: "loading", points: [], total: 0, invalidCount: 0 });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    fetchMapPoints()
      .then((result) => {
        if (active) setData({ status: "ready", ...result });
      })
      .catch((err) => {
        console.error("Fetch map points error:", err);

        if (active) setData({ status: "error", points: [], total: 0, invalidCount: 0 });
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  function retry() {
    setData({ status: "loading", points: [], total: 0, invalidCount: 0 });
    setReloadKey((key) => key + 1);
  }

  /* =====================================================
     MAP
  ===================================================== */

  const containerRef = useRef(null);

  const { L, map } = useLeafletMap(containerRef, {
    options: {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: false,
      worldCopyJump: true,
    },

    setup: (Leaflet, createdMap) => {
      createdMap.fitBounds(THAILAND_BOUNDS);

      Leaflet.tileLayer(TILE_URL, {
        maxZoom: 19,
        attribution: TILE_ATTRIBUTION,
      }).addTo(createdMap);
    },
  });

  /* "loading" ระหว่างเพิ่มหมุด, "ready" เมื่อหมุดอยู่บนแผนที่ครบแล้ว */
  const [markersState, setMarkersState] = useState({ forPoints: null, ready: false });

  useEffect(() => {
    if (!L || !map || data.status !== "ready") return;

    let cancelled = false;

    let clusterGroup = null;

    async function addMarkers() {
      try {
        /* ปลั๊กอินเพิ่ม L.markerClusterGroup ให้ L ที่อยู่ใน window */
        window.L = L;

        await import("leaflet.markercluster");

        if (cancelled) return;

        const icon = L.divIcon({
          className: "vh-map-pin",
          html: '<span class="vh-map-pin-dot"></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -10],
        });

        clusterGroup = L.markerClusterGroup({
          chunkedLoading: true,
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
          zoomToBoundsOnClick: true,
          maxClusterRadius: 50,
        });

        const markers = data.points.map((point) => {
          const marker = L.marker([point.latitude, point.longitude], {
            icon,
            keyboard: true,
            title: point.pnu_no != null ? `PNU ${point.pnu_no}` : "",
          });

          marker.bindPopup(() => createPopup(point, popupContextRef.current), {
            minWidth: 180,
            maxWidth: 260,
          });

          return marker;
        });

        clusterGroup.addLayers(markers);

        map.addLayer(clusterGroup);

        setMarkersState({ forPoints: data.points, ready: true });
      } catch (err) {
        console.error("Add map markers error:", err);

        if (!cancelled) setData((current) => ({ ...current, status: "error" }));
      }
    }

    addMarkers();

    return () => {
      cancelled = true;

      if (clusterGroup) {
        clusterGroup.unspiderfy?.();

        map.removeLayer(clusterGroup);
      }
    };
  }, [L, map, data.status, data.points]);

  const markersReady =
    data.status === "ready" && markersState.ready && markersState.forPoints === data.points;

  const isEmpty = data.status === "ready" && data.points.length === 0;

  /* =====================================================
     PAGE
     มือถือ: หักหัวเว็บ 58px และแถบเมนูล่าง 78px (padding ของ body)
     เดสก์ท็อป: เต็มจอ โดยมี spacer 72px ของ Navbar อยู่ด้านบน
  ===================================================== */

  return (
    <main
      data-map-state={markersReady || isEmpty ? "ready" : data.status}
      className="flex h-[calc(100dvh_-_136px_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] flex-col overflow-hidden text-ink md:h-[100dvh]"
    >
      <Navbar />

      <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule bg-paper/90 px-4 py-2.5 backdrop-blur md:px-6">
        <h1 className="font-serif text-[1.15rem] leading-tight text-ink md:text-[1.3rem]">
          {t.title}
        </h1>

        <p data-map-summary className="font-mono text-[12px] tabular-nums text-muted">
          {data.status === "ready"
            ? t.summary(formatNumber(data.points.length), formatNumber(data.total))
            : data.status === "loading"
              ? t.loading
              : t.error}
        </p>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          aria-label={t.mapLabel}
          className="vh-collection-map absolute inset-0 z-0 dark:[&_.leaflet-tile-pane]:brightness-[0.78] dark:[&_.leaflet-tile-pane]:contrast-[1.04] dark:[&_.leaflet-tile-pane]:saturate-[0.82]"
        />

        {(data.status === "loading" || (data.status === "ready" && !markersReady && !isEmpty)) && (
          <MapOverlay>
            <div role="status" className="flex items-center gap-3">
              <LoadingIcon className="h-5 w-5 animate-spin text-moss" />

              <p className="font-serif text-[15px] italic text-muted">{t.loading}</p>
            </div>
          </MapOverlay>
        )}

        {isEmpty && (
          <MapOverlay>
            <div className="text-center">
              <p className="font-serif text-[1.15rem] italic text-ink-soft">{t.empty}</p>

              <p className="mt-1.5 text-[13px] text-muted">{t.emptyDescription}</p>
            </div>
          </MapOverlay>
        )}

        {data.status === "error" && (
          <MapOverlay>
            <div role="alert" className="text-center">
              <p className="text-[14px] text-clay">{t.error}</p>

              <button type="button" onClick={retry} className="vh-btn vh-btn-outline vh-btn-sm mt-3">
                {t.retry}
              </button>
            </div>
          </MapOverlay>
        )}
      </div>

      {/* หมุดเป็น div (ไม่ใช่ img) จึงไม่โดนกฎ img { background } ของ globals.css */}
      <style>{PIN_CSS}</style>
    </main>
  );
}

const PIN_CSS = `
.vh-map-pin { background: none; border: 0; }
.vh-map-pin-dot {
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--moss);
  border: 3px solid var(--sheet-raised);
  box-shadow: 0 3px 10px rgba(0,0,0,.24), 0 0 0 4px var(--moss-soft);
}
.vh-collection-map .leaflet-popup-content-wrapper,
.vh-collection-map .leaflet-popup-tip {
  background: var(--sheet-raised);
  color: var(--ink);
}
.vh-collection-map .leaflet-popup-content { margin: 12px 14px; }
`;

/* =========================================================
   POPUP
   สร้าง DOM เอง (textContent) ไม่ต่อ HTML จากข้อมูลในฐานข้อมูล
========================================================= */

function createPopup(point, { t, router }) {
  const root = document.createElement("div");

  root.className = "font-sans text-[13px] leading-5";

  if (point.pnu_no !== null && point.pnu_no !== undefined && point.pnu_no !== "") {
    const pnu = document.createElement("p");

    pnu.className = "font-mono text-[11.5px] text-muted";
    pnu.textContent = `PNU ${point.pnu_no}`;

    root.appendChild(pnu);
  }

  const name = document.createElement("p");

  name.className = "vh-binomial mt-0.5 text-[15px] text-ink";
  name.textContent = point.botanical_name || t.unknownName;

  root.appendChild(name);

  if (point.family) {
    const family = document.createElement("p");

    family.className = "vh-family mt-0.5";
    family.textContent = point.family;

    root.appendChild(family);
  }

  const link = document.createElement("a");

  const href = `/plants/${encodeURIComponent(point.id)}`;

  link.href = href;
  link.className = "mt-2 inline-block font-medium !text-moss underline underline-offset-2";
  link.textContent = t.viewDetails;

  /* เปลี่ยนหน้าแบบ client-side (ยังเปิดแท็บใหม่ด้วย Ctrl/Cmd ได้) */
  link.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();

    router.push(href);
  });

  root.appendChild(link);

  return root;
}

/* =========================================================
   UI
========================================================= */

function MapOverlay({ children }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center p-4">
      <div className="vh-panel pointer-events-auto px-5 py-4 shadow-sheet">{children}</div>
    </div>
  );
}

function LoadingIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.25" />

      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
