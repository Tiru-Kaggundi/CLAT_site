import { db } from "@/lib/db";
import { questionSets, questions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateQuestions } from "@/lib/ai/gemini-client";
import { getTodayIST } from "@/lib/utils/date";
import { getQuestionContentsFromLast3Days } from "@/server-actions/questions";
import { selectLeastSimilarQuestions } from "@/lib/utils/question-similarity";
import type { QuestionSetInput } from "@/lib/validations/question-schema";

/**
 * Generate today's questions and publish them.
 *
 * Generation runs BEFORE anything is deleted. If Gemini fails, the existing
 * set for today (if any) stays live. The delete of the old set and the insert
 * of the new one happen in a single transaction, so the site never sees a day
 * with no questions.
 */
export async function publishDailyQuestionSet(): Promise<{ date: string; questionCount: number }> {
  const today = getTodayIST();

  // Question contents from the last 3 days, for deduplication
  const existingContents = await getQuestionContentsFromLast3Days();
  console.log(`Dedup: comparing against ${existingContents.length} questions from last 3 days`);

  // Generate 12 questions, then keep the 10 least similar to recent ones.
  // Throws on failure, before the database is touched.
  const generatedQuestions = await generateQuestions();
  const uniqueQuestions = selectLeastSimilarQuestions(
    generatedQuestions,
    existingContents,
    10
  ) as QuestionSetInput;
  console.log(`Dedup: generated ${generatedQuestions.length}, publishing ${uniqueQuestions.length}`);

  await db.transaction(async (tx) => {
    // Remove today's existing set (cascades to its questions and responses)
    const deleted = await tx
      .delete(questionSets)
      .where(eq(questionSets.date, today))
      .returning({ id: questionSets.id });
    if (deleted.length > 0) {
      console.log(`Replacing existing question set for ${today}`);
    }

    const [newSet] = await tx.insert(questionSets).values({ date: today }).returning();

    await tx.insert(questions).values(
      uniqueQuestions.map((q) => ({
        set_id: newSet.id,
        content: q.content,
        options: q.options,
        correct_option: q.correct_option,
        explanation: q.explanation,
        category: q.category,
      }))
    );
  });

  return { date: today, questionCount: uniqueQuestions.length };
}
