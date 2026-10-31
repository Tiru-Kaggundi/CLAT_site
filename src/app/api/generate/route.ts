import { NextRequest, NextResponse } from "next/server";
import { publishDailyQuestionSet } from "@/lib/questions/publish-daily-set";

/**
 * Generate questions endpoint - protected by CRON_SECRET
 */
export async function POST(request: NextRequest) {
  // Validate CRON_SECRET from header (set by cron endpoint)
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (cronSecretHeader !== cronSecret) {
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
    console.error("Error generating questions:", error);
    return NextResponse.json(
      {
        error: "Failed to generate questions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
