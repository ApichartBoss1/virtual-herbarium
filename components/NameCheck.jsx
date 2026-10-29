"use client";

import { useRef, useState } from "react";

import {
  GBIF_TEXT,
  checkName,
  cleanName,
  compareFamily,
  gbifSearchUrl,
} from "@/lib/gbif";

/* =========================================================
   NAME CHECK
   ตรวจชื่อวิทยาศาสตร์กับ GBIF จากค่าปัจจุบันในฟอร์ม
   - ปุ่ม "ใช้ชื่อนี้" / "ใช้วงศ์นี้" เปลี่ยนค่าในฟอร์มเท่านั้น ไม่บันทึกเอง
   - แก้ชื่อหลังตรวจแล้ว ผลเดิมจะหายไป (ผลผูกกับชื่อที่ตรวจ)
========================================================= */

const COPY = {
  TH: {
    check: "ตรวจชื่อ",
    checking: "กำลังตรวจกับ GBIF...",
    enterName: "กรอกชื่อวิทยาศาสตร์ก่อนตรวจ",
    useName: "ใช้ชื่อนี้",
    useFamily: "ใช้วงศ์นี้",
    newTab: "(เปิดแท็บใหม่)",
  },
  EN: {
    check: "Check name",
    checking: "Checking with GBIF...",
    enterName: "Enter a botanical name first",
    useName: "Use this name",
    useFamily: "Use this family",
    newTab: "(opens in a new tab)",
  },
};

const TONES = {
  ok: "border-moss/30 bg-moss-soft text-moss",
  synonym: "border-ochre/35 bg-ochre-soft text-ochre",
  genus_only:
    "border-sky-700/25 bg-sky-500/10 text-sky-800 dark:border-sky-300/25 dark:text-sky-300",
  not_found: "border-clay/40 bg-clay-soft text-clay",
};

export default function NameCheck({
  botanicalName,
  family,
  language,
  disabled = false,
  onUseName,
  onUseFamily,
}) {
  const isEnglish = language === "EN";

  const t = isEnglish ? COPY.EN : COPY.TH;

  const g = isEnglish ? GBIF_TEXT.EN : GBIF_TEXT.TH;

  /* { forName, data } หรือ { forName, error } */
  const [outcome, setOutcome] = useState(null);

  const [checking, setChecking] = useState(false);

  const requestRef = useRef(0);

  const currentName = cleanName(botanicalName);

  /* ชื่อในช่องเปลี่ยนไปจากที่ตรวจแล้ว → ไม่แสดงผลเดิม */
  const visible = outcome && outcome.forName === currentName ? outcome : null;

  async function handleCheck() {
    if (checking) return;

    if (!currentName) {
      setOutcome({ forName: currentName, error: t.enterName });
      return;
    }

    const requestId = ++requestRef.current;

    setChecking(true);
    setOutcome(null);

    try {
      const data = await checkName({ botanical_name: currentName, family });

      if (requestId === requestRef.current) {
        setOutcome({ forName: currentName, data });
      }
    } catch (err) {
      console.error("GBIF name check error:", err);

      if (requestId === requestRef.current) {
        setOutcome({
          forName: currentName,
          error: g.errors[err?.code] || g.errors.gbif_unavailable,
        });
      }
    } finally {
      if (requestId === requestRef.current) {
        setChecking(false);
      }
    }
  }

  const data = visible?.data || null;

  const gbif = data?.gbif || null;

  /* เทียบวงศ์กับค่าปัจจุบันในฟอร์ม เพื่อให้คำเตือนหายเมื่อกด "ใช้วงศ์นี้" */
  const familyCheck =
    data && data.result !== "not_found"
      ? compareFamily(family, gbif?.family)
      : null;

  return (
    <div className="mt-2.5">
      <button
        type="button"
        onClick={handleCheck}
        disabled={disabled || checking}
        className="vh-btn vh-btn-outline vh-btn-sm"
      >
        {checking ? (
          <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <SearchIcon className="h-3.5 w-3.5" />
        )}

        {checking ? t.checking : t.check}
      </button>

      <div aria-live="polite">
        {visible?.error && (
          <p
            role="alert"
            className="mt-3 rounded-[6px] border border-clay/40 bg-clay-soft px-3.5 py-2.5 text-[13px] leading-6 text-clay"
          >
            {visible.error}
          </p>
        )}

        {data && (
          <div
            className={`mt-3 rounded-[6px] border px-3.5 py-3 text-[13px] leading-6 ${TONES[data.result]}`}
          >
            <ResultBody
              data={data}
              gbif={gbif}
              g={g}
              t={t}
              disabled={disabled}
              onUseName={onUseName}
            />

            {familyCheck === "differs" && gbif?.family && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[4px] border border-ochre/35 bg-ochre-soft px-3 py-2 text-ochre">
                <span>{g.familyDiffers(gbif.family)}</span>

                <UseButton
                  label={t.useFamily}
                  disabled={disabled}
                  onClick={() => onUseFamily?.(gbif.family)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   RESULT BODY
========================================================= */

function ResultBody({ data, gbif, g, t, disabled, onUseName }) {
  if (data.result === "synonym") {
    return (
      <>
        <p className="font-medium">
          {g.result.synonym}{" "}
          <span className="italic">{gbif.acceptedName}</span>
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <UseButton
            label={t.useName}
            disabled={disabled || !gbif.acceptedName}
            onClick={() => onUseName?.(gbif.acceptedName)}
          />

          <GbifLink href={gbif.acceptedGbifUrl || gbif.gbifUrl} g={g} t={t} />
        </div>
      </>
    );
  }

  if (data.result === "not_found") {
    return (
      <>
        <p className="font-medium">{g.result.not_found}</p>

        {data.suggestions.length > 0 ? (
          <>
            <p className="mt-2">{g.suggestions}</p>

            <ul className="mt-1.5 space-y-2">
              {data.suggestions.map((item) => (
                <li
                  key={item.gbifUrl}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
                >
                  <span className="italic text-ink">{item.scientificName}</span>

                  <UseButton
                    label={t.useName}
                    disabled={disabled}
                    onClick={() => onUseName?.(item.scientificName)}
                  />

                  <GbifLink href={item.gbifUrl} g={g} t={t} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-1">{g.noSuggestions}</p>
        )}

        {/* ค้นชื่อที่กรอกบน GBIF (ไม่ซ้ำกับลิงก์ของชื่อที่แนะนำ) */}
        <div className="mt-2">
          <GbifLink href={gbifSearchUrl(data.cleaned)} g={g} t={t} />
        </div>
      </>
    );
  }

  /* ok / genus_only */
  return (
    <>
      <p className="font-medium">{g.result[data.result]}</p>

      {gbif?.scientificName && (
        <p className="mt-0.5">
          {g.matchedName}:{" "}
          <span className="italic">{gbif.scientificName}</span>
        </p>
      )}

      <div className="mt-2">
        <GbifLink href={gbif?.gbifUrl} g={g} t={t} />
      </div>
    </>
  );
}

function UseButton({ label, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="vh-btn vh-btn-outline vh-btn-sm !bg-sheet"
    >
      {label}
    </button>
  );
}

function GbifLink({ href, g, t }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-80"
    >
      {g.viewOnGbif}
      <ExternalIcon className="h-3.5 w-3.5" />
      <span className="sr-only">{t.newTab}</span>
    </a>
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
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

function ExternalIcon({ className = "" }) {
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
      <path d="M14 5h5v5" />
      <path d="M19 5 11 13" />
      <path d="M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" />
    </svg>
  );
}

function SpinnerIcon({ className = "" }) {
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
