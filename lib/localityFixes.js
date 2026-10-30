/* =========================================================
   LOCALITY FIXES
   คำสะกดผิดที่พบบ่อยในชื่อสถานที่ของข้อมูลเดิม (PNU Herbarium)
   ใช้ก่อนส่งค้นพิกัดเท่านั้น ไม่แก้ข้อมูลในฐานข้อมูล
   [รูปแบบ (ไม่สนตัวพิมพ์ใหญ่-เล็ก), คำที่ถูก]
   เพิ่มคำใหม่ได้ที่ตารางนี้ แล้วเปลี่ยน LOCALITY_FIXES_VERSION
   เพื่อให้ผลที่ค้นไว้ (cache) ถูกค้นใหม่
========================================================= */

export const LOCALITY_FIXES_VERSION = 1;

export const LOCALITY_FIXES = [
  /* จังหวัด */
  [/\bPh?i?t?sa?[nm]ulok?e?\b/gi, "Phitsanulok"],
  [/\bPhitsamulok\b/gi, "Phitsanulok"],
  [/\bPh?etchaboon\b/gi, "Phetchabun"],
  [/\bPetchabun\b/gi, "Phetchabun"],
  [/\bUttadit\b/gi, "Uttaradit"],
  [/\bNa?kh?or?n\b/gi, "Nakhon"],
  [/\bNakh?o?r?n\s?sawan\b/gi, "Nakhon Sawan"],
  [/\bChachoengchao\b/gi, "Chachoengsao"],
  [/\bK[ua]mphaeng\s?phet\b/gi, "Kamphaeng Phet"],
  [/\bSukho Thai\b/gi, "Sukhothai"],
  [/\bChan Taburi\b/gi, "Chanthaburi"],
  [/\bChampho?n\b/gi, "Chumphon"],
  [/\bLamphoon\b/gi, "Lamphun"],
  [/\bPhattalung\b/gi, "Phatthalung"],
  [/\bChaiyaphoom\b/gi, "Chaiyaphum"],
  [/\bSrakaew\b/gi, "Sa Kaeo"],
  [/\bPrachuap\s?kirikhan\b/gi, "Prachuap Khiri Khan"],
  [/\bPhang Ngaa\b/gi, "Phang Nga"],
  [/\bCh(?:ia|ai)ng\s?mai\b/gi, "Chiang Mai"],
  [/\bChiengmai\b/gi, "Chiang Mai"],
  [/\bChiangrai\b/gi, "Chiang Rai"],
  [/\bKhonkaen\b/gi, "Khon Kaen"],

  /* อำเภอ / พื้นที่ */
  [/\bMu(?:a|e)?[nm]g\b/gi, "Mueang"],
  [/\bMuamg\b/gi, "Mueang"],
  [/\bWang?\s?tha?o?ng\b/gi, "Wang Thong"],
  [/\bTha\s?-?\s?pho\b/gi, "Tha Pho"],
  [/\bLomsak\b/gi, "Lom Sak"],
  [/\bBang\s?mu[nl]\s?nak\b/gi, "Bang Mun Nak"],
  [/\bChiang Sean\b/gi, "Chiang Saen"],
  [/\bNakon Thai\b/gi, "Nakhon Thai"],
  [/\bSaklek\b/gi, "Sak Lek"],
  [/\bKao Yai\b/gi, "Khao Yai"],

  /* คำทั่วไป */
  [/\bNatioa?nal Pak\b/gi, "National Park"],
  [/\bNatioal\b/gi, "National"],
  [/\bsub-?di[sa]t?ri?ct?\b/gi, "Subdistrict"],
  [/\bd[ei]st?rict?\b/gi, "District"],
  [/\bcmmunity\b/gi, "community"],
  [/\bHeadquaters\b/gi, "Headquarters"],
  [/\bmusium\b/gi, "museum"],
  [/\bTombon\b/gi, "Tambon"],
];

export function applyLocalityFixes(text) {
  return LOCALITY_FIXES.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    String(text ?? ""),
  );
}
