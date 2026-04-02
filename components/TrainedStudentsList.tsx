"use client";

import type { TrainedStudent } from "@/utils/types";

interface TrainedStudentsListProps {
  students: TrainedStudent[];
  isLoading: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString();
}

export function TrainedStudentsList({
  students,
  isLoading,
  errorMessage,
  onRefresh,
}: TrainedStudentsListProps) {
  return (
    <section className="mt-6 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-slate-900">Trained Students</h3>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sky-50"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-slate-500">Loading trained students...</p>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && !errorMessage && students.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No students trained yet. Use Add Person & Train to enroll the first student.
        </p>
      ) : null}

      {!isLoading && !errorMessage && students.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {students.map((student) => (
            <li
              key={student.name}
              className="rounded-lg border border-sky-100 bg-white p-3"
            >
              <p className="text-sm font-semibold text-slate-800">{student.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                Samples used: {student.samples_used}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Last updated: {formatDate(student.updated_at)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
