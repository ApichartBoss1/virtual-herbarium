"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import BioHeroLazy from "@/components/BioHeroLazy";
import Navbar from "@/components/Navbar";
import { useAdmin } from "@/components/AdminContext";
import { supabase } from "@/lib/supabase";
import {
  EMPTY_FACETS,
  fetchPlantFacets,
  fetchPlantsPage,
} from "@/lib/plantQueries";
import { useSiteSettings } from "@/components/SiteSettingsContext";

/* =========================================================
   PAGE
========================================================= */

export default function AccountPage() {

  const { language } = useSiteSettings();
  const isEnglish = language === "EN";

  /* =====================================================
     STATE
  ===================================================== */

  const { user } = useAdmin();

  const [profile, setProfile] = useState(null);
  /* latest plants for the preview (max 6) */
  const [plants, setPlants] = useState([]);
  const [facets, setFacets] = useState(EMPTY_FACETS);

  const [loading, setLoading] = useState(true);
  const [plantsLoading, setPlantsLoading] = useState(false);

  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [deletingPlantId, setDeletingPlantId] = useState("");
  const [pendingDeletePlant, setPendingDeletePlant] = useState(null);

  /* =====================================================
     TEXT
  ===================================================== */

  const text = {
    TH: {
      eyebrow: "ADMIN HERBARIUM",

      title: "ศูนย์จัดการคลังพรรณไม้",

      subtitle:
        "จัดการข้อมูลตัวอย่างพรรณไม้ทั้งหมดใน Virtual Herbarium สำหรับผู้ดูแลระบบ",

      welcome: "ยินดีต้อนรับกลับ",

      addPlant: "เพิ่มพรรณไม้",
      managePlants: "จัดการทั้งหมด",

      profileLabel: "ADMIN PROFILE",
      memberSince: "เริ่มใช้งานผู้ดูแลตั้งแต่",

      verified: "ยืนยันอีเมลแล้ว",
      unverified: "ยังไม่ได้ยืนยันอีเมล",

      editProfile: "แก้ไขบัญชี",
      logout: "ออกจากระบบ",
      loggingOut: "กำลังออก...",

      myPlants: "คลังพรรณไม้ทั้งหมด",
      myPlantsLabel: "PLANT COLLECTION",

      myPlantsDescription: "จัดการข้อมูลตัวอย่างพรรณไม้ทุกรายการในคลัง",

      totalPlants: "ตัวอย่างทั้งหมด",
      families: "วงศ์พืช",
      groups: "กลุ่มพืช",

      edit: "แก้ไข",
      view: "ดู",
      delete: "ลบ",
      deleting: "กำลังลบ...",

      deleteConfirm:
        "ต้องการลบข้อมูลพรรณไม้นี้ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้",

      deleteError: "ไม่สามารถลบข้อมูลพรรณไม้ได้",

      noPlants: "ยังไม่มีข้อมูลพรรณไม้",

      loading: "กำลังเปิดระบบผู้ดูแล...",
      loadingPlants: "กำลังโหลดพรรณไม้...",

      family: "วงศ์",
      locality: "สถานที่ / อุทยาน / จังหวัด",
      collectorNo: "หมายเลขผู้เก็บ",


      loadError: "ไม่สามารถโหลดข้อมูลพรรณไม้ได้",
      retry: "ลองอีกครั้ง",

      unknownPlant: "ไม่ระบุชื่อวิทยาศาสตร์",

      morePlants: "รายการเพิ่มเติม",
      showAll: "ดูทั้งหมด",

      noPlantsDescription: "เริ่มต้นเพิ่มตัวอย่างพรรณไม้รายการแรกเข้าสู่คลัง",
      recentLabel: "ระเบียนล่าสุด",
      colAccession: "เลขทะเบียน",
      colSpecimen: "ตัวอย่าง",
      colActions: "จัดการ",
      deleteTitle: "ลบระเบียนพรรณไม้",
      cancel: "ยกเลิก",
    },

    EN: {
      eyebrow: "ADMIN HERBARIUM",

      title: "Herbarium Admin Dashboard",

      subtitle:
        "Manage all botanical specimen records in the Virtual Herbarium as an administrator.",

      welcome: "Welcome back",

      addPlant: "Add Plant",
      managePlants: "Manage All",

      profileLabel: "ADMIN PROFILE",
      memberSince: "Administrator since",

      verified: "Email verified",
      unverified: "Email not verified",

      editProfile: "Edit Account",
      logout: "Sign Out",
      loggingOut: "Signing out...",

      myPlants: "All Plant Records",
      myPlantsLabel: "PLANT COLLECTION",

      myPlantsDescription:
        "Manage all plant specimen records in the collection.",

      totalPlants: "Total Specimens",
      families: "Plant Families",
      groups: "Plant Groups",

      edit: "Edit",
      view: "View",
      delete: "Delete",
      deleting: "Deleting...",

      deleteConfirm:
        "Are you sure you want to delete this plant record? This action cannot be undone.",

      deleteError: "Unable to delete plant record",

      noPlants: "No plant records yet",

      loading: "Opening the admin dashboard...",
      loadingPlants: "Loading your plants...",

      family: "Family",
      locality: "Locality / NP / Province",
      collectorNo: "Collector No.",


      loadError: "Unable to load your plants.",
      retry: "Try Again",

      unknownPlant: "Botanical Name Not Specified",

      morePlants: "More plants",
      showAll: "View all",

      noPlantsDescription: "Start by adding the first specimen record to the collection.",
      recentLabel: "Recent records",
      colAccession: "Accession",
      colSpecimen: "Specimen",
      colActions: "Actions",
      deleteTitle: "Delete specimen record",
      cancel: "Cancel",
    },
  };

  const t = isEnglish ? text.EN : text.TH;

  /* =====================================================
     FETCH ADMIN PROFILE
  ===================================================== */

  async function fetchProfile(currentUser) {
    if (!currentUser?.id) {
      return null;
    }

    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profileError) {
        console.error("Load admin profile error:", profileError);
        return null;
      }

      return data || null;
    } catch (err) {
      console.error("Load admin profile failed:", err);
      return null;
    }
  }

  /* =====================================================
     FETCH DASHBOARD PLANTS

     Admin จัดการพรรณไม้ทั้งหมด
     ไม่กรองด้วย user_id อีกแล้ว
     ดึงเฉพาะ 6 รายการล่าสุด + สถิติจาก get_plant_facets()
  ===================================================== */

  async function fetchAllPlants() {
    setPlantsLoading(true);
    setError("");

    try {
      const [latest, facetData] = await Promise.all([
        fetchPlantsPage({ sort: "newest", page: 1, pageSize: 6 }),
        fetchPlantFacets(),
      ]);

      setPlants(latest.rows);
      setFacets(facetData);
    } catch (err) {
      console.error("Fetch admin plants failed:", err);

      setPlants([]);
      setFacets(EMPTY_FACETS);
      setError(err?.message || t.loadError);
    } finally {
      setPlantsLoading(false);
    }
  }

  /* =====================================================
     LOAD DASHBOARD
     สิทธิ์ admin ตรวจแล้วที่ app/account/layout.js
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const profileData = await fetchProfile(user);

        if (!mounted) return;

        setProfile(profileData);

        await fetchAllPlants();
      } catch (err) {
        console.error("Admin dashboard error:", err);

        if (mounted) {
          setError(err?.message || t.loadError);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [user]);

  /* =====================================================
     LOGOUT
  ===================================================== */

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setError("");

    try {
      const { error: logoutError } = await supabase.auth.signOut();

      if (logoutError) {
        throw logoutError;
      }

      /* app/account/layout.js พาไปหน้า /login เมื่อ SIGNED_OUT */
    } catch (err) {
      console.error("Logout error:", err);

      setError(
        err?.message ||
          (isEnglish ? "Unable to sign out." : "ไม่สามารถออกจากระบบได้"),
      );
    } finally {
      setLoggingOut(false);
    }
  }

  /* =====================================================
     DELETE PLANT - ADMIN ONLY

     ใช้ id (uuid) ของตาราง plants
  ===================================================== */

  async function deletePlant(plant) {
    const plantId = plant.id;

    if (!plantId || !user?.id || deletingPlantId) {
      return;
    }

    setDeletingPlantId(plantId);
    setError("");

    try {
      /* =============================================
         DELETE PLANT FROM DATABASE
      ============================================= */

      const { data: deleted, error: deleteError } = await supabase
        .from("plants")
        .delete()
        .eq("id", plantId)
        .select("id")
        .maybeSingle();

      if (deleteError) {
        throw deleteError;
      }

      if (!deleted) {
        throw new Error(t.deleteError);
      }

      /* =============================================
         REMOVE FROM UI
      ============================================= */

      await fetchAllPlants();

      /* =============================================
         REMOVE ASSOCIATED STORAGE IMAGE
      ============================================= */

      const imagePath = getPlantImageStoragePath(plant.image_url);

      if (imagePath) {
        const { error: storageError } = await supabase.storage
          .from("plant-images")
          .remove([imagePath]);

        if (storageError) {
          console.error("Delete plant image error:", storageError);
        }
      }
    } catch (err) {
      console.error("Delete plant error:", err);
      setError(err?.message || t.deleteError);
    } finally {
      setDeletingPlantId("");
      setPendingDeletePlant(null);
    }
  }

  /* =====================================================
     DELETE CONFIRM DIALOG
     (replaces window.confirm – same confirm-then-delete flow)
  ===================================================== */

  function requestDelete(plant) {
    if (!plant?.id || deletingPlantId) return;

    setPendingDeletePlant(plant);
  }

  function cancelDelete() {
    if (deletingPlantId) return;

    setPendingDeletePlant(null);
  }

  useEffect(() => {
    if (!pendingDeletePlant) return;

    function onKeyDown(event) {
      if (event.key === "Escape" && !deletingPlantId) {
        setPendingDeletePlant(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [pendingDeletePlant, deletingPlantId]);

  /* =====================================================
     STATS
  ===================================================== */

  const stats = {
    plants: facets.total,
    families: facets.family_count,
    groups: facets.group_count,
  };

  /* =====================================================
     MOBILE PREVIEW

     สูงสุด 4 block
     ถ้ามากกว่า 4 -> 3 plant + 1 remaining
  ===================================================== */

  const mobilePreview = useMemo(() => {
    if (facets.total <= 4) {
      return {
        items: plants.slice(0, 4),
        remaining: 0,
      };
    }

    return {
      items: plants.slice(0, 3),
      remaining: facets.total - 3,
    };
  }, [plants, facets]);

  /* =====================================================
     DESKTOP PREVIEW

     สูงสุด 6 block
     ถ้ามากกว่า 6 -> 5 plant + 1 remaining
  ===================================================== */

  const desktopPreview = useMemo(() => {
    if (facets.total <= 6) {
      return {
        items: plants,
        remaining: 0,
      };
    }

    return {
      items: plants.slice(0, 5),
      remaining: facets.total - 5,
    };
  }, [plants, facets]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="page overflow-x-hidden">
        <Navbar />

        <section className="flex min-h-[60dvh] items-center justify-center px-5">
          <div className="text-center">
            <LoadingIcon className="mx-auto h-7 w-7 animate-spin text-moss" />

            <p className="mt-4 font-serif text-[15px] italic text-muted">
              {t.loading}
            </p>
          </div>
        </section>
      </main>
    );
  }

  /* =====================================================
     ADMIN DATA
  ===================================================== */

  const username =
    profile?.username ||
    profile?.full_name ||
    user.user_metadata?.username ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    (isEnglish ? "Administrator" : "ผู้ดูแลระบบ");

  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || "";

  const email = user.email || "-";

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString(
        isEnglish ? "en-GB" : "th-TH-u-ca-gregory",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      )
    : "-";

  const statItems = [
    { label: t.totalPlants, value: stats.plants },
    { label: t.groups, value: stats.groups },
    { label: t.families, value: stats.families },
  ];

  const pendingDeleteId = pendingDeletePlant?.id || "";

  const pendingDeleting =
    Boolean(pendingDeleteId) && deletingPlantId === pendingDeleteId;

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="page overflow-x-hidden">
      <Navbar />

      {/* =====================================================
          DASHBOARD HEADER
      ===================================================== */}

      <section className="relative overflow-hidden border-b border-rule">
        <div
          aria-hidden="true"
          className="vh-grid-paper pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_80%_30%,black,transparent_70%)]"
        />

        <div className="vh-container relative grid gap-10 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end lg:gap-14">
          {/* LEFT – GREETING + STATS */}

          <div className="page-enter min-w-0">
            <p className="vh-eyebrow flex items-center gap-3">
              <span className="h-px w-6 bg-ochre" />
              {t.eyebrow}
            </p>

            <h1 className="vh-display mt-5 text-[2.3rem] min-[390px]:text-[2.6rem] md:text-[3.4rem]">
              <span className="block">{t.welcome},</span>

              <span className="block truncate italic text-moss">
                {username}
              </span>
            </h1>

            <p className="mt-5 font-serif text-[1.2rem] leading-snug text-ink md:text-[1.35rem]">
              {t.title}
            </p>

            <p className="vh-prose mt-2 max-w-[560px]">{t.subtitle}</p>

            {/* STATS – ruled row */}

            <dl className="mt-9 grid max-w-[560px] grid-cols-3 border-t border-rule">
              {statItems.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`min-w-0 pt-5 ${
                    index > 0 ? "border-l border-rule pl-4 sm:pl-5" : ""
                  }`}
                >
                  <dt className="vh-eyebrow truncate !text-[10px]">
                    {stat.label}
                  </dt>

                  <dd className="mt-2 font-serif text-[2rem] leading-none text-ink tabular-nums md:text-[2.4rem]">
                    {plantsLoading ? (
                      <span className="vh-skeleton inline-block h-8 w-12 rounded" />
                    ) : (
                      stat.value.toLocaleString()
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {/* QUICK ACTIONS */}

            <div className="mt-9 flex flex-wrap gap-2.5">
              <Link
                href="/account/plants/new"
                className="vh-btn vh-btn-primary"
              >
                <PlusIcon className="h-4 w-4" />
                {t.addPlant}
              </Link>

              <Link href="/account/plants" className="vh-btn vh-btn-outline">
                <CollectionIcon className="h-4 w-4" />
                {t.managePlants}
              </Link>
            </div>
          </div>

          {/* RIGHT – ADMIN PROFILE */}

          <div className="flex min-w-0 flex-col lg:self-stretch">
            {/* Featured specimen – fills the empty space above the card */}
            <div className="relative hidden min-h-0 flex-1 lg:block">
              <div className="absolute inset-x-0 bottom-6 top-0">
                <BioHeroLazy variant="helix" minWidth={1024} opacity={0.85} />
              </div>
            </div>

            <aside className="vh-sheet page-enter p-5 [animation-delay:100ms] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="vh-eyebrow !text-[10px]">{t.profileLabel}</span>

                <StatusBadge
                  verified={Boolean(user.email_confirmed_at)}
                  text={user.email_confirmed_at ? t.verified : t.unverified}
                />
              </div>

              <div className="mt-5 flex min-w-0 items-center gap-4">
                <ProfileAvatar avatarUrl={avatarUrl} username={username} />

                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-serif text-[1.45rem] leading-tight text-ink">
                    {username}
                  </h2>

                  <p className="mt-1 truncate font-mono text-[12px] text-muted">
                    {email}
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-3 border-t border-dashed border-rule-strong pt-4 text-[12.5px]">
                <dt className="text-faint">{t.memberSince}</dt>
                <dd className="truncate text-right text-ink-soft">{joinedDate}</dd>
              </dl>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link
                  href="/account/edit"
                  className="vh-btn vh-btn-outline vh-btn-sm min-w-0"
                >
                  <EditIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{t.editProfile}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="vh-btn vh-btn-ghost vh-btn-sm min-w-0 text-clay hover:!text-clay"
                >
                  {loggingOut ? (
                    <LoadingIcon className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  ) : (
                    <LogoutIcon className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate">
                    {loggingOut ? t.loggingOut : t.logout}
                  </span>
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* =====================================================
          RECENT RECORDS
      ===================================================== */}

      <section className="vh-container py-12 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="vh-eyebrow flex items-center gap-3">
              <span className="h-px w-6 bg-ochre" />
              {t.myPlantsLabel}
            </p>

            <h2 className="vh-display mt-3 text-[2rem] md:text-[2.6rem]">
              {t.myPlants}
            </h2>

            <p className="mt-2 text-[14px] leading-6 text-muted">
              {t.myPlantsDescription}
            </p>
          </div>

          <Link
            href="/account/plants"
            className="group inline-flex items-center gap-2 text-sm text-moss transition hover:text-moss-hover"
          >
            {t.showAll}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="mt-8 flex items-start gap-3 rounded-[6px] border border-clay/40 bg-clay-soft p-4 text-clay"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />

            <div className="min-w-0">
              <p className="text-sm leading-6">{error}</p>

              <button
                type="button"
                onClick={fetchAllPlants}
                className="vh-btn vh-btn-danger vh-btn-sm mt-3"
              >
                <RefreshIcon className="h-3.5 w-3.5" />
                {t.retry}
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}

        {plantsLoading && (
          <div className="mt-8 border-t border-rule" aria-busy="true">
            <p className="sr-only">{t.loadingPlants}</p>

            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 border-b border-rule py-4"
              >
                <div className="vh-skeleton h-12 w-12 shrink-0 rounded-[3px]" />

                <div className="flex-1 space-y-2">
                  <div className="vh-skeleton h-3 w-20 rounded" />
                  <div className="vh-skeleton h-4 w-2/3 max-w-[280px] rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY */}

        {!plantsLoading && !error && plants.length === 0 && (
          <div className="vh-panel mt-8 px-6 py-12 text-center">
            <LeafIcon className="mx-auto h-7 w-7 text-moss" />

            <h3 className="mt-4 font-serif text-xl italic text-muted">
              {t.noPlants}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-faint">
              {t.noPlantsDescription}
            </p>

            <Link
              href="/account/plants/new"
              className="vh-btn vh-btn-primary vh-btn-sm mt-6"
            >
              <PlusIcon className="h-4 w-4" />
              {t.addPlant}
            </Link>
          </div>
        )}

        {!plantsLoading && !error && plants.length > 0 && (
          <>
            {/* =================================================
                MOBILE – stacked rows (max 4)
            ================================================= */}

            <ol className="mt-8 border-t border-rule-strong md:hidden">
              {mobilePreview.items.map((plant, index) => (
                <MobilePlantRow
                  key={plant.id}
                  plant={plant}
                  index={index}
                  t={t}
                  onDelete={requestDelete}
                  deleting={deletingPlantId === plant.id}
                />
              ))}

              {mobilePreview.remaining > 0 && (
                <li>
                  <MorePlantsLink count={mobilePreview.remaining} t={t} />
                </li>
              )}
            </ol>

            {/* =================================================
                DESKTOP – table (max 6)
            ================================================= */}

            <div className="vh-panel mt-8 hidden overflow-x-auto md:block">
              <table className="vh-table">
                <thead>
                  <tr>
                    <th className="w-[1%] whitespace-nowrap">№</th>
                    <th>{t.colSpecimen}</th>
                    <th className="whitespace-nowrap">{t.colAccession}</th>
                    <th className="hidden lg:table-cell">{t.locality}</th>
                    <th className="hidden whitespace-nowrap xl:table-cell">
                      {t.collectorNo}
                    </th>
                    <th className="text-right">{t.colActions}</th>
                  </tr>
                </thead>

                <tbody>
                  {desktopPreview.items.map((plant, index) => (
                    <DesktopPlantRow
                      key={plant.id}
                      plant={plant}
                      index={index}
                      t={t}
                      onDelete={requestDelete}
                      deleting={deletingPlantId === plant.id}
                    />
                  ))}
                </tbody>
              </table>

              {desktopPreview.remaining > 0 && (
                <MorePlantsLink count={desktopPreview.remaining} t={t} />
              )}
            </div>
          </>
        )}
      </section>

      {/* =====================================================
          DELETE CONFIRM DIALOG
      ===================================================== */}

      {pendingDeletePlant && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          onClick={cancelDelete}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            onClick={(event) => event.stopPropagation()}
            className="vh-sheet page-enter w-full max-w-md p-6 shadow-lift sm:p-7"
          >
            <p className="vh-eyebrow flex items-center gap-3 !text-clay">
              <span className="h-px w-6 bg-clay" />
              {t.delete}
            </p>

            <h2
              id="delete-dialog-title"
              className="vh-display mt-3 text-[1.7rem] leading-tight"
            >
              {t.deleteTitle}
            </h2>

            <div className="vh-label-card mt-5">
              <div className="flex items-center justify-between gap-3">
                <span className="vh-family truncate">
                  {pendingDeletePlant.family || "—"}
                </span>

                {pendingDeletePlant.pnu_no && (
                  <span className="vh-catalog shrink-0">
                    PNU {pendingDeletePlant.pnu_no}
                  </span>
                )}
              </div>

              <p
                className={`mt-1.5 line-clamp-2 text-[1.15rem] leading-snug text-ink ${
                  pendingDeletePlant.botanical_name
                    ? "vh-binomial"
                    : "font-serif"
                }`}
              >
                {pendingDeletePlant.botanical_name || t.unknownPlant}
              </p>
            </div>

            <p
              id="delete-dialog-description"
              className="mt-5 text-[14px] leading-7 text-ink-soft"
            >
              {t.deleteConfirm}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={pendingDeleting}
                className="vh-btn vh-btn-outline"
              >
                {t.cancel}
              </button>

              <button
                type="button"
                onClick={() => deletePlant(pendingDeletePlant)}
                disabled={pendingDeleting}
                className="vh-btn vh-btn-danger"
              >
                {pendingDeleting ? (
                  <LoadingIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <DeleteIcon className="h-4 w-4" />
                )}
                {pendingDeleting ? t.deleting : t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   PROFILE AVATAR
========================================================= */

function ProfileAvatar({ avatarUrl, username }) {
  const [imageError, setImageError] = useState(false);

  const showImage = avatarUrl && !imageError;

  const initial =
    String(username || "V")
      .trim()
      .charAt(0)
      .toUpperCase() || "V";

  return (
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-rule-strong bg-paper-deep p-[3px] sm:h-[72px] sm:w-[72px]">
      {showImage ? (
        <img
          src={avatarUrl}
          alt={username}
          className="h-full w-full rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-moss-soft font-serif text-2xl text-moss">
          {initial}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ verified, text }) {
  return (
    <span
      className={`vh-tag shrink-0 !text-[11px] ${
        verified ? "vh-tag-moss" : "!border-transparent !bg-ochre-soft !text-ochre"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          verified ? "bg-moss" : "bg-ochre"
        }`}
      />
      {text}
    </span>
  );
}

/* =========================================================
   PLANT HELPERS
========================================================= */

function getPlantMeta(plant, t) {
  const plantId = plant.id;

  return {
    plantId,
    image: plant.image_url || "",
    botanicalName: plant.botanical_name || "",
    name:
      plant.botanical_name ||
      (plant.pnu_no ? `PNU ${plant.pnu_no}` : "") ||
      t.unknownPlant,
    family: plant.family || "",
    group: plant.artificial_group || "",
    locality: plant.locality || "",
    collectorNo: plant.collector_no || "",
    pnuNo: plant.pnu_no || "",
  };
}

function PlantThumb({ image, name, className = "" }) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-[3px] border border-rule bg-paper-deep ${className}`}
    >
      {image ? (
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-faint">
          <LeafIcon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

function PlantName({ meta, t, className = "" }) {
  return meta.botanicalName ? (
    <span className={`vh-binomial text-ink ${className}`}>
      {meta.botanicalName}
    </span>
  ) : (
    <span className={`font-serif text-muted ${className}`}>
      {meta.pnuNo ? `PNU ${meta.pnuNo}` : t.unknownPlant}
    </span>
  );
}

/* =========================================================
   DESKTOP TABLE ROW
========================================================= */

function DesktopPlantRow({ plant, index, t, onDelete, deleting }) {
  const meta = getPlantMeta(plant, t);

  const viewHref = meta.plantId
    ? `/account/plants/${meta.plantId}`
    : "/account/plants";

  return (
    <tr>
      <td className="align-middle font-mono text-[12px] text-ochre">
        {String(index + 1).padStart(2, "0")}
      </td>

      <td className="min-w-[240px]">
        <Link href={viewHref} className="group flex items-center gap-3.5">
          <PlantThumb image={meta.image} name={meta.name} className="h-12 w-12" />

          <span className="min-w-0">
            <PlantName
              meta={meta}
              t={t}
              className="block truncate text-[1.05rem] leading-snug transition group-hover:text-moss"
            />

            <span className="mt-1 flex min-w-0 items-center gap-2">
              {meta.family && (
                <span className="vh-family truncate">{meta.family}</span>
              )}

              {meta.group && (
                <span className="truncate text-[12px] text-faint">
                  {meta.family ? "· " : ""}
                  {meta.group}
                </span>
              )}
            </span>
          </span>
        </Link>
      </td>

      <td className="whitespace-nowrap">
        <span className="vh-catalog !text-[12px] !text-ink-soft">
          {meta.pnuNo ? `PNU ${meta.pnuNo}` : "—"}
        </span>
      </td>

      <td className="hidden max-w-[220px] lg:table-cell">
        <span className="block truncate text-[13px]" title={meta.locality}>
          {meta.locality || "—"}
        </span>
      </td>

      <td className="hidden whitespace-nowrap xl:table-cell">
        <span className="vh-catalog !text-[12px]">
          {meta.collectorNo || "—"}
        </span>
      </td>

      <td className="text-right">
        {meta.plantId && (
          <div className="inline-flex items-center justify-end gap-1">
            <Link
              href={`/account/plants/${meta.plantId}`}
              className="vh-icon-btn !h-9 !w-9 !border-transparent"
              aria-label={t.view}
              title={t.view}
            >
              <EyeIcon className="h-4 w-4" />
            </Link>

            <Link
              href={`/account/plants/${meta.plantId}/edit`}
              className="vh-icon-btn !h-9 !w-9 !border-transparent"
              aria-label={t.edit}
              title={t.edit}
            >
              <EditIcon className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => onDelete?.(plant)}
              disabled={deleting}
              className="vh-icon-btn !h-9 !w-9 !border-transparent hover:!bg-clay-soft hover:!text-clay"
              aria-label={deleting ? t.deleting : t.delete}
              title={deleting ? t.deleting : t.delete}
            >
              {deleting ? (
                <LoadingIcon className="h-4 w-4 animate-spin" />
              ) : (
                <DeleteIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

/* =========================================================
   MOBILE STACKED ROW
========================================================= */

function MobilePlantRow({ plant, index, t, onDelete, deleting }) {
  const meta = getPlantMeta(plant, t);

  const viewHref = meta.plantId
    ? `/account/plants/${meta.plantId}`
    : "/account/plants";

  return (
    <li className="border-b border-rule py-4">
      <Link href={viewHref} className="flex min-w-0 gap-3.5">
        <PlantThumb image={meta.image} name={meta.name} className="h-16 w-16" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-ochre">
              {String(index + 1).padStart(2, "0")}
            </span>

            {meta.pnuNo && (
              <span className="vh-catalog shrink-0">PNU {meta.pnuNo}</span>
            )}
          </div>

          <PlantName
            meta={meta}
            t={t}
            className="mt-1 block truncate text-[1.08rem] leading-snug"
          />

          {meta.family && (
            <span className="vh-family mt-1 block truncate">{meta.family}</span>
          )}

          {meta.locality && (
            <p className="mt-1 truncate text-[12px] text-muted">
              <span className="text-faint">{t.locality}: </span>
              {meta.locality}
            </p>
          )}
        </div>
      </Link>

      {meta.plantId && (
        <div className="mt-3 grid grid-cols-3 gap-1.5 pl-[78px]">
          <Link
            href={`/account/plants/${meta.plantId}`}
            className="vh-btn vh-btn-ghost vh-btn-sm min-w-0 !px-2"
          >
            <EyeIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t.view}</span>
          </Link>

          <Link
            href={`/account/plants/${meta.plantId}/edit`}
            className="vh-btn vh-btn-outline vh-btn-sm min-w-0 !px-2"
          >
            <EditIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t.edit}</span>
          </Link>

          <button
            type="button"
            onClick={() => onDelete?.(plant)}
            disabled={deleting}
            className="vh-btn vh-btn-danger vh-btn-sm min-w-0 !px-2"
          >
            {deleting ? (
              <LoadingIcon className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : (
              <DeleteIcon className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">{deleting ? t.deleting : t.delete}</span>
          </button>
        </div>
      )}
    </li>
  );
}

/* =========================================================
   MORE PLANTS LINK
========================================================= */

function MorePlantsLink({ count, t }) {
  return (
    <Link
      href="/account/plants"
      className="group flex items-baseline gap-3 px-0 py-4 transition md:px-4"
    >
      <span className="font-serif text-[1.3rem] leading-none text-ochre tabular-nums">
        +{count}
      </span>

      <span className="text-[14px] text-ink-soft transition group-hover:text-moss">
        {t.morePlants}
      </span>

      <span
        aria-hidden="true"
        className="flex-1 translate-y-[-3px] border-b border-dotted border-rule-strong"
      />

      <span className="inline-flex items-center gap-1.5 text-[13px] text-moss">
        {t.showAll}
        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/* =========================================================
   IMAGE STORAGE PATH
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

function CollectionIcon({ className = "" }) {
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
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
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

function ArrowRightIcon({ className = "" }) {
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
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
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

function DeleteIcon({ className = "" }) {
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
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function LogoutIcon({ className = "" }) {
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
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
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
      strokeWidth="1.7"
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

function RefreshIcon({ className = "" }) {
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
      <path d="M20 11a8.1 8.1 0 0 0-14.9-3.9L3 10" />
      <path d="M3 4v6h6" />
      <path d="M4 13a8.1 8.1 0 0 0 14.9 3.9L21 14" />
      <path d="M21 20v-6h-6" />
    </svg>
  );
}

function LoadingIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
