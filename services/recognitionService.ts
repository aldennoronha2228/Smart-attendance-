import { normalizeRecognitionResponse } from "@/utils/normalizeRecognitionResponse";
import type { RecognitionResponse } from "@/utils/types";

const RECOGNIZE_URL = "/api/recognize";
const PUBLIC_RECOGNIZE_URL = process.env.NEXT_PUBLIC_RECOGNIZE_URL;

export async function recognizeFaces(imageFile: File): Promise<RecognitionResponse> {
  const formData = new FormData();
  formData.append("image", imageFile);

  const urls = [RECOGNIZE_URL, PUBLIC_RECOGNIZE_URL].filter(
    (url): url is string => typeof url === "string" && url.length > 0
  );

  let response: Response;
  let lastUrl = urls[0] ?? RECOGNIZE_URL;
  try {
    response = await fetch(lastUrl, {
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
  } catch {
    throw new Error(
      `Cannot connect to recognition API. Tried: ${urls.join(", ")}. Start backend server and verify NEXT_PUBLIC_RECOGNIZE_URL.`
    );
  }

  if (!response.ok) {
    throw new Error(`Recognition request failed (${response.status}) from ${lastUrl}.`);
  }

  const payload: unknown = await response.json();

  // We only consume the final fields needed by the UI from the backend SDK pipeline.
  return normalizeRecognitionResponse(payload);
}
