"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QuestionWithResponse, QuestionOption } from "@/types";

interface QuestionCardProps {
  question: QuestionWithResponse;
  questionNumber: number;
  selectedOption?: QuestionOption;
  onSelectOption?: (option: QuestionOption) => void;
  showAnswer?: boolean;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  selectedOption,
  onSelectOption,
  showAnswer = false,
  disabled = false,
}: QuestionCardProps) {
  const options = ["a", "b", "c", "d"] as const;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">
          Question {questionNumber}: {question.category.replace("_", " ").toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-base font-medium">{question.content}</p>
        <div className="space-y-2">
          {options.map((option) => {
            const optionText = question.options[option];
            const isSelected = selectedOption === option;
            const isCorrect = question.correct_option === option;
            const isUserCorrect = showAnswer && isSelected && isCorrect;
            const isUserIncorrect = showAnswer && isSelected && !isCorrect;

            return (
              <button
                key={option}
                onClick={() => !disabled && onSelectOption?.(option)}
                disabled={disabled}
                className={cn(
                  "w-full text-left p-3 rounded-md border-2 transition-colors",
                  isSelected && !showAnswer && "border-primary bg-primary/10",
                  isUserCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                  isUserIncorrect && "border-red-500 bg-red-50 dark:bg-red-950",
                  showAnswer && isCorrect && !isSelected && "border-green-300 bg-green-50/50 dark:bg-green-950/50",
                  !disabled && "hover:bg-accent cursor-pointer",
                  disabled && "cursor-not-allowed opacity-70"
                )}
              >
                <span className="font-semibold mr-2">{option.toUpperCase()}.</span>
                {optionText}
              </button>
            );
          })}
        </div>
        {showAnswer && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm font-semibold mb-1">Explanation:</p>
            <p className="text-sm">{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
