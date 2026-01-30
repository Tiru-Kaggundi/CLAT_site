"use server";

import { db } from "@/lib/db";
import { anonymousAttempts } from "@/lib/db/schema";
import { sql, desc } from "drizzle-orm";

/**
 * Record an anonymous attempt and return the assigned label (anon_user_N)
 */
export async function recordAnonymousAttempt(
  setDate: string,
  score: number,
  totalQuestions: number
): Promise<{ anonUserLabel: string }> {
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(anonymousAttempts);

  const nextNumber = (countResult[0]?.count ?? 0) + 1;
  const anonUserLabel = `anon_user_${nextNumber}`;

  await db.insert(anonymousAttempts).values({
    anon_user_label: anonUserLabel,
    set_date: setDate,
    score,
    total_questions: totalQuestions,
  });

  return { anonUserLabel };
}

/**
 * Get stats for anonymous attempts: total count and average score
 */
export async function getAnonymousAttemptStats(): Promise<{
  totalAttempts: number;
  averageScore: number;
  totalQuestionsAnswered: number;
  recentAttempts: Array<{
    anonUserLabel: string;
    setDate: string;
    score: number;
    totalQuestions: number;
    createdAt: Date;
  }>;
}> {
  const all = await db
    .select()
    .from(anonymousAttempts)
    .orderBy(desc(anonymousAttempts.created_at));

  const totalAttempts = all.length;
  const totalQuestionsAnswered = all.reduce((sum, row) => sum + row.total_questions, 0);
  // Average score as mean of (score/total) per attempt (how well they do per attempt)
  const averageScore =
    totalAttempts > 0
      ? all.reduce((sum, row) => sum + row.score / row.total_questions, 0) / totalAttempts
      : 0;

  const recentAttempts = all.slice(0, 50).map((row) => ({
    anonUserLabel: row.anon_user_label,
    setDate: row.set_date,
    score: row.score,
    totalQuestions: row.total_questions,
    createdAt: row.created_at,
  }));

  return {
    totalAttempts,
    averageScore,
    totalQuestionsAnswered,
    recentAttempts,
  };
}
