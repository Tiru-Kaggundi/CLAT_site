"use server";

import { db } from "@/lib/db";
import { questions, questionSets, userResponses, users } from "@/lib/db/schema";
import { eq, and, inArray, sql, ne, gte, lte, desc } from "drizzle-orm";
import { getTodayIST, formatIST, getDateDaysAgo } from "@/lib/utils/date";
import { updateUserStreak } from "@/lib/utils/streak";
import type { QuestionOption, QuestionWithResponse } from "@/types";

/**
 * Get question content strings from the last 3 days (yesterday, 2 days ago, 3 days ago)
 * Used for deduplication - excludes today
 */
export async function getQuestionContentsFromLast3Days(): Promise<string[]> {
  const dates = [
    getDateDaysAgo(1), // yesterday
    getDateDaysAgo(2),
    getDateDaysAgo(3),
  ];

  const sets = await db
    .select({ id: questionSets.id })
    .from(questionSets)
    .where(inArray(questionSets.date, dates));

  if (sets.length === 0) return [];

  const setIds = sets.map((s) => s.id);
  const questionList = await db
    .select({ content: questions.content })
    .from(questions)
    .where(inArray(questions.set_id, setIds));

  return questionList.map((q) => q.content);
}

/**
 * Fetch today's question set without user responses (for anonymous users)
 */
export async function getTodayQuestionsAnonymous(): Promise<{
  questions: Array<{
    id: string;
    content: string;
    options: { a: string; b: string; c: string; d: string };
    correct_option: QuestionOption;
    explanation: string;
    category: string;
  }>;
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

  // Return questions without user responses
  const questionsWithoutResponses = questionList.map((q) => ({
    id: q.id,
    content: q.content,
    options: q.options as { a: string; b: string; c: string; d: string },
    correct_option: q.correct_option as QuestionOption,
    explanation: q.explanation,
    category: q.category,
  }));

  return {
    questions: questionsWithoutResponses,
    setId: set.id,
    date: set.date,
  };
}

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
 * 
 * For historical practice:
 * - First attempt: Save responses and show score
 * - Subsequent attempts: Only update responses if new score > old score
 */
export async function submitQuestionSet(
  userId: string,
  answers: Array<{ questionId: string; selectedOption: QuestionOption; correctOption: QuestionOption }>,
  isHistorical: boolean = false
): Promise<{
  success: boolean;
  score: number;
  totalQuestions: number;
  streakCount: number;
}> {
  try {
    const questionIds = answers.map((a) => a.questionId);
    
    // Check if all questions have already been answered
    const existingResponses = await db
      .select()
      .from(userResponses)
      .where(
        and(
          eq(userResponses.user_id, userId),
          inArray(userResponses.question_id, questionIds)
        )
      );

    // For historical practice: only update if new score is better
    if (isHistorical && existingResponses.length === 10 && questionIds.length === 10) {
      // Calculate current best score from existing responses
      const bestScore = existingResponses.filter((r) => r.is_correct).length;
      
      // Calculate new score from submitted answers
      let newScore = 0;
      for (const answer of answers) {
        if (answer.selectedOption === answer.correctOption) {
          newScore++;
        }
      }
      
      // Only update if new score is better
      if (newScore > bestScore) {
        // Update all responses with new answers
        for (const answer of answers) {
          const isCorrect = answer.selectedOption === answer.correctOption;
          await db
            .update(userResponses)
            .set({
              selected_option: answer.selectedOption,
              is_correct: isCorrect,
              answered_at: new Date(),
            })
            .where(
              and(
                eq(userResponses.user_id, userId),
                eq(userResponses.question_id, answer.questionId)
              )
            );
        }
        
        // Note: Historical practice doesn't update total_score or streak
        // Only update the responses to track the "last time you scored"
        const [updatedUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        return {
          success: true,
          score: newScore,
          totalQuestions: 10,
          streakCount: updatedUser?.streak_count || 0,
        };
      } else {
        // Keep old score - don't update responses
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        return {
          success: true,
          score: bestScore,
          totalQuestions: 10,
          streakCount: user?.streak_count || 0,
        };
      }
    }

    // For today's questions: If all 10 questions already have responses, score is LOCKED - return original score
    if (!isHistorical && existingResponses.length === 10 && questionIds.length === 10) {
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

    // Update user score only with newly correct answers (NOT for historical practice)
    if (newCorrectAnswers > 0 && !isHistorical) {
      await db
        .update(users)
        .set({
          total_score: user.total_score + newCorrectAnswers,
        })
        .where(eq(users.id, userId));
    }

    // Update streak (only if all 10 questions answered for the first time AND NOT historical)
    if (answers.length === 10 && existingResponses.length < 10 && !isHistorical) {
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

/**
 * Get all effort data with user's best scores (no date limit)
 */
export async function getRecentEffort(userId: string): Promise<Array<{
  date: string;
  score: number | null; // null if not attempted
  totalQuestions: number;
}>> {
  try {
    const todayStr = getTodayIST();

    // Get all question sets, ordered by date (newest first)
    const recentSets = await db
      .select({
        id: questionSets.id,
        date: questionSets.date,
      })
      .from(questionSets)
      .where(lte(questionSets.date, todayStr))
      .orderBy(desc(questionSets.date));

    if (recentSets.length === 0) {
      return [];
    }

    // Get all questions for these sets
    const setIds = recentSets.map((s) => s.id);
    const allQuestions = await db
      .select({
        id: questions.id,
        set_id: questions.set_id,
      })
      .from(questions)
      .where(inArray(questions.set_id, setIds));

    // Group questions by set_id
    const questionsBySet = new Map<string, string[]>();
    for (const q of allQuestions) {
      if (!questionsBySet.has(q.set_id)) {
        questionsBySet.set(q.set_id, []);
      }
      questionsBySet.get(q.set_id)!.push(q.id);
    }

    // Get all user responses for these questions
    const allQuestionIds = allQuestions.map((q) => q.id);
    const allResponses = allQuestionIds.length > 0
      ? await db
          .select({
            question_id: userResponses.question_id,
            is_correct: userResponses.is_correct,
          })
          .from(userResponses)
          .where(
            and(
              eq(userResponses.user_id, userId),
              inArray(userResponses.question_id, allQuestionIds)
            )
          )
      : [];

    // Group responses by question_id for quick lookup
    const responsesByQuestion = new Map<string, boolean>();
    for (const r of allResponses) {
      responsesByQuestion.set(r.question_id, r.is_correct);
    }

    // Calculate score for each set
    const result: Array<{ date: string; score: number | null; totalQuestions: number }> = [];

    for (const set of recentSets) {
      const questionIds = questionsBySet.get(set.id) || [];
      const totalQuestions = questionIds.length;

      if (totalQuestions === 0) {
        // No questions for this set
        result.push({
          date: set.date,
          score: null,
          totalQuestions: 0,
        });
        continue;
      }

      // Check if user has attempted all questions
      const attemptedQuestionIds = questionIds.filter((qId) => responsesByQuestion.has(qId));
      const allAttempted = attemptedQuestionIds.length === totalQuestions;

      if (!allAttempted) {
        // Not attempted
        result.push({
          date: set.date,
          score: null,
          totalQuestions,
        });
      } else {
        // Calculate best score (count correct answers)
        const correctCount = attemptedQuestionIds.filter(
          (qId) => responsesByQuestion.get(qId) === true
        ).length;
        result.push({
          date: set.date,
          score: correctCount,
          totalQuestions,
        });
      }
    }

    return result;
  } catch (error) {
    console.error("Error getting recent effort:", error);
    return [];
  }
}
