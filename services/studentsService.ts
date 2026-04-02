import type { TrainedStudent } from "@/utils/types";

const STUDENTS_URL =
  process.env.NEXT_PUBLIC_STUDENTS_URL ?? "http://localhost:8000/students";

interface StudentsPayload {
  count?: number;
  students?: unknown;
}

export async function fetchTrainedStudents(): Promise<TrainedStudent[]> {
  let response: Response;
  try {
    response = await fetch(STUDENTS_URL, {
      method: "GET",
      cache: "no-store",
    });
  } catch {
    throw new Error(
      `Cannot connect to students API at ${STUDENTS_URL}. Start backend server and verify NEXT_PUBLIC_STUDENTS_URL.`
    );
  }

  if (!response.ok) {
    throw new Error(`Failed to load trained students (${response.status}).`);
  }

  const payload = (await response.json()) as StudentsPayload;
  const list = Array.isArray(payload.students) ? payload.students : [];

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
