"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import FilterDropdown from "@/components/FilterDropdown";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import {
  EMPTY_FACETS,
  fetchPlantFacets,
  fetchPlantsPage,
  plantFiltersToSearch,
  readPlantFilters,
} from "@/lib/plantQueries";
import { supabasePublic } from "@/lib/supabasePublic";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   SORT OPTIONS
========================================================= */

const SORT_OPTIONS = ["newest", "oldest", "nameAZ", "nameZA"];

/* portal ใช้ได้หลัง hydrate เท่านั้น (server = false, browser = true) */
function subscribeNothing() {
  return () => {};
}

/* รอให้หยุดพิมพ์ก่อนค่อยค้นหาที่ฐานข้อมูล */
const SEARCH_DEBOUNCE_MS = 300;

/* =========================================================
   PAGE
   useSearchParams needs a Suspense boundary (Next 16).
   Filters live in the URL:
   ?q=&family=&group=&collector=&sort=&page=
   (?family=<name> is linked from the home page family index)
========================================================= */

export default function PlantsPage() {
  return (
    <main className="page overflow-x-hidden">
      <Navbar />

      <Suspense fallback={<CatalogueFallback />}>
        <PlantsBrowser />
      </Suspense>

      <SiteFooter />
    </main>
  );
}

/* =========================================================
   BROWSER
========================================================= */

function PlantsBrowser() {
  const { language } = useSiteSettings();

  const isEnglish = language === "EN";

  /* =====================================================
     URL STATE
  ===================================================== */

  const searchParams = useSearchParams();

  /* q, family, group, collector อ่านด้วยฟังก์ชันเดียวกับ /map */
  const {
    search,
    family: familyFilter,
    group: artificialGroupFilter,
    collector: collectorFilter,
  } = readPlantFilters(searchParams);

  const sortParam = searchParams.get("sort");

  const sort = SORT_OPTIONS.includes(sortParam) ? sortParam : "newest";

  const currentPage = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "", 10) || 1,
  );

  /* =====================================================
     STATE
  ===================================================== */

  /* rows of the current page only */
  const [plants, setPlants] = useState([]);

  const [totalResults, setTotalResults] = useState(0);

  const [facets, setFacets] = useState(EMPTY_FACETS);

  const [loading, setLoading] = useState(true);

  const [facetsLoading, setFacetsLoading] = useState(true);

  const [error, setError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  const [searchInput, setSearchInput] = useState(search);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const portalReady = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  const requestIdRef = useRef(0);

  const committedSearchRef = useRef(search);

  /* =====================================================
     PAGINATION STATE
     MOBILE = 10
     DESKTOP / TABLET = 12
  ===================================================== */

  const [isDesktop, setIsDesktop] = useState(false);

  const [viewportReady, setViewportReady] = useState(false);

  /* GRID / LIST VIEW (list view is desktop only) */

  const [view, setView] = useState("grid");

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "BOTANICAL COLLECTION",

      titleTop: "สำรวจความหลากหลาย",

      titleHighlight: "ของพรรณไม้",

      mobileTitle: "คลังพรรณไม้",

      subtitle:
        "ค้นหาตัวอย่างพรรณไม้ด้วย PNU No. ชื่อวิทยาศาสตร์ วงศ์ กลุ่มพืช ผู้เก็บตัวอย่าง และสถานที่เก็บตัวอย่าง",

      specimens: "ตัวอย่างทั้งหมด",

      groups: "กลุ่มพืช",

      families: "วงศ์พืช",

      records: "รายการ",

      groupUnit: "กลุ่ม",

      familyUnit: "วงศ์",

      searchLabel: "ค้นหาในคลัง",

      searchDescription: "ค้นหาและกรองข้อมูลตัวอย่างพรรณไม้",

      search: "ค้นหา PNU ชื่อวิทยาศาสตร์ วงศ์ ผู้เก็บ หรือสถานที่...",

      mobileSearch: "ค้นหา PNU หรือพรรณไม้...",

      refresh: "โหลดข้อมูลใหม่",

      filters: "ตัวกรอง",

      filterTitle: "ตัวกรองพรรณไม้",

      filterDescription: "เลือกข้อมูลเพื่อค้นหาพรรณไม้ที่ต้องการ",

      activeFilters: "ตัวกรองที่ใช้งาน",

      familyFilter: "วงศ์พืช",

      artificialGroupFilter: "กลุ่มพืช",

      collectorFilter: "ผู้เก็บตัวอย่าง",

      sortFilter: "เรียงลำดับ",

      allFamilies: "ทุกวงศ์",

      allGroups: "ทุกกลุ่มพืช",

      allCollectors: "ผู้เก็บทั้งหมด",

      collectionLabel: "HERBARIUM RECORDS",

      collection: "รายการพรรณไม้",

      found: "พบ",

      result: "รายการ",

      newest: "ล่าสุด",

      oldest: "เก่าสุด",

      nameAZ: "ชื่อ A-Z",

      nameZA: "ชื่อ Z-A",

      specimen: "SPECIMEN",

      family: "วงศ์",

      location: "Locality / NP / Province",

      collector: "ผู้เก็บตัวอย่าง",

      collectorNo: "Collector No.",

      viewDetails: "ดูข้อมูล",

      noData: "ยังไม่มีข้อมูลพรรณไม้",

      noSearch: "ไม่พบพรรณไม้ที่ตรงกับการค้นหา",

      noSearchDescription: "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองบางรายการ",

      clearFilters: "ล้างตัวกรอง",

      viewOnMap: "ดูบนแผนที่",

      applyFilters: "แสดงผล",

      closeFilters: "ปิดตัวกรอง",

      loadError: "ไม่สามารถโหลดข้อมูลพรรณไม้ได้",

      retry: "ลองอีกครั้ง",

      unknown: "ไม่ระบุ",

      footer: "ธรรมชาติ...คือห้องเรียนที่ดีที่สุด",

      /* PAGINATION */

      page: "หน้า",

      pageOf: "จาก",

      previousPage: "หน้าก่อนหน้า",

      nextPage: "หน้าถัดไป",

      /* CATALOGUE */

      noDataDescription: "เมื่อมีการเพิ่มตัวอย่างพรรณไม้ รายการจะปรากฏที่นี่",

      viewMode: "รูปแบบการแสดงผล",

      gridView: "มุมมองแบบการ์ด",

      listView: "มุมมองแบบรายการ",

      specimenColumn: "ตัวอย่าง",
    },

    EN: {
      eyebrow: "BOTANICAL COLLECTION",

      titleTop: "Explore the diversity",

      titleHighlight: "of plant life",

      mobileTitle: "Plant Collection",

      subtitle:
        "Discover specimens by PNU number, botanical name, family, artificial group, collector and locality.",

      specimens: "Total Specimens",

      groups: "Plant Groups",

      families: "Plant Families",

      records: "records",

      groupUnit: "groups",

      familyUnit: "families",

      searchLabel: "Search the collection",

      searchDescription: "Search and refine specimen records",

      search: "Search PNU, botanical name, family, collector or locality...",

      mobileSearch: "Search PNU or plants...",

      refresh: "Refresh Collection",

      filters: "Filters",

      filterTitle: "Plant Filters",

      filterDescription: "Choose filters to refine the plant collection",

      activeFilters: "Active filters",

      familyFilter: "Plant Family",

      artificialGroupFilter: "Artificial Group",

      collectorFilter: "Collector",

      sortFilter: "Sort",

      allFamilies: "All Families",

      allGroups: "All Plant Groups",

      allCollectors: "All Collectors",

      collectionLabel: "HERBARIUM RECORDS",

      collection: "Plant Collection",

      found: "Found",

      result: "records",

      newest: "Newest first",

      oldest: "Oldest first",

      nameAZ: "Name A-Z",

      nameZA: "Name Z-A",

      specimen: "SPECIMEN",

      family: "Family",

      location: "Locality / NP / Province",

      collector: "Collector",

      collectorNo: "Collector No.",

      viewDetails: "View",

      noData: "No plant records yet",

      noSearch: "No plants match your search",

      noSearchDescription: "Try another keyword or remove some filters.",

      clearFilters: "Clear Filters",

      viewOnMap: "View on map",

      applyFilters: "Show Results",

      closeFilters: "Close filters",

      loadError: "Unable to load plant data",

      retry: "Try Again",

      unknown: "Unknown",

      footer: "Nature is the greatest classroom.",

      /* PAGINATION */

      page: "Page",

      pageOf: "of",

      previousPage: "Previous page",

      nextPage: "Next page",

      /* CATALOGUE */

      noDataDescription:
        "Specimens will appear here once they are added to the collection.",

      viewMode: "View mode",

      gridView: "Grid view",

      listView: "List view",

      specimenColumn: "Specimen",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     PAGINATION RESPONSIVE SIZE

     MOBILE    = 10 records
     >= 768px = 12 records
  ===================================================== */

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)");

    function updateDeviceSize() {
      setIsDesktop(mediaQuery.matches);
      setViewportReady(true);
    }

    updateDeviceSize();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateDeviceSize);
    } else {
      mediaQuery.addListener(updateDeviceSize);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateDeviceSize);
      } else {
        mediaQuery.removeListener(updateDeviceSize);
      }
    };
  }, []);

  /* =====================================================
     MOBILE SHEET BODY LOCK
  ===================================================== */

  useEffect(() => {
    if (!mobileFilterOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileFilterOpen]);

  /* =====================================================
     ESC CLOSE
  ===================================================== */

  useEffect(() => {
    if (!mobileFilterOpen) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMobileFilterOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileFilterOpen]);

  /* =====================================================
     UPDATE URL
     replaceState keeps the filters shareable and lets the
     back button from a plant page restore them.
     Any filter change goes back to page 1 unless keepPage.
  ===================================================== */

  function updateParams(changes, { keepPage = false } = {}) {
    const params = new URLSearchParams(window.location.search);

    Object.entries(changes).forEach(([key, value]) => {
      const isDefault =
        value === null ||
        value === undefined ||
        value === "" ||
        (key === "sort" && value === "newest") ||
        (key === "page" && Number(value) <= 1);

      if (isDefault) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    if (!keepPage) {
      params.delete("page");
    }

    const query = params.toString();

    window.history.replaceState(
      null,
      "",
      query ? `?${query}` : window.location.pathname,
    );
  }

  function setSearch(value) {
    const next = String(value || "").trim();

    committedSearchRef.current = next;

    setSearchInput(value);

    updateParams({ q: next });
  }

  function setFamilyFilter(value) {
    updateParams({ family: value });
  }

  function setArtificialGroupFilter(value) {
    updateParams({ group: value });
  }

  function setCollectorFilter(value) {
    updateParams({ collector: value });
  }

  function setSort(value) {
    updateParams({ sort: value });
  }

  /* =====================================================
     SEARCH INPUT (DEBOUNCED)
  ===================================================== */

  useEffect(() => {
    const next = searchInput.trim();

    if (next === search) {
      return;
    }

    const timer = window.setTimeout(() => {
      committedSearchRef.current = next;

      updateParams({ q: next });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput, search]);

  /* URL changed from outside (e.g. navbar link) -> sync the input */

  useEffect(() => {
    if (search === committedSearchRef.current) {
      return;
    }

    committedSearchRef.current = search;

    setSearchInput(search);
  }, [search]);

  /* =====================================================
     FETCH
     facets = stats + filter options (once / on refresh)
     page   = rows of the current page (on every change)
  ===================================================== */

  /* facets โหลดใหม่เฉพาะตอนกดโหลดใหม่ จึงตั้งสถานะกำลังโหลดที่นี่ */
  function refreshData() {
    setFacetsLoading(true);

    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let active = true;

    fetchPlantFacets(supabasePublic)
      .then((data) => {
        if (active) {
          setFacets(data);
        }
      })
      .catch((err) => {
        console.error("Fetch plant facets failed:", err);

        if (active) {
          setFacets(EMPTY_FACETS);

          setError(err?.message || t.loadError);
        }
      })
      .finally(() => {
        if (active) {
          setFacetsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const pageSize = isDesktop ? 12 : 10;

  /* คำขอใหม่ (ตัวกรอง หน้า หรือกดโหลดใหม่) → ตั้งสถานะกำลังโหลดระหว่าง render
     แทนการ setState ใน effect ("" = ยังไม่ส่งคำขอ เพราะยังไม่รู้ขนาดจอ) */
  const pageRequestKey = viewportReady
    ? JSON.stringify([
        search,
        familyFilter,
        artificialGroupFilter,
        collectorFilter,
        sort,
        currentPage,
        pageSize,
        reloadKey,
      ])
    : "";

  const [startedRequestKey, setStartedRequestKey] = useState("");

  if (pageRequestKey !== startedRequestKey) {
    setStartedRequestKey(pageRequestKey);

    if (pageRequestKey) {
      setLoading(true);
      setError("");
    }
  }

  useEffect(() => {
    if (!viewportReady) {
      return;
    }

    /* ignore responses that arrive after a newer request */
    const requestId = ++requestIdRef.current;

    fetchPlantsPage({
      search,
      family: familyFilter,
      group: artificialGroupFilter,
      collector: collectorFilter,
      sort,
      page: currentPage,
      pageSize,
      client: supabasePublic,
    })
      .then(({ rows, total }) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        /* page in the URL is past the last page */
        if (total === null) {
          updateParams({ page: 1 });

          return;
        }

        setPlants(rows);
        setTotalResults(total);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        console.error("Fetch plants failed:", err);

        setPlants([]);
        setTotalResults(0);

        setError(err?.message || t.loadError);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, [
    viewportReady,
    search,
    familyFilter,
    artificialGroupFilter,
    collectorFilter,
    sort,
    currentPage,
    pageSize,
    reloadKey,
  ]);

  /* =====================================================
     FILTER OPTIONS
  ===================================================== */

  const artificialGroups = facets.groups.map((group) => group.name);

  const collectors = facets.collectors.map((collector) => collector.name);

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

  /* =====================================================
     CHANGE PAGE
  ===================================================== */

  function handlePageChange(page) {
    const nextPage = Math.min(Math.max(page, 1), totalPages);

    if (nextPage === currentPage) {
      return;
    }

    updateParams({ page: nextPage }, { keepPage: true });

    window.requestAnimationFrame(() => {
      document.getElementById("plant-collection")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  /* =====================================================
     STATS
  ===================================================== */

  const stats = {
    specimens: facets.total,

    groups: facets.group_count,

    families: facets.family_count,
  };

  /* =====================================================
     FAMILY INDEX (name + record count)
  ===================================================== */

  const familyIndex = facets.families;

  /* =====================================================
     HELPERS
  ===================================================== */

  function hasText(value) {
    return !(
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    );
  }

  function localizedValue(thValue, enValue, legacyValue = "") {
    const values = isEnglish
      ? [enValue, thValue, legacyValue]
      : [thValue, enValue, legacyValue];

    return values.find((value) => hasText(value)) || "";
  }

  function getPlantName(plant) {
    return (
      localizedValue(
        plant.common_name_th,
        plant.common_name_en,
        plant.common_name,
      ) ||
      plant.botanical_name ||
      (hasText(plant.pnu_no) ? `PNU ${plant.pnu_no}` : "") ||
      t.unknown
    );
  }

  function getCommonName(plant) {
    return localizedValue(
      plant.common_name_th,
      plant.common_name_en,
      plant.common_name,
    );
  }

  function getProvince(plant) {
    return localizedValue(plant.province_th, plant.province_en, plant.province);
  }

  function getDistrict(plant) {
    return localizedValue(plant.district_th, plant.district_en, plant.district);
  }

  function getPlaceName(plant) {
    return localizedValue(plant.place_name_th, plant.place_name_en);
  }

  function getAddress(plant) {
    return localizedValue(plant.address_th, plant.address_en, plant.location);
  }

  function getHabitat(plant) {
    return localizedValue(plant.habitat_th, plant.habitat_en, plant.habitat);
  }

  function getNotes(plant) {
    return localizedValue(plant.notes_th, plant.notes_en, plant.notes);
  }

  function getCollector(plant) {
    return localizedValue(
      plant.collected_by_th,
      plant.collected_by_en,
      plant.collected_by,
    );
  }

  function getLocation(plant) {
    if (hasText(plant.locality)) {
      return plant.locality;
    }

    const values = [
      getPlaceName(plant),
      getAddress(plant),
      getDistrict(plant),
      getProvince(plant),
    ].filter(Boolean);

    return [...new Set(values)].join(", ");
  }

  function clearFilters() {
    committedSearchRef.current = "";

    setSearchInput("");

    updateParams({
      q: "",
      family: "",
      group: "",
      collector: "",
      sort: "newest",
    });
  }

  const hasFilterValues = Boolean(
    search || familyFilter || artificialGroupFilter || collectorFilter,
  );

  const hasActiveFilters = Boolean(
    search.trim() ||
    familyFilter ||
    artificialGroupFilter ||
    collectorFilter ||
    sort !== "newest",
  );

  const mobileFilterCount = [
    familyFilter,
    artificialGroupFilter,
    collectorFilter,
    sort !== "newest" ? sort : "",
  ].filter(Boolean).length;

  const sortLabels = {
    newest: t.newest,
    oldest: t.oldest,
    nameAZ: t.nameAZ,
    nameZA: t.nameZA,
  };

  const activeView = isDesktop ? view : "grid";

  /* ตัวกรองปัจจุบันไปหน้า /map (ชื่อพารามิเตอร์เดียวกัน) */
  const mapQuery = plantFiltersToSearch({
    search,
    family: familyFilter,
    group: artificialGroupFilter,
    collector: collectorFilter,
  });

  const mapHref = mapQuery ? `/map?${mapQuery}` : "/map";

  const activeChips = [
    familyFilter && {
      key: "family",
      label: t.familyFilter,
      value: familyFilter,
    },
    artificialGroupFilter && {
      key: "group",
      label: t.artificialGroupFilter,
      value: artificialGroupFilter,
    },
    collectorFilter && {
      key: "collector",
      label: t.collectorFilter,
      value: collectorFilter,
    },
    search.trim() && {
      key: "search",
      label: t.searchLabel,
      value: `“${search.trim()}”`,
    },
  ].filter(Boolean);

  function clearChip(key) {
    if (key === "family") setFamilyFilter("");
    if (key === "group") setArtificialGroupFilter("");
    if (key === "collector") setCollectorFilter("");
    if (key === "search") setSearch("");
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <>
      {/* =====================================================
          CATALOGUE HEADER
      ===================================================== */}

      <header className="relative isolate overflow-hidden border-b border-rule">
        <div
          aria-hidden="true"
          className="vh-grid-paper pointer-events-none absolute inset-0 -z-10 opacity-35 [mask-image:radial-gradient(ellipse_at_85%_20%,black,transparent_65%)]"
        />

        <div className="vh-container page-enter py-9 md:py-14">
          <p className="vh-eyebrow flex items-center gap-3">
            <span className="h-px w-6 bg-ochre" />
            {t.eyebrow}
          </p>

          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <h1 className="vh-display text-[2.4rem] min-[390px]:text-[2.7rem] md:text-[3.6rem] lg:text-[3.4rem] xl:text-[4.1rem]">
                <span className="md:hidden">{t.mobileTitle}</span>

                <span className="hidden md:block">{t.titleTop}</span>

                <span className="hidden italic text-moss md:block">
                  {t.titleHighlight}
                </span>
              </h1>

              <p className="vh-prose mt-4 max-w-2xl !text-[14px] md:!text-[15px]">
                {t.subtitle}
              </p>
            </div>

            <dl className="grid grid-cols-3 border-t border-rule lg:min-w-[420px]">
              {[
                { label: t.specimens, value: stats.specimens },
                { label: t.families, value: stats.families },
                { label: t.groups, value: stats.groups },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className={`pt-4 ${index > 0 ? "border-l border-rule pl-4 md:pl-5" : ""}`}
                >
                  <dt className="vh-eyebrow truncate !text-[10px]">
                    {stat.label}
                  </dt>

                  <dd className="mt-2 font-mono text-[1.5rem] leading-none text-ink tabular-nums md:text-[1.9rem]">
                    {facetsLoading ? (
                      <span className="vh-skeleton inline-block h-7 w-12 rounded" />
                    ) : (
                      String(stat.value).padStart(2, "0")
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </header>

      {/* =====================================================
          SEARCH BAR
      ===================================================== */}

      <section className="vh-container pt-6 md:pt-9">
        <label
          htmlFor="plant-search"
          className="vh-field-label sr-only md:not-sr-only md:!mb-2.5 md:block"
        >
          {t.searchLabel}
        </label>

        <div className="grid grid-cols-[minmax(0,1fr)_44px_44px] gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:gap-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-faint" />

            <input
              id="plant-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={isDesktop ? t.search : t.mobileSearch}
              className="vh-input !min-h-[48px] !rounded-full !pl-11 !pr-4 !text-[14px] md:!min-h-[52px] md:!text-[15px]"
            />
          </div>

          {/* MOBILE: FILTER + REFRESH */}

          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            aria-label={t.filters}
            className="vh-icon-btn relative !h-12 !w-11 md:!hidden"
          >
            <FilterIcon className="h-[18px] w-[18px]" />

            {mobileFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-moss px-1 font-mono text-[9px] text-on-moss">
                {mobileFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={refreshData}
            disabled={loading}
            aria-label={t.refresh}
            className="vh-icon-btn !h-12 !w-11 md:!hidden"
          >
            <RefreshIcon
              className={`h-[18px] w-[18px] ${loading ? "animate-spin" : ""}`}
            />
          </button>

          {/* DESKTOP: REFRESH */}

          <button
            type="button"
            onClick={refreshData}
            disabled={loading}
            className="vh-btn vh-btn-outline hidden !min-h-[52px] md:inline-flex"
          >
            <RefreshIcon
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />

            {t.refresh}
          </button>
        </div>

        <p className="mt-2 hidden text-[12px] text-faint md:block">
          {t.searchDescription}
        </p>
      </section>

      {/* =====================================================
          COLLECTION
      ===================================================== */}

      <section className="vh-container pb-16 pt-6 md:pb-24 md:pt-10">
        <div className="md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-12">
          {/* ---------------- SIDEBAR (DESKTOP) ---------------- */}

          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-8">
              <div className="flex items-center justify-between gap-3 border-b border-rule-strong pb-3">
                <p className="vh-eyebrow flex items-center gap-2">
                  <FilterIcon className="h-3.5 w-3.5" />
                  {t.filters}
                </p>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 text-[12px] text-moss transition hover:text-moss-hover"
                  >
                    <CloseCircleIcon className="h-3.5 w-3.5" />
                    {t.clearFilters}
                  </button>
                )}
              </div>

              <div>
                <p className="vh-field-label">{t.familyFilter}</p>

                <FamilyIndex
                  families={familyIndex}
                  total={facets.total}
                  value={familyFilter}
                  onChange={setFamilyFilter}
                  allLabel={t.allFamilies}
                  loading={facetsLoading}
                />
              </div>

              <div>
                <p className="vh-field-label">{t.artificialGroupFilter}</p>

                <FilterDropdown
                  value={artificialGroupFilter}
                  onChange={setArtificialGroupFilter}
                  options={artificialGroups}
                  placeholder={t.allGroups}
                />
              </div>

              <div>
                <p className="vh-field-label">{t.collectorFilter}</p>

                <FilterDropdown
                  value={collectorFilter}
                  onChange={setCollectorFilter}
                  options={collectors}
                  placeholder={t.allCollectors}
                />
              </div>
            </div>
          </aside>

          {/* ---------------- RESULTS ---------------- */}

          <div className="min-w-0">
            <div
              id="plant-collection"
              className="flex scroll-mt-[90px] flex-wrap items-end justify-between gap-4 border-b border-rule pb-4 md:scroll-mt-[100px]"
            >
              <div className="min-w-0">
                <p className="vh-eyebrow">{t.collectionLabel}</p>

                <h2 className="mt-1.5 font-serif text-[1.45rem] leading-tight text-ink md:text-[1.75rem]">
                  {t.collection}
                </h2>

                <p className="mt-1.5 text-[13px] text-muted">
                  {t.found}{" "}
                  <span className="font-mono text-ochre tabular-nums">
                    {totalResults}
                  </span>
                  {totalResults !== facets.total && (
                    <span className="font-mono text-faint tabular-nums">
                      {" "}
                      / {facets.total}
                    </span>
                  )}{" "}
                  {t.result}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={mapHref}
                  data-view-on-map
                  className="vh-btn vh-btn-outline vh-btn-sm !min-h-[40px] !rounded-full"
                >
                  <PinIcon className="h-4 w-4 shrink-0" />
                  {t.viewOnMap}
                </Link>

                <div className="hidden items-center gap-2 md:flex">
                  <div className="w-[190px]">
                    <span className="sr-only">{t.sortFilter}</span>

                    <FilterDropdown
                      value={sort === "newest" ? "" : sort}
                      onChange={(value) => setSort(value || "newest")}
                      options={SORT_OPTIONS.slice(1)}
                      labels={sortLabels}
                      placeholder={t.newest}
                      compact
                    />
                  </div>

                  <div
                    role="group"
                    aria-label={t.viewMode}
                    className="flex items-center rounded-full border border-rule p-0.5"
                  >
                    <ViewToggleButton
                      active={view === "grid"}
                      label={t.gridView}
                      onClick={() => setView("grid")}
                    >
                      <GridIcon className="h-4 w-4" />
                    </ViewToggleButton>

                    <ViewToggleButton
                      active={view === "list"}
                      label={t.listView}
                      onClick={() => setView("list")}
                    >
                      <ListIcon className="h-4 w-4" />
                    </ViewToggleButton>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTIVE FILTER CHIPS */}

            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="vh-eyebrow mr-1 !text-[10px]">
                  {t.activeFilters}
                </span>

                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => clearChip(chip.key)}
                    title={chip.label}
                    className="vh-tag vh-tag-moss max-w-full transition hover:bg-moss-tint"
                  >
                    <span className="truncate">{chip.value}</span>
                    <CloseIcon className="h-3 w-3 shrink-0" />
                  </button>
                ))}

                {sort !== "newest" && (
                  <span className="vh-tag">
                    {t.sortFilter}: {sortLabels[sort]}
                  </span>
                )}

                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-1 text-[12px] text-muted underline decoration-rule-strong underline-offset-4 transition hover:text-ink md:hidden"
                >
                  {t.clearFilters}
                </button>
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="vh-panel mt-6 !border-clay/40 !bg-clay-soft p-6 text-center md:mt-8 md:p-8">
                <AlertIcon className="mx-auto h-6 w-6 text-clay" />

                <h3 className="mt-3 font-serif text-[1.2rem] text-clay">
                  {t.loadError}
                </h3>

                <p className="mx-auto mt-2 max-w-xl font-mono text-[12px] text-ink-soft">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={refreshData}
                  className="vh-btn vh-btn-primary vh-btn-sm mt-5"
                >
                  <RefreshIcon className="h-4 w-4" />
                  {t.retry}
                </button>
              </div>
            )}

            {/* LOADING */}

            {loading && !error && plants.length === 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:gap-5 lg:grid-cols-3 min-[1680px]:grid-cols-4">
                {Array.from({
                  length: 6,
                }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            )}

            {/* EMPTY */}

            {!loading && !error && totalResults === 0 && (
              <div className="vh-panel mt-6 px-6 py-12 text-center md:mt-8 md:py-16">
                <LeafIcon className="mx-auto h-6 w-6 text-moss" />

                <p className="mt-4 font-serif text-[1.25rem] italic text-ink-soft md:text-[1.4rem]">
                  {hasFilterValues ? t.noSearch : t.noData}
                </p>

                <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-muted">
                  {hasFilterValues
                    ? t.noSearchDescription
                    : t.noDataDescription}
                </p>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="vh-btn vh-btn-outline vh-btn-sm mt-6"
                  >
                    {t.clearFilters}
                  </button>
                )}
              </div>
            )}

            {/* RESULTS */}

            {!error && plants.length > 0 && (
              <div
                aria-busy={loading}
                className={`transition-opacity ${loading ? "opacity-60" : ""}`}
              >
                {activeView === "list" ? (
                  <SpecimenTable
                    plants={plants}
                    t={t}
                    isEnglish={isEnglish}
                    getPlantName={getPlantName}
                    getCommonName={getCommonName}
                    getLocation={getLocation}
                    getCollector={getCollector}
                  />
                ) : (
                  <div className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:gap-5 lg:grid-cols-3 min-[1680px]:grid-cols-4">
                    {plants.map((plant) => (
                      <PlantCard
                        key={plant.id}
                        plant={plant}
                        t={t}
                        getPlantName={getPlantName}
                        getCommonName={getCommonName}
                        getLocation={getLocation}
                        getCollector={getCollector}
                      />
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    t={t}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          MOBILE FILTER SHEET
      ===================================================== */}

      {portalReady &&
        mobileFilterOpen &&
        createPortal(
          <div className="fixed inset-0 z-[160] md:hidden">
            <button
              type="button"
              aria-label={t.closeFilters}
              onClick={() => setMobileFilterOpen(false)}
              className="absolute inset-0 h-full w-full bg-paper-deep/80"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label={t.filterTitle}
              className="mobile-app-sheet absolute inset-x-0 bottom-0 flex max-h-[86dvh] flex-col overflow-hidden border-t border-rule-strong bg-sheet text-ink shadow-lift"
            >
              <div className="shrink-0 pt-2.5">
                <div className="mx-auto h-1 w-10 rounded-full bg-rule-strong" />
              </div>

              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-rule px-5 pb-4 pt-3">
                <div className="min-w-0">
                  <p className="vh-eyebrow flex items-center gap-2 !text-[10px]">
                    <span className="h-px w-5 bg-ochre" />
                    {t.filters}
                  </p>

                  <h2 className="mt-1.5 font-serif text-[1.35rem] leading-tight text-ink">
                    {t.filterTitle}
                  </h2>

                  <p className="mt-1 text-[12px] leading-5 text-muted">
                    {t.filterDescription}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  aria-label={t.closeFilters}
                  className="vh-icon-btn"
                >
                  <CloseIcon className="h-[18px] w-[18px]" />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5">
                {mobileFilterCount > 0 && (
                  <span className="vh-tag vh-tag-moss">
                    <span className="h-1.5 w-1.5 rounded-full bg-moss" />
                    {mobileFilterCount} {t.activeFilters}
                  </span>
                )}

                <div>
                  <p className="vh-field-label">{t.sortFilter}</p>

                  <FilterDropdown
                    value={sort === "newest" ? "" : sort}
                    onChange={(value) => setSort(value || "newest")}
                    options={SORT_OPTIONS.slice(1)}
                    labels={sortLabels}
                    placeholder={t.newest}
                    mobile
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <p className="vh-field-label truncate">
                      {t.artificialGroupFilter}
                    </p>

                    <FilterDropdown
                      value={artificialGroupFilter}
                      onChange={setArtificialGroupFilter}
                      options={artificialGroups}
                      placeholder={t.allGroups}
                      mobile
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="vh-field-label truncate">
                      {t.collectorFilter}
                    </p>

                    <FilterDropdown
                      value={collectorFilter}
                      onChange={setCollectorFilter}
                      options={collectors}
                      placeholder={t.allCollectors}
                      mobile
                    />
                  </div>
                </div>

                <div>
                  <p className="vh-field-label">{t.familyFilter}</p>

                  <FamilyIndex
                    families={familyIndex}
                    total={facets.total}
                    value={familyFilter}
                    onChange={setFamilyFilter}
                    allLabel={t.allFamilies}
                    loading={facetsLoading}
                    mobile
                  />
                </div>
              </div>

              <div className="shrink-0 border-t border-rule bg-sheet px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-4">
                <div className="grid grid-cols-[0.9fr_1.1fr] gap-3">
                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="vh-btn vh-btn-outline !px-3"
                  >
                    <CloseCircleIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t.clearFilters}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="vh-btn vh-btn-primary !px-3"
                  >
                    <span className="truncate">{t.applyFilters}</span>

                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-on-moss/20 px-1.5 font-mono text-[10px]">
                      {totalResults}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/* =========================================================
   SUSPENSE FALLBACK
========================================================= */

function CatalogueFallback() {
  return (
    <div className="vh-container py-10 md:py-14" aria-hidden="true">
      <div className="vh-skeleton h-3 w-40 rounded" />
      <div className="vh-skeleton mt-6 h-12 w-3/4 max-w-[560px] rounded" />
      <div className="vh-skeleton mt-4 h-4 w-2/3 max-w-[480px] rounded" />
      <div className="vh-skeleton mt-10 h-[52px] w-full rounded-full" />

      <div className="mt-10 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3 min-[1680px]:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   FAMILY INDEX
   Catalogue-style list: name ····· count
========================================================= */

function FamilyIndex({
  families,
  total,
  value,
  onChange,
  allLabel,
  loading,
  mobile = false,
}) {
  if (loading) {
    return (
      <div className="space-y-3 py-1">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="vh-skeleton h-4 rounded" />
        ))}
      </div>
    );
  }

  const items = [{ name: "", label: allLabel, count: total }].concat(
    families.map((family) => ({
      name: family.name,
      label: family.name,
      count: family.count,
    })),
  );

  return (
    <ul
      className={`overflow-y-auto overscroll-contain border-t border-rule pr-1 ${
        mobile
          ? "max-h-[300px]"
          : "max-h-[min(440px,calc(100dvh-380px))] min-h-[160px]"
      }`}
    >
      {items.map((item) => {
        const active = value === item.name;

        return (
          <li key={item.name || "__all"}>
            <button
              type="button"
              onClick={() => onChange(item.name)}
              aria-pressed={active}
              className={`group relative flex w-full items-baseline gap-2 border-b border-rule py-2.5 pl-3 pr-1 text-left transition ${
                active ? "bg-moss-soft" : "hover:bg-moss-soft"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-y-1.5 left-0 w-[2px] rounded-full transition ${
                  active ? "bg-moss" : "bg-transparent"
                }`}
              />

              <span
                className={`min-w-0 truncate ${
                  item.name
                    ? "font-serif text-[15px]"
                    : "text-[13px] font-medium"
                } ${active ? "text-moss" : "text-ink-soft group-hover:text-ink"}`}
              >
                {item.label}
              </span>

              <span
                aria-hidden="true"
                className="min-w-3 flex-1 translate-y-[-3px] border-b border-dotted border-rule-strong"
              />

              <span
                className={`vh-catalog shrink-0 ${active ? "!text-ochre" : ""}`}
              >
                {String(item.count).padStart(2, "0")}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* =========================================================
   VIEW TOGGLE
========================================================= */

function ViewToggleButton({ active, label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
        active
          ? "bg-moss text-on-moss"
          : "text-muted hover:bg-moss-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/* =========================================================
   PAGINATION
========================================================= */

function Pagination({ currentPage, totalPages, onPageChange, t }) {
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-col items-center gap-3 border-t border-rule pt-8 md:mt-14"
    >
      <div className="flex max-w-full items-center gap-1.5 md:gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label={t.previousPage}
          className="vh-icon-btn disabled:!opacity-30"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 items-center gap-1">
          {visiblePages.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-10 min-w-[22px] items-center justify-center font-mono text-[12px] text-faint md:min-w-7"
                >
                  …
                </span>
              );
            }

            const active = page === currentPage;

            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={active ? "page" : undefined}
                className={`flex h-10 min-w-10 items-center justify-center rounded-full px-2 font-mono text-[13px] tabular-nums transition ${
                  active
                    ? "bg-moss text-on-moss"
                    : "text-ink-soft hover:bg-moss-soft hover:text-ink"
                }`}
              >
                {String(page).padStart(2, "0")}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label={t.nextPage}
          className="vh-icon-btn disabled:!opacity-30"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <p className="vh-catalog">
        {t.page} <span className="text-ink-soft">{currentPage}</span> {t.pageOf}{" "}
        <span className="text-ink-soft">{totalPages}</span>
      </p>
    </nav>
  );
}

/* =========================================================
   PAGINATION HELPER
========================================================= */

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from(
      {
        length: totalPages,
      },
      (_, index) => index + 1,
    );
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage, "...", totalPages];
}

/* =========================================================
   PLANT CARD
========================================================= */

function hasTextValue(value) {
  return !(
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  );
}

function PlantCard({
  plant,
  t,
  getPlantName,
  getCommonName,
  getLocation,
  getCollector,
}) {
  const image = plant.image_url || "";

  const botanicalName = plant.botanical_name?.trim();

  const commonName = getCommonName(plant);

  const locality = getLocation(plant) || t.unknown;

  const collector = getCollector(plant);

  return (
    <article className="vh-specimen group min-w-0">
      <Link href={`/plants/${plant.id}`} className="flex flex-1 flex-col">
        <div className="vh-specimen-media aspect-[4/5]">
          {image ? (
            <img src={image} alt={getPlantName(plant)} loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-paper-deep">
              <LeafIcon className="h-8 w-8 text-faint md:h-12 md:w-12" />
            </div>
          )}

          {hasTextValue(plant.artificial_group) && (
            <span className="absolute left-2 top-2 max-w-[calc(100%-16px)] truncate rounded-full border border-rule bg-sheet/90 px-2 py-0.5 text-[10px] text-ink-soft md:left-3 md:top-3 md:px-2.5 md:text-[11px]">
              {plant.artificial_group}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="vh-family min-w-0 truncate !text-[10px] md:!text-[10.5px]">
              {plant.family || "—"}
            </span>

            {hasTextValue(plant.pnu_no) && (
              <span className="vh-catalog shrink-0 !text-[10px] md:!text-[11px]">
                PNU {plant.pnu_no}
              </span>
            )}
          </div>

          <h3 className="vh-binomial mt-2 line-clamp-2 text-[1rem] leading-snug text-ink transition group-hover:text-moss md:text-[1.15rem]">
            {botanicalName || getPlantName(plant)}
          </h3>

          {botanicalName && commonName && (
            <p className="mt-1 truncate text-[12px] text-muted md:text-[13px]">
              {commonName}
            </p>
          )}

          <div className="mt-auto pt-3 md:pt-4">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-2 gap-y-1 border-t border-dashed border-rule-strong pt-2.5 text-[11px] md:pt-3 md:text-[12px]">
              <dt className="text-faint">
                <PinIcon className="h-3 w-3 translate-y-[1px] md:h-3.5 md:w-3.5" />
                <span className="sr-only">{t.location}</span>
              </dt>
              <dd className="truncate text-ink-soft" title={locality}>
                {locality}
              </dd>

              {collector && (
                <>
                  <dt className="hidden text-faint md:block">
                    <UserIcon className="h-3.5 w-3.5 translate-y-[1px]" />
                    <span className="sr-only">{t.collector}</span>
                  </dt>
                  <dd
                    className="hidden truncate text-ink-soft md:block"
                    title={collector}
                  >
                    {collector}
                    {plant.collector_no && (
                      <span className="vh-catalog ml-1.5">
                        <span className="sr-only">{t.collectorNo} </span>
                        {plant.collector_no}
                      </span>
                    )}
                  </dd>
                </>
              )}

              {!collector && plant.collector_no && (
                <>
                  <dt className="hidden text-faint md:block">
                    <DocumentIcon className="h-3.5 w-3.5 translate-y-[1px]" />
                    <span className="sr-only">{t.collectorNo}</span>
                  </dt>
                  <dd className="vh-catalog hidden truncate md:block">
                    {plant.collector_no}
                  </dd>
                </>
              )}
            </dl>
          </div>

          <span className="mt-3 hidden items-center gap-1.5 text-[12px] text-moss md:inline-flex">
            {t.viewDetails}
            <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </article>
  );
}

/* =========================================================
   SPECIMEN TABLE (LIST VIEW, DESKTOP)
========================================================= */

function SpecimenTable({
  plants,
  t,
  isEnglish,
  getPlantName,
  getCommonName,
  getLocation,
  getCollector,
}) {
  /* Thai headers must not get wide tracking */
  const thClass = isEnglish ? "" : "!font-sans !text-[12px] !tracking-normal";

  return (
    <div className="vh-panel mt-6 overflow-x-auto md:mt-8">
      <table className="vh-table min-w-[680px]">
        <thead>
          <tr>
            <th className="w-[72px]">
              <span className="sr-only">{t.specimen}</span>
            </th>
            <th>PNU</th>
            <th className={thClass}>{t.specimenColumn}</th>
            <th className={thClass}>{t.family}</th>
            <th className={`hidden lg:table-cell ${thClass}`}>{t.location}</th>
            <th className={`hidden xl:table-cell ${thClass}`}>{t.collector}</th>
            <th className="w-[64px]">
              <span className="sr-only">{t.viewDetails}</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {plants.map((plant) => {
            const botanicalName = plant.botanical_name?.trim();

            const commonName = getCommonName(plant);

            const collector = getCollector(plant);

            return (
              <tr key={plant.id} className="group">
                <td className="!py-2.5">
                  <Link
                    href={`/plants/${plant.id}`}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="block h-12 w-12 overflow-hidden rounded-[3px] bg-paper-deep"
                  >
                    {plant.image_url ? (
                      <img
                        src={plant.image_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <LeafIcon className="h-5 w-5 text-faint" />
                      </span>
                    )}
                  </Link>
                </td>

                <td className="whitespace-nowrap">
                  <span className="vh-catalog !text-[12px] !text-ink-soft">
                    {hasTextValue(plant.pnu_no) ? plant.pnu_no : "—"}
                  </span>
                </td>

                <td className="max-w-[280px]">
                  <Link
                    href={`/plants/${plant.id}`}
                    className="vh-binomial block truncate text-[1.02rem] text-ink transition group-hover:text-moss"
                  >
                    {botanicalName || getPlantName(plant)}
                  </Link>

                  {botanicalName && commonName && (
                    <span className="mt-0.5 block truncate text-[12px] text-muted">
                      {commonName}
                    </span>
                  )}
                </td>

                <td className="whitespace-nowrap">
                  <span className="vh-family">{plant.family || "—"}</span>
                </td>

                <td className="hidden max-w-[220px] lg:table-cell">
                  <span
                    className="block truncate text-[13px]"
                    title={getLocation(plant)}
                  >
                    {getLocation(plant) || t.unknown}
                  </span>
                </td>

                <td className="hidden max-w-[200px] xl:table-cell">
                  <span className="block truncate text-[13px]">
                    {collector || "—"}
                  </span>

                  {plant.collector_no && (
                    <span className="vh-catalog mt-0.5 block">
                      {t.collectorNo} {plant.collector_no}
                    </span>
                  )}
                </td>

                <td className="text-right">
                  <Link
                    href={`/plants/${plant.id}`}
                    aria-label={`${t.viewDetails} ${botanicalName || getPlantName(plant)}`}
                    className="vh-icon-btn !h-8 !w-8"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function SkeletonCard() {
  return (
    <div className="vh-specimen">
      <div className="vh-skeleton aspect-[4/5]" />

      <div className="space-y-2.5 p-3 md:p-4">
        <div className="vh-skeleton h-3 w-16 rounded" />
        <div className="vh-skeleton h-5 w-3/4 rounded" />
        <div className="vh-skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function SearchIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function FilterIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}

function RefreshIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11a8 8 0 0 0-14.9-3.9L3 10" />
      <path d="M3 4v6h6" />
      <path d="M4 13a8 8 0 0 0 14.9 3.9L21 14" />
      <path d="M21 20v-6h-6" />
    </svg>
  );
}

function LeafIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
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

function GridIcon({ className = "" }) {
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
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
    </svg>
  );
}

function ListIcon({ className = "" }) {
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
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <path d="M4.5 6h.01" />
      <path d="M4.5 12h.01" />
      <path d="M4.5 18h.01" />
    </svg>
  );
}

function DocumentIcon({ className = "" }) {
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
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

function UserIcon({ className = "" }) {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function ChevronLeftIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CloseCircleIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6" />
      <path d="m15 9-6 6" />
    </svg>
  );
}

function CloseIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function AlertIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 2.5 20h19Z" />
      <path d="M12 9v5" />
      <path d="M12 17.5h.01" />
    </svg>
  );
}
