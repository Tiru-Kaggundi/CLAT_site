import { getCurrentUser } from "@/server-actions/auth";
import { getQuestionsByDate, getPreviousScoreForDate } from "@/server-actions/questions";
import { QuestionSet } from "@/components/questions/QuestionSet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

interface HistoricalPageProps {
  params: Promise<{ date: string }>;
}

export default async function HistoricalPage({ params }: HistoricalPageProps) {
  const { date } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const [questionData, previousScore] = await Promise.all([
    getQuestionsByDate(user.id, date),
    getPreviousScoreForDate(user.id, date),
  ]);

  if (!questionData) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Questions for {date}</h1>
        <p className="text-muted-foreground">
          Practice questions from this date. This won't affect your current streak.
        </p>
      </div>

      <QuestionSet
        questions={questionData.questions}
        userId={user.id}
        isHistorical={true}
        previousScore={previousScore}
        practiceDate={date}
      />
    </div>
  );
}
