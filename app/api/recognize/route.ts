import { NextResponse } from "next/server";
import { forwardJsonOrText, resolveBackendEndpoint } from "@/app/api/_lib/backendProxy";

export async function POST(request: Request) {
  const targetUrl = resolveBackendEndpoint("/recognize", ["RECOGNIZE_URL"]);
  if (!targetUrl) {
    return NextResponse.json(
      { detail: "Backend recognize endpoint is not configured." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const upstream = await fetch(targetUrl, {
      method: "POST",
      body: formData,
      cache: "no-store",
    });

    return forwardJsonOrText(upstream);
  } catch {
    return NextResponse.json(
      { detail: `Cannot reach backend recognize endpoint at ${targetUrl}.` },
      { status: 502 }
    );
  }
}
