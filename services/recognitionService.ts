import { normalizeRecognitionResponse } from "@/utils/normalizeRecognitionResponse";
import type { RecognitionResponse } from "@/utils/types";

const RECOGNIZE_URL = "/api/recognize";
const REQUEST_TIMEOUT_MS = 60000;

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
    throw new Error(`Recognition request failed (${response.status}) from ${lastUrl}.`);
  }

  const payload: unknown = await response.json();

  // We only consume the final fields needed by the UI from the backend SDK pipeline.
  return normalizeRecognitionResponse(payload);
}
