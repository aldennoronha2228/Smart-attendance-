import { NextResponse } from "next/server";
import { forwardJsonOrText, resolveBackendEndpointCandidates } from "@/app/api/_lib/backendProxy";

export async function GET() {
  const targetUrls = resolveBackendEndpointCandidates("/students", ["STUDENTS_URL"]);
  if (targetUrls.length === 0) {
    return NextResponse.json(
      { detail: "Backend students endpoint is not configured." },
      { status: 500 }
    );
  }

  let lastResponse: Response | null = null;
  try {
    for (const targetUrl of targetUrls) {
      const upstream = await fetch(targetUrl, {
        method: "GET",
        cache: "no-store",
      });

      lastResponse = upstream;

      if (upstream.status !== 404) {
        return forwardJsonOrText(upstream);
      }
    }

    if (lastResponse) {
      return forwardJsonOrText(lastResponse);
    }

  } catch {
    return NextResponse.json(
      { detail: `Cannot reach backend students endpoint. Tried: ${targetUrls.join(", ")}.` },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { detail: "Unable to query backend students endpoint." },
    { status: 502 }
  );
}
