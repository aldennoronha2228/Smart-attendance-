export const runtime = "nodejs";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { forwardJsonOrText, resolveBackendEndpointCandidates } from "@/app/api/_lib/backendProxy";

export async function POST(request: Request) {
  const targetUrls = resolveBackendEndpointCandidates("/enroll", ["ENROLL_URL"]);
  if (targetUrls.length === 0) {
    return NextResponse.json(
      { detail: "Backend enroll endpoint is not configured." },
      { status: 500 }
    );
  }

  const contentType = request.headers.get("content-type");
  const rawBody = Buffer.from(await request.arrayBuffer());
  const upstreamHeaders: Record<string, string> = {};
  if (contentType) {
    upstreamHeaders["content-type"] = contentType;
  }
  upstreamHeaders["content-length"] = String(rawBody.byteLength);

  let lastResponse: Response | null = null;
  try {
    for (const targetUrl of targetUrls) {
      const upstream = await fetch(targetUrl, {
        method: "POST",
        headers: upstreamHeaders,
        body: rawBody,
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
      { detail: `Cannot reach backend enroll endpoint. Tried: ${targetUrls.join(", ")}.` },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { detail: "Unable to query backend enroll endpoint." },
    { status: 502 }
  );
}
