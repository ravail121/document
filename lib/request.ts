import { NextResponse } from "next/server";
import { error } from "@/lib/http";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function invalidUuidError(field = "id"): NextResponse {
  return error(`Invalid ${field}`, 400);
}

export async function parseJsonBody(
  request: Request
): Promise<{ ok: true; value: unknown } | { ok: false; response: NextResponse }> {
  try {
    const value: unknown = await request.json();
    return { ok: true, value };
  } catch {
    return { ok: false, response: error("Invalid JSON body", 400) };
  }
}

export async function parseOptionalJsonBody(
  request: Request
): Promise<{ ok: true; value: unknown } | { ok: false; response: NextResponse }> {
  const raw = await request.text();
  if (raw.trim().length === 0) {
    return { ok: true, value: {} };
  }

  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, response: error("Invalid JSON body", 400) };
  }
}
