"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface StreakDisplayProps {
  streakCount: number;
}

export function StreakDisplay({ streakCount }: StreakDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Current Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold text-primary">{streakCount}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {streakCount === 1 ? "day" : "days"} in a row
        </p>
      </CardContent>
    </Card>
  );
}
