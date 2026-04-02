import type { TrainedStudent } from "@/utils/types";

const STUDENTS_URL = "/api/students";
const RECOGNIZE_URL = "/api/recognize";
const ENROLL_URL = "/api/enroll";
const PUBLIC_STUDENTS_URL = process.env.NEXT_PUBLIC_STUDENTS_URL;
const PUBLIC_RECOGNIZE_URL = process.env.NEXT_PUBLIC_RECOGNIZE_URL;
const PUBLIC_ENROLL_URL = process.env.NEXT_PUBLIC_ENROLL_URL;
const LOCAL_BACKEND_STUDENTS_URL = "http://localhost:8000/students";

interface StudentsPayload {
  count?: number;
  students?: unknown;
}

function isLocalRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
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

function withStudentsPath(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    url.pathname = "/students";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function getCandidateStudentsUrls(): string[] {
  const localhostCandidates = isLocalRuntime()
    ? [LOCAL_BACKEND_STUDENTS_URL, `${LOCAL_BACKEND_STUDENTS_URL}/`]
    : [];

  const candidates = [
    STUDENTS_URL,
    STUDENTS_URL.endsWith("/") ? STUDENTS_URL.slice(0, -1) : `${STUDENTS_URL}/`,
    PUBLIC_STUDENTS_URL,
    PUBLIC_STUDENTS_URL?.endsWith("/")
      ? PUBLIC_STUDENTS_URL.slice(0, -1)
      : PUBLIC_STUDENTS_URL
        ? `${PUBLIC_STUDENTS_URL}/`
        : "",
    withStudentsPath(RECOGNIZE_URL),
    withStudentsPath(ENROLL_URL),
    withStudentsPath(PUBLIC_RECOGNIZE_URL ?? ""),
    withStudentsPath(PUBLIC_ENROLL_URL ?? ""),
    ...localhostCandidates,
  ].filter((url): url is string => typeof url === "string" && url.length > 0);

  return [...new Set(candidates)];
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
      const response = await fetch(url, {
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
      if (error instanceof Error && error.message.startsWith("Failed to load trained students")) {
        throw error;
      }
    }
  }

  if (lastStatus === 404) {
    throw new Error(
      `Failed to load trained students (404) from ${lastUrl}. Check NEXT_PUBLIC_STUDENTS_URL and restart Next.js after editing .env.local.`
    );
  }

  throw new Error(
    `Cannot connect to students API. Tried: ${urls.join(", ")}. Start backend server and verify endpoint URLs.`
  );
}
