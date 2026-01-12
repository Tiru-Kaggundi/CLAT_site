"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QuestionCard } from "./QuestionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Timer } from "./Timer";
import type { QuestionWithResponse, QuestionOption } from "@/types";
import { submitQuestionSet, getHistoricalAverageScore } from "@/server-actions/questions";

interface QuestionSetProps {
  questions: QuestionWithResponse[];
  onSubmit?: (score: number, total: number, streakCount: number) => void;
  userId: string;
  isHistorical?: boolean;
  previousScore?: { score: number; totalQuestions: number } | null;
  practiceDate?: string;
}

export function QuestionSet({ 
  questions, 
  onSubmit, 
  userId, 
  isHistorical = false,
  previousScore = null,
  practiceDate
}: QuestionSetProps) {
  const router = useRouter();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, QuestionOption>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    totalQuestions: number;
    streakCount: number;
  } | null>(null);
  const [historicalScore, setHistoricalScore] = useState<{
    averageScore: number;
    totalAttempts: number;
  } | null>(null);

  // Fetch historical score when results are available
  useEffect(() => {
    if (results && !isHistorical) {
      getHistoricalAverageScore(userId).then((historical) => {
        setHistoricalScore(historical);
      });
    }
  }, [results, userId, isHistorical]);

  const handleSelectOption = (questionId: string, option: QuestionOption) => {
    if (submitted || timeUp) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleTimeUp = () => {
    setTimeUp(true);
    // Auto-submit when time is up
    if (!submitted && !loading) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (loading || submitted) return;

    // Check if all questions are answered (unless time is up)
    const unanswered = questions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0 && !timeUp) {
      alert(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }

    setLoading(true);

    try {
      // Get all answered questions (when time is up, submit whatever is answered)
      const answers = questions
        .filter((q) => selectedAnswers[q.id]) // Only include questions with answers
        .map((q) => ({
          questionId: q.id,
          selectedOption: selectedAnswers[q.id]!,
          correctOption: q.correct_option,
        }));

      const result = await submitQuestionSet(userId, answers, isHistorical);

      if (result.success) {
        setResults(result);
        setSubmitted(true);
        onSubmit?.(result.score, result.totalQuestions, result.streakCount);
      } else {
        alert("Failed to submit answers. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting answers:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const allAnswered = questions.every((q) => selectedAnswers[q.id]);
  // For historical questions, don't check userResponse - always show clean slate
  const hasExistingResponse = isHistorical ? false : questions[0]?.userResponse;
  const showTimer = !submitted && !hasExistingResponse && !isHistorical;

  return (
    <div>
      {/* Previous Score Indicator for Historical Questions */}
      {isHistorical && previousScore && !submitted && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Last time you scored</p>
              <p className="text-2xl font-bold">
                <span className="text-primary">{previousScore.score}</span>
                <span className="text-muted-foreground"> / {previousScore.totalQuestions}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {showTimer && (
        <Timer
          initialSeconds={10 * 60} // 10 minutes
          onTimeUp={handleTimeUp}
          disabled={submitted}
        />
      )}
      
      {questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          question={question}
          questionNumber={index + 1}
          // For historical questions, never pre-select answers (clean slate)
          selectedOption={isHistorical ? selectedAnswers[question.id] : (selectedAnswers[question.id] || question.userResponse?.selected_option)}
          onSelectOption={(option) => handleSelectOption(question.id, option)}
          // For historical questions, only show answers after submission
          showAnswer={isHistorical ? submitted : (submitted || !!question.userResponse)}
          disabled={isHistorical ? submitted : (submitted || !!question.userResponse)}
        />
      ))}

      {!submitted && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={handleSubmit}
            disabled={(!allAnswered && !timeUp) || loading}
            size="lg"
            className="min-w-[200px]"
          >
            {loading ? "Evaluating answers..." : timeUp ? "Evaluating answers..." : "Submit Answers"}
          </Button>
        </div>
      )}

      {results && (
        <div className="mt-6 p-6 bg-muted rounded-lg">
          <h3 className="text-2xl font-bold mb-4 text-center">Results</h3>
          
          <div className="space-y-4">
            {/* Historical Practice Results */}
            {isHistorical && (
              <>
                {/* First Attempt - Show current score only */}
                {!previousScore && (
                  <div className="text-center p-4 bg-background rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Your score</p>
                    <p className="text-2xl font-bold">
                      <span className="text-primary">{results.score}</span>
                      <span className="text-muted-foreground"> / {results.totalQuestions}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      This score has been saved. Try again to improve!
                    </p>
                  </div>
                )}

                {/* Subsequent Attempts - Show comparison */}
                {previousScore && (
                  <>
                    {/* Previous Score */}
                    <div className="text-center p-4 bg-background rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Last time you scored</p>
                      <p className="text-xl font-bold">
                        <span className="text-muted-foreground">{previousScore.score}</span>
                        <span className="text-muted-foreground"> / {previousScore.totalQuestions}</span>
                      </p>
                    </div>

                    {/* This Time Score */}
                    <div className="text-center p-4 bg-background rounded-lg border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-1">This time you scored</p>
                      <p className="text-2xl font-bold">
                        <span className="text-primary">{results.score}</span>
                        <span className="text-muted-foreground"> / {results.totalQuestions}</span>
                      </p>
                    </div>

                    {/* Congratulations if improved */}
                    {results.score > previousScore.score && (
                      <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">
                          🎉 Congratulations! 🎉
                        </p>
                        <p className="text-sm text-muted-foreground">
                          You improved by {results.score - previousScore.score} point{results.score - previousScore.score === 1 ? '' : 's'}! This is now your best score for this date.
                        </p>
                      </div>
                    )}

                    {/* Same score message */}
                    {results.score === previousScore.score && (
                      <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          You scored the same as last time. Keep practicing to improve!
                        </p>
                      </div>
                    )}

                    {/* Lower score message */}
                    {results.score < previousScore.score && (
                      <div className="text-center p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Your score was {previousScore.score - results.score} point{previousScore.score - results.score === 1 ? '' : 's'} lower this time. Your best score ({previousScore.score}/{previousScore.totalQuestions}) has been kept. Don't give up, keep practicing!
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Today's Score (non-historical) */}
            {!isHistorical && (
              <div className="space-y-3">
                <div className="text-center p-4 bg-background rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Today's Score</p>
                  <p className="text-2xl font-bold">
                    <span className="text-primary">{results.score}</span>
                    <span className="text-muted-foreground"> / {results.totalQuestions}</span>
                  </p>
                </div>
                {/* Practice Again Option */}
                {results.score < results.totalQuestions && (
                  <div className="text-center">
                    <Button
                      onClick={() => router.push("/dashboard")}
                      variant="outline"
                      className="min-w-[200px]"
                    >
                      Practice Again to Improve
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Historical Average Score */}
            {!isHistorical && historicalScore && historicalScore.totalAttempts > 0 && (
              <Link href="/dashboard/recent-effort" className="block">
                <div className="text-center p-4 bg-background rounded-lg border hover:border-primary transition-colors cursor-pointer">
                  <p className="text-sm text-muted-foreground mb-1">
                    Historical Average ({historicalScore.totalAttempts} {historicalScore.totalAttempts === 1 ? 'attempt' : 'attempts'})
                  </p>
                  <p className="text-2xl font-bold">
                    <span className="text-primary">{historicalScore.averageScore.toFixed(1)}</span>
                    <span className="text-muted-foreground"> / 10</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 italic">Click to view recent effort</p>
                </div>
              </Link>
            )}

            {/* Streak */}
            {!isHistorical && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Current streak: <span className="font-semibold text-foreground">{results.streakCount} days</span>
                </p>
              </div>
            )}
          </div>

          {/* Navigation button */}
          {!isHistorical && (
            <div className="mt-6 flex justify-center">
              <Link href="/dashboard">
                <Button
                  variant="default"
                  className="min-w-[200px]"
                >
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
