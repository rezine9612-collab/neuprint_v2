import { NextResponse } from "next/server";

/**
 * /api/analyze (POST)
 * MVP: build-safe minimal endpoint.
 *
 * - Accepts: { text: string }
 * - Returns: a lightweight report JSON payload so /report can render via sessionStorage fallback.
 *
 * NOTE:
 * Real GPT call + backend calculations should be wired later (lib/server/*).
 * This file must export at least one handler, otherwise Next.js treats it as "not a module".
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { text?: unknown };
    const text = typeof body?.text === "string" ? body.text : "";

    // Minimal payload. Report page hydration is tolerant of missing fields.
    return NextResponse.json({
      meta: {
        created_at: new Date().toISOString(),
        source: "api/analyze",
      },
      input: { text },
      // Placeholders; extend with real schema fields when wiring backend.
      backend: {},
      ui: { text: {} },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "ANALYZE_FAILED",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

// Optional: simple health check
export async function GET() {
  return NextResponse.json({ ok: true });
}
