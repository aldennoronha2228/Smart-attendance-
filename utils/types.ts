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

export interface TrainedStudent {
  name: string;
  samples_used: number;
  updated_at?: string | null;
  sample_image?: string | null;
}
