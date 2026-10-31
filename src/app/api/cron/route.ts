import { NextRequest, NextResponse } from "next/server";
import { publishDailyQuestionSet } from "@/lib/questions/publish-daily-set";

// Force dynamic rendering to ensure cron job runs
export const dynamic = 'force-dynamic';

// Grounded generation of 12 MCQs can take well over a minute
export const maxDuration = 300;

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
    const { date, questionCount } = await publishDailyQuestionSet();

    return NextResponse.json({
      success: true,
      message: "Questions generated successfully",
      date,
      questionCount,
    });
  } catch (error) {
    console.error("Error generating questions in cron:", error);
    return NextResponse.json(
      {
        error: "Failed to generate questions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
