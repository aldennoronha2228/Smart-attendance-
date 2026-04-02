"use client";

import { useMemo, useState } from "react";
import type { TrainedStudent } from "@/utils/types";

interface TrainedStudentsListProps {
  students: TrainedStudent[];
  isLoading: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
  onEditStudent: (student: TrainedStudent) => void;
  onDeleteStudents: (names: string[]) => void;
  isDeleting: boolean;
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
  onEditStudent,
  onDeleteStudents,
  isDeleting,
}: TrainedStudentsListProps) {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  const selectedCount = selectedNames.length;
  const allSelected = useMemo(
    () => students.length > 0 && selectedCount === students.length,
    [selectedCount, students.length]
  );

  const toggleStudent = (name: string) => {
    setSelectedNames((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  };

  return (
    <section className="mt-6 rounded-2xl border border-card-border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <h3 className="text-lg font-bold text-slate-900 sm:text-xl">Trained Students</h3>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isDeleting}
            className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSelectMode((current) => !current);
              setSelectedNames([]);
            }}
            disabled={isDeleting}
            className="w-full rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2"
          >
            {isSelectMode ? "Cancel Select" : "Select"}
          </button>
        </div>
      </div>

      {isSelectMode ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedNames(allSelected ? [] : students.map((student) => student.name));
            }}
            disabled={isDeleting || students.length === 0}
            className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {allSelected ? "Unselect All" : "Select All"}
          </button>
          <button
            type="button"
            onClick={() => {
              onDeleteStudents(selectedNames);
              setSelectedNames([]);
              setIsSelectMode(false);
            }}
            disabled={isDeleting || selectedCount === 0}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : `Delete Selected (${selectedCount})`}
          </button>
        </div>
      ) : null}

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
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isSelectMode ? (
                    <input
                      type="checkbox"
                      checked={selectedNames.includes(student.name)}
                      onChange={() => toggleStudent(student.name)}
                      className="h-4 w-4 rounded border-sky-300 text-indigo-600"
                    />
                  ) : null}
                  <p className="text-sm font-semibold text-slate-800">{student.name}</p>
                </div>
                {!isSelectMode ? (
                  <button
                    type="button"
                    onClick={() => onEditStudent(student)}
                    className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Edit
                  </button>
                ) : null}
              </div>
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
