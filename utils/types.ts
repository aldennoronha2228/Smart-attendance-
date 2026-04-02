export type FaceBox = [number, number, number, number];

export interface RecognizedFace {
  name: string;
  confidence: number;
  box: FaceBox;
}

export interface RecognitionResponse {
  faces_detected: number;
  recognized: RecognizedFace[];
  unknown_count: number;
}

export interface EnrollmentResponse {
  message: string;
  valid_images: number;
  skipped_images: number;
}
