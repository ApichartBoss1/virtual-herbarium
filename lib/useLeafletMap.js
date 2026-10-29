"use client";

import { useEffect, useRef, useState } from "react";

/* =========================================================
   useLeafletMap
   สร้างแผนที่ Leaflet บน container หนึ่งตัว และลบทิ้งเมื่อ unmount

   - import("leaflet") แบบ dynamic เฉพาะฝั่งเบราว์เซอร์
   - ถ้า unmount ระหว่างรอ import (เช่นหน้าถูก redirect) จะไม่สร้างแผนที่
   - กันการสร้างซ้ำบน container เดิม (React Strict Mode เรียก effect สองรอบ)
   - cleanup เรียก map.remove() และล้าง ref ทุกครั้ง

   ใช้งาน
   const containerRef = useRef(null);
   const { L, map, mapRef, leafletRef, error } = useLeafletMap(containerRef, {
     enabled: true,
     options: { zoomControl: true },
     setup: (L, map) => { ... เพิ่ม tile layer, marker, event ... },
   });

   - options และ setup ถูกอ่านตอนสร้างแผนที่เท่านั้น
   - ถ้า enabled เปลี่ยนเป็น false แผนที่จะถูกลบ
========================================================= */

const INVALIDATE_SIZE_DELAY = 150;

export function useLeafletMap(containerRef, { enabled = true, options, setup } = {}) {
  const mapRef = useRef(null);

  const leafletRef = useRef(null);

  const optionsRef = useRef(options);

  const setupRef = useRef(setup);

  const [state, setState] = useState({ L: null, map: null, error: null });

  useEffect(() => {
    optionsRef.current = options;

    setupRef.current = setup;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    let createdMap = null;

    let resizeTimer = null;

    async function createMap() {
      try {
        const leafletModule = await import("leaflet");

        const container = containerRef.current;

        if (cancelled || !container || !container.isConnected) {
          return;
        }

        /* container นี้มีแผนที่อยู่แล้ว (Strict Mode / HMR) */
        if (mapRef.current || container._leaflet_id) {
          return;
        }

        const L = leafletModule.default || leafletModule;

        const map = L.map(container, optionsRef.current);

        createdMap = map;

        mapRef.current = map;

        leafletRef.current = L;

        setupRef.current?.(L, map);

        setState({ L, map, error: null });

        resizeTimer = window.setTimeout(() => {
          if (!cancelled && mapRef.current === map) {
            map.invalidateSize();
          }
        }, INVALIDATE_SIZE_DELAY);
      } catch (error) {
        console.error("Initialize map error:", error);

        if (!cancelled) {
          setState({ L: null, map: null, error });
        }
      }
    }

    createMap();

    return () => {
      cancelled = true;

      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }

      if (createdMap) {
        /*
         * Leaflet 1.9 จบ zoom animation ด้วย setTimeout 250ms ที่ remove() ไม่ยกเลิก
         * ถ้าออกจากหน้าระหว่าง zoom จะเกิด error "_leaflet_pos"
         * ตั้ง _animatingZoom = false ให้ callback นั้น return ทันที
         */
        createdMap.stop();

        createdMap._animatingZoom = false;

        createdMap.off();

        createdMap.remove();
      }

      if (mapRef.current === createdMap) {
        mapRef.current = null;

        leafletRef.current = null;
      }

      setState({ L: null, map: null, error: null });
    };
  }, [containerRef, enabled]);

  return { ...state, mapRef, leafletRef };
}
