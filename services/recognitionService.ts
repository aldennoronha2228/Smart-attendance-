import { normalizeRecognitionResponse } from "@/utils/normalizeRecognitionResponse";
import type { RecognitionResponse } from "@/utils/types";

const RECOGNIZE_URL = "/api/recognize";
const REQUEST_TIMEOUT_MS = 60000;

function getErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string") {
    const text = payload.trim();
    return text.length > 0 ? text : fallback;
  }

  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.detail === "string") {
    return record.detail;
  }
  if (Array.isArray(record.detail)) {
    const validationMessages = record.detail
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item) => {
        const msg = typeof item.msg === "string" ? item.msg : "Invalid value";
        const loc = Array.isArray(item.loc)
          ? item.loc.filter((part): part is string | number =>
              typeof part === "string" || typeof part === "number"
            )
          : [];
        const locText = loc.length > 0 ? String(loc.join(".")) : "request";
        return `${locText}: ${msg}`;
      })
      .filter((text) => text.trim().length > 0);

    if (validationMessages.length > 0) {
      return validationMessages.slice(0, 2).join("; ");
    }
  }

  return fallback;
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function recognizeFaces(imageFile: File): Promise<RecognitionResponse> {
  const formData = new FormData();
  formData.append("image", imageFile);

  const urls = [RECOGNIZE_URL];

  let response: Response;
  let lastUrl = urls[0] ?? RECOGNIZE_URL;
  try {
    response = await fetchWithTimeout(lastUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok && response.status === 404 && urls.length > 1) {
      lastUrl = urls[1];
      response = await fetch(lastUrl, {
        method: "POST",
        body: formData,
      });
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "Recognition is taking too long (60s). Backend may be slow/cold-started. Please retry."
      );
    }
    throw new Error(
      `Cannot connect to recognition API. Tried: ${urls.join(", ")}. Start backend server and verify API proxy configuration.`
    );
  }

  if (!response.ok) {
    const payload: unknown = await response
      .json()
      .catch(async () => response.text().catch(() => ""));
    throw new Error(
      getErrorMessage(payload, `Recognition request failed (${response.status}) from ${lastUrl}.`)
    );
  }

  const payload: unknown = await response.json();

  // We only consume the final fields needed by the UI from the backend SDK pipeline.
  return normalizeRecognitionResponse(payload);
}
