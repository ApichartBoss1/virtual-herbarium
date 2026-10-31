"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import BulkDeleteDialog from "@/components/BulkDeleteDialog";
import Navbar from "@/components/Navbar";
import { useAdmin } from "@/components/AdminContext";
import { readLabelSelection, writeLabelSelection } from "@/lib/labelSelection";
import { supabase } from "@/lib/supabase";
import {
  EMPTY_FACETS,
  MAX_LABELS,
  fetchPlantFacets,
  fetchPlantIdsByFilters,
  fetchPlantsPage,
} from "@/lib/plantQueries";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* รอให้หยุดพิมพ์ก่อนค่อยค้นหาที่ฐานข้อมูล */
const SEARCH_DEBOUNCE_MS = 300;

export default function MyPlantsPage() {
  const { language } = useSiteSettings();

  const router = useRouter();

  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const { user } = useAdmin();

  /* rows of the current page only */
  const [plants, setPlants] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [facets, setFacets] = useState(EMPTY_FACETS);

  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearchValue] = useState("");
  const [familyFilter, setFamilyFilterValue] = useState("");
  const [localityFilter, setLocalityFilterValue] = useState("");
  const [sort, setSortValue] = useState("newest");

  const [isMobile, setIsMobile] = useState(false);
  const [viewportReady, setViewportReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const requestIdRef = useRef(0);

  const [deletingPlantId, setDeletingPlantId] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [actionError, setActionError] = useState("");

  /* id ที่เลือกไว้พิมพ์ป้าย คงอยู่เมื่อเปลี่ยนหน้า/ตัวกรอง (เก็บใน sessionStorage) */
  const [selectedIds, setSelectedIds] = useState(() =>
    typeof window === "undefined" ? [] : readLabelSelection(),
  );

  /* ลบหลายรายการ: id ที่ส่งเข้ากล่องยืนยัน (null = ปิด) */
  const [bulkDeleteIds, setBulkDeleteIds] = useState(null);

  const [selectingAll, setSelectingAll] = useState(false);

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "PLANT COLLECTION",

      title: "จัดการคลังพรรณไม้",

      subtitle:
        "ค้นหา ตรวจสอบ และจัดการตัวอย่างพรรณไม้ทั้งหมดใน Virtual Herbarium",

      backAccount: "กลับไปหน้าบัญชี",

      searchTitle: "ค้นหาและกรองข้อมูล",

      searchPlaceholder: "ค้นหา PNU, ชื่อวิทยาศาสตร์, วงศ์, ผู้เก็บ หรือสถานที่",

      clearSearch: "ล้างคำค้น",

      collectionLabel: "SPECIMENS",
      collectionTitle: "รายการพรรณไม้",

      addPlant: "เพิ่มข้อมูลพรรณไม้",
      addMobile: "เพิ่มพรรณไม้",
      importData: "นำเข้าข้อมูล",
      printLabels: "พิมพ์ป้าย",

      selectRow: "เลือกรายการนี้",
      selectPage: "เลือกทั้งหน้า",
      selectedCount: (count) => `เลือกไว้ ${count} รายการ`,
      clearSelection: "ล้างที่เลือก",
      printSelected: (count) => `พิมพ์ป้ายที่เลือก (${count})`,
      selectionLimit: `พิมพ์ได้ครั้งละไม่เกิน ${MAX_LABELS} ป้าย`,
      deleteSelected: (count) => `ลบที่เลือก (${count})`,
      selectAllMatching: (count) =>
        `เลือกทั้งหมดที่ตรงตัวกรอง (${count.toLocaleString("th-TH")} รายการ)`,
      selectingAll: "กำลังเลือก...",
      selectAllError: "เลือกทั้งหมดไม่สำเร็จ กรุณาลองใหม่",

      total: "ทั้งหมด",
      result: "รายการ",
      found: "พบ",

      location: "สถานที่",
      collector: "ผู้เก็บตัวอย่าง",
      specimen: "หมายเลขตัวอย่าง",

      view: "รายละเอียด",
      viewShort: "ดู",
      edit: "แก้ไข",
      delete: "ลบ",
      deleting: "กำลังลบ...",
      deleteConfirm: "ต้องการลบข้อมูลพรรณไม้นี้ใช่หรือไม่?",
      deleteDescription:
        "ข้อมูลตัวอย่างนี้จะถูกลบออกจากคลังอย่างถาวร และไม่สามารถกู้คืนได้",
      cancel: "ยกเลิก",
      deleteError: "ไม่สามารถลบข้อมูลพรรณไม้ได้",
      imageDeleteError:
        "ลบข้อมูลพรรณไม้แล้ว แต่ไม่สามารถลบรูปภาพออกจากที่จัดเก็บได้",
      dismiss: "ปิด",

      noPlants: "ยังไม่มีข้อมูลพรรณไม้",
      noPlantsDescription:
        "คลังของคุณยังว่างอยู่ เริ่มบันทึกตัวอย่างพรรณไม้ชิ้นแรกได้เลย",

      noResults: "ไม่พบข้อมูลที่ตรงกับการค้นหา",

      noResultsDescription: "ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองบางรายการ",

      clear: "ล้างตัวกรอง",

      familyLabel: "วงศ์",
      allFamilies: "ทุกวงศ์",
      localityLabel: "สถานที่",
      allLocalities: "ทุกสถานที่",
      sortLabel: "เรียงตาม",
      sortNewest: "เพิ่มล่าสุด",
      sortOldest: "เก่าที่สุด",
      sortAZ: "ชื่อ ก–ฮ / A–Z",
      sortZA: "ชื่อ ฮ–ก / Z–A",

      colImage: "ภาพ",
      colPnu: "PNU No.",
      colName: "ชื่อวิทยาศาสตร์",
      colFamily: "วงศ์",
      colActions: "จัดการ",

      loading: "กำลังเปิดคลังพรรณไม้ของคุณ...",

      loadError: "ไม่สามารถโหลดข้อมูลพรรณไม้ได้",

      retry: "ลองอีกครั้ง",


      unknownPlant: "ไม่ระบุชื่อพรรณไม้",

      previous: "ก่อนหน้า",
      next: "ถัดไป",
      page: "หน้า",
      of: "จาก",
    },

    EN: {
      eyebrow: "PLANT COLLECTION",

      title: "Manage Plant Collection",

      subtitle:
        "Search, review and manage every plant specimen in Virtual Herbarium.",

      backAccount: "Back to Account",

      searchTitle: "Search & Filter",

      searchPlaceholder:
        "Search PNU, botanical name, family, collector or locality",

      clearSearch: "Clear search",

      collectionLabel: "SPECIMENS",
      collectionTitle: "Plant Records",

      addPlant: "Add Plant Record",
      addMobile: "Add Plant",
      importData: "Import Data",
      printLabels: "Print Labels",

      selectRow: "Select this record",
      selectPage: "Select this page",
      selectedCount: (count) => `${count} selected`,
      clearSelection: "Clear selection",
      printSelected: (count) => `Print selected labels (${count})`,
      selectionLimit: `Up to ${MAX_LABELS} labels per print`,
      deleteSelected: (count) => `Delete selected (${count})`,
      selectAllMatching: (count) =>
        `Select all matching filters (${count.toLocaleString("en-US")})`,
      selectingAll: "Selecting...",
      selectAllError: "Unable to select all records. Please try again.",

      total: "Total",
      result: "records",
      found: "Found",

      location: "Location",
      collector: "Collected by",
      specimen: "Specimen number",

      view: "Details",
      viewShort: "View",
      edit: "Edit",
      delete: "Delete",
      deleting: "Deleting...",
      deleteConfirm: "Are you sure you want to delete this plant?",
      deleteDescription:
        "This specimen record will be permanently removed from your collection.",
      cancel: "Cancel",
      deleteError: "Unable to delete this plant record",
      imageDeleteError:
        "The plant record was deleted, but its image could not be removed from storage.",
      dismiss: "Dismiss",

      noPlants: "No plant records yet",
      noPlantsDescription:
        "Your collection is still empty — begin by recording your first specimen.",

      noResults: "No matching plant records",

      noResultsDescription:
        "Try another search term or remove some active filters.",

      clear: "Clear filters",

      familyLabel: "Family",
      allFamilies: "All families",
      localityLabel: "Locality",
      allLocalities: "All localities",
      sortLabel: "Sort",
      sortNewest: "Newest first",
      sortOldest: "Oldest first",
      sortAZ: "Name A–Z",
      sortZA: "Name Z–A",

      colImage: "Image",
      colPnu: "PNU No.",
      colName: "Botanical name",
      colFamily: "Family",
      colActions: "Actions",

      loading: "Opening your plant collection...",

      loadError: "Unable to load your plant records",

      retry: "Try Again",


      unknownPlant: "Unnamed Plant",

      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     RESPONSIVE PAGE SIZE
     MOBILE = 10
     TABLET / DESKTOP = 12
  ===================================================== */

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");

    const updateViewport = () => {
      setIsMobile(media.matches);
      setViewportReady(true);
      setCurrentPage(1);
    };

    updateViewport();

    media.addEventListener?.("change", updateViewport);

    return () => {
      media.removeEventListener?.("change", updateViewport);
    };
  }, []);

  /* =====================================================
     FILTER SETTERS
     Any filter change goes back to page 1
  ===================================================== */

  function setSearch(value) {
    setSearchInput(value);
    setSearchValue(String(value || "").trim());
    setCurrentPage(1);
  }

  function setFamilyFilter(value) {
    setFamilyFilterValue(value);
    setCurrentPage(1);
  }

  function setLocalityFilter(value) {
    setLocalityFilterValue(value);
    setCurrentPage(1);
  }

  function setSort(value) {
    setSortValue(value);
    setCurrentPage(1);
  }

  /* SEARCH INPUT (DEBOUNCED) */

  useEffect(() => {
    const next = searchInput.trim();

    if (next === search) return;

    const timer = window.setTimeout(() => {
      setSearchValue(next);
      setCurrentPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchInput, search]);

  /* =====================================================
     FETCH PLANTS
     facets = totals + filter options
     page   = rows of the current page
  ===================================================== */

  function refreshData() {
    setReloadKey((key) => key + 1);
  }

  const userId = user?.id || "";

  useEffect(() => {
    if (!userId) return;

    let active = true;

    fetchPlantFacets()
      .then((data) => {
        if (active) setFacets(data);
      })
      .catch((err) => {
        console.error("Fetch plant facets error:", err);

        if (active) {
          setFacets(EMPTY_FACETS);
          setError(err?.message || t.loadError);
        }
      });

    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  const itemsPerPage = isMobile ? 10 : 12;

  /* คำขอใหม่ → ตั้งสถานะกำลังโหลดระหว่าง render แทนการ setState ใน effect
     ("" = ยังไม่ส่งคำขอ) */
  const listRequestKey =
    userId && viewportReady
      ? JSON.stringify([
          userId,
          search,
          familyFilter,
          localityFilter,
          sort,
          currentPage,
          itemsPerPage,
          reloadKey,
        ])
      : "";

  const [startedListKey, setStartedListKey] = useState("");

  if (listRequestKey !== startedListKey) {
    setStartedListKey(listRequestKey);

    if (listRequestKey) {
      setListLoading(true);
      setError("");
    }
  }

  useEffect(() => {
    if (!userId || !viewportReady) return;

    /* ignore responses that arrive after a newer request */
    const requestId = ++requestIdRef.current;

    fetchPlantsPage({
      search,
      family: familyFilter,
      locality: localityFilter,
      sort,
      page: currentPage,
      pageSize: itemsPerPage,
    })
      .then(({ rows, total }) => {
        if (requestId !== requestIdRef.current) return;

        /* page is past the last page (e.g. after deleting its last row) */
        if (total === null) {
          setCurrentPage((page) => Math.max(1, page - 1));
          return;
        }

        setPlants(rows);
        setTotalResults(total);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;

        console.error("Fetch my plants error:", err);

        setPlants([]);
        setTotalResults(0);
        setError(err?.message || t.loadError);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setListLoading(false);
        }
      });
  }, [
    userId,
    viewportReady,
    search,
    familyFilter,
    localityFilter,
    sort,
    currentPage,
    itemsPerPage,
    reloadKey,
  ]);

  /* Opens the confirmation sheet (replaces window.confirm) */
  function requestDelete(plant) {
    if (!plant?.id) return;

    setPendingDelete(plant);
  }

  function cancelDelete() {
    if (deletingPlantId) return;

    setPendingDelete(null);
  }

  async function deletePlant(plant) {
    const plantId = plant?.id;

    if (!plantId) return;

    setDeletingPlantId(plantId);
    setActionError("");

    try {
      const { data: deleted, error } = await supabase
        .from("plants")
        .delete()
        .eq("id", plantId)
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }

      /* RLS can block a delete without returning an error */
      if (!deleted) {
        throw new Error(t.deleteError);
      }

      refreshData();

      updateSelection((ids) => ids.filter((id) => id !== plantId));

      const imagePath = getPlantImageStoragePath(plant.image_url);

      if (imagePath) {
        const { error: storageError } = await supabase.storage
          .from("plant-images")
          .remove([imagePath]);

        if (storageError) {
          console.error("Delete plant image error:", storageError);

          setActionError(t.imageDeleteError);
        }
      }
    } catch (err) {
      console.error("Delete plant error:", err);

      setActionError(err?.message || t.deleteError);
    } finally {
      setDeletingPlantId("");
      setPendingDelete(null);
    }
  }

  /* Close the delete sheet with Escape */
  useEffect(() => {
    if (!pendingDelete) return;

    function onKeyDown(event) {
      if (event.key === "Escape" && !deletingPlantId) {
        setPendingDelete(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pendingDelete, deletingPlantId]);

  /* =====================================================
     LABEL SELECTION
  ===================================================== */

  function updateSelection(update) {
    setSelectedIds((current) => {
      const next = update(current);

      writeLabelSelection(next);

      return next;
    });
  }

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const pageIds = plants.map((plant) => plant.id).filter(Boolean);

  const pageSelectedCount = pageIds.filter((id) => selectedSet.has(id)).length;

  const allPageSelected =
    pageIds.length > 0 && pageSelectedCount === pageIds.length;

  function toggleSelected(id) {
    if (!id) return;

    updateSelection((ids) =>
      ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
    );
  }

  function togglePageSelected() {
    updateSelection((ids) => {
      if (allPageSelected) {
        const onPage = new Set(pageIds);

        return ids.filter((id) => !onPage.has(id));
      }

      const current = new Set(ids);

      return [...ids, ...pageIds.filter((id) => !current.has(id))];
    });
  }

  /* id ทุกรายการที่ตรงตัวกรองปัจจุบัน รวมเข้ากับที่เลือกไว้ */
  async function selectAllMatching() {
    setSelectingAll(true);
    setActionError("");

    try {
      const ids = await fetchPlantIdsByFilters({
        search,
        family: familyFilter,
        locality: localityFilter,
      });

      updateSelection((current) => {
        const existing = new Set(current);

        return [...current, ...ids.filter((id) => !existing.has(id))];
      });
    } catch (err) {
      console.error("Select all matching error:", err);

      setActionError(t.selectAllError);
    } finally {
      setSelectingAll(false);
    }
  }

  /* ลบเสร็จ: ล้าง id ที่ลบแล้ว (และที่ไม่พบในระบบ) ออกจากการเลือก แล้วโหลดใหม่
     หน้าปัจจุบันว่าง → fetchPlantsPage คืน total = null แล้วถอยหน้าเอง */
  function handleBulkDeleteFinished({ clearedIds }) {
    const cleared = new Set(clearedIds);

    updateSelection((ids) => ids.filter((id) => !cleared.has(id)));

    refreshData();
  }

  function printSelected() {
    if (selectedIds.length === 0) return;

    writeLabelSelection(selectedIds);

    router.push("/account/plants/labels?source=selection");
  }

  /* =====================================================
     FILTER OPTIONS
  ===================================================== */

  const families = useMemo(
    () => facets.families.map((family) => family.name),
    [facets],
  );

  const localities = useMemo(
    () => facets.localities.map((locality) => locality.name),
    [facets],
  );

  const localityLabels = useMemo(() => {
    return Object.fromEntries(
      facets.localities.map((locality) => [
        locality.name,
        `${locality.name} (${locality.count})`,
      ]),
    );
  }, [facets]);

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));

  function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);

    requestAnimationFrame(() => {
      document.getElementById("my-specimens")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  /* =====================================================
     FILTER HELPERS
  ===================================================== */

  const hasFilterValues = Boolean(search || familyFilter || localityFilter);

  const hasFilters = Boolean(hasFilterValues || sort !== "newest");

  function clearFilters() {
    setSearch("");

    setFamilyFilter("");

    setLocalityFilter("");

    setSort("newest");
  }

  const sortOptions = ["newest", "oldest", "nameAZ", "nameZA"];

  const sortLabels = {
    newest: t.sortNewest,
    oldest: t.sortOldest,
    nameAZ: t.sortAZ,
    nameZA: t.sortZA,
  };

  /* =====================================================
     PAGE
  ===================================================== */

  const pageStart = totalResults ? (currentPage - 1) * itemsPerPage + 1 : 0;

  const pageEnd = Math.min(currentPage * itemsPerPage, totalResults);

  return (
    <main className="page min-h-screen overflow-x-hidden text-ink">
      <Navbar />

      <div className="vh-container page-enter pb-[calc(106px+env(safe-area-inset-bottom))] pt-6 sm:pb-16 md:pt-10">
        {/* =================================================
            HEADER
        ================================================= */}

        <Link
          href="/account"
          className="vh-btn vh-btn-ghost vh-btn-sm -ml-3 hidden md:inline-flex"
        >
          <ArrowLeftIcon className="h-4 w-4" />

          {t.backAccount}
        </Link>

        <header className="mt-2 flex flex-col gap-6 border-b border-rule-strong pb-7 md:mt-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="vh-eyebrow flex items-center gap-3">
              <span className="h-px w-6 bg-ochre" />
              {t.eyebrow}
            </p>

            <h1 className="vh-display mt-4 text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]">
              {t.title}
            </h1>

            <p className="mt-4 max-w-2xl text-[14px] leading-7 text-muted sm:text-[15px]">
              {t.subtitle}
            </p>

            <p className="mt-4 font-mono text-[12px] tabular-nums text-faint">
              <span className="text-ochre">{t.total}</span>{" "}
              <span className="text-ink">
                {String(facets.total).padStart(3, "0")}
              </span>{" "}
              {t.result}
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
            <Link
              href="/account/plants/labels"
              className="vh-btn vh-btn-outline w-full sm:w-auto"
            >
              <PrintIcon className="h-4 w-4" />

              {t.printLabels}
            </Link>

            <Link
              href="/account/plants/import"
              className="vh-btn vh-btn-outline w-full sm:w-auto"
            >
              <ImportIcon className="h-4 w-4" />

              {t.importData}
            </Link>

            <Link
              href="/account/plants/new"
              aria-label={t.addPlant}
              className="vh-btn vh-btn-primary w-full sm:w-auto"
            >
              <PlusIcon className="h-4 w-4" />

              <span className="sm:hidden">{t.addMobile}</span>

              <span className="hidden sm:inline">{t.addPlant}</span>
            </Link>
          </div>
        </header>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <section aria-label={t.searchTitle} className="vh-panel mt-7 p-4 sm:p-5">
          <h2 className="vh-eyebrow">{t.searchTitle}</h2>

          {/* SEARCH */}

          <div className="relative mt-3 min-w-0">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-faint" />

            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchTitle}
              className="vh-input h-12 truncate pl-11 pr-11 [&::-webkit-search-cancel-button]:appearance-none"
            />

            {searchInput && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={t.clearSearch}
                title={t.clearSearch}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-faint transition hover:bg-moss-soft hover:text-ink"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* FILTERS */}

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.4fr_0.9fr]">
            <SelectField
              label={t.familyLabel}
              value={familyFilter}
              onChange={setFamilyFilter}
              options={families}
              placeholder={t.allFamilies}
            />

            <SelectField
              label={t.localityLabel}
              value={localityFilter}
              onChange={setLocalityFilter}
              options={localities}
              labels={localityLabels}
              placeholder={t.allLocalities}
            />

            <SelectField
              label={t.sortLabel}
              value={sort}
              onChange={setSort}
              options={sortOptions}
              labels={sortLabels}
            />
          </div>

          {/* ACTIVE FILTERS */}

          {hasFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {familyFilter && (
                <FilterChip
                  label={`${t.familyLabel}: ${familyFilter}`}
                  onRemove={() => setFamilyFilter("")}
                  removeLabel={t.clear}
                />
              )}

              {localityFilter && (
                <FilterChip
                  label={`${t.localityLabel}: ${localityFilter}`}
                  onRemove={() => setLocalityFilter("")}
                  removeLabel={t.clear}
                />
              )}

              {search.trim() && (
                <FilterChip
                  label={`“${search.trim()}”`}
                  onRemove={() => setSearch("")}
                  removeLabel={t.clearSearch}
                />
              )}

              <button
                type="button"
                onClick={clearFilters}
                className="vh-btn vh-btn-ghost vh-btn-sm ml-auto"
              >
                <CloseIcon className="h-3.5 w-3.5" />
                {t.clear}
              </button>
            </div>
          )}

          {/* RESULT COUNT */}

          <p className="mt-4 border-t border-rule pt-3 text-[13px] text-muted">
            {t.found}{" "}
            <span className="font-mono tabular-nums text-ink">
              {totalResults}
            </span>{" "}
            {t.of}{" "}
            <span className="font-mono tabular-nums">{facets.total}</span>{" "}
            {t.result}
          </p>
        </section>

        {/* =================================================
            REGISTER
        ================================================= */}

        <section id="my-specimens" className="mt-10 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-3">
            <div className="min-w-0">
              <p className="vh-eyebrow">{t.collectionLabel}</p>

              <h2 className="vh-display mt-2 text-[1.6rem] sm:text-[1.9rem]">
                {t.collectionTitle}
              </h2>
            </div>

            <p className="font-mono text-[12px] tabular-nums text-faint">
              {totalResults > 0 && (
                <>
                  {pageStart}–{pageEnd} / {" "}
                </>
              )}
              <span className="text-ink">{totalResults}</span>{" "}
              {t.result}
            </p>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              role="alert"
              className="vh-panel mt-5 flex items-start gap-3 border-clay/40 bg-clay-soft p-4"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-clay" />

              <div className="min-w-0">
                <p className="text-[14px] leading-6 text-clay">{error}</p>

                <button
                  type="button"
                  onClick={refreshData}
                  className="vh-btn vh-btn-danger vh-btn-sm mt-3"
                >
                  {t.retry}
                </button>
              </div>
            </div>
          )}

          {actionError && (
            <div
              role="alert"
              className="vh-panel mt-5 flex items-start gap-3 border-clay/40 bg-clay-soft p-4"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-clay" />

              <p className="min-w-0 flex-1 text-[14px] leading-6 text-clay">
                {actionError}
              </p>

              <button
                type="button"
                onClick={() => setActionError("")}
                aria-label={t.dismiss}
                title={t.dismiss}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-clay transition hover:bg-clay-soft"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* =================================================
              LABEL SELECTION
          ================================================= */}

          {(plants.length > 0 || selectedIds.length > 0) && (
            <div className="vh-panel mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 p-3 sm:px-4">
              <label
                className={`flex items-center gap-2.5 text-[13px] text-ink-soft ${
                  pageIds.length > 0 ? "cursor-pointer" : "opacity-50"
                }`}
              >
                <Checkbox
                  checked={allPageSelected}
                  indeterminate={pageSelectedCount > 0 && !allPageSelected}
                  disabled={pageIds.length === 0}
                  onChange={togglePageSelected}
                />

                {t.selectPage}
              </label>

              <p aria-live="polite" className="text-[13px] text-muted">
                <span className="font-mono tabular-nums text-ink">
                  {t.selectedCount(selectedIds.length)}
                </span>

                {selectedIds.length > MAX_LABELS && (
                  <span className="ml-2 text-ochre">{t.selectionLimit}</span>
                )}
              </p>

              {totalResults > 0 && (
                <button
                  type="button"
                  data-select-all-matching
                  onClick={selectAllMatching}
                  disabled={selectingAll}
                  className="vh-btn vh-btn-ghost vh-btn-sm -ml-2 w-full justify-start sm:w-auto"
                >
                  {selectingAll ? (
                    <LoadingIcon className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckAllIcon className="h-3.5 w-3.5" />
                  )}
                  {selectingAll ? t.selectingAll : t.selectAllMatching(totalResults)}
                </button>
              )}

              <div className="grid w-full grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto">
                <button
                  type="button"
                  onClick={() => updateSelection(() => [])}
                  disabled={selectedIds.length === 0}
                  className="vh-btn vh-btn-ghost vh-btn-sm sm:flex-none"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                  {t.clearSelection}
                </button>

                <button
                  type="button"
                  data-bulk-delete
                  onClick={() => setBulkDeleteIds([...selectedIds])}
                  disabled={selectedIds.length === 0}
                  className="vh-btn vh-btn-danger vh-btn-sm sm:flex-none"
                >
                  <TrashIcon className="h-4 w-4" />
                  {t.deleteSelected(selectedIds.length)}
                </button>

                <button
                  type="button"
                  onClick={printSelected}
                  disabled={selectedIds.length === 0}
                  className="vh-btn vh-btn-primary vh-btn-sm col-span-2 sm:flex-none"
                >
                  <PrintIcon className="h-4 w-4" />
                  {t.printSelected(selectedIds.length)}
                </button>
              </div>
            </div>
          )}

          {/* =================================================
              FIRST LOAD
          ================================================= */}

          {!error && listLoading && plants.length === 0 && (
            <div className="vh-panel mt-6 flex items-center justify-center gap-3 px-6 py-12">
              <LoadingIcon className="h-5 w-5 animate-spin text-moss" />

              <p className="font-serif text-[15px] italic text-muted">
                {t.loading}
              </p>
            </div>
          )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!error && !listLoading && totalResults === 0 && !hasFilterValues && (
            <div className="vh-panel mt-6 px-6 py-12 text-center sm:py-16">
              <LeafIcon className="mx-auto h-7 w-7 text-faint" />

              <p className="mx-auto mt-5 max-w-md font-serif text-[1.35rem] italic leading-snug text-ink-soft">
                {t.noPlants}
              </p>

              <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-muted">
                {t.noPlantsDescription}
              </p>

              <Link
                href="/account/plants/new"
                className="vh-btn vh-btn-primary mt-6"
              >
                <PlusIcon className="h-4 w-4" />
                {t.addPlant}
              </Link>
            </div>
          )}

          {/* =================================================
              NO RESULTS
          ================================================= */}

          {!error && !listLoading && totalResults === 0 && hasFilterValues && (
            <div className="vh-panel mt-6 px-6 py-12 text-center">
              <SearchIcon className="mx-auto h-6 w-6 text-faint" />

              <p className="mx-auto mt-5 max-w-md font-serif text-[1.25rem] italic leading-snug text-ink-soft">
                {t.noResults}
              </p>

              <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-muted">
                {t.noResultsDescription}
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="vh-btn vh-btn-outline vh-btn-sm mt-5"
              >
                {t.clear}
              </button>
            </div>
          )}

          {/* =================================================
              RECORDS
              DESKTOP (lg+) = TABLE REGISTER
              MOBILE / TABLET = STACKED ROWS
          ================================================= */}

          {!error && plants.length > 0 && (
            <div
              aria-busy={listLoading}
              className={`transition-opacity ${listLoading ? "opacity-60" : ""}`}
            >
              {/* DESKTOP TABLE */}

              <div className="vh-panel mt-5 hidden overflow-x-auto lg:block">
                <table className="vh-table">
                  <thead>
                    <tr>
                      <th className="w-[44px] pr-0">
                        <span className="sr-only">{t.selectRow}</span>
                      </th>
                      <th className="w-[76px]">
                        <span className="sr-only">{t.colImage}</span>
                      </th>
                      <th>{t.colPnu}</th>
                      <th>{t.colName}</th>
                      <th>{t.colFamily}</th>
                      <th>{t.collector}</th>
                      <th>{t.location}</th>
                      <th className="text-right">
                        <span className="sr-only">{t.colActions}</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {plants.map((plant) => (
                      <PlantTableRow
                        key={plant.id || plant.plant_id}
                        plant={plant}
                        t={t}
                        isEnglish={isEnglish}
                        onDelete={requestDelete}
                        deleting={
                          deletingPlantId === (plant.id || plant.plant_id)
                        }
                        selected={selectedSet.has(plant.id)}
                        onToggleSelected={toggleSelected}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE / TABLET ROWS */}

              <ul className="vh-panel mt-5 divide-y divide-rule lg:hidden">
                {plants.map((plant) => (
                  <PlantMobileRow
                    key={plant.id || plant.plant_id}
                    plant={plant}
                    t={t}
                    isEnglish={isEnglish}
                    onDelete={requestDelete}
                    deleting={deletingPlantId === (plant.id || plant.plant_id)}
                    selected={selectedSet.has(plant.id)}
                    onToggleSelected={toggleSelected}
                  />
                ))}
              </ul>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  t={t}
                />
              )}
            </div>
          )}
        </section>
      </div>

      {/* =================================================
          DELETE CONFIRMATION SHEET
      ================================================= */}

      {bulkDeleteIds && (
        <BulkDeleteDialog
          ids={bulkDeleteIds}
          onClose={() => setBulkDeleteIds(null)}
          onFinished={handleBulkDeleteFinished}
        />
      )}

      {pendingDelete && (
        <DeleteSheet
          plant={pendingDelete}
          t={t}
          isEnglish={isEnglish}
          deleting={Boolean(deletingPlantId)}
          onCancel={cancelDelete}
          onConfirm={() => deletePlant(pendingDelete)}
        />
      )}
    </main>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function hasText(value) {
  return typeof value === "string" ? value.trim() !== "" : value != null;
}

function localized(isEnglish, th, en, legacy) {
  const values = isEnglish ? [en, th, legacy] : [th, en, legacy];

  const found = values.find((value) => hasText(value));

  return found != null ? String(found).trim() : "";
}

function getPlantView(plant, t, isEnglish) {
  const commonName = localized(
    isEnglish,
    plant.common_name_th,
    plant.common_name_en,
    plant.common_name,
  );

  const collector = localized(
    isEnglish,
    plant.collected_by_th,
    plant.collected_by_en,
    plant.collected_by,
  );

  const locality = hasText(plant.locality)
    ? String(plant.locality).trim()
    : [
        plant.location,
        plant.district,
        localized(isEnglish, plant.province_th, plant.province_en, plant.province),
      ]
        .filter(hasText)
        .join(", ");

  const accession = hasText(plant.pnu_no)
    ? `PNU ${plant.pnu_no}`
    : hasText(plant.specimen_number)
      ? String(plant.specimen_number)
      : "";

  return {
    plantId: plant.id || null,
    image: plant.image_url || "",
    botanicalName: plant.botanical_name || "",
    commonName,
    displayName: plant.botanical_name || commonName || t.unknownPlant,
    family: plant.family || "",
    collector,
    collectorNo: hasText(plant.collector_no) ? String(plant.collector_no) : "",
    locality,
    accession,
  };
}

/* =========================================================
   THUMBNAIL
========================================================= */

function Thumb({ image, alt, size = "h-14 w-14" }) {
  return (
    <div
      className={`${size} shrink-0 overflow-hidden rounded-[4px] border border-rule bg-paper-deep`}
    >
      {image ? (
        <img
          src={image}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <LeafIcon className="h-5 w-5 text-faint" />
        </div>
      )}
    </div>
  );
}

/* =========================================================
   NAME
========================================================= */

function PlantName({ view, t, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      {view.botanicalName ? (
        <p className="vh-binomial truncate text-[16px] text-ink" title={view.botanicalName}>
          {view.botanicalName}
        </p>
      ) : (
        <p className="truncate text-[15px] text-ink">
          {view.commonName || t.unknownPlant}
        </p>
      )}

      {view.botanicalName && view.commonName && (
        <p className="mt-0.5 truncate text-[13px] text-muted" title={view.commonName}>
          {view.commonName}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   TABLE ROW (DESKTOP)
========================================================= */

function PlantTableRow({
  plant,
  t,
  isEnglish,
  onDelete,
  deleting,
  selected,
  onToggleSelected,
}) {
  const view = getPlantView(plant, t, isEnglish);

  return (
    <tr className="align-middle">
      <td className="py-3 pr-0">
        {view.plantId && (
          <Checkbox
            checked={selected}
            onChange={() => onToggleSelected(view.plantId)}
            label={`${t.selectRow}: ${view.accession || view.displayName}`}
          />
        )}
      </td>

      <td className="py-3 pr-0">
        <Thumb image={view.image} alt={view.displayName} />
      </td>

      <td className="whitespace-nowrap">
        <span className="font-mono text-[12px] tabular-nums text-ink">
          {view.accession || "—"}
        </span>
      </td>

      <td className="max-w-[260px]">
        <PlantName view={view} t={t} />
      </td>

      <td className="max-w-[160px]">
        {view.family ? (
          <span className="vh-family block truncate" title={view.family}>
            {view.family}
          </span>
        ) : (
          <span className="text-faint">—</span>
        )}
      </td>

      <td className="max-w-[180px]">
        <p className="truncate text-[13px]" title={view.collector}>
          {view.collector || <span className="text-faint">—</span>}
        </p>

        {view.collectorNo && (
          <p className="vh-catalog mt-0.5">No. {view.collectorNo}</p>
        )}
      </td>

      <td className="max-w-[220px]">
        <p className="truncate text-[13px]" title={view.locality}>
          {view.locality || <span className="text-faint">—</span>}
        </p>
      </td>

      <td>
        <div className="flex items-center justify-end gap-2">
          {view.plantId && (
            <Link
              href={`/account/plants/${view.plantId}`}
              className="vh-icon-btn"
              aria-label={t.view}
              title={t.view}
            >
              <EyeIcon className="h-4 w-4" />
            </Link>
          )}

          {view.plantId && (
            <Link
              href={`/account/plants/${view.plantId}/edit`}
              className="vh-btn vh-btn-outline vh-btn-sm"
            >
              <EditIcon className="h-3.5 w-3.5" />
              {t.edit}
            </Link>
          )}

          <button
            type="button"
            onClick={() => onDelete(plant)}
            disabled={deleting}
            className="vh-icon-btn hover:border-clay/40 hover:bg-clay-soft hover:text-clay"
            aria-label={deleting ? t.deleting : t.delete}
            title={deleting ? t.deleting : t.delete}
          >
            {deleting ? (
              <LoadingIcon className="h-4 w-4 animate-spin" />
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

/* =========================================================
   STACKED ROW (MOBILE / TABLET)
========================================================= */

function PlantMobileRow({
  plant,
  t,
  isEnglish,
  onDelete,
  deleting,
  selected,
  onToggleSelected,
}) {
  const view = getPlantView(plant, t, isEnglish);

  return (
    <li className="p-4">
      <div className="flex min-w-0 gap-3.5">
        {view.plantId && (
          <div className="flex shrink-0 items-center">
            <Checkbox
              checked={selected}
              onChange={() => onToggleSelected(view.plantId)}
              label={`${t.selectRow}: ${view.accession || view.displayName}`}
            />
          </div>
        )}

        <Thumb
          image={view.image}
          alt={view.displayName}
          size="h-[72px] w-[72px]"
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="truncate font-mono text-[11.5px] tabular-nums text-ink">
              {view.accession || "—"}
            </span>

            {view.family && (
              <span className="vh-family min-w-0 truncate" title={view.family}>
                {view.family}
              </span>
            )}
          </div>

          <PlantName view={view} t={t} className="mt-1" />

          {(view.collector || view.locality) && (
            <dl className="mt-2 space-y-0.5 text-[12.5px]">
              {view.collector && (
                <div className="flex min-w-0 gap-2">
                  <dt className="shrink-0 text-faint">{t.collector}</dt>
                  <dd className="truncate text-ink-soft">{view.collector}</dd>
                </div>
              )}

              {view.locality && (
                <div className="flex min-w-0 gap-2">
                  <dt className="shrink-0 text-faint">{t.location}</dt>
                  <dd className="truncate text-ink-soft">{view.locality}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-dashed border-rule-strong pt-3">
        {view.plantId && (
          <Link
            href={`/account/plants/${view.plantId}`}
            className="vh-btn vh-btn-ghost vh-btn-sm flex-1"
          >
            <EyeIcon className="h-4 w-4" />
            {t.viewShort}
          </Link>
        )}

        {view.plantId && (
          <Link
            href={`/account/plants/${view.plantId}/edit`}
            className="vh-btn vh-btn-outline vh-btn-sm flex-1"
          >
            <EditIcon className="h-3.5 w-3.5" />
            {t.edit}
          </Link>
        )}

        <button
          type="button"
          onClick={() => onDelete(plant)}
          disabled={deleting}
          className="vh-icon-btn hover:border-clay/40 hover:bg-clay-soft hover:text-clay"
          aria-label={deleting ? t.deleting : t.delete}
        >
          {deleting ? (
            <LoadingIcon className="h-4 w-4 animate-spin" />
          ) : (
            <TrashIcon className="h-4 w-4 text-clay" />
          )}
        </button>
      </div>
    </li>
  );
}

/* =========================================================
   DELETE SHEET
========================================================= */

function DeleteSheet({ plant, t, isEnglish, deleting, onCancel, onConfirm }) {
  const view = getPlantView(plant, t, isEnglish);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/40 p-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:items-center"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-sheet-title"
        aria-describedby="delete-sheet-description"
        className="vh-sheet page-enter w-full max-w-md p-6 shadow-lift"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="vh-eyebrow flex items-center gap-3">
          <span className="h-px w-6 bg-clay" />
          {t.delete}
        </p>

        <h2
          id="delete-sheet-title"
          className="vh-display mt-3 text-[1.5rem] leading-tight"
        >
          {t.deleteConfirm}
        </h2>

        <div className="vh-label-card mt-5 flex items-center gap-3">
          <Thumb image={view.image} alt={view.displayName} size="h-12 w-12" />

          <div className="min-w-0">
            {view.accession && (
              <p className="font-mono text-[11.5px] tabular-nums text-ink">
                {view.accession}
              </p>
            )}

            <PlantName view={view} t={t} />

            {view.family && (
              <p className="vh-family mt-1 truncate">{view.family}</p>
            )}
          </div>
        </div>

        <p
          id="delete-sheet-description"
          className="mt-4 text-[14px] leading-6 text-muted"
        >
          {t.deleteDescription}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="vh-btn vh-btn-outline"
            autoFocus
          >
            {t.cancel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="vh-btn vh-btn-danger"
          >
            {deleting ? (
              <LoadingIcon className="h-4 w-4 animate-spin" />
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
            {deleting ? t.deleting : t.delete}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGINATION
========================================================= */

function Pagination({ currentPage, totalPages, onPageChange, t }) {
  const pages = getPageItems(currentPage, totalPages);

  return (
    <nav aria-label={t.page} className="mt-6 border-t border-rule pt-5">
      {/* MOBILE */}

      <div className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2 sm:hidden">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label={t.previous}
          className="vh-icon-btn"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <div className="text-center text-[13px] text-muted">
          {t.page}{" "}
          <span className="font-mono tabular-nums text-ink">{currentPage}</span>{" "}
          {t.of} <span className="font-mono tabular-nums">{totalPages}</span>
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label={t.next}
          className="vh-icon-btn"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* TABLET / DESKTOP */}

      <div className="hidden items-center justify-between gap-4 sm:flex">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="vh-btn vh-btn-outline vh-btn-sm"
        >
          <ChevronLeftIcon className="h-4 w-4" />

          {t.previous}
        </button>

        <div className="flex items-center justify-center gap-1">
          {pages.map((item, index) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                aria-current={currentPage === item ? "page" : undefined}
                onClick={() => onPageChange(item)}
                className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 font-mono text-[12px] tabular-nums transition ${
                  currentPage === item
                    ? "bg-moss text-on-moss"
                    : "text-muted hover:bg-moss-soft hover:text-ink"
                }`}
              >
                {String(item).padStart(2, "0")}
              </button>
            ) : (
              <span
                key={`${item}-${index}`}
                className="px-1 font-mono text-[12px] text-faint"
              >
                …
              </span>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="vh-btn vh-btn-outline vh-btn-sm"
        >
          {t.next}

          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

/* =========================================================
   PAGE ITEMS
========================================================= */

function getPageItems(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from(
      {
        length: totalPages,
      },
      (_, index) => index + 1,
    );
  }

  const pages = [1];

  if (currentPage > 3) {
    pages.push("left");
  }

  const start = Math.max(2, currentPage - 1);

  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) {
    pages.push("right");
  }

  pages.push(totalPages);

  return pages;
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({ label, value, onChange, options, placeholder, labels = {} }) {
  return (
    <label className="block min-w-0">
      <span className="vh-eyebrow mb-1.5 block !text-[10px]">{label}</span>

      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="vh-input appearance-none truncate pr-9 text-[14px]"
        >
          {placeholder && <option value="">{placeholder}</option>}

          {options.map((option) => (
            <option key={option} value={option}>
              {labels[option] || option}
            </option>
          ))}
        </select>

        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      </span>
    </label>
  );
}

/* =========================================================
   CHECKBOX
   indeterminate ตั้งได้ผ่าน DOM เท่านั้น
========================================================= */

function Checkbox({ checked, indeterminate = false, disabled = false, onChange, label }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label={label}
      className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-moss disabled:cursor-not-allowed"
    />
  );
}

/* =========================================================
   FILTER CHIP
========================================================= */

function FilterChip({ label, onRemove, removeLabel }) {
  return (
    <span className="vh-tag vh-tag-moss max-w-full !pr-1">
      <span className="truncate">{label}</span>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`${removeLabel}: ${label}`}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition hover:bg-moss hover:text-on-moss"
      >
        <CloseIcon className="h-3 w-3" />
      </button>
    </span>
  );
}

/* =========================================================
   STORAGE PATH
   Same rule as the /account page
========================================================= */

function getPlantImageStoragePath(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  const marker = "/storage/v1/object/public/plant-images/";

  const url = String(imageUrl);

  if (!url.includes(marker)) {
    return "";
  }

  const encodedPath = url.split(marker)[1]?.split("?")[0] || "";

  if (!encodedPath) {
    return "";
  }

  try {
    return decodeURIComponent(encodedPath);
  } catch {
    return encodedPath;
  }
}

/* =========================================================
   ICONS
========================================================= */

function LeafIcon({ className = "" }) {
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
      <path d="M20 4C10 4 5 8 5 15c0 2.8 2 5 5 5 7 0 10-5 10-16Z" />

      <path d="M4 20c4-5 7-7 13-10" />
    </svg>
  );
}

function ImportIcon({ className = "" }) {
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
      <path d="M12 15V4" />

      <path d="m7 9 5-5 5 5" />

      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function CheckAllIcon({ className = "" }) {
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
      <path d="M3 12l4 4 8-8" />

      <path d="M11 16l1 1 9-9" />
    </svg>
  );
}

function PrintIcon({ className = "" }) {
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
      <path d="M7 9V4h10v5" />

      <path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />

      <path d="M7 14h10v6H7z" />
    </svg>
  );
}

function PlusIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />

      <path d="M5 12h14" />
    </svg>
  );
}

function EyeIcon({ className = "" }) {
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
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />

      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EditIcon({ className = "" }) {
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
      <path d="M12 20h9" />

      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

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

function ArrowLeftIcon({ className = "" }) {
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

      <path d="M9 12h10" />
    </svg>
  );
}

function ChevronDownIcon({ className = "" }) {
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
      <path d="m7 10 5 5 5-5" />
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
      <circle cx="12" cy="12" r="9" />

      <path d="M12 8v5" />

      <path d="M12 16.5h.01" />
    </svg>
  );
}

function LoadingIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon({ className = "" }) {
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
      <path d="M4 7h16" />

      <path d="M9 7V4h6v3" />

      <path d="M6 7l1 13h10l1-13" />

      <path d="M10 11v6" />

      <path d="M14 11v6" />
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
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />

      <path d="M18 6 6 18" />
    </svg>
  );
}
