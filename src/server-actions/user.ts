"use server";

import { db } from "@/lib/db";
import { users, userResponses, questions, questionSets } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

/**
 * Get user stats
 */
export async function getUserStats(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    return null;
  }

  // Calculate total questions answered and correct answers
  const responses = await db
    .select({
      total: sql<number>`count(*)::int`,
      correct: sql<number>`sum(case when ${userResponses.is_correct} then 1 else 0 end)::int`,
    })
    .from(userResponses)
    .where(eq(userResponses.user_id, userId));

  const totalQuestions = responses[0]?.total || 0;
  const correctAnswers = responses[0]?.correct || 0;
  
  const accuracy =
    totalQuestions > 0
      ? (correctAnswers / totalQuestions) * 100
      : 0;

  return {
    streakCount: user.streak_count,
    totalScore: correctAnswers, // Correct answers
    totalQuestions: totalQuestions, // Total questions answered
    accuracy: Math.round(accuracy * 100) / 100,
    lastActiveDate: user.last_active_date,
  };
}

/**
 * Get list of dates user has completed
 */
export async function getCompletedDates(userId: string): Promise<string[]> {
  // Get all question IDs the user has answered
  const userQuestionIds = await db
    .selectDistinct({ question_id: userResponses.question_id })
    .from(userResponses)
    .where(eq(userResponses.user_id, userId));

  if (userQuestionIds.length === 0) {
    return [];
  }

  const qIds = userQuestionIds.map((q) => q.question_id).filter((id): id is string => !!id);

  // Get set IDs from questions
  const questionSetIds = await db
    .selectDistinct({ set_id: questions.set_id })
    .from(questions)
    .where(inArray(questions.id, qIds));

  if (questionSetIds.length === 0) {
    return [];
  }

  const setIds = questionSetIds.map((s) => s.set_id).filter((id): id is string => !!id);

  // Get dates from question sets
  const sets = await db
    .selectDistinct({ date: questionSets.date })
    .from(questionSets)
    .where(inArray(questionSets.id, setIds));

  return sets.map((s) => s.date).filter((d): d is string => !!d);
}
