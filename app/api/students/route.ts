import { NextResponse } from "next/server";
import { forwardJsonOrText, resolveBackendEndpoint } from "@/app/api/_lib/backendProxy";

export async function GET() {
  const targetUrl = resolveBackendEndpoint("/students", ["STUDENTS_URL"]);
  if (!targetUrl) {
    return NextResponse.json(
      { detail: "Backend students endpoint is not configured." },
      { status: 500 }
    );
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
    });

    return forwardJsonOrText(upstream);
  } catch {
    return NextResponse.json(
      { detail: `Cannot reach backend students endpoint at ${targetUrl}.` },
      { status: 502 }
    );
  }
}
