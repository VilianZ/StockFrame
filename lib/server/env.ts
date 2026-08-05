import "server-only";

export type ServerEnv = Record<
  "ALPHA_VANTAGE_API_KEY" | "OPENROUTER_API_KEY" | "OPENROUTER_MODEL_ID",
  string | undefined
>;

export function getServerEnv(): ServerEnv {
  return {
    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL_ID: process.env.OPENROUTER_MODEL_ID,
  };
}
