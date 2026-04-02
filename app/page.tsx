"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AttendanceResult } from "@/components/AttendanceResult";
import { CameraCapture } from "@/components/CameraCapture";
import { EnrollmentPanel } from "@/components/EnrollmentPanel";
import { FaceOverlay } from "@/components/FaceOverlay";
import { ImageUploader } from "@/components/ImageUploader";
import { Navbar } from "@/components/Navbar";
import { recognizeFaces } from "@/services/recognitionService";
import type { RecognitionResponse } from "@/utils/types";

export default function HomePage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEnrollmentPanel, setShowEnrollmentPanel] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  const updateSelectedImage = useCallback((file: File, nextPreviewUrl: string) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
    setSelectedImage(file);
    setResult(null);
    setErrorMessage(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedImage) {
      setErrorMessage("Please upload or capture an image first.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const response = await recognizeFaces(selectedImage);
      setResult(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Face recognition failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedImage]);

  const handleReset = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage(null);
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50 to-white">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Smart Attendance System
            </h1>
            <p className="mt-2 text-sm text-muted">
              Upload an image or capture one from your camera, then run face
              recognition to mark attendance.
            </p>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            <ImageUploader
              onImageSelected={updateSelectedImage}
              disabled={isSubmitting}
            />
            <CameraCapture onCapture={updateSelectedImage} disabled={isSubmitting} />
          </div>

          {previewUrl ? (
            <FaceOverlay imageUrl={previewUrl} faces={result?.recognized ?? []} />
          ) : (
            <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 text-sm text-slate-500">
              Image preview will appear here.
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedImage || isSubmitting}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  Recognizing...
                </>
              ) : (
                "Submit"
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sky-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() => setShowEnrollmentPanel((current) => !current)}
              disabled={isSubmitting}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {showEnrollmentPanel ? "Close Training" : "Add Person & Train"}
            </button>
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          {showEnrollmentPanel ? <EnrollmentPanel disabled={isSubmitting} /> : null}
        </section>

        <AttendanceResult result={result} />
      </main>
    </div>
  );
}
