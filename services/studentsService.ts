import type { TrainedStudent } from "@/utils/types";

const STUDENTS_URL = "/api/students";
const REQUEST_TIMEOUT_MS = 15000;

interface StudentsPayload {
  count?: number;
  students?: unknown;
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
  if (typeof record.message === "string") {
    return record.message;
  }
  if (typeof record.error === "string") {
    return record.error;
  }

  return fallback;
}

function getCandidateStudentsUrls(): string[] {
  const candidates = [STUDENTS_URL];

  return [...new Set(candidates)];
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

function mapStudents(payload: unknown): TrainedStudent[] {
  const record = payload && typeof payload === "object" ? (payload as StudentsPayload) : {};
  const list = Array.isArray(record.students)
    ? record.students
    : Array.isArray(payload)
      ? payload
      : [];

  return list
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      name: typeof item.name === "string" ? item.name : "Unknown",
      samples_used:
        typeof item.samples_used === "number" ? item.samples_used : 0,
      updated_at:
        typeof item.updated_at === "string" ? item.updated_at : null,
      sample_image:
        typeof item.sample_image === "string" ? item.sample_image : null,
    }));
}

export async function fetchTrainedStudents(): Promise<TrainedStudent[]> {
  const urls = getCandidateStudentsUrls();
  let lastStatus: number | null = null;
  let lastUrl = urls[0] ?? STUDENTS_URL;

  for (const url of urls) {
    lastUrl = url;
    try {
      const response = await fetchWithTimeout(url, {
        method: "GET",
        cache: "no-store",
      });

      if (response.ok) {
        const payload: unknown = await response.json().catch(() => ({}));
        return mapStudents(payload);
      }

      lastStatus = response.status;
      if (response.status !== 404) {
        const payload: unknown = await response
          .json()
          .catch(async () => response.text().catch(() => ""));
        throw new Error(
          getErrorMessage(payload, `Failed to load trained students (${response.status}) from ${url}.`)
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Loading trained students timed out. Please try refresh.");
        }
        throw error;
      }
    }
  }

  if (lastStatus === 404) {
    throw new Error(
      `Failed to load trained students (404) from ${lastUrl}. Verify backend endpoint mapping with BACKEND_API_BASE_URL or STUDENTS_URL.`
    );
  }

  throw new Error(
    `Cannot connect to students API. Tried: ${urls.join(", ")}. Start backend server and verify endpoint URLs.`
  );
}

export async function deleteTrainedStudents(names: string[]): Promise<void> {
  const trimmedNames = names.map((name) => name.trim()).filter((name) => name.length > 0);
  if (trimmedNames.length === 0) {
    return;
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(STUDENTS_URL, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ names: trimmedNames }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Students delete request timed out. Please try again.");
    }
    throw new Error("Cannot connect to students delete API.");
  }

  if (!response.ok) {
    const payload: unknown = await response
      .json()
      .catch(async () => response.text().catch(() => ""));
    throw new Error(
      getErrorMessage(payload, `Failed to delete selected students (${response.status}).`)
    );
  }
}
