/* =========================================================
   Node loader สำหรับ npm run test:label-pdf
   ให้ Node import โค้ดของหน้าเว็บได้โดยตรง
   - "@/..." → ไฟล์ในโปรเจกต์ (เติมนามสกุล .js / .jsx เหมือน Next)
   - ไฟล์ .js / .jsx ของโปรเจกต์ที่มี JSX → แปลงด้วย typescript
========================================================= */

import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const ROOT = new URL("../", import.meta.url);

const EXTENSIONS = ["", ".js", ".jsx", "/index.js"];

const COMPILER_OPTIONS = {
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022,
};

const isFile = (url) => existsSync(url) && statSync(url).isFile();

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    for (const extension of EXTENSIONS) {
      const url = new URL(`${specifier.slice(2)}${extension}`, ROOT);

      if (isFile(url)) return { url: url.href, shortCircuit: true };
    }
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  const isProjectSource =
    url.startsWith(ROOT.href) &&
    !url.includes("/node_modules/") &&
    /\.jsx?$/.test(url);

  if (!isProjectSource) return nextLoad(url, context);

  const path = fileURLToPath(url);

  const { outputText } = ts.transpileModule(readFileSync(path, "utf8"), {
    fileName: path,
    compilerOptions: COMPILER_OPTIONS,
  });

  return { format: "module", source: outputText, shortCircuit: true };
}
