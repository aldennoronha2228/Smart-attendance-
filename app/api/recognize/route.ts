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

  let lastResponse: Response | null = null;
  try {
    for (const targetUrl of targetUrls) {
      const cloned = request.clone();
      const contentType = cloned.headers.get("content-type");
      const headers: Record<string, string> = {};
      if (contentType) {
        headers["content-type"] = contentType;
      }

      const upstream = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: cloned.body,
        duplex: "half",
        cache: "no-store",
      } as any);

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
