"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AttendanceResult } from "@/components/AttendanceResult";
import { CameraCapture } from "@/components/CameraCapture";
import { EnrollmentPanel } from "@/components/EnrollmentPanel";
import { FaceOverlay } from "@/components/FaceOverlay";
import { ImageUploader } from "@/components/ImageUploader";
import { Navbar } from "@/components/Navbar";
import { TrainedStudentsList } from "@/components/TrainedStudentsList";
import { recognizeFaces } from "@/services/recognitionService";
import { deleteTrainedStudents, fetchTrainedStudents } from "@/services/studentsService";
import type { RecognitionResponse, TrainedStudent } from "@/utils/types";

export default function HomePage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEnrollmentPanel, setShowEnrollmentPanel] = useState(false);
  const [enrollmentPrefillName, setEnrollmentPrefillName] = useState<string | undefined>(
    undefined
  );
  const [enrollmentPrefillSamples, setEnrollmentPrefillSamples] = useState<number>(0);
  const [students, setStudents] = useState<TrainedStudent[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isDeletingStudents, setIsDeletingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
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

  const loadTrainedStudents = useCallback(async () => {
    try {
      setIsLoadingStudents(true);
      setStudentsError(null);
      const trainedStudents = await fetchTrainedStudents();
      setStudents(trainedStudents);
    } catch (error) {
      setStudentsError(
        error instanceof Error
          ? error.message
          : "Failed to load trained students."
      );
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  const handleDeleteStudents = useCallback(async (names: string[]) => {
    if (names.length === 0) {
      return;
    }

    try {
      setIsDeletingStudents(true);
      setStudentsError(null);
      await deleteTrainedStudents(names);
      const remaining = await fetchTrainedStudents();
      setStudents(remaining);
    } catch (error) {
      setStudentsError(
        error instanceof Error ? error.message : "Failed to delete selected students."
      );
    } finally {
      setIsDeletingStudents(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    void loadTrainedStudents();
  }, [loadTrainedStudents]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50 to-white">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-6 sm:py-8">
        <section className="rounded-2xl border border-card-border bg-card p-4 shadow-sm sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl font-bold text-slate-900 sm:text-3xl">
              Smart Attendance System
            </h1>
            <p className="mt-2 text-sm text-muted">
              Upload an image or capture one from your camera, then run face
              recognition to mark attendance.
            </p>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap">
            <ImageUploader
              onImageSelected={updateSelectedImage}
              disabled={isSubmitting}
            />
            <CameraCapture onCapture={updateSelectedImage} disabled={isSubmitting} />
          </div>

          {previewUrl ? (
            <FaceOverlay imageUrl={previewUrl} faces={result?.recognized ?? []} />
          ) : (
            <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 px-3 text-center text-sm text-slate-500 sm:min-h-56">
              Image preview will appear here.
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedImage || isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2"
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
              className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 sm:w-auto sm:py-2"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() => {
                setEnrollmentPrefillName(undefined);
                setEnrollmentPrefillSamples(0);
                setShowEnrollmentPanel((current) => !current);
              }}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2"
            >
              {showEnrollmentPanel ? "Close Training" : "Add Person & Train"}
            </button>
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          {showEnrollmentPanel ? (
            <EnrollmentPanel
              disabled={isSubmitting}
              onEnrollmentSuccess={loadTrainedStudents}
              prefillName={enrollmentPrefillName}
              prefillSamplesUsed={enrollmentPrefillSamples}
            />
          ) : null}
        </section>

        <AttendanceResult result={result} />
        <TrainedStudentsList
          students={students}
          isLoading={isLoadingStudents || isDeletingStudents}
          errorMessage={studentsError}
          onRefresh={() => {
            void loadTrainedStudents();
          }}
          onEditStudent={(student) => {
            setEnrollmentPrefillName(student.name);
            setEnrollmentPrefillSamples(student.samples_used);
            setShowEnrollmentPanel(true);
          }}
          onDeleteStudents={(names) => {
            void handleDeleteStudents(names);
          }}
          isDeleting={isDeletingStudents}
        />
      </main>
    </div>
  );
}
