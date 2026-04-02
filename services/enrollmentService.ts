import type { EnrollmentResponse } from "@/utils/types";

const ENROLL_URL = process.env.NEXT_PUBLIC_ENROLL_URL ?? "http://localhost:8000/enroll";

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.detail === "string") {
    return record.detail;
  }
  if (typeof record.message === "string") {
    return record.message;
  }

  return fallback;
}

export async function enrollStudent(
  name: string,
  images: File[]
): Promise<EnrollmentResponse> {
  const formData = new FormData();
  formData.append("name", name);
  images.forEach((image) => formData.append("images", image));

  let response: Response;
  try {
    response = await fetch(ENROLL_URL, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error(
      `Cannot connect to enrollment API at ${ENROLL_URL}. Start backend server and verify NEXT_PUBLIC_ENROLL_URL.`
    );
  }

  const payload: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload, `Enrollment request failed (${response.status}).`)
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
