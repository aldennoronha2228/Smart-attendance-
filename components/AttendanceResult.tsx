import type { RecognitionResponse } from "@/utils/types";

interface AttendanceResultProps {
  result: RecognitionResponse | null;
}

export function AttendanceResult({ result }: AttendanceResultProps) {
  return (
    <section className="mt-6 rounded-2xl border border-card-border bg-card p-4 shadow-sm sm:p-6">
      <h3 className="text-lg font-bold text-slate-900 sm:text-xl">Attendance Result</h3>

      {!result ? (
        <p className="mt-3 text-sm text-muted">
          Submit an image to view detected faces and attendance list.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Faces Detected
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                {result.faces_detected}
              </p>
            </div>

            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Recognized
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                {result.recognized.length}
              </p>
            </div>

            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Unknown
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                {result.unknown_count}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <h4 className="text-sm font-semibold text-slate-800">
              Recognized Students
            </h4>

            {result.recognized.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No students recognized.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {result.recognized.map((student, index) => (
                  <li
                    key={`${student.name}-${index}-${student.confidence}`}
                    className="flex flex-wrap items-center justify-between gap-1 rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">{student.name}</span>
                    <span className="text-slate-500">
                      {student.confidence.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
