import type { EnrollmentResponse } from "@/utils/types";

const ENROLL_URL = "/api/enroll";
const ENROLL_URL_WITH_TRAILING_SLASH = "/api/enroll/";

function getCandidateEnrollUrls(): string[] {
  const candidates = [ENROLL_URL, ENROLL_URL_WITH_TRAILING_SLASH];

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
  const response = await fetch(url, {
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
  } catch {
    throw new Error(
      `Cannot connect to enrollment API. Tried: ${urls.join(", ")}. Start backend server and verify NEXT_PUBLIC_ENROLL_URL.`
    );
  }

  if (!response || !response.ok) {
    if (response?.status === 404) {
      throw new Error(
        `Enrollment request failed (404) from ${lastUrl}. Check NEXT_PUBLIC_ENROLL_URL and restart Next.js after editing .env.local.`
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
