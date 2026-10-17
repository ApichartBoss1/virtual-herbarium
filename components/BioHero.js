"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";

import {
  CanvasBoundary,
  buildPointGeometry,
  useMediaQuery,
  usePageVisible,
  usePointerRef,
  useReducedMotion,
  useThemeColors,
  useWebGLSupport,
  seededRandom,
} from "@/components/bio/bioShared";

/* =========================================================
   BIO HERO
   A single featured specimen drawn with points.

   variant "helix"        – DNA double helix (moss + ochre)
   variant "phyllotaxis"  – golden-angle seed head
   variant "leaf"         – herbarium leaf dissolving into data

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

  /* The leaf sits beside live text – show nothing rather than a placeholder */
  const fallback =
    variant === "leaf" ? null : (
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
            {variant === "leaf" ? (
              <Leaf colors={colors} animate={animate} still={reducedMotion} />
            ) : variant === "phyllotaxis" ? (
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

/* =========================================================
   LEAF
   A pressed herbarium leaf drawn as points along its margin,
   midrib and secondary veins. Toward the tip the points
   loosen, snap onto a small lattice and drift away as ochre
   data – specimen becoming digital knowledge.
========================================================= */

const LEAF = {
  length: 5.2,
  halfWidth: 1.15,
  bend: 0.16, // midrib curvature
  curl: 0.22, // margins lift out of plane
  arch: 0.18,
  veinPairs: 8,
  dissolveFrom: 0.5, // position along the blade where data begins
  grid: 0.17,
  drift: 300,
};

const LEAF_TILT = [-0.38, 0.22, 0.62];
const LEAF_OFFSET = [-0.25, -0.3, 0];
const LEAF_SWING = THREE.MathUtils.degToRad(15);

const smooth = (edge0, edge1, x) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);

  return t * t * (3 - 2 * t);
};

/* Elliptic blade with a narrow base and drawn-out (acuminate) tip */
function leafHalfWidth(u) {
  if (u <= 0 || u >= 1) return 0;

  return LEAF.halfWidth * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.72)), 1.15);
}

/* u: 0 base → 1 tip, s: -1 … 1 across the blade */
function leafPoint(u, s) {
  const w = leafHalfWidth(u);
  const across = s * w;

  return [
    (u - 0.5) * LEAF.length,
    LEAF.bend * Math.sin(Math.PI * u) + across,
    LEAF.curl * s * s * (w / LEAF.halfWidth) +
      LEAF.arch * Math.sin(Math.PI * Math.max(u, 0)),
  ];
}

function snapToGrid(point) {
  return point.map((value) => Math.round(value / LEAF.grid) * LEAF.grid);
}

function buildLeaf() {
  const random = seededRandom(23);

  const positions = [];
  const targets = [];
  const size = [];
  const mix = [];
  const order = [];
  const drift = [];
  const phase = [];
  const speed = [];

  const occupied = new Set();

  function push(point, target, attrs) {
    positions.push(...point);
    targets.push(...target);
    size.push(attrs.size);
    mix.push(attrs.mix);
    order.push(attrs.order);
    drift.push(attrs.drift || 0);
    phase.push(attrs.phase || 0);
    speed.push(attrs.speed || 0);
  }

  /* Dense specimen at the base, loosening into lattice dots */
  function addStructure(u, s, drawOrder, weight = 1) {
    const d = smooth(LEAF.dissolveFrom, 1, u);

    if (random() < d * 0.55) return;

    const base = leafPoint(u, s);
    let point = base;

    if (d > 0) {
      const lift = d * (0.35 + random() * 0.45);
      const loose = [
        base[0] + lift * 0.8,
        base[1] + lift * (0.45 + s * 0.4),
        base[2] + lift * 0.5,
      ];
      const cell = snapToGrid(loose);
      const blend = Math.pow(d, 0.7);

      /* One dot per lattice cell once a point has fully snapped */
      if (blend > 0.6) {
        const key = cell.map((value) => Math.round(value / LEAF.grid)).join();

        if (occupied.has(key)) return;
        occupied.add(key);
      }

      point = base.map((value, axis) => value + (cell[axis] - value) * blend);
    }

    push(point, point, {
      size: (2.3 - d * 1) * weight,
      mix: d,
      order: drawOrder,
    });
  }

  /* Petiole */
  for (let index = 0; index < 12; index += 1) {
    const u = -0.08 + (index / 12) * 0.08;

    addStructure(u, 0, 0, 1.05);
  }

  /* Midrib */
  for (let index = 0; index <= 120; index += 1) {
    const u = index / 120;

    addStructure(u, 0, u * 0.88, 1.05);
  }

  /* Margin */
  for (let side = -1; side <= 1; side += 2) {
    for (let index = 1; index < 150; index += 1) {
      const u = index / 150;

      addStructure(u, side, u * 0.88 + 0.03, 0.85);
    }
  }

  /* Secondary veins: leave the midrib at an acute angle toward the tip */
  for (let pair = 0; pair < LEAF.veinPairs; pair += 1) {
    const u0 = 0.08 + ((pair + 0.5) / LEAF.veinPairs) * 0.78;
    const steps = Math.round(9 + 10 * (leafHalfWidth(u0) / LEAF.halfWidth));

    for (let side = -1; side <= 1; side += 2) {
      for (let index = 1; index <= steps; index += 1) {
        const v = index / steps;
        const u = u0 + 0.17 * Math.pow(v, 0.75);

        addStructure(
          u,
          side * 0.9 * Math.pow(v, 1.15),
          u0 * 0.88 + v * 0.1,
          0.7,
        );
      }
    }
  }

  /* Drifting data: leave the tip half and settle on the lattice */
  for (let index = 0; index < LEAF.drift; index += 1) {
    const u = 0.58 + 0.42 * Math.sqrt(random());
    const s = (random() * 2 - 1) * 0.9;
    const origin = leafPoint(u, s);
    const distance = 0.5 + random() * 1.5;

    const direction = new THREE.Vector3(
      1,
      0.3 + s * 0.6 + (random() - 0.5) * 0.5,
      0.2 + random() * 0.5,
    ).normalize();

    const target = snapToGrid([
      origin[0] + direction.x * distance,
      origin[1] + direction.y * distance,
      origin[2] + direction.z * distance,
    ]);

    push(origin, target, {
      size: 1.2 + random() * 0.5,
      mix: 1,
      order: 1,
      drift: 1,
      phase: random(),
      speed: 1 / (7 + random() * 7),
    });
  }

  const geometry = buildPointGeometry({
    positions: new Float32Array(positions),
    size: new Float32Array(size),
    mix: new Float32Array(mix),
    phase: new Float32Array(phase),
    speed: new Float32Array(speed),
    order: new Float32Array(order),
  });

  geometry.setAttribute(
    "aTarget",
    new THREE.Float32BufferAttribute(targets, 3),
  );
  geometry.setAttribute("aDrift", new THREE.Float32BufferAttribute(drift, 1));

  return geometry;
}

const leafVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uProgress;
  uniform float uDriftOn;
  uniform float uNear;
  uniform float uFar;

  attribute vec3 aTarget;
  attribute float aSize;
  attribute float aMix;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aOrder;
  attribute float aDrift;

  varying float vMix;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float alpha;
    float mixValue = aMix;

    if (aDrift > 0.5) {
      float t = fract(uTime * aSpeed + aPhase);
      float travel = 1.0 - pow(1.0 - smoothstep(0.0, 0.7, t), 3.0);

      p = mix(position, aTarget, travel);
      mixValue = mix(0.35, 1.0, smoothstep(0.0, 0.35, t));
      alpha = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.5, 1.0, t));
      alpha *= uDriftOn * smoothstep(0.9, 1.0, uProgress);
    } else {
      alpha = smoothstep(aOrder, aOrder + 0.06, uProgress);
    }

    /* Data dots stay faint next to the specimen */
    alpha *= mix(0.95, 0.45, mixValue);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = clamp((-mv.z - uNear) / (uFar - uNear), 0.0, 1.0);
    alpha *= mix(1.0, 0.7, depth);

    vMix = mixValue;
    vAlpha = alpha;

    gl_PointSize = uSize * aSize * uPixelRatio * (10.0 / -mv.z);
  }
`;

const leafFragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying float vMix;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.18, d) * vAlpha;

    if (a < 0.004) discard;

    gl_FragColor = vec4(mix(uColorA, uColorB, vMix), a);

    #include <colorspace_fragment>
  }
`;

const LeafPointMaterial = shaderMaterial(
  {
    uTime: 0,
    uPixelRatio: 1,
    uSize: 1,
    uProgress: 0,
    uDriftOn: 1,
    uNear: 4,
    uFar: 18,
    uColorA: new THREE.Color("#2e5b3a"),
    uColorB: new THREE.Color("#9a6b1f"),
  },
  leafVertexShader,
  leafFragmentShader,
);

extend({ LeafPointMaterial });

function Leaf({ colors, animate, still }) {
  const poseRef = useRef(null);
  const swingRef = useRef(null);
  const materialRef = useRef(null);
  const timeRef = useRef(0);
  const progressRef = useRef(0);

  const dpr = useThree((state) => state.viewport.dpr);
  const distance = useFitCamera(3, 2.6, 1);

  const pointerRef = usePointerRef(!still);

  const geometry = useMemo(() => buildLeaf(), []);

  useLayoutEffect(() => () => geometry.dispose(), [geometry]);

  /* Reduced motion: the finished leaf as a still, no drifting data */
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    const material = materialRef.current;

    if (!material) return;

    material.uProgress = still ? 1 : progressRef.current;
    material.uDriftOn = still ? 0 : 1;
    invalidate();
  }, [still, invalidate]);

  useFrame((_state, delta) => {
    if (!animate) return;

    timeRef.current += Math.min(delta, 0.1);

    const time = timeRef.current;

    /* Veins draw from base to tip once (~2.5 s, ease-in-out) */
    const draw = Math.min(time / 2.5, 1);

    progressRef.current =
      draw < 0.5 ? 4 * draw ** 3 : 1 - Math.pow(-2 * draw + 2, 3) / 2;

    if (materialRef.current) {
      materialRef.current.uTime = time;
      materialRef.current.uProgress = progressRef.current;
    }

    /* Slow rock about the midrib, never a full turn */
    if (swingRef.current) {
      swingRef.current.rotation.x =
        Math.sin((time / 24) * Math.PI * 2) * LEAF_SWING;
      swingRef.current.rotation.y =
        Math.sin((time / 37) * Math.PI * 2 + 1.3) * LEAF_SWING * 0.4;
    }

    if (poseRef.current) {
      const pointer = pointerRef.current;
      const ease = 1 - Math.exp(-Math.min(delta, 0.1) * 0.9);

      poseRef.current.rotation.x +=
        (pointer.y * 0.14 - poseRef.current.rotation.x) * ease;
      poseRef.current.rotation.y +=
        (pointer.x * 0.18 - poseRef.current.rotation.y) * ease;
    }
  });

  return (
    <group ref={poseRef}>
      <group position={LEAF_OFFSET} rotation={LEAF_TILT}>
        <group ref={swingRef}>
          <points geometry={geometry} frustumCulled={false}>
            <leafPointMaterial
              ref={materialRef}
              transparent
              depthWrite={false}
              uSize={1.3}
              uPixelRatio={dpr}
              uNear={distance - 2.5}
              uFar={distance + 3}
              uColorA={colors.moss}
              uColorB={colors.ochre}
            />
          </points>
        </group>
      </group>
    </group>
  );
}
