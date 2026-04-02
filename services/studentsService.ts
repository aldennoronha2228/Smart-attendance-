import type { TrainedStudent } from "@/utils/types";

const STUDENTS_URL =
  process.env.NEXT_PUBLIC_STUDENTS_URL ?? "http://localhost:8000/students";
const RECOGNIZE_URL =
  process.env.NEXT_PUBLIC_RECOGNIZE_URL ?? "http://localhost:8000/recognize";
const ENROLL_URL = process.env.NEXT_PUBLIC_ENROLL_URL ?? "http://localhost:8000/enroll";
const LOCAL_BACKEND_STUDENTS_URL = "http://localhost:8000/students";

interface StudentsPayload {
  count?: number;
  students?: unknown;
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
  const candidates = [
    STUDENTS_URL,
    STUDENTS_URL.endsWith("/") ? STUDENTS_URL.slice(0, -1) : `${STUDENTS_URL}/`,
    withStudentsPath(RECOGNIZE_URL),
    withStudentsPath(ENROLL_URL),
    LOCAL_BACKEND_STUDENTS_URL,
    `${LOCAL_BACKEND_STUDENTS_URL}/`,
  ].filter((url) => url.length > 0);

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
        throw new Error(`Failed to load trained students (${response.status}) from ${url}.`);
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
