"use client";

/* =========================================================
   IMPORT UI
   ส่วนประกอบที่ใช้ร่วมกันในหน้า /account/plants/import
   (ข้อมูล Excel, รูปตาม PNU, เติมพิกัด, รายงานชื่อวิทยาศาสตร์)
========================================================= */

/* ตารางแบ่งหน้า หน้าละ 50 แถว */
export const PREVIEW_PAGE_SIZE = 50;

export function formatNumber(value) {
  return Number(value).toLocaleString("en-US");
}

const STAT_TONES = {
  moss: "text-moss",
  clay: "text-clay",
  ochre: "text-ochre",
};

export function StatCard({ id, label, value, sub = null, tone = null }) {
  return (
    <div
      data-stat={id}
      className="rounded-[6px] border border-rule bg-sheet px-4 py-3.5"
    >
      <p className="text-[12px] leading-5 text-muted">{label}</p>

      <p
        className={`mt-1 font-mono text-[1.5rem] leading-tight tabular-nums ${
          STAT_TONES[tone] || "text-ink"
        }`}
      >
        {formatNumber(value)}
      </p>

      {sub && <p className="mt-0.5 text-[12px] text-faint">{sub}</p>}
    </div>
  );
}

/* ตารางแบ่งหน้า render เฉพาะแถวของหน้าปัจจุบัน */
export function PagedTable({
  t,
  rows,
  columns,
  page,
  onPageChange,
  testId,
  rowKey = (row) => `${row.sheet}:${row.rowNumber}`,
}) {
  const totalPages = Math.max(1, Math.ceil(rows.length / PREVIEW_PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const pageRows = rows.slice(
    (currentPage - 1) * PREVIEW_PAGE_SIZE,
    currentPage * PREVIEW_PAGE_SIZE,
  );

  return (
    <>
      <div
        data-testid={testId}
        className="overflow-x-auto rounded-[6px] border border-rule"
      >
        <table className="vh-table min-w-[960px]">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pageRows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => {
                  const content = column.render(row);

                  return (
                    <td
                      key={column.key}
                      className={`max-w-[240px] truncate text-[13px] ${
                        column.mono ? "font-mono tabular-nums" : ""
                      }`}
                      title={typeof content === "string" ? content : undefined}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}

            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-muted"
                >
                  {t.noRows}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="vh-btn vh-btn-outline vh-btn-sm"
          >
            {t.previous}
          </button>

          <span className="font-mono text-[12px] tabular-nums text-muted">
            {t.page(currentPage, totalPages)}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="vh-btn vh-btn-outline vh-btn-sm"
          >
            {t.next}
          </button>
        </div>
      )}
    </>
  );
}

export function StepPanel({ number, title, description, children }) {
  return (
    <section className="vh-panel p-4 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="font-mono text-[12px] tabular-nums text-ochre">
          {number}
        </span>

        <div className="min-w-0">
          <h2 className="font-serif text-[1.35rem] leading-tight text-ink">
            {title}
          </h2>

          {description && (
            <p className="mt-1.5 text-[14px] leading-6 text-muted">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ProgressBar({ label, detail, done, total }) {
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="text-ink-soft">{label}</span>

        <span className="font-mono tabular-nums text-muted">{detail}</span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-2 h-2 overflow-hidden rounded-full bg-paper-deep"
      >
        <div
          className="h-full rounded-full bg-moss transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function AlertBox({ type, children }) {
  const isSuccess = type === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-[6px] border px-4 py-3.5 text-[14px] leading-6 ${
        isSuccess
          ? "border-moss/30 bg-moss-soft text-moss"
          : "border-clay/40 bg-clay-soft text-clay"
      }`}
    >
      {isSuccess ? (
        <CheckIcon className="mt-1 h-4 w-4 shrink-0" />
      ) : (
        <AlertIcon className="mt-1 h-4 w-4 shrink-0" />
      )}

      <span>{children}</span>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function SvgIcon({ className = "", children }) {
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
      {children}
    </svg>
  );
}

export function ArrowLeftIcon({ className = "" }) {
  return (
    <SvgIcon className={className}>
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h10" />
    </SvgIcon>
  );
}

export function UploadIcon({ className = "" }) {
  return (
    <SvgIcon className={className}>
      <path d="M12 15V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </SvgIcon>
  );
}

export function DownloadIcon({ className = "" }) {
  return (
    <SvgIcon className={className}>
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </SvgIcon>
  );
}

export function ImageIcon({ className = "" }) {
  return (
    <SvgIcon className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m20.5 16-4.5-4.5L6 19.5" />
    </SvgIcon>
  );
}

export function CheckIcon({ className = "" }) {
  return (
    <SvgIcon className={className}>
      <path d="m5 12 4.5 4.5L19 7" />
    </SvgIcon>
  );
}

export function AlertIcon({ className = "" }) {
  return (
    <SvgIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16.5h.01" />
    </SvgIcon>
  );
}

export function StopIcon({ className = "" }) {
  return (
    <SvgIcon className={className}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />
    </SvgIcon>
  );
}

export function RefreshIcon({ className = "" }) {
  return (
    <SvgIcon className={className}>
      <path d="M20 11a8 8 0 0 0-14.6-4.5L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.6 4.5L20 16" />
      <path d="M20 20v-4h-4" />
    </SvgIcon>
  );
}

export function LoadingIcon({ className = "" }) {
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
