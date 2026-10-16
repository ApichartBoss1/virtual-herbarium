"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

import {
  CanvasBoundary,
  buildPointGeometry,
  seededRandom,
  useIsMobile,
  usePageVisible,
  usePointerRef,
  useReducedMotion,
  useThemeColors,
  useWebGLSupport,
} from "@/components/bio/bioShared";

/* =========================================================
   BIO BACKGROUND
   Pollen / spores drifting upward, very slowly, behind every
   page. Atmosphere only – it should be felt, not noticed.

   intensity "normal" – default pages
   intensity "calm"   – pages with tables or forms
========================================================= */

const SETTINGS = {
  normal: { count: 60, opacity: 0.25 },
  calm: { count: 30, opacity: 0.12 },
};

const FIELD = { width: 30, height: 16, near: -9, far: 4 };

export default function BioBackground({ intensity = "normal" }) {
  const supported = useWebGLSupport();
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const visible = usePageVisible();
  const colors = useThemeColors();

  if (!supported) return null;

  const setting = SETTINGS[intensity] || SETTINGS.normal;
  const count = Math.round(setting.count / (isMobile ? 2 : 1));
  const animate = !reducedMotion && visible;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-1000"
      style={{ opacity: setting.opacity }}
    >
      <CanvasBoundary>
        <Canvas
          dpr={[1, 1.5]}
          frameloop={animate ? "always" : "demand"}
          camera={{ position: [0, 0, 10], fov: 50 }}
          gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
          style={{ pointerEvents: "none" }}
        >
          <Spores
            key={count}
            count={count}
            colors={colors}
            animate={animate}
            followPointer={!isMobile && !reducedMotion}
          />
        </Canvas>
      </CanvasBoundary>
    </div>
  );
}

/* =========================================================
   SPORES
========================================================= */

function Spores({ count, colors, animate, followPointer }) {
  const materialRef = useRef(null);
  const timeRef = useRef(0);

  const dpr = useThree((state) => state.viewport.dpr);

  const pointerRef = usePointerRef(followPointer);

  const geometry = useMemo(() => {
    const random = seededRandom(count * 7 + 3);

    const positions = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const mix = new Float32Array(count);
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);
    const order = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (random() - 0.5) * FIELD.width;
      positions[index * 3 + 1] = (random() - 0.5) * FIELD.height;
      positions[index * 3 + 2] =
        FIELD.near + random() * (FIELD.far - FIELD.near);

      size[index] = 2.2 + random() * 2.6;

      /* Mostly moss, a few ochre pollen grains */
      mix[index] = random() < 0.28 ? 1 : 0;

      phase[index] = random() * Math.PI * 2;

      /* World units per second – a full climb takes minutes */
      speed[index] = 0.05 + random() * 0.07;
    }

    return buildPointGeometry({ positions, size, mix, phase, speed, order });
  }, [count]);

  useFrame((state, delta) => {
    if (!animate) return;

    /* Clamp so a resumed tab doesn't jump */
    timeRef.current += Math.min(delta, 0.1);

    if (materialRef.current) {
      materialRef.current.uTime = timeRef.current;
    }

    if (followPointer) {
      const { camera } = state;
      const pointer = pointerRef.current;

      camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.012;
      camera.position.y += (-pointer.y * 0.4 - camera.position.y) * 0.012;
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <softPointMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        uRise={1}
        uHeight={FIELD.height}
        uNear={10 - FIELD.far}
        uFar={10 - FIELD.near}
        uSize={1.4}
        uPixelRatio={dpr}
        uOpacity={1}
        uColorA={colors.moss}
        uColorB={colors.ochre}
      />
    </points>
  );
}
