import "server-only";

/* =========================================================
   AI CONFIG (ฝั่ง server เท่านั้น)
   - อ่านค่าตอนเรียกฟังก์ชัน ไม่ใช่ตอน import
     จึง build ผ่านแม้ยังไม่ได้ตั้ง ANTHROPIC_API_KEY
   - ไม่มี key → throw error ที่มี code = "ai_not_configured"
========================================================= */

export const DEFAULT_AI_MODEL = "claude-haiku-5-5";

export function getAIConfig() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    const error = new Error("ANTHROPIC_API_KEY is not configured.");

    error.code = "ai_not_configured";

    throw error;
  }

  return {
    apiKey,
    model: process.env.AI_MODEL?.trim() || DEFAULT_AI_MODEL,
  };
}
