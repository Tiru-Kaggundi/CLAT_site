import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "@/lib/ai/gemini-client";
import { db } from "@/lib/db";
import { questionSets, questions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTodayIST } from "@/lib/utils/date";
import { getQuestionContentsFromLast3Days } from "@/server-actions/questions";
import { selectLeastSimilarQuestions } from "@/lib/utils/question-similarity";
import type { QuestionSetInput } from "@/lib/validations/question-schema";

// Force dynamic rendering to ensure cron job runs
export const dynamic = 'force-dynamic';

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
    const today = getTodayIST();

    // Check if question set already exists for today
    const [existingSet] = await db
      .select()
      .from(questionSets)
      .where(eq(questionSets.date, today))
      .limit(1);

    // If existing set found, delete it to allow regeneration
    if (existingSet) {
      console.log(`Deleting existing question set for ${today} to allow regeneration`);
      await db.delete(questionSets).where(eq(questionSets.id, existingSet.id));
      console.log(`Deleted existing question set and associated questions for ${today}`);
    }

    // Get question contents from last 3 days for deduplication
    const existingContents = await getQuestionContentsFromLast3Days();
    console.log(`Dedup: comparing against ${existingContents.length} questions from last 3 days`);

    // Generate 12 questions, then keep the 10 with lowest similarity to last 30
    const generatedQuestions = await generateQuestions();
    const uniqueQuestions = selectLeastSimilarQuestions(
      generatedQuestions,
      existingContents,
      10
    ) as QuestionSetInput;

    console.log(`Dedup: generated 12, publishing 10 least similar to last 3 days`);

    // Create question set
    const [newSet] = await db
      .insert(questionSets)
      .values({
        date: today,
      })
      .returning();

    // Insert all questions
    const questionsToInsert = uniqueQuestions.map((q) => ({
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
      questionCount: uniqueQuestions.length,
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
