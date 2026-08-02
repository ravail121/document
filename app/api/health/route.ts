import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await query<{ now: string }>("SELECT NOW() as now");
    const time = result.rows[0].now;

    return NextResponse.json({ ok: true, db: true, time });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, db: false, error: "Database unavailable" },
      { status: 500 }
    );
  }
}
