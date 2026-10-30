"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FilterDropdown from "@/components/FilterDropdown";
import Navbar from "@/components/Navbar";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import { fetchMapPoints } from "@/lib/mapQueries";
import {
  EMPTY_FACETS,
  EMPTY_PLANT_FILTERS,
  PLANT_FILTER_PARAMS,
  fetchPlantFacets,
  hasPlantFilters,
  plantFiltersToSearch,
  readPlantFilters,
} from "@/lib/plantQueries";
import { supabasePublic } from "@/lib/supabasePublic";
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
   - ตัวกรองอยู่ใน URL ชื่อเดียวกับ /plants: ?q=&family=&group=&collector=
     (replaceState แบบเดียวกับ /plants: แชร์ลิงก์ได้ และกด back
     จากหน้ารายละเอียดแล้วได้ตัวกรองเดิม)
========================================================= */

/* ขอบเขตประเทศไทยสำหรับมุมมองเริ่มต้น */
const THAILAND_BOUNDS = [
  [5.6, 97.3],
  [20.5, 105.7],
];

/* หลังกรอง ซูมให้พอดีกับจุดที่เหลือ แต่ไม่ลึกกว่านี้ (กรณีเหลือจุดเดียว) */
const FILTER_FIT_MAX_ZOOM = 12;

const FILTER_FIT_PADDING = [40, 40];

/* รอให้หยุดพิมพ์ก่อนค่อยค้นหา (เท่ากับ /plants) */
const SEARCH_DEBOUNCE_MS = 300;

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
    summaryFiltered: (shown, matched) =>
      `แสดง ${shown} รายการที่มีพิกัด จาก ${matched} รายการที่ตรงตัวกรอง`,
    loading: "กำลังโหลดตำแหน่งพรรณไม้...",
    updating: "กำลังกรอง...",
    empty: "ยังไม่มีรายการที่มีพิกัด",
    emptyDescription: "รายการที่บันทึกละติจูดและลองจิจูดไว้จะแสดงบนแผนที่นี้",
    noMatch: "ไม่พบรายการที่มีพิกัดตรงกับตัวกรอง",
    noMatchDescription: "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองบางรายการ",
    error: "ไม่สามารถโหลดข้อมูลแผนที่ได้",
    retry: "ลองอีกครั้ง",
    mapLabel: "แผนที่ตำแหน่งเก็บตัวอย่างพรรณไม้",
    viewDetails: "ดูรายละเอียด",
    unknownName: "ไม่ระบุชื่อ",
    filters: "ตัวกรอง",
    showFilters: "แสดงตัวกรอง",
    hideFilters: "ซ่อนตัวกรอง",
    searchLabel: "ค้นหาในคลัง",
    search: "ค้นหา PNU ชื่อวิทยาศาสตร์ วงศ์ ผู้เก็บ หรือสถานที่...",
    familyFilter: "วงศ์พืช",
    artificialGroupFilter: "กลุ่มพืช",
    collectorFilter: "ผู้เก็บตัวอย่าง",
    allFamilies: "ทุกวงศ์",
    allGroups: "ทุกกลุ่มพืช",
    allCollectors: "ผู้เก็บทั้งหมด",
    clearFilters: "ล้างตัวกรอง",
  },
  EN: {
    title: "Collection Map",
    summary: (shown, total) =>
      `Showing ${shown} records with coordinates out of ${total}`,
    summaryFiltered: (shown, matched) =>
      `Showing ${shown} records with coordinates out of ${matched} matching filters`,
    loading: "Loading specimen locations...",
    updating: "Filtering...",
    empty: "No records with coordinates yet",
    emptyDescription: "Records with latitude and longitude will appear on this map.",
    noMatch: "No records with coordinates match these filters",
    noMatchDescription: "Try a different search or clear some filters.",
    error: "Unable to load map data",
    retry: "Try Again",
    mapLabel: "Map of specimen collection locations",
    viewDetails: "View details",
    unknownName: "Unnamed",
    filters: "Filters",
    showFilters: "Show filters",
    hideFilters: "Hide filters",
    searchLabel: "Search the collection",
    search: "Search PNU, botanical name, family, collector or locality...",
    familyFilter: "Plant Family",
    artificialGroupFilter: "Artificial Group",
    collectorFilter: "Collector",
    allFamilies: "All Families",
    allGroups: "All Plant Groups",
    allCollectors: "All Collectors",
    clearFilters: "Clear Filters",
  },
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

/* =========================================================
   PAGE
   useSearchParams ต้องอยู่ใน Suspense (Next 16)
   มือถือ: หักหัวเว็บ 58px และแถบเมนูล่าง 78px (padding ของ body)
   เดสก์ท็อป: เต็มจอ โดยมี spacer 72px ของ Navbar อยู่ด้านบน
========================================================= */

export default function CollectionMapPage() {
  return (
    <main className="flex h-[calc(100dvh_-_136px_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] flex-col overflow-hidden text-ink md:h-[100dvh]">
      <Navbar />

      <Suspense fallback={<MapFallback />}>
        <CollectionMap />
      </Suspense>
    </main>
  );
}

function CollectionMap() {
  const router = useRouter();

  const { language } = useSiteSettings();

  const t = language === "EN" ? text.EN : text.TH;

  /* popup สร้างตอนเปิด จึงอ่านข้อความและ router ล่าสุดจาก ref */
  const popupContextRef = useRef({ t, router });

  useEffect(() => {
    popupContextRef.current = { t, router };
  });

  /* =====================================================
     FILTERS (URL)
  ===================================================== */

  const searchParams = useSearchParams();

  const filters = readPlantFilters(searchParams);

  /* query string ของตัวกรอง ใช้เป็น key ของผลที่โหลด ("" = ไม่มีตัวกรอง) */
  const filtersKey = plantFiltersToSearch(filters);

  const filtersActive = hasPlantFilters(filters);

  const [searchInput, setSearchInput] = useState(filters.search);

  /* URL เปลี่ยนจากภายนอก (back/forward, ล้างตัวกรอง) → ปรับช่องค้นหาตาม */
  const [syncedSearch, setSyncedSearch] = useState(filters.search);

  if (syncedSearch !== filters.search) {
    setSyncedSearch(filters.search);

    if (searchInput.trim() !== filters.search) {
      setSearchInput(filters.search);
    }
  }

  const [filtersOpen, setFiltersOpen] = useState(false);

  /* replaceState แบบเดียวกับ /plants (useSearchParams อัปเดตตาม) */
  function updateFilters(changes) {
    const params = new URLSearchParams(window.location.search);

    Object.entries(changes).forEach(([key, value]) => {
      const param = PLANT_FILTER_PARAMS[key];
      const next = String(value || "").trim();

      if (next) {
        params.set(param, next);
      } else {
        params.delete(param);
      }
    });

    const query = params.toString();

    window.history.replaceState(
      null,
      "",
      query ? `?${query}` : window.location.pathname,
    );
  }

  function clearFilters() {
    setSearchInput("");

    updateFilters(EMPTY_PLANT_FILTERS);
  }

  useEffect(() => {
    const next = searchInput.trim();

    if (next === filters.search) return;

    const timer = window.setTimeout(() => {
      updateFilters({ search: next });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput, filters.search]);

  /* ตัวเลือกจาก get_plant_facets() ชุดเดียวกับ /plants */
  const [facets, setFacets] = useState(EMPTY_FACETS);

  useEffect(() => {
    let active = true;

    fetchPlantFacets(supabasePublic)
      .then((result) => {
        if (active) setFacets(result);
      })
      .catch((err) => {
        console.error("Fetch plant facets failed:", err);
      });

    return () => {
      active = false;
    };
  }, []);

  const familyOptions = facets.families.map((family) => family.name);
  const groupOptions = facets.groups.map((group) => group.name);
  const collectorOptions = facets.collectors.map((collector) => collector.name);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  /* =====================================================
     DATA
     หมุดเดิมยังอยู่ระหว่างโหลดผลของตัวกรองใหม่
  ===================================================== */

  /* { status: "loading" | "ready" | "error", points, total, invalidCount, filtersKey } */
  const [data, setData] = useState({
    status: "loading",
    points: [],
    total: 0,
    invalidCount: 0,
    filtersKey: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    fetchMapPoints(readPlantFilters(new URLSearchParams(filtersKey)))
      .then((result) => {
        if (active) setData({ status: "ready", ...result, filtersKey });
      })
      .catch((err) => {
        console.error("Fetch map points error:", err);

        if (active) {
          setData({ status: "error", points: [], total: 0, invalidCount: 0, filtersKey });
        }
      });

    return () => {
      active = false;
    };
  }, [filtersKey, reloadKey]);

  function retry() {
    setData({ status: "loading", points: [], total: 0, invalidCount: 0, filtersKey: null });
    setReloadKey((key) => key + 1);
  }

  /* กำลังโหลดผลของตัวกรองใหม่ (ยังแสดงผลเดิมอยู่) */
  const refreshing = data.status !== "loading" && data.filtersKey !== filtersKey;

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

  /* ความสูงแผนที่เปลี่ยนเมื่อเปิด/ปิดตัวกรองบนมือถือ */
  useEffect(() => {
    const container = containerRef.current;

    if (!map || !container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => map.invalidateSize());

    observer.observe(container);

    return () => observer.disconnect();
  }, [map]);

  /* ตัวกรองที่ซูมให้พอดีไปแล้ว ("" = มุมมองประเทศไทยตอนเริ่ม) */
  const fittedKeyRef = useRef("");

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

        /* ตัวกรองเปลี่ยน → ซูมให้พอดีกับจุดที่เหลือ, ล้างตัวกรอง → กลับมุมมองประเทศไทย
           เหลือ 0 จุด → ไม่ซูม (แสดงข้อความแทน) */
        if (fittedKeyRef.current !== data.filtersKey) {
          fittedKeyRef.current = data.filtersKey;

          if (!data.filtersKey) {
            map.fitBounds(THAILAND_BOUNDS);
          } else if (data.points.length > 0) {
            map.fitBounds(
              L.latLngBounds(data.points.map((point) => [point.latitude, point.longitude])),
              { maxZoom: FILTER_FIT_MAX_ZOOM, padding: FILTER_FIT_PADDING },
            );
          }
        }

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
  }, [L, map, data]);

  const markersReady =
    data.status === "ready" && markersState.ready && markersState.forPoints === data.points;

  const isEmpty = data.status === "ready" && data.points.length === 0;

  const shownFiltered = Boolean(data.filtersKey);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      data-map-state={markersReady || isEmpty ? "ready" : data.status}
      data-map-refreshing={refreshing ? "true" : undefined}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="shrink-0 border-b border-rule bg-paper/90 px-4 py-2.5 backdrop-blur md:px-6">
        <div className="flex items-start justify-between gap-3 md:flex-wrap md:items-baseline md:gap-x-4 md:gap-y-1">
          <div className="min-w-0 md:contents">
            <h1 className="font-serif text-[1.15rem] leading-tight text-ink md:text-[1.3rem]">
              {t.title}
            </h1>

            <p className="mt-0.5 flex items-center gap-2 font-mono text-[12px] tabular-nums text-muted md:mt-0">
              <span data-map-summary>
                {data.status === "ready"
                  ? shownFiltered
                    ? t.summaryFiltered(formatNumber(data.points.length), formatNumber(data.total))
                    : t.summary(formatNumber(data.points.length), formatNumber(data.total))
                  : data.status === "loading"
                    ? t.loading
                    : t.error}
              </span>

              {refreshing && (
                <span role="status" className="inline-flex items-center gap-1 text-moss">
                  <LoadingIcon className="h-3.5 w-3.5 animate-spin" />
                  <span className="sr-only">{t.updating}</span>
                </span>
              )}
            </p>
          </div>

          {/* มือถือ: พับเก็บตัวกรองได้ เพื่อไม่ให้บังแผนที่ */}
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="map-filters"
            aria-label={filtersOpen ? t.hideFilters : t.showFilters}
            data-map-filter-toggle
            className={`vh-icon-btn relative shrink-0 !h-10 !w-10 md:!hidden ${
              filtersOpen ? "!border-moss !text-moss" : ""
            }`}
          >
            <FilterIcon className="h-[18px] w-[18px]" />

            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-moss px-1 font-mono text-[9px] text-on-moss">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div
          id="map-filters"
          data-map-filters
          className={`${filtersOpen ? "grid" : "hidden"} mt-2.5 grid-cols-2 gap-2 md:mt-2.5 md:grid md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto] md:gap-2.5`}
        >
          <div className="relative col-span-2 md:col-span-1">
            <label htmlFor="map-search" className="sr-only">
              {t.searchLabel}
            </label>

            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />

            <input
              id="map-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t.search}
              className="vh-input !min-h-[40px] !rounded-full !py-2 !pl-10 !pr-4 !text-[13px]"
            />
          </div>

          <div className="col-span-2 min-w-0 md:col-span-1" data-map-filter="family">
            <span className="sr-only">{t.familyFilter}</span>

            <FilterDropdown
              value={filters.family}
              onChange={(value) => updateFilters({ family: value })}
              options={familyOptions}
              placeholder={t.allFamilies}
              compact
            />
          </div>

          <div className="min-w-0" data-map-filter="group">
            <span className="sr-only">{t.artificialGroupFilter}</span>

            <FilterDropdown
              value={filters.group}
              onChange={(value) => updateFilters({ group: value })}
              options={groupOptions}
              placeholder={t.allGroups}
              compact
            />
          </div>

          <div className="min-w-0" data-map-filter="collector">
            <span className="sr-only">{t.collectorFilter}</span>

            <FilterDropdown
              value={filters.collector}
              onChange={(value) => updateFilters({ collector: value })}
              options={collectorOptions}
              placeholder={t.allCollectors}
              compact
            />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!filtersActive && !searchInput.trim()}
            data-map-clear-filters
            className="vh-btn vh-btn-outline vh-btn-sm col-span-2 !min-h-[40px] !rounded-full md:col-span-1"
          >
            <CloseCircleIcon className="h-4 w-4 shrink-0" />
            {t.clearFilters}
          </button>
        </div>
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
            <div data-map-empty className="text-center">
              <p className="font-serif text-[1.15rem] italic text-ink-soft">
                {shownFiltered ? t.noMatch : t.empty}
              </p>

              <p className="mt-1.5 text-[13px] text-muted">
                {shownFiltered ? t.noMatchDescription : t.emptyDescription}
              </p>

              {shownFiltered && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="vh-btn vh-btn-outline vh-btn-sm mt-3"
                >
                  {t.clearFilters}
                </button>
              )}
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
    </div>
  );
}

function MapFallback() {
  return (
    <div aria-hidden="true" className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-rule px-4 py-3 md:px-6">
        <div className="vh-skeleton h-5 w-40 rounded" />
        <div className="vh-skeleton mt-2 h-3 w-64 max-w-full rounded" />
      </div>

      <div className="vh-skeleton min-h-0 flex-1" />
    </div>
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

function SearchIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function FilterIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function CloseCircleIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}
