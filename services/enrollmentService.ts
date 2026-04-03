import type { EnrollmentResponse } from "@/utils/types";

const ENROLL_URL = "/api/enroll";
// Training can take a while on cold-started / CPU-only deployments.
const REQUEST_TIMEOUT_MS = 180000;

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

function getCandidateEnrollUrls(): string[] {
  const candidates = [ENROLL_URL];

  return [...new Set(candidates)];
}

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
  if (record.detail && typeof record.detail === "object" && !Array.isArray(record.detail)) {
    const detailRecord = record.detail as Record<string, unknown>;
    if (typeof detailRecord.message === "string") {
      const skippedReasons = Array.isArray(detailRecord.skipped_reasons)
        ? detailRecord.skipped_reasons.filter(
            (reason): reason is string => typeof reason === "string"
          )
        : [];

      if (skippedReasons.length > 0) {
        return `${detailRecord.message}. ${skippedReasons.join("; ")}`;
      }

      return detailRecord.message;
    }
  }
  if (Array.isArray(record.detail)) {
    const firstValidationMessage = record.detail
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item) => item.msg)
      .find((msg): msg is string => typeof msg === "string");

    if (firstValidationMessage) {
      return firstValidationMessage;
    }
  }
  if (typeof record.message === "string") {
    return record.message;
  }
  if (typeof record.error === "string") {
    return record.error;
  }

  return fallback;
}

function buildEnrollmentFormData(name: string, images: File[], imageField: string): FormData {
  const formData = new FormData();
  formData.append("name", name);
  images.forEach((image) => formData.append(imageField, image));
  return formData;
}

async function postEnrollment(
  url: string,
  name: string,
  images: File[],
  imageField: string
): Promise<{ response: Response; payload: unknown }> {
  const response = await fetchWithTimeout(url, {
    method: "POST",
    body: buildEnrollmentFormData(name, images, imageField),
  });

  const payload: unknown = await response
    .json()
    .catch(async () => response.text().catch(() => ""));
  return { response, payload };
}

export async function enrollStudent(
  name: string,
  images: File[]
): Promise<EnrollmentResponse> {
  const urls = getCandidateEnrollUrls();
  let response: Response | null = null;
  let payload: unknown = {};
  let lastUrl = urls[0] ?? ENROLL_URL;

  try {
    for (const url of urls) {
      lastUrl = url;

      const primary = await postEnrollment(url, name, images, "images");
      response = primary.response;
      payload = primary.payload;

      if (response.ok) {
        break;
      }

      // Some backends use "files" instead of "images" for multipart lists.
      if (response.status === 400) {
        const retry = await postEnrollment(url, name, images, "files");
        response = retry.response;
        payload = retry.payload;
        if (response.ok) {
          break;
        }
      }

      if (response.status !== 404) {
        break;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "Training is taking too long (3 min). Backend may be slow/cold-started. Please retry, or upgrade backend resources for faster training."
      );
    }
    throw new Error(
      `Cannot connect to enrollment API. Tried: ${urls.join(", ")}. Verify server-side BACKEND_API_BASE_URL or ENROLL_URL configuration.`
    );
  }

  if (!response || !response.ok) {
    if (response?.status === 404) {
      throw new Error(
        `Enrollment request failed (404) from ${lastUrl}. Verify backend endpoint mapping with BACKEND_API_BASE_URL or ENROLL_URL.`
      );
    }

    throw new Error(
      getErrorMessage(payload, `Enrollment request failed (${response?.status ?? "unknown"}).`)
    );
  }

  const record = payload as Record<string, unknown>;
  return {
    message:
      typeof record.message === "string"
        ? record.message
        : "Enrollment successful",
    valid_images:
      typeof record.valid_images === "number" ? record.valid_images : 0,
    skipped_images:
      typeof record.skipped_images === "number" ? record.skipped_images : 0,
  };
}
