"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* =========================================================
   FILTER DROPDOWN
   ตัวเลือกตัวกรองที่ใช้ร่วมกันระหว่าง /plants และ /map
   options เป็นรายการข้อความ, labels ใช้แทนข้อความที่แสดง (ถ้ามี)
   เมนูเปิดผ่าน portal ที่ body จึงไม่ถูกตัดโดยแผนที่หรือ sidebar
========================================================= */

export default function FilterDropdown({
  value,
  onChange,
  options,
  placeholder,
  labels = {},
  mobile = false,
  compact = false,
}) {
  const [open, setOpen] = useState(false);

  const [menuPosition, setMenuPosition] = useState(null);

  const buttonRef = useRef(null);

  const menuRef = useRef(null);

  const selectedLabel = value ? labels[value] || value : placeholder;

  function updateMenuPosition() {
    const button = buttonRef.current;

    if (!button || typeof window === "undefined") {
      return;
    }

    const rect = button.getBoundingClientRect();

    const margin = 8;

    const desiredWidth = mobile
      ? Math.max(rect.width, 220)
      : Math.max(rect.width, 230);

    const width = Math.min(desiredWidth, window.innerWidth - 16);

    let left = rect.left;

    if (left + width > window.innerWidth - 8) {
      left = window.innerWidth - width - 8;
    }

    if (left < 8) {
      left = 8;
    }

    const spaceBelow = window.innerHeight - rect.bottom - margin;

    const spaceAbove = rect.top - margin;

    const openUpward = spaceBelow < 190 && spaceAbove > spaceBelow;

    const availableSpace = openUpward ? spaceAbove : spaceBelow;

    const maxHeight = Math.max(140, Math.min(260, availableSpace - 6));

    if (openUpward) {
      setMenuPosition({
        left,
        width,
        bottom: window.innerHeight - rect.top + margin,
        top: "auto",
        maxHeight,
      });

      return;
    }

    setMenuPosition({
      left,
      width,
      top: rect.bottom + margin,
      bottom: "auto",
      maxHeight,
    });
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    updateMenuPosition();

    function handleResize() {
      updateMenuPosition();
    }

    function handleScroll() {
      updateMenuPosition();
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handlePointerDown(event) {
      const button = buttonRef.current;

      const menu = menuRef.current;

      if (button?.contains(event.target)) {
        return;
      }

      if (menu?.contains(event.target)) {
        return;
      }

      setOpen(false);
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  function handleSelect(option) {
    onChange(option);

    setOpen(false);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`vh-input flex items-center justify-between gap-2 text-left ${
          compact
            ? "!min-h-[40px] !rounded-full !py-2 !pl-4 !pr-2.5 !text-[13px]"
            : mobile
              ? "!min-h-[44px] !py-2 !pl-3 !pr-2 !text-[13px]"
              : "!min-h-[44px] !py-2 !pl-3.5 !pr-2.5 !text-[14px]"
        } ${open ? "!border-moss shadow-[0_0_0_3px_var(--moss-soft)]" : ""} ${
          value ? "!text-ink" : "!text-ink-soft"
        }`}
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>

        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-faint transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open &&
        menuPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              left: menuPosition.left,
              width: menuPosition.width,
              top: menuPosition.top,
              bottom: menuPosition.bottom,
              maxHeight: menuPosition.maxHeight,
              zIndex: 260,
            }}
            className="overflow-y-auto rounded-[6px] border border-rule-strong bg-sheet-raised p-1 text-ink shadow-lift"
          >
            <DropdownOption
              active={!value}
              label={placeholder}
              onClick={() => handleSelect("")}
            />

            {options.map((option) => (
              <DropdownOption
                key={option}
                active={value === option}
                label={labels[option] || option}
                onClick={() => handleSelect(option)}
              />
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

/* =========================================================
   DROPDOWN OPTION
========================================================= */

function DropdownOption({ active, label, onClick }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={`flex min-h-[40px] w-full items-center justify-between gap-3 rounded-[4px] px-3 text-left text-[13px] transition ${
        active
          ? "bg-moss-soft text-moss"
          : "text-ink-soft hover:bg-moss-soft hover:text-ink"
      }`}
    >
      <span className="min-w-0 break-words">{label}</span>

      {active && <CheckIcon className="h-4 w-4 shrink-0 text-moss" />}
    </button>
  );
}

/* =========================================================
   ICONS
========================================================= */

function ChevronDownIcon({ className = "" }) {
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
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

function CheckIcon({ className = "" }) {
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
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
