"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

import {
  CanvasBoundary,
  buildPointGeometry,
  useMediaQuery,
  usePageVisible,
  usePointerRef,
  useReducedMotion,
  useThemeColors,
  useWebGLSupport,
} from "@/components/bio/bioShared";

/* =========================================================
   BIO HERO
   A single featured specimen drawn with points.

   variant "helix"        – DNA double helix (moss + ochre)
   variant "phyllotaxis"  – golden-angle seed head

   minWidth  hide below this viewport width (no canvas at all)
   opacity   overall strength of the drawing
========================================================= */

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); /* 137.5° */

/* Soft feathered edge so the drawing never has a hard crop */
const FADE_MASK =
  "radial-gradient(ellipse 50% 50% at 50% 50%, black 55%, transparent 100%)";

export default function BioHero({
  variant = "helix",
  minWidth = 768,
  opacity = 1,
  className = "",
}) {
  const supported = useWebGLSupport();
  const wideEnough = useMediaQuery(`(min-width: ${minWidth}px)`);
  const reducedMotion = useReducedMotion();
  const visible = usePageVisible();
  const colors = useThemeColors();

  if (!wideEnough) return null;

  const animate = !reducedMotion && visible;

  const fallback = (
    <div className="vh-grid-paper absolute inset-0 opacity-40" />
  );

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative h-full w-full ${className}`}
      style={{
        opacity,
        maskImage: FADE_MASK,
        WebkitMaskImage: FADE_MASK,
      }}
    >
      {supported ? (
        <CanvasBoundary fallback={fallback}>
          <Canvas
            dpr={[1, 1.5]}
            frameloop={animate ? "always" : "demand"}
            camera={{ position: [0, 0, 10], fov: 35 }}
            gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
            style={{ pointerEvents: "none" }}
          >
            {variant === "phyllotaxis" ? (
              <Phyllotaxis colors={colors} animate={animate} />
            ) : (
              <Helix
                colors={colors}
                animate={animate}
                followPointer={!reducedMotion}
              />
            )}
          </Canvas>
        </CanvasBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}

/* =========================================================
   FIT CAMERA
   Keeps a box of half-size (hw, hh) inside any container.
========================================================= */

function useFitCamera(halfWidth, halfHeight, margin = 1.12) {
  const fov = useThree((state) => state.camera.fov);
  const size = useThree((state) => state.size);
  const get = useThree((state) => state.get);

  const aspect = size.width / Math.max(size.height, 1);
  const tan = Math.tan(THREE.MathUtils.degToRad(fov / 2));

  const distance =
    Math.max(halfHeight / tan, halfWidth / (tan * aspect)) * margin;

  useLayoutEffect(() => {
    const { camera, invalidate } = get();

    camera.position.z = distance;
    camera.updateProjectionMatrix();
    invalidate();
  }, [get, distance]);

  return distance;
}

/* =========================================================
   HELIX
========================================================= */

const HELIX = {
  perStrand: 72,
  height: 6,
  turns: 2.1,
  radius: 1.15,
  pairEvery: 3,
};

function Helix({ colors, animate, followPointer }) {
  const groupRef = useRef(null);
  const spinRef = useRef(null);
  const timeRef = useRef(0);

  const dpr = useThree((state) => state.viewport.dpr);
  const size = useThree((state) => state.size);

  /* Lay the helix on its side in short, wide slots */
  const horizontal = size.width / Math.max(size.height, 1) > 1.3;
  const baseTilt = horizontal ? Math.PI / 2 - 0.14 : 0.32;

  const distance = useFitCamera(
    horizontal ? HELIX.height / 2 + 0.3 : HELIX.radius + 0.6,
    horizontal ? HELIX.radius + 0.6 : HELIX.height / 2 + 0.3,
  );

  const pointerRef = usePointerRef(followPointer);

  const { points, pairs } = useMemo(() => {
    const total = HELIX.perStrand * 2;

    const positions = new Float32Array(total * 3);
    const size = new Float32Array(total);
    const mix = new Float32Array(total);
    const order = new Float32Array(total);

    const pairPositions = [];

    for (let strand = 0; strand < 2; strand += 1) {
      for (let index = 0; index < HELIX.perStrand; index += 1) {
        const t = index / (HELIX.perStrand - 1);
        const angle = t * HELIX.turns * Math.PI * 2 + strand * Math.PI;
        const point = strand * HELIX.perStrand + index;

        positions[point * 3] = Math.cos(angle) * HELIX.radius;
        positions[point * 3 + 1] = (t - 0.5) * HELIX.height;
        positions[point * 3 + 2] = Math.sin(angle) * HELIX.radius;

        size[point] = index % HELIX.pairEvery === 0 ? 3.4 : 2.2;
        mix[point] = strand;
      }
    }

    for (let index = 0; index < HELIX.perStrand; index += HELIX.pairEvery) {
      const a = index;
      const b = HELIX.perStrand + index;

      pairPositions.push(
        positions[a * 3],
        positions[a * 3 + 1],
        positions[a * 3 + 2],
        positions[b * 3],
        positions[b * 3 + 1],
        positions[b * 3 + 2],
      );
    }

    const pairGeometry = new THREE.BufferGeometry();

    pairGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(pairPositions, 3),
    );

    return {
      points: buildPointGeometry({ positions, size, mix, order }),
      pairs: pairGeometry,
    };
  }, []);

  useFrame((_state, delta) => {
    const group = groupRef.current;

    if (!group || !animate) return;

    timeRef.current += Math.min(delta, 0.1);

    /* One revolution every ~30 seconds, around the helix axis */
    if (spinRef.current) {
      spinRef.current.rotation.y = (timeRef.current / 30) * Math.PI * 2;
    }

    if (followPointer) {
      const pointer = pointerRef.current;

      group.rotation.x += (pointer.y * 0.12 - group.rotation.x) * 0.02;
      group.rotation.z +=
        (baseTilt - pointer.x * 0.1 - group.rotation.z) * 0.02;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, 0, baseTilt]}>
      <group ref={spinRef} rotation={[0, 0.6, 0]}>
        <lineSegments geometry={pairs}>
          <lineBasicMaterial
            color={colors.ink}
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </lineSegments>

        <points geometry={points} frustumCulled={false}>
          <softPointMaterial
            transparent
            depthWrite={false}
            uSize={1.25}
            uPixelRatio={dpr}
            uNear={distance - HELIX.radius}
            uFar={distance + HELIX.radius * 2.5}
            uColorA={colors.moss}
            uColorB={colors.ochre}
          />
        </points>
      </group>
    </group>
  );
}

/* =========================================================
   PHYLLOTAXIS
========================================================= */

const SEEDS = { count: 300, spacing: 0.17, dome: 0.7 };

function Phyllotaxis({ colors, animate }) {
  const groupRef = useRef(null);
  const materialRef = useRef(null);
  const timeRef = useRef(0);

  const dpr = useThree((state) => state.viewport.dpr);
  const maxRadius = SEEDS.spacing * Math.sqrt(SEEDS.count);
  const distance = useFitCamera(maxRadius, maxRadius);

  const geometry = useMemo(() => {
    const positions = new Float32Array(SEEDS.count * 3);
    const size = new Float32Array(SEEDS.count);
    const mix = new Float32Array(SEEDS.count);
    const order = new Float32Array(SEEDS.count);

    for (let index = 0; index < SEEDS.count; index += 1) {
      const radius = SEEDS.spacing * Math.sqrt(index + 0.5);
      const angle = index * GOLDEN_ANGLE;
      const t = radius / maxRadius;

      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = Math.sin(angle) * radius;

      /* Gentle dome so the seed head reads in depth */
      positions[index * 3 + 2] = (1 - t * t) * SEEDS.dome;

      /* Seeds grow larger toward the rim */
      size[index] = 1.6 + t * 2.4;

      /* Ochre heart, moss rim */
      mix[index] = 1 - t;

      order[index] = (index / SEEDS.count) * 0.92;
    }

    return buildPointGeometry({ positions, size, mix, order });
  }, [maxRadius]);

  useFrame((_state, delta) => {
    if (!animate) return;

    timeRef.current += Math.min(delta, 0.1);

    /* Form from the centre once (~2 s, ease-out), then turn slowly */
    const progress = Math.min(timeRef.current / 2, 1);

    if (materialRef.current) {
      materialRef.current.uProgress = 1 - Math.pow(1 - progress, 3);
    }

    if (groupRef.current) {
      groupRef.current.rotation.z = -(timeRef.current / 120) * Math.PI * 2;
    }
  });

  return (
    <group rotation={[-0.45, 0.2, 0]}>
      <group ref={groupRef}>
        <points geometry={geometry} frustumCulled={false}>
          <softPointMaterial
            ref={materialRef}
            transparent
            depthWrite={false}
            uSize={1.1}
            uPixelRatio={dpr}
            uProgress={animate ? 0 : 1}
            uNear={distance - SEEDS.dome}
            uFar={distance + maxRadius}
            uColorA={colors.moss}
            uColorB={colors.ochre}
          />
        </points>
      </group>
    </group>
  );
}
