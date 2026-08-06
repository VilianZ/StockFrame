import "server-only";

export type ServerEnv = Record<
  "BUSINESS_QUANT_API_KEY" | "GEMINI_API_KEY" | "GEMINI_MODEL_ID",
  string | undefined
>;

export function getServerEnv(): ServerEnv {
  return {
    BUSINESS_QUANT_API_KEY: process.env.BUSINESS_QUANT_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL_ID: process.env.GEMINI_MODEL_ID,
  };
}
