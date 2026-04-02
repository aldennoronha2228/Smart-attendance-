import type { FaceBox, RecognitionResponse, RecognizedFace } from "@/utils/types";

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toBox(value: unknown): FaceBox {
  if (!Array.isArray(value) || value.length !== 4) {
    return [0, 0, 0, 0];
  }

  return [
    toNumber(value[0]),
    toNumber(value[1]),
    toNumber(value[2]),
    toNumber(value[3]),
  ];
}

function toRecognizedFace(value: unknown): RecognizedFace | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name =
    typeof record.name === "string" && record.name.trim().length > 0
      ? record.name
      : "Unknown";

  return {
    name,
    confidence: toNumber(record.confidence),
    box: toBox(record.box),
  };
}

export function normalizeRecognitionResponse(payload: unknown): RecognitionResponse {
  const base =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  const recognized = Array.isArray(base.recognized)
    ? base.recognized.map(toRecognizedFace).filter(Boolean)
    : [];

  return {
    faces_detected: toNumber(base.faces_detected),
    recognized: recognized as RecognizedFace[],
    unknown_count: toNumber(base.unknown_count),
  };
}
