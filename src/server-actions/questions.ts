"use server";

import { db } from "@/lib/db";
import { questions, questionSets, userResponses, users } from "@/lib/db/schema";
import { eq, and, inArray, sql, ne } from "drizzle-orm";
import { getTodayIST } from "@/lib/utils/date";
import { updateUserStreak } from "@/lib/utils/streak";
import type { QuestionOption, QuestionWithResponse } from "@/types";

/**
 * Fetch today's question set with user responses (if any)
 */
export async function getTodayQuestions(userId: string): Promise<{
  questions: QuestionWithResponse[];
  setId: string;
  date: string;
} | null> {
  const today = getTodayIST();

  // Find today's question set
  const [set] = await db
    .select()
    .from(questionSets)
    .where(eq(questionSets.date, today))
    .limit(1);

  if (!set) {
    return null;
  }

  // Fetch all questions for this set
  const questionList = await db
    .select()
    .from(questions)
    .where(eq(questions.set_id, set.id))
    .orderBy(questions.created_at);

  // Fetch user responses for these questions
  const questionIds = questionList.map((q) => q.id);
  const responses = questionIds.length > 0
    ? await db
        .select()
        .from(userResponses)
        .where(
          and(
            eq(userResponses.user_id, userId),
            inArray(userResponses.question_id, questionIds)
          )
        )
    : [];

  // Create a map of question_id -> response
  const responseMap = new Map(
    responses.map((r) => [r.question_id, { selected_option: r.selected_option as QuestionOption, is_correct: r.is_correct }])
  );

  // Combine questions with responses
  const questionsWithResponses: QuestionWithResponse[] = questionList.map((q) => ({
    ...q,
    options: q.options as { a: string; b: string; c: string; d: string },
    correct_option: q.correct_option as QuestionOption,
    userResponse: responseMap.get(q.id),
  }));

  return {
    questions: questionsWithResponses,
    setId: set.id,
    date: set.date,
  };
}

/**
 * Fetch question set for a specific date
 */
export async function getQuestionsByDate(
  userId: string,
  date: string
): Promise<{
  questions: QuestionWithResponse[];
  setId: string;
  date: string;
} | null> {
  // Find question set for the date
  const [set] = await db
    .select()
    .from(questionSets)
    .where(eq(questionSets.date, date))
    .limit(1);

  if (!set) {
    return null;
  }

  // Fetch all questions for this set
  const questionList = await db
    .select()
    .from(questions)
    .where(eq(questions.set_id, set.id))
    .orderBy(questions.created_at);

  // Fetch user responses
  const questionIds = questionList.map((q) => q.id);
  const responses = questionIds.length > 0
    ? await db
        .select()
        .from(userResponses)
        .where(
          and(
            eq(userResponses.user_id, userId),
            inArray(userResponses.question_id, questionIds)
          )
        )
    : [];

  const responseMap = new Map(
    responses.map((r) => [r.question_id, { selected_option: r.selected_option as QuestionOption, is_correct: r.is_correct }])
  );

  const questionsWithResponses: QuestionWithResponse[] = questionList.map((q) => ({
    ...q,
    options: q.options as { a: string; b: string; c: string; d: string },
    correct_option: q.correct_option as QuestionOption,
    userResponse: responseMap.get(q.id),
  }));

  return {
    questions: questionsWithResponses,
    setId: set.id,
    date: set.date,
  };
}

/**
 * Submit answers for a question set
 */
export async function submitAnswers(
  userId: string,
  questionId: string,
  selectedOption: QuestionOption,
  correctOption: QuestionOption
): Promise<{ success: boolean; isCorrect: boolean }> {
  const isCorrect = selectedOption === correctOption;

  try {
    // Check if response already exists
    const existing = await db
      .select()
      .from(userResponses)
      .where(
        and(
          eq(userResponses.user_id, userId),
          eq(userResponses.question_id, questionId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing response
      await db
        .update(userResponses)
        .set({
          selected_option: selectedOption,
          is_correct: isCorrect,
          answered_at: new Date(),
        })
        .where(
          and(
            eq(userResponses.user_id, userId),
            eq(userResponses.question_id, questionId)
          )
        );
    } else {
      // Insert new response
      await db.insert(userResponses).values({
        user_id: userId,
        question_id: questionId,
        selected_option: selectedOption,
        is_correct: isCorrect,
      });
    }

    return { success: true, isCorrect };
  } catch (error) {
    console.error("Error submitting answer:", error);
    return { success: false, isCorrect: false };
  }
}

/**
 * Submit all answers for a question set and update streak
 * IMPORTANT: If all 10 questions in the set have already been answered, 
 * the score is LOCKED and returns the original score without updating.
 */
export async function submitQuestionSet(
  userId: string,
  answers: Array<{ questionId: string; selectedOption: QuestionOption; correctOption: QuestionOption }>
): Promise<{
  success: boolean;
  score: number;
  totalQuestions: number;
  streakCount: number;
}> {
  try {
    const questionIds = answers.map((a) => a.questionId);
    
    // Check if all questions have already been answered (score is locked)
    const existingResponses = await db
      .select()
      .from(userResponses)
      .where(
        and(
          eq(userResponses.user_id, userId),
          inArray(userResponses.question_id, questionIds)
        )
      );

    // If all 10 questions already have responses, score is LOCKED - return original score
    if (existingResponses.length === 10 && questionIds.length === 10) {
      const originalCorrectCount = existingResponses.filter((r) => r.is_correct).length;
      
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user) {
        return {
          success: false,
          score: 0,
          totalQuestions: 10,
          streakCount: 0,
        };
      }

      // Return original locked score without any updates
      return {
        success: true,
        score: originalCorrectCount,
        totalQuestions: 10,
        streakCount: user.streak_count,
      };
    }

    // First-time or partial submission - proceed normally
    let correctCount = 0;
    let newCorrectAnswers = 0; // Track only newly correct answers for score update

    // Submit all answers
    for (const answer of answers) {
      const existingResponse = existingResponses.find((r) => r.question_id === answer.questionId);
      const wasAlreadyAnswered = !!existingResponse;
      const wasAlreadyCorrect = existingResponse?.is_correct ?? false;
      
      const result = await submitAnswers(
        userId,
        answer.questionId,
        answer.selectedOption,
        answer.correctOption
      );
      
      if (result.isCorrect) {
        correctCount++;
        // Only count as new correct answer if it wasn't already correct
        if (!wasAlreadyCorrect) {
          newCorrectAnswers++;
        }
      }
    }

    // Fetch user
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user) {
      return {
        success: false,
        score: 0,
        totalQuestions: answers.length,
        streakCount: 0,
      };
    }

    // Update user score only with newly correct answers
    if (newCorrectAnswers > 0) {
      await db
        .update(users)
        .set({
          total_score: user.total_score + newCorrectAnswers,
        })
        .where(eq(users.id, userId));
    }

    // Update streak (only if all 10 questions answered for the first time)
    if (answers.length === 10 && existingResponses.length < 10) {
      const { streakCount } = await updateUserStreak(userId, new Date());
      return {
        success: true,
        score: correctCount,
        totalQuestions: 10,
        streakCount,
      };
    }

    // Return with current streak
    return {
      success: true,
      score: correctCount,
      totalQuestions: answers.length,
      streakCount: user.streak_count,
    };
  } catch (error) {
    console.error("Error submitting question set:", error);
    return {
      success: false,
      score: 0,
      totalQuestions: answers.length,
      streakCount: 0,
    };
  }
}

/**
 * Get today's score for a user
 */
export async function getTodayScore(userId: string): Promise<{
  score: number;
  totalQuestions: number;
  streakCount: number;
} | null> {
  try {
    const today = getTodayIST();

    // Find today's question set
    const [set] = await db
      .select()
      .from(questionSets)
      .where(eq(questionSets.date, today))
      .limit(1);

    if (!set) {
      return null;
    }

    // Get all questions for this set
    const questionList = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.set_id, set.id));

    if (questionList.length === 0) {
      return null;
    }

    const questionIds = questionList.map((q) => q.id);

    // Get user responses for today's questions
    const responses = await db
      .select()
      .from(userResponses)
      .where(
        and(
          eq(userResponses.user_id, userId),
          inArray(userResponses.question_id, questionIds)
        )
      );

    // Check if all questions are answered
    if (responses.length < questionIds.length) {
      return null; // Not all questions answered yet
    }

    // Calculate score
    const correctCount = responses.filter((r) => r.is_correct).length;

    // Get user for streak
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return null;
    }

    return {
      score: correctCount,
      totalQuestions: questionIds.length,
      streakCount: user.streak_count,
    };
  } catch (error) {
    console.error("Error getting today's score:", error);
    return null;
  }
}

/**
 * Get the earliest question set date (first date when questions were generated)
 */
export async function getEarliestQuestionSetDate(): Promise<string | null> {
  try {
    const [earliestSet] = await db
      .select({ date: questionSets.date })
      .from(questionSets)
      .orderBy(questionSets.date)
      .limit(1);

    return earliestSet?.date || null;
  } catch (error) {
    console.error("Error getting earliest question set date:", error);
    return null;
  }
}

/**
 * Get previous score for a specific date (for historical practice)
 */
export async function getPreviousScoreForDate(
  userId: string,
  date: string
): Promise<{
  score: number;
  totalQuestions: number;
} | null> {
  try {
    // Find question set for the date
    const [set] = await db
      .select()
      .from(questionSets)
      .where(eq(questionSets.date, date))
      .limit(1);

    if (!set) {
      return null;
    }

    // Get all questions for this set
    const questionList = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.set_id, set.id));

    if (questionList.length === 0) {
      return null;
    }

    const questionIds = questionList.map((q) => q.id);

    // Get user responses for this date's questions
    const responses = await db
      .select()
      .from(userResponses)
      .where(
        and(
          eq(userResponses.user_id, userId),
          inArray(userResponses.question_id, questionIds)
        )
      );

    // Check if all questions were answered previously
    if (responses.length < questionIds.length) {
      return null; // Not all questions were answered before
    }

    // Calculate previous score
    const correctCount = responses.filter((r) => r.is_correct).length;

    return {
      score: correctCount,
      totalQuestions: questionIds.length,
    };
  } catch (error) {
    console.error("Error getting previous score for date:", error);
    return null;
  }
}

/**
 * Get historical average score for a user (excluding today)
 * Returns average score out of 10 for all previous attempts
 */
export async function getHistoricalAverageScore(userId: string): Promise<{
  averageScore: number;
  totalAttempts: number;
}> {
  try {
    const today = getTodayIST();

    // Get all user responses with their question set dates (excluding today)
    const responsesWithSets = await db
      .select({
        questionId: userResponses.question_id,
        isCorrect: userResponses.is_correct,
        setDate: questionSets.date,
        setId: questionSets.id,
      })
      .from(userResponses)
      .innerJoin(questions, eq(questions.id, userResponses.question_id))
      .innerJoin(questionSets, eq(questionSets.id, questions.set_id))
      .where(
        and(
          eq(userResponses.user_id, userId),
          ne(questionSets.date, today)
        )
      );

    if (responsesWithSets.length === 0) {
      return {
        averageScore: 0,
        totalAttempts: 0,
      };
    }

    // Group responses by set ID and calculate scores
    const setScores = new Map<string, { correct: number; total: number }>();

    for (const response of responsesWithSets) {
      const setId = response.setId;
      if (!setScores.has(setId)) {
        setScores.set(setId, { correct: 0, total: 0 });
      }
      const score = setScores.get(setId)!;
      score.total++;
      if (response.isCorrect) {
        score.correct++;
      }
    }

    // Filter to only sets with 10 questions (complete sets) and calculate average
    const validScores: number[] = [];
    for (const [setId, score] of setScores.entries()) {
      if (score.total === 10) {
        validScores.push(score.correct);
      }
    }

    if (validScores.length === 0) {
      return {
        averageScore: 0,
        totalAttempts: 0,
      };
    }

    const sum = validScores.reduce((acc, score) => acc + score, 0);
    const averageScore = sum / validScores.length;

    return {
      averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal place
      totalAttempts: validScores.length,
    };
  } catch (error) {
    console.error("Error calculating historical average score:", error);
    return {
      averageScore: 0,
      totalAttempts: 0,
    };
  }
}
