/* =========================================================
   LABEL SELECTION
   id ที่เลือกในหน้า /account/plants สำหรับพิมพ์ป้าย
   เก็บใน sessionStorage (หายเมื่อปิดแท็บ)
========================================================= */

export const LABEL_SELECTION_KEY = "vh-label-selection";

export function readLabelSelection() {
  try {
    const value = JSON.parse(
      window.sessionStorage.getItem(LABEL_SELECTION_KEY) || "[]",
    );

    return Array.isArray(value)
      ? value.filter((id) => typeof id === "string" && id)
      : [];
  } catch {
    return [];
  }
}

export function writeLabelSelection(ids) {
  try {
    window.sessionStorage.setItem(LABEL_SELECTION_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error("Save label selection error:", err);
  }
}
