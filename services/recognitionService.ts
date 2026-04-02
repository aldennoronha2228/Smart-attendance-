import { normalizeRecognitionResponse } from "@/utils/normalizeRecognitionResponse";
import type { RecognitionResponse } from "@/utils/types";

const RECOGNIZE_URL =
  process.env.NEXT_PUBLIC_RECOGNIZE_URL ?? "http://localhost:8000/recognize";

export async function recognizeFaces(imageFile: File): Promise<RecognitionResponse> {
  const formData = new FormData();
  formData.append("image", imageFile);

  let response: Response;
  try {
    response = await fetch(RECOGNIZE_URL, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error(
      `Cannot connect to recognition API at ${RECOGNIZE_URL}. Start backend server and verify NEXT_PUBLIC_RECOGNIZE_URL.`
    );
  }

  if (!response.ok) {
    throw new Error(`Recognition request failed (${response.status}).`);
  }

  const payload: unknown = await response.json();

  // We only consume the final fields needed by the UI from the backend SDK pipeline.
  return normalizeRecognitionResponse(payload);
}
