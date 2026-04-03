export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { forwardJsonOrText, resolveBackendEndpointCandidates } from "@/app/api/_lib/backendProxy";

export async function POST(request: Request) {
  const targetUrls = resolveBackendEndpointCandidates("/recognize", ["RECOGNIZE_URL"]);
  if (targetUrls.length === 0) {
    return NextResponse.json(
      { detail: "Backend recognize endpoint is not configured." },
      { status: 500 }
    );
  }

  const body = await request.arrayBuffer();
  const contentType = request.headers.get("content-type");
  const headers: Record<string, string> = {};
  if (contentType) {
    headers["content-type"] = contentType;
  }

  let lastResponse: Response | null = null;
  try {
    for (const targetUrl of targetUrls) {
      const upstream = await fetch(targetUrl, {
        method: "POST",
        headers,
        body,
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
      { detail: `Cannot reach backend recognize endpoint. Tried: ${targetUrls.join(", ")}.` },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { detail: "Unable to query backend recognize endpoint." },
    { status: 502 }
  );
}
