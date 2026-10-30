import {
  Document,
  Font,
  Page,
  Path,
  Rect,
  Svg,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

import { QR_OPTIONS } from "@/components/PlantQR";
import {
  LABEL_HEIGHT_MM,
  LABEL_WIDTH_MM,
  LOCALITY_COMPACT_PT,
  QR_SIZE_MM,
  getLabelContent,
} from "@/components/PrintLabel";
import { getPlantUrl } from "@/lib/siteUrl";

/* =========================================================
   LABEL PDF
   สร้างไฟล์ PDF ของป้ายในเบราว์เซอร์ (หน้า labels import ไฟล์นี้
   แบบ dynamic ตอนกดปุ่มเท่านั้น หน้าอื่นจึงไม่โหลด react-pdf)
   - ขนาด ข้อความ และฟิลด์มาจาก PrintLabel ชุดเดียวกับป้ายบนหน้าจอ
   - ฟอนต์ฝังจาก public/fonts (ไม่โหลดจาก CDN ภายนอก)
   - A4 ขอบ 10 มม. เหมือน @page ของหน้าพิมพ์, ป้ายจัดกลางแนวนอน
   - QR เป็น vector ใช้ getPlantUrl() และ QR_OPTIONS เดิม
   - แก้ตำแหน่งสระ/วรรณยุกต์ไทยด้วย renderGlyphs() ด้านล่าง
========================================================= */

/* ช่องว่างระหว่างป้าย เท่ากับ LABEL_GAP_MM ของหน้า labels */
const LABEL_GAP_MM = 5;

const PAGE_MARGIN_MM = 10;

const PER_PAGE = { eight: 8, one: 1 };

/* เส้นขอบ 1px บนจอ = 0.75pt */
const HAIRLINE_PT = 0.75;

const FONT_FILES = [
  ["sans", "/fonts/IBMPlexSansThai-Regular.ttf", 400, "normal"],
  ["sans", "/fonts/IBMPlexSansThai-SemiBold.ttf", 600, "normal"],
  ["mono", "/fonts/IBMPlexMono-Regular.ttf", 400, "normal"],
  ["mono", "/fonts/IBMPlexMono-Medium.ttf", 500, "normal"],
  ["serif", "/fonts/Fraunces-Italic-14pt.ttf", 400, "italic"],
];

/* ชื่อ family ที่ลงทะเบียนแล้ว { sans, mono, serif }
   react-pdf จำผลโหลดฟอนต์ที่ล้มเหลวไว้ จึงลงทะเบียนชื่อใหม่เมื่อสร้างไม่สำเร็จ */
let fontFamilies = null;
let fontGeneration = 0;

function registerFonts(fontBase) {
  if (fontFamilies) return fontFamilies;

  const families = {};

  for (const [role, path, fontWeight, fontStyle] of FONT_FILES) {
    families[role] ||= { family: `Label-${role}-${fontGeneration}`, fonts: [] };

    families[role].fonts.push({
      src: `${fontBase}${path}`,
      fontWeight,
      fontStyle,
    });
  }

  Object.values(families).forEach((family) => Font.register(family));

  /* ไม่ตัดคำด้วยขีด (เหมือนป้ายบนหน้าจอ) จุดตัดบรรทัดมาจาก textParts() */
  Font.registerHyphenationCallback((word) => [word]);

  fontFamilies = Object.fromEntries(
    Object.entries(families).map(([role, { family }]) => [role, family]),
  );

  return fontFamilies;
}

/* =========================================================
   PUBLIC
========================================================= */

/* คืนค่า Blob ของไฟล์ PDF
   compactIds = id ของป้ายที่หน้าจอลดขนาด locality แล้ว (กฎข้อความล้นเดียวกัน)
   fontBase = ที่อยู่ของโฟลเดอร์ public (สคริปต์ทดสอบใน Node ส่ง path ของเครื่อง) */
export async function createLabelPdf({
  plants,
  layout,
  language,
  compactIds = new Set(),
  fontBase = window.location.origin,
}) {
  const fonts = registerFonts(fontBase);

  PDFDocument.prototype.glyphs ||= renderGlyphs;

  /* QR ใบใดสร้างไม่ได้ให้ล้มทั้งไฟล์ (ไม่ส่งป้ายที่ไม่มี QR ออกไป) */
  const qrs = plants.map((plant) => createQr(plant.id));

  const labels = plants.map((plant, index) => ({
    plant,
    qr: qrs[index],
    compact: compactIds.has(plant.id),
  }));

  const perPage = PER_PAGE[layout] || PER_PAGE.eight;

  /* แถวกว้างเท่ากริดของหน้าพิมพ์ ป้ายใบสุดท้ายที่เหลือเดี่ยวจึงอยู่คอลัมน์ซ้าย */
  const columns = perPage === 1 ? 1 : 2;

  const rowWidth = columns * LABEL_WIDTH_MM + (columns - 1) * LABEL_GAP_MM;

  const labelDocument = (
    <Document title="Specimen labels" creator="Virtual Herbarium">
      {chunk(labels, perPage).map((pageLabels) => (
        <Page
          key={pageLabels[0].plant.id}
          size="A4"
          style={{ paddingTop: mm(PAGE_MARGIN_MM), alignItems: "center" }}
        >
          {chunk(pageLabels, columns).map((row, rowIndex) => (
            <View
              key={row[0].plant.id}
              style={{
                width: mm(rowWidth),
                flexDirection: "row",
                marginTop: rowIndex > 0 ? mm(LABEL_GAP_MM) : 0,
              }}
            >
              {row.map((label, columnIndex) => (
                <View
                  key={label.plant.id}
                  style={{ marginLeft: columnIndex > 0 ? mm(LABEL_GAP_MM) : 0 }}
                >
                  <LabelPdf {...label} language={language} fonts={fonts} />
                </View>
              ))}
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );

  try {
    return await pdf(labelDocument).toBlob();
  } catch (err) {
    /* ครั้งต่อไปโหลดฟอนต์ใหม่ (เช่น เน็ตหลุดระหว่างโหลด) */
    fontFamilies = null;
    fontGeneration += 1;

    throw err;
  }
}

/* =========================================================
   LABEL
   ตำแหน่งและขนาดตามคลาส Tailwind ใน PrintLabel
========================================================= */

function LabelPdf({ plant, qr, compact, language, fonts }) {
  const { institution, pnuNo, botanicalName, lines } = getLabelContent(
    plant,
    language,
  );

  return (
    <View
      wrap={false}
      style={{
        width: mm(LABEL_WIDTH_MM),
        height: mm(LABEL_HEIGHT_MM),
        paddingHorizontal: mm(3.5),
        paddingVertical: mm(3),
        borderWidth: HAIRLINE_PT,
        borderStyle: "dashed",
        borderColor: "#000000",
        backgroundColor: "#ffffff",
        color: "#000000",
        fontFamily: fonts.sans,
        overflow: "hidden",
      }}
    >
      <Text
        maxLines={1}
        style={{
          flexShrink: 0,
          paddingBottom: mm(1.2),
          borderBottomWidth: HAIRLINE_PT,
          borderBottomColor: "#000000",
          textAlign: "center",
          fontSize: 7,
          fontWeight: 600,
          lineHeight: 1.25,
        }}
      >
        {thaiText(institution)}
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexGrow: 1,
          flexBasis: 0,
          minHeight: 0,
          marginTop: mm(1.8),
        }}
      >
        {/* ข้อความวางใน View แบบ absolute ให้สูงเต็มเนื้อหา แล้วตัดส่วนที่ล้นที่ขอบคอลัมน์
            (ถ้าไม่ทำ react-pdf บีบกล่องข้อความให้พอดีแล้วบรรทัดซ้อนกัน) */}
        <View style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            {pnuNo && (
              <Text
                style={{
                  fontFamily: fonts.mono,
                  fontWeight: 500,
                  fontSize: 9,
                  lineHeight: 1,
                  letterSpacing: 9 * 0.02,
                }}
              >
                PNU {pnuNo}
              </Text>
            )}

            {botanicalName && (
              <Text
                style={{
                  marginTop: mm(1.2),
                  fontSize: 10.5,
                  lineHeight: 1.15,
                  ...(hasThai(botanicalName)
                    ? {}
                    : { fontFamily: fonts.serif, fontStyle: "italic" }),
                }}
              >
                {textParts(botanicalName)}
              </Text>
            )}

            <View style={{ marginTop: mm(1.2) }}>
              {lines.map((line, index) => (
                <Text
                  key={line.key}
                  style={{
                    marginTop: index > 0 ? mm(0.4) : 0,
                    fontSize:
                      line.key === "locality" && compact
                        ? LOCALITY_COMPACT_PT
                        : 7.5,
                    lineHeight: 1.3,
                  }}
                >
                  <Text style={{ fontWeight: 600 }}>
                    {textParts(`${line.label}:`)}
                  </Text>
                  {textParts(" ")}
                  <Text
                    style={
                      line.mono ? { fontFamily: fonts.mono, fontSize: 7 } : {}
                    }
                  >
                    {textParts(line.value)}
                  </Text>
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View
          style={{
            width: mm(QR_SIZE_MM),
            marginLeft: mm(3),
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <QrPdf qr={qr} />

          {pnuNo && (
            <Text
              style={{
                marginTop: mm(0.8),
                fontFamily: fonts.mono,
                fontSize: 7,
                lineHeight: 1,
              }}
            >
              PNU {pnuNo}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function QrPdf({ qr }) {
  const size = mm(QR_SIZE_MM);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${qr.viewSize} ${qr.viewSize}`}>
      <Rect
        x={0}
        y={0}
        width={qr.viewSize}
        height={qr.viewSize}
        fill={QR_OPTIONS.color.light}
      />

      <Path d={qr.path} fill={QR_OPTIONS.color.dark} />
    </Svg>
  );
}

/* =========================================================
   QR
   โมดูลเดียวกับ QRCode.toString() ของป้ายบนหน้าจอ (ระดับแก้ผิด, ขอบ)
   วาดเป็นสี่เหลี่ยม vector รวมช่องดำที่ติดกันในแถวเป็นชิ้นเดียว
========================================================= */

function createQr(id) {
  const url = getPlantUrl(id);

  const { modules } = QRCode.create(url, {
    errorCorrectionLevel: QR_OPTIONS.errorCorrectionLevel,
  });

  const margin = QR_OPTIONS.margin;

  const parts = [];

  for (let row = 0; row < modules.size; row += 1) {
    let column = 0;

    while (column < modules.size) {
      if (!modules.get(row, column)) {
        column += 1;
        continue;
      }

      const start = column;

      while (column < modules.size && modules.get(row, column)) {
        column += 1;
      }

      parts.push(
        `M${start + margin} ${row + margin}h${column - start}v1h${start - column}z`,
      );
    }
  }

  return {
    url,
    path: parts.join(""),
    viewSize: modules.size + margin * 2,
  };
}

/* =========================================================
   TEXT
   - ำ: ฟอนต์แยกเป็น ํ + า ตอนจัดรูปอักษร ทำให้ react-pdf นับตำแหน่ง
     ตัวอักษรเลื่อน (ข้อความท้ายบรรทัดหาย) จึงแยกไว้ก่อนตามลำดับเดียวกับ
     ที่เบราว์เซอร์ทำ (ํ ก่อนวรรณยุกต์) ภาพที่ได้เหมือนเดิม
   - react-pdf ตัดบรรทัดเฉพาะที่ช่องว่าง จึงคั่นคำไทยด้วยช่องว่างขนาดเกือบศูนย์
     (ตัดคำด้วย Intl.Segmenter แบบเดียวกับที่เบราว์เซอร์ตัดบรรทัดภาษาไทย)
   - react-pdf เกลี่ยความยาวบรรทัด (Knuth-Plass) จึงตัดบรรทัดเร็วกว่าเบราว์เซอร์
     ช่องว่างปกติจึงใช้ NBSP + ช่องว่างขนาดเกือบศูนย์ที่ยืดไม่ได้ react-pdf
     จะกลับไปตัดแบบใส่จนเต็มบรรทัด (best fit) เหมือนป้ายบนหน้าจอ
     ข้อความล้นจึงตรงกับที่หน้าจอวัดไว้
========================================================= */

const THAI_CHAR = /[\u0E00-\u0E7F]/;

const WORD_GAP_STYLE = { fontSize: 0.01 };

let wordSegmenter;

function hasThai(value) {
  return THAI_CHAR.test(value);
}

function thaiText(value) {
  return value.replace(/([\u0E48-\u0E4B]?)\u0E33/g, "\u0E4D$1\u0E32");
}

function textParts(value) {
  if (typeof Intl.Segmenter !== "function") {
    return thaiText(value);
  }

  wordSegmenter ||= new Intl.Segmenter("th", { granularity: "word" });

  /* ข้อความระหว่างจุดตัดต้องอยู่ชิ้นเดียวกัน ถ้าแยกชิ้น react-pdf
     ถือรอยต่อเป็นจุดตัดคำและเติมขีด */
  const parts = [];

  let current = "";

  const addBreak = () => {
    if (current) parts.push(thaiText(current));

    parts.push(
      <Text key={parts.length} style={WORD_GAP_STYLE}>
        {" "}
      </Text>,
    );

    current = "";
  };

  /* ตัดคำจากข้อความเดิม (พจนานุกรมไม่รู้จักคำที่แยก ำ แล้ว) */
  for (const { segment } of wordSegmenter.segment(value)) {
    if (/^\s+$/.test(segment)) {
      current += "\u00A0".repeat(segment.length);
      addBreak();
      continue;
    }

    if (THAI_CHAR.test(current.slice(-1)) && THAI_CHAR.test(segment[0])) {
      addBreak();
    }

    current += segment;
  }

  if (current) parts.push(thaiText(current));

  return parts;
}

/* =========================================================
   GLYPH OFFSETS
   react-pdf 4.9.0 แปลงหน่วย xAdvance แต่ไม่แปลง xOffset/yOffset ของ glyph
   ทำให้สระบน/วรรณยุกต์ไม่ขยับตาม GPOS ของฟอนต์ (เช่น ไม้เอกของ "ป่า"
   ซ้อนกับหางตัว ป จนมองไม่เห็น)
   react-pdf เรียก doc.glyphs() แทนตัววาดของตัวเองเมื่อมี จึงใส่ตัววาด
   ชุดเดียวกับ @react-pdf/render 4.9.0 ที่แปลงหน่วย offset ให้ถูก
   (ถ้าอัปเดต @react-pdf/renderer ต้องตรวจโค้ดส่วนนี้กับของใหม่)
========================================================= */

/* export ให้ scripts/test-label-pdf.mjs ตรวจว่า react-pdf เรียกตัววาดนี้จริง */
export function renderGlyphs(glyphs, positions, x, y) {
  /* pt → หน่วยของคำสั่ง TJ (1/1000 ของขนาดตัวอักษร) */
  const toText = 1000 / this._fontSize;
  const advanceWidthScale = 1000 / (this._font.font.unitsPerEm || 1000);

  const encoded = encodeGlyphs(this._font, glyphs);

  const items = positions.map((position, index) => ({
    xAdvance: position.xAdvance * toText,
    xOffset: position.xOffset * toText,
    yOffset: position.yOffset * toText,
    advanceWidth: glyphs[index].advanceWidth * advanceWidthScale,
  }));

  const scale = this._fontSize / 1000;
  const commands = [];

  let last = 0;
  let hadOffset = false;

  this.save();

  /* กลับแกน y ให้ตรงกับระบบพิกัดของ PDF */
  this.transform(1, 0, 0, -1, 0, this.page.height);

  const baseY = this.page.height - y;

  if (this.page.fonts[this._font.id] == null) {
    this.page.fonts[this._font.id] = this._font.ref();
  }

  this.addContent("BT");
  this.addContent(`1 0 0 1 ${pdfNumber(x)} ${pdfNumber(baseY)} Tm`);
  this.addContent(`/${this._font.id} ${pdfNumber(this._fontSize)} Tf`);

  const addSegment = (end) => {
    if (last < end) {
      const hex = encoded.slice(last, end).join("");
      const item = items[end - 1];

      commands.push(`<${hex}> ${pdfNumber(-(item.xAdvance - item.advanceWidth))}`);
    }

    last = end;
  };

  const flush = (end) => {
    addSegment(end);

    if (commands.length > 0) {
      this.addContent(`[${commands.join(" ")}] TJ`);
      commands.length = 0;
    }
  };

  let index = 0;

  for (; index < items.length; index += 1) {
    const item = items[index];

    if (item.xOffset || item.yOffset) {
      flush(index);

      this.addContent(
        `1 0 0 1 ${pdfNumber(x + item.xOffset * scale)} ${pdfNumber(baseY + item.yOffset * scale)} Tm`,
      );

      flush(index + 1);

      hadOffset = true;
    } else {
      if (hadOffset) {
        this.addContent(`1 0 0 1 ${pdfNumber(x)} ${pdfNumber(baseY)} Tm`);
        hadOffset = false;
      }

      if (item.xAdvance - item.advanceWidth !== 0) {
        addSegment(index + 1);
      }
    }

    x += item.xAdvance * scale;
  }

  flush(index);

  this.addContent("ET");

  return this.restore();
}

/* รหัส glyph ในฟอนต์ที่ฝัง (subset) หรือฟอนต์มาตรฐานของ PDF */
function encodeGlyphs(font, glyphs) {
  if (font.subset) {
    return glyphs.map((glyph) => {
      const id = font.subset.includeGlyph(glyph.id);

      font.widths[id] ??= glyph.advanceWidth * font.scale;
      font.unicode[id] ??= glyph.codePoints;

      return `0000${id.toString(16)}`.slice(-4);
    });
  }

  return glyphs.map((glyph) => `00${glyph.id.toString(16)}`.slice(-2));
}

function pdfNumber(value) {
  return Math.round(value * 1e6) / 1e6;
}

/* =========================================================
   HELPERS
========================================================= */

/* มม. → pt */
function mm(value) {
  return (value * 72) / 25.4;
}

function chunk(items, size) {
  const result = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}
