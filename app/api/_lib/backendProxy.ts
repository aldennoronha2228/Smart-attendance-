import { NextResponse } from "next/server";

const DEFAULT_BACKEND_BASE_URL = "http://localhost:8000";

function toAbsoluteUrl(value?: string): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

function buildFromBase(baseUrl: string, path: string): string | null {
  const normalizedBase = toAbsoluteUrl(baseUrl);
  if (!normalizedBase) {
    return null;
  }

  try {
    const base = new URL(normalizedBase);
    const basePath = base.pathname.endsWith("/") ? base.pathname.slice(0, -1) : base.pathname;
    const endpointPath = path.startsWith("/") ? path : `/${path}`;
    base.pathname = `${basePath}${endpointPath}`.replace(/\/+/g, "/");
    base.search = "";
    base.hash = "";
    return base.toString();
  } catch {
    return null;
  }
}

export function resolveBackendEndpoint(path: string, endpointEnvKeys: string[]): string | null {
  const candidates = resolveBackendEndpointCandidates(path, endpointEnvKeys);
  return candidates[0] ?? null;
}

export function resolveBackendEndpointCandidates(path: string, endpointEnvKeys: string[]): string[] {
  const candidates: string[] = [];

  for (const key of endpointEnvKeys) {
    const endpointValue = process.env[key];
    const endpointUrl = toAbsoluteUrl(endpointValue);
    if (endpointUrl) {
      candidates.push(endpointUrl);
    }
  }

  const baseCandidates = [
    process.env.BACKEND_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NODE_ENV === "development" ? DEFAULT_BACKEND_BASE_URL : undefined,
  ];

  for (const base of baseCandidates) {
    if (!base) {
      continue;
    }

    const built = buildFromBase(base, path);
    if (built) {
      candidates.push(built);
    }

    const apiBuilt = buildFromBase(base, `/api${path}`);
    if (apiBuilt) {
      candidates.push(apiBuilt);
    }
  }

  return [...new Set(candidates)];
}

export async function forwardJsonOrText(upstream: Response): Promise<NextResponse> {
  const contentType = upstream.headers.get("content-type") ?? "application/json";
  const body = await upstream.text();

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "content-type": contentType,
    },
  });
}
