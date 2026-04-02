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

function buildDeleteCandidates(targetUrl: string): string[] {
  try {
    const url = new URL(targetUrl);
    const path = url.pathname;
    const candidates = [
      targetUrl,
      targetUrl,
      `${url.origin}${path.replace(/\/$/, "")}/delete`,
      `${url.origin}${path.replace(/\/$/, "")}/remove`,
      `${url.origin}/delete-students`,
      `${url.origin}/api/delete-students`,
    ];

    return [...new Set(candidates)];
  } catch {
    return [targetUrl];
  }
}

export async function DELETE(request: Request) {
  const targetUrls = resolveBackendEndpointCandidates("/students", ["STUDENTS_URL"]);
  if (targetUrls.length === 0) {
    return NextResponse.json(
      { detail: "Backend students endpoint is not configured." },
      { status: 500 }
    );
  }

  const payload = await request
    .json()
    .catch(() => ({ names: [] as string[] }));

  let lastResponse: Response | null = null;

  try {
    for (const targetUrl of targetUrls) {
      const candidates = buildDeleteCandidates(targetUrl);

      for (const candidateUrl of candidates) {
        const useDeleteMethod = candidateUrl === targetUrl;
        const upstream = await fetch(candidateUrl, {
          method: useDeleteMethod ? "DELETE" : "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
          cache: "no-store",
        });

        lastResponse = upstream;

        if (upstream.status !== 404 && upstream.status !== 405) {
          return forwardJsonOrText(upstream);
        }
      }
    }

    if (lastResponse) {
      return forwardJsonOrText(lastResponse);
    }
  } catch {
    return NextResponse.json(
      { detail: `Cannot reach backend students delete endpoint. Tried: ${targetUrls.join(", ")}.` },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { detail: "Unable to query backend students delete endpoint." },
    { status: 502 }
  );
}
