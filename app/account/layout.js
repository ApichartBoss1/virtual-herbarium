"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { AdminContext } from "@/components/AdminContext";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import { getLoginPathFor } from "@/lib/adminRedirect";
import { supabase } from "@/lib/supabase";

/* =========================================================
   ADMIN GUARD
   ตรวจสิทธิ์จุดเดียวของทุกหน้าใน /account
   - ระหว่างตรวจแสดง loading เท่านั้น ไม่ render children
   - ไม่มี session → /login?next=<path เดิม>
   - มี session แต่ไม่ใช่ admin → signOut แล้ว /login?error=not_admin
   - logout หรือ session หมดอายุระหว่างใช้งาน → /login
   สิทธิ์ admin อยู่ใน app_metadata (กำหนดจากฝั่งเซิร์ฟเวอร์เท่านั้น)
========================================================= */

function isAdmin(user) {
  return user?.app_metadata?.role === "admin";
}

export default function AccountLayout({ children }) {
  const router = useRouter();

  const { language } = useSiteSettings();

  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      const currentPath = `${window.location.pathname}${window.location.search}`;

      try {
        const { data, error } = await supabase.auth.getUser();

        if (!active) return;

        if (error || !data?.user) {
          router.replace(getLoginPathFor(currentPath));
          return;
        }

        if (!isAdmin(data.user)) {
          await supabase.auth.signOut();

          if (active) {
            router.replace("/login?error=not_admin");
          }

          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error("Verify admin error:", err);

        if (active) {
          router.replace(getLoginPathFor(currentPath));
        }
      }
    }

    verifyAdmin();

    /* INITIAL_SESSION ข้ามไป เพราะ verifyAdmin() ตรวจกับเซิร์ฟเวอร์อยู่แล้ว */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event === "INITIAL_SESSION") return;

      if (!session?.user || !isAdmin(session.user)) {
        setUser(null);
        router.replace("/login");
        return;
      }

      setUser(session.user);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const value = useMemo(() => (user ? { user } : null), [user]);

  if (!value) {
    return (
      <main className="page min-h-screen overflow-x-hidden text-ink">
        <Navbar />

        <section className="flex min-h-[65dvh] items-center justify-center px-5">
          <div role="status" className="text-center">
            <LoadingIcon className="mx-auto h-6 w-6 animate-spin text-moss" />

            <p className="mt-4 font-serif text-[15px] italic text-muted">
              {language === "EN"
                ? "Checking administrator access..."
                : "กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ..."}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
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
