import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "@/lib/ai/gemini-client";
import { db } from "@/lib/db";
import { questionSets, questions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTodayIST } from "@/lib/utils/date";

/**
 * Vercel Cron endpoint - validates CRON_SECRET and triggers question generation
 */
export async function GET(request: NextRequest) {
  // Validate CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Call the generate endpoint internally
    const response = await fetch(`${request.nextUrl.origin}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": cronSecret,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({ success: true, message: "Questions generated successfully", data });
  } catch (error) {
    console.error("Error in cron endpoint:", error);
    return NextResponse.json(
      { error: "Failed to generate questions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
