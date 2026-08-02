import { NextResponse } from "next/server";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function error(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
