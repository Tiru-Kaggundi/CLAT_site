import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "@/lib/ai/gemini-client";
import { db } from "@/lib/db";
import { questionSets, questions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTodayIST } from "@/lib/utils/date";

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
    const today = getTodayIST();

    // Check if question set already exists for today
    const [existingSet] = await db
      .select()
      .from(questionSets)
      .where(eq(questionSets.date, today))
      .limit(1);

    // If existing set found, delete it to allow regeneration
    // This will cascade delete all associated questions and user responses
    if (existingSet) {
      console.log(`Deleting existing question set for ${today} to allow regeneration`);
      await db.delete(questionSets).where(eq(questionSets.id, existingSet.id));
      console.log(`Deleted existing question set and associated questions for ${today}`);
    }

    // Generate questions using Gemini AI
    const generatedQuestions = await generateQuestions();

    // Create question set
    const [newSet] = await db
      .insert(questionSets)
      .values({
        date: today,
      })
      .returning();

    // Insert all questions
    const questionsToInsert = generatedQuestions.map((q) => ({
      set_id: newSet.id,
      content: q.content,
      options: q.options,
      correct_option: q.correct_option,
      explanation: q.explanation,
      category: q.category,
    }));

    await db.insert(questions).values(questionsToInsert);

    return NextResponse.json({
      success: true,
      message: "Questions generated successfully",
      date: today,
      questionCount: generatedQuestions.length,
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
