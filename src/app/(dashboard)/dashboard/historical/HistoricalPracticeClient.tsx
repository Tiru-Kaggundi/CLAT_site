"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/dashboard/DatePicker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTodayIST } from "@/lib/utils/date";

interface HistoricalPracticeClientProps {
  earliestDate: string | null;
}

export function HistoricalPracticeClient({ earliestDate }: HistoricalPracticeClientProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = getTodayIST();

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleStartPractice = () => {
    if (selectedDate) {
      router.push(`/dashboard/${selectedDate}`);
    }
  };

  // Set minimum date to earliest question set date, or today if no questions exist yet
  const minDate = earliestDate 
    ? new Date(earliestDate + "T00:00:00")
    : new Date(today + "T00:00:00");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Historical Practice</h1>
        <p className="text-muted-foreground">
          Select a date to practice questions from that day
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
          <CardDescription>
            {earliestDate 
              ? `Choose any date from ${earliestDate} to today (${today}) to practice questions`
              : `No historical questions available yet. Questions will be available after the first daily generation.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DatePicker
            onDateSelect={handleDateSelect}
            minDate={minDate}
            maxDate={new Date(today + "T00:00:00")}
          />
          <Button
            onClick={handleStartPractice}
            disabled={!selectedDate}
            className="w-full"
          >
            Start Practice
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
