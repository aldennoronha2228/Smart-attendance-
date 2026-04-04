export const runtime = "nodejs";
export const maxDuration = 15;

import { NextResponse } from "next/server";
import { forwardJsonOrText, resolveBackendEndpointCandidates } from "@/app/api/_lib/backendProxy";

export async function GET() {
  const targetUrls = resolveBackendEndpointCandidates("/health", ["HEALTH_URL"]);
  if (targetUrls.length === 0) {
    return NextResponse.json(
      { detail: "Backend health endpoint is not configured." },
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
      { detail: `Cannot reach backend health endpoint. Tried: ${targetUrls.join(", ")}.` },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { detail: "Unable to query backend health endpoint." },
    { status: 502 }
  );
}
