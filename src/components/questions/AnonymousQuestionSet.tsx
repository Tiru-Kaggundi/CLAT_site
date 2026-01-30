"use client";

import { useState } from "react";
import Link from "next/link";
import { QuestionCard } from "./QuestionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Timer } from "./Timer";
import { recordAnonymousAttempt } from "@/server-actions/anonymous";
import type { QuestionOption } from "@/types";

interface AnonymousQuestion {
  id: string;
  content: string;
  options: { a: string; b: string; c: string; d: string };
  correct_option: QuestionOption;
  explanation: string;
  category: string;
}

interface AnonymousQuestionSetProps {
  questions: AnonymousQuestion[];
  setId: string;
  date: string;
}

export function AnonymousQuestionSet({ 
  questions, 
  setId,
  date
}: AnonymousQuestionSetProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, QuestionOption>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    totalQuestions: number;
  } | null>(null);

  const handleSelectOption = (questionId: string, option: QuestionOption) => {
    if (submitted || timeUp) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleTimeUp = () => {
    setTimeUp(true);
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
      // Calculate score locally (no server submission for anonymous users)
      let correctCount = 0;
      questions.forEach((q) => {
        if (selectedAnswers[q.id] === q.correct_option) {
          correctCount++;
        }
      });

      // Record anonymous attempt for stats (anon_user_1, anon_user_2, ...)
      await recordAnonymousAttempt(date, correctCount, questions.length);

      setResults({
        score: correctCount,
        totalQuestions: questions.length,
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error calculating score:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const allAnswered = questions.every((q) => selectedAnswers[q.id]);
  const showTimer = !submitted;

  return (
    <div>
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
          question={{
            ...question,
            set_id: setId,
            created_at: new Date(), // Anonymous questions don't have a real created_at, use current date
            userResponse: undefined, // No user response for anonymous
          }}
          questionNumber={index + 1}
          selectedOption={selectedAnswers[question.id]}
          onSelectOption={(option) => handleSelectOption(question.id, option)}
          showAnswer={submitted}
          disabled={submitted}
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
            {/* Score Display */}
            <div className="text-center p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Your Score</p>
              <p className="text-2xl font-bold">
                <span className="text-primary">{results.score}</span>
                <span className="text-muted-foreground"> / {results.totalQuestions}</span>
              </p>
              <p className="text-lg font-semibold text-primary mt-2">
                {((results.score / results.totalQuestions) * 100).toFixed(1)}%
              </p>
            </div>

            {/* Signup Encouragement */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Want to improve your score?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sign up to practice questions from previous days, track your progress, build streaks, and see how you compare over time!
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/login">
                      <Button className="w-full sm:w-auto">
                        Sign Up / Login
                      </Button>
                    </Link>
                    <Link href="/">
                      <Button variant="outline" className="w-full sm:w-auto">
                        Back to Home
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
