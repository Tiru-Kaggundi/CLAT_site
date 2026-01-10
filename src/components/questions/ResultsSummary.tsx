"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultsSummaryProps {
  score: number;
  total: number;
  streakCount?: number;
}

export function ResultsSummary({ score, total, streakCount }: ResultsSummaryProps) {
  const percentage = Math.round((score / total) * 100);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Your Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-bold">
              {score} / {total}
            </p>
            <p className="text-sm text-muted-foreground">{percentage}% Correct</p>
          </div>
          {streakCount !== undefined && (
            <div>
              <p className="text-lg font-semibold">Current Streak</p>
              <p className="text-2xl font-bold text-primary">{streakCount} days</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
