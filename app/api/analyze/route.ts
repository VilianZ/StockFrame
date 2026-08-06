import "server-only";

import { createServerBusinessQuantProvider } from "../../../lib/market-data";
import { GeminiAdapter } from "../../../lib/ai";
import {
  analyze,
  type AnalyzeDependencies,
} from "../../../lib/server/analyze";
import {
  AnalyzeServiceError,
  statusForAnalyzeError,
  toAnalyzeErrorResponse,
} from "../../../lib/server/errors";
import {
  InMemoryRateLimiter,
  type RateLimiter,
} from "../../../lib/server/rate-limit";

export const runtime = "nodejs";

export const MAX_ANALYZE_BODY_BYTES = 16 * 1024;

export interface AnalyzeRouteOptions {
  rateLimiter?: RateLimiter;
  maxBodyBytes?: number;
}

function logGeminiValidationFailure(event: {
  requestId: string;
  category: "contract mismatch" | "unknown evidence" | "unsafe language" | "confidence violation";
}): void {
  console.warn("[ai-validation]", JSON.stringify({
    requestId: event.requestId,
    category: event.category,
  }));
}

function logGeminiHttpStatus(event: { requestId: string; modelId: string; status: number }): void {
  console.warn("[ai-http]", JSON.stringify(event));
}

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "anonymous";
}

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export function createAnalyzeHandler(
  dependencies: AnalyzeDependencies,
  options: AnalyzeRouteOptions = {},
): (request: Request) => Promise<Response> {
  const rateLimiter = options.rateLimiter ?? new InMemoryRateLimiter();
  const maxBodyBytes = options.maxBodyBytes ?? MAX_ANALYZE_BODY_BYTES;

  return async function handleAnalyze(request: Request): Promise<Response> {
    const requestId = crypto.randomUUID();
    const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();

    if (request.method !== "POST" || contentType !== "application/json") {
      const error = new AnalyzeServiceError("INVALID_REQUEST", false);
      return jsonResponse(toAnalyzeErrorResponse(requestId, error), 400);
    }

    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
      const error = new AnalyzeServiceError("INVALID_REQUEST", false);
      return jsonResponse(toAnalyzeErrorResponse(requestId, error), 413);
    }

    if (!rateLimiter.allow(clientKey(request))) {
      const error = new AnalyzeServiceError("REQUEST_RATE_LIMITED", true);
      return jsonResponse(toAnalyzeErrorResponse(requestId, error), 429);
    }

    let body: unknown;
    try {
      const text = await request.text();
      if (new TextEncoder().encode(text).byteLength > maxBodyBytes) {
        const error = new AnalyzeServiceError("INVALID_REQUEST", false);
        return jsonResponse(toAnalyzeErrorResponse(requestId, error), 413);
      }
      body = JSON.parse(text);
    } catch {
      const error = new AnalyzeServiceError("INVALID_REQUEST", false);
      return jsonResponse(toAnalyzeErrorResponse(requestId, error), 400);
    }

    try {
      const response = await analyze(body, dependencies, { requestId });
      return jsonResponse(response, 200);
    } catch (error) {
      return jsonResponse(
        toAnalyzeErrorResponse(requestId, error),
        statusForAnalyzeError(error),
      );
    }
  };
}

const defaultDependencies: AnalyzeDependencies = {
  marketDataProvider: createServerBusinessQuantProvider(),
  aiAdapter: new GeminiAdapter({
    validationLogger: logGeminiValidationFailure,
    statusLogger: logGeminiHttpStatus,
  }),
};
const defaultHandler = createAnalyzeHandler(defaultDependencies);

export async function POST(request: Request): Promise<Response> {
  return defaultHandler(request);
}
