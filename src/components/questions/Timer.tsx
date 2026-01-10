"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface TimerProps {
  initialSeconds: number;
  onTimeUp?: () => void;
  disabled?: boolean;
}

export function Timer({ initialSeconds, onTimeUp, disabled = false }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (disabled || isExpired) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [disabled, isExpired, onTimeUp]);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getColorClass = () => {
    if (isExpired) return "text-destructive";
    if (seconds <= 60) return "text-orange-500"; // Less than 1 minute - orange
    return "text-foreground";
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Time Remaining:</span>
          <span className={`text-2xl font-bold font-mono ${getColorClass()}`}>
            {formatTime(seconds)}
          </span>
        </div>
        {isExpired && (
          <span className="text-sm text-destructive font-medium">Time's Up!</span>
        )}
      </div>
      {seconds <= 60 && !isExpired && (
        <p className="text-xs text-muted-foreground mt-2">
          Less than a minute remaining. Please submit your answers soon!
        </p>
      )}
    </Card>
  );
}
