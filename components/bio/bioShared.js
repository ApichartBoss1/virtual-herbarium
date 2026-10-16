"use client";

import { Component, useEffect, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";

/* =========================================================
   BIO 3D – SHARED HELPERS
   Hooks and the soft-point shader used by BioBackground
   and BioHero. Everything here is client-only.
========================================================= */

/* ---------------------------------------------------------
   WEBGL SUPPORT
--------------------------------------------------------- */

let webglSupport;

function detectWebGL() {
  if (webglSupport !== undefined) return webglSupport;

  try {
    const canvas = document.createElement("canvas");

    webglSupport = Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    webglSupport = false;
  }

  return webglSupport;
}

const noopSubscribe = () => () => {};

export function useWebGLSupport() {
  return useSyncExternalStore(noopSubscribe, detectWebGL, () => false);
}

/* ---------------------------------------------------------
   MEDIA QUERY / VISIBILITY
--------------------------------------------------------- */

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);

      media.addEventListener("change", onChange);

      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export function useIsMobile() {
  return useMediaQuery("(max-width: 767px)");
}

export function usePageVisible() {
  return useSyncExternalStore(
    (onChange) => {
      document.addEventListener("visibilitychange", onChange);

      return () => document.removeEventListener("visibilitychange", onChange);
    },
    () => document.visibilityState !== "hidden",
    () => true,
  );
}

/* ---------------------------------------------------------
   THEME COLOURS
   Reads the design tokens from :root and refreshes when the
   .dark / .light class on <html> changes.
--------------------------------------------------------- */

const THEME_TOKENS = ["moss", "ochre", "ink"];

function readThemeColors() {
  const styles = getComputedStyle(document.documentElement);

  return Object.fromEntries(
    THEME_TOKENS.map((token) => [
      token,
      styles.getPropertyValue(`--${token}`).trim() || "#2e5b3a",
    ]),
  );
}

let themeSnapshot = null;
let themeKey = "";

function getThemeSnapshot() {
  const next = readThemeColors();
  const key = THEME_TOKENS.map((token) => next[token]).join("|");

  if (key !== themeKey) {
    themeKey = key;
    themeSnapshot = next;
  }

  return themeSnapshot;
}

const SERVER_THEME = { moss: "#2e5b3a", ochre: "#9a6b1f", ink: "#1c2a20" };

export function useThemeColors() {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });

      return () => observer.disconnect();
    },
    getThemeSnapshot,
    () => SERVER_THEME,
  );
}

/* ---------------------------------------------------------
   POINTER
   The canvases are pointer-events-none, so the pointer is
   tracked on window. Values are -1 … 1.
--------------------------------------------------------- */

export function usePointerRef(enabled) {
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;

    function handleMove(event) {
      pointerRef.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    }

    window.addEventListener("mousemove", handleMove, { passive: true });

    return () => window.removeEventListener("mousemove", handleMove);
  }, [enabled]);

  return pointerRef;
}

/* ---------------------------------------------------------
   ERROR BOUNDARY
   A failed WebGL context must never break the page.
--------------------------------------------------------- */

export class CanvasBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn("3D canvas disabled:", error?.message || error);
  }

  render() {
    return this.state.failed
      ? (this.props.fallback ?? null)
      : this.props.children;
  }
}

/* ---------------------------------------------------------
   SOFT POINT MATERIAL
   Round, feathered dots with per-point size, colour mix and
   depth fade. Normal blending only – no glow.

   uRise      1 = drift upward and wrap (background spores)
   uProgress  0 → 1 reveals points in aOrder sequence
--------------------------------------------------------- */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uRise;
  uniform float uHeight;
  uniform float uProgress;
  uniform float uNear;
  uniform float uFar;

  attribute float aSize;
  attribute float aMix;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aOrder;

  varying float vMix;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float alpha = 1.0;

    if (uRise > 0.5) {
      p.y = mod(p.y + uTime * aSpeed + uHeight * 0.5, uHeight) - uHeight * 0.5;
      p.x += sin(uTime * 0.07 + aPhase) * 0.35;
      p.z += cos(uTime * 0.05 + aPhase) * 0.25;
      alpha *= 1.0 - smoothstep(uHeight * 0.36, uHeight * 0.5, abs(p.y));
    }

    float reveal = smoothstep(aOrder, aOrder + 0.08, uProgress);
    alpha *= reveal;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = clamp((-mv.z - uNear) / (uFar - uNear), 0.0, 1.0);
    alpha *= mix(1.0, 0.3, depth);

    vMix = aMix;
    vAlpha = alpha;

    gl_PointSize = uSize * aSize * uPixelRatio * (0.55 + 0.45 * reveal) * (10.0 / -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;

  varying float vMix;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.16, d) * vAlpha * uOpacity;

    if (a < 0.004) discard;

    gl_FragColor = vec4(mix(uColorA, uColorB, vMix), a);

    #include <colorspace_fragment>
  }
`;

const SoftPointMaterial = shaderMaterial(
  {
    uTime: 0,
    uPixelRatio: 1,
    uSize: 1,
    uRise: 0,
    uHeight: 1,
    uProgress: 1,
    uNear: 4,
    uFar: 18,
    uOpacity: 1,
    uColorA: new THREE.Color("#2e5b3a"),
    uColorB: new THREE.Color("#9a6b1f"),
  },
  vertexShader,
  fragmentShader,
);

extend({ SoftPointMaterial });

/* ---------------------------------------------------------
   GEOMETRY HELPER
--------------------------------------------------------- */

export function buildPointGeometry({
  positions,
  size,
  mix,
  phase,
  speed,
  order,
}) {
  const geometry = new THREE.BufferGeometry();
  const count = positions.length / 3;
  const fill = (value) => value || new Float32Array(count);

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(fill(size), 1));
  geometry.setAttribute("aMix", new THREE.BufferAttribute(fill(mix), 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(fill(phase), 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(fill(speed), 1));
  geometry.setAttribute("aOrder", new THREE.BufferAttribute(fill(order), 1));

  /* Large bounds – points move in the shader */
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);

  return geometry;
}

/* Deterministic pseudo-random so layouts are stable between renders */
export function seededRandom(seed = 1) {
  let value = seed;

  return () => {
    value = (value * 16807) % 2147483647;

    return (value - 1) / 2147483646;
  };
}
