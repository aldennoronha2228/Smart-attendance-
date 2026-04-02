"use client";

import { useEffect, useMemo, useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { enrollStudent } from "@/services/enrollmentService";
import type { EnrollmentResponse } from "@/utils/types";

interface EnrollmentPanelProps {
  disabled?: boolean;
  onEnrollmentSuccess?: () => void;
  prefillName?: string;
  prefillSamplesUsed?: number;
}

export function EnrollmentPanel({
  disabled = false,
  onEnrollmentSuccess,
  prefillName,
  prefillSamplesUsed,
}: EnrollmentPanelProps) {
  const maxImages = 10;
  const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const [studentName, setStudentName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<EnrollmentResponse | null>(null);

  useEffect(() => {
    if (!prefillName) {
      return;
    }

    setStudentName(prefillName);
    setSelectedFiles([]);
    setResult(null);
    setErrorMessage(null);
  }, [prefillName]);

  const isFormInvalid = useMemo(() => {
    return studentName.trim().length === 0 || selectedFiles.length === 0;
  }, [studentName, selectedFiles]);

  const existingSamples = Math.max(0, prefillSamplesUsed ?? 0);
  const estimatedUpdatedSamples = existingSamples + selectedFiles.length;

  const appendFiles = (files: File[]) => {
    const validFiles = files.filter((file) => allowedImageTypes.includes(file.type));
    const unsupportedCount = files.length - validFiles.length;
    const availableSlots = Math.max(0, maxImages - selectedFiles.length);
    const filesToAdd = validFiles.slice(0, availableSlots);
    const overflowCount = validFiles.length - filesToAdd.length;

    if (filesToAdd.length > 0) {
      setSelectedFiles((current) => [...current, ...filesToAdd]);
      setResult(null);
    }

    if (files.length === 0) {
      setErrorMessage(null);
      return;
    }

    if (validFiles.length === 0) {
      setErrorMessage(
        "No supported images selected. Use JPG, PNG, or WEBP. If your photos are HEIC, convert them to JPG first."
      );
      return;
    }

    if (overflowCount > 0) {
      setErrorMessage(
        `Only ${maxImages} images are allowed per person. ${overflowCount} image(s) were not added.`
      );
      return;
    }

    if (unsupportedCount > 0) {
      setErrorMessage(
        `${unsupportedCount} unsupported file(s) skipped. Use JPG, PNG, or WEBP only.`
      );
      return;
    }

    setErrorMessage(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    appendFiles(files);
    event.target.value = "";
  };

  const handleCameraCapture = (file: File, previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    appendFiles([file]);
  };

  const handleSubmit = async () => {
    if (isFormInvalid) {
      setErrorMessage("Please enter a name and select at least one image.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const response = await enrollStudent(studentName.trim(), selectedFiles);
      setResult(response);
      onEnrollmentSuccess?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Enrollment failed. Please retry."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
      <h3 className="text-base font-bold text-slate-900 sm:text-lg">Train New Student</h3>
      <p className="mt-1 text-sm text-muted">
        Add student name and upload up to 10 images for best recognition accuracy.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Supported formats: JPG, PNG, WEBP. HEIC photos may fail backend validation.
      </p>
      {prefillName ? (
        <p className="mt-1 text-xs font-medium text-indigo-700">
          Editing {prefillName}: current samples {existingSamples}, selected now {selectedFiles.length},
          estimated total {estimatedUpdatedSamples}.
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Student Name
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(event) => {
              setStudentName(event.target.value);
              setResult(null);
              setErrorMessage(null);
            }}
            disabled={disabled || isSubmitting}
            placeholder="e.g. Alden"
            className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-primary/30 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Student Images
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={disabled || isSubmitting || selectedFiles.length >= maxImages}
            className="w-full cursor-pointer rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="mt-1 text-xs text-slate-500">
            Max {maxImages} images per person.
          </p>
        </div>
      </div>

      <div className="mt-3">
        <CameraCapture
          onCapture={handleCameraCapture}
          disabled={disabled || isSubmitting || selectedFiles.length >= maxImages}
        />
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Selected images: {selectedFiles.length}/{maxImages}
      </p>

      {selectedFiles.length > 0 ? (
        <ul className="mt-2 max-h-28 space-y-1 overflow-auto rounded-lg border border-sky-100 bg-white p-2 text-xs text-slate-600">
          {selectedFiles.map((file, index) => (
            <li key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-2">
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
                  setResult(null);
                  setErrorMessage(null);
                }}
                disabled={disabled || isSubmitting}
                className="rounded border border-sky-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || isSubmitting || isFormInvalid}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2"
        >
          {isSubmitting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
              Training...
            </>
          ) : (
            "Train Model"
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setStudentName("");
            setSelectedFiles([]);
            setResult(null);
            setErrorMessage(null);
          }}
          disabled={disabled || isSubmitting}
          className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2"
        >
          Clear
        </button>
      </div>

      {result ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {result.message}. Valid images: {result.valid_images}, skipped:{" "}
          {result.skipped_images}.
          {prefillName
            ? ` Updated samples estimate: ${existingSamples + result.valid_images}.`
            : ""}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
