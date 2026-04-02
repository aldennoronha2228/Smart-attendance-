"use client";

import { useMemo, useState } from "react";
import { enrollStudent } from "@/services/enrollmentService";
import type { EnrollmentResponse } from "@/utils/types";

interface EnrollmentPanelProps {
  disabled?: boolean;
}

export function EnrollmentPanel({ disabled = false }: EnrollmentPanelProps) {
  const [studentName, setStudentName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<EnrollmentResponse | null>(null);

  const isFormInvalid = useMemo(() => {
    return studentName.trim().length === 0 || selectedFiles.length === 0;
  }, [studentName, selectedFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setSelectedFiles(files);
    setResult(null);
    setErrorMessage(null);
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
      <h3 className="text-lg font-bold text-slate-900">Train New Student</h3>
      <p className="mt-1 text-sm text-muted">
        Add student name and upload 5 to 10 images for best recognition accuracy.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
            disabled={disabled || isSubmitting}
            className="w-full cursor-pointer rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Selected images: {selectedFiles.length}
      </p>

      {selectedFiles.length > 0 ? (
        <ul className="mt-2 max-h-28 space-y-1 overflow-auto rounded-lg border border-sky-100 bg-white p-2 text-xs text-slate-600">
          {selectedFiles.map((file) => (
            <li key={`${file.name}-${file.size}`}>{file.name}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || isSubmitting || isFormInvalid}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
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
          className="rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear
        </button>
      </div>

      {result ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {result.message}. Valid images: {result.valid_images}, skipped:{" "}
          {result.skipped_images}.
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
