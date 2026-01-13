import { getTodayQuestionsAnonymous } from "@/server-actions/questions";
import { AnonymousQuestionSet } from "@/components/questions/AnonymousQuestionSet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Force dynamic rendering to always fetch latest questions
export const dynamic = 'force-dynamic';

export default async function AnonymousPracticePage() {
  const questionData = await getTodayQuestionsAnonymous();

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex flex-col">
            <span className="text-2xl font-bold">GK Daily Scan</span>
            <span className="text-xs text-muted-foreground">AI powered top 10 questions for competitions</span>
          </Link>
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Today's Questions</h1>
          <p className="text-muted-foreground">
            Try today's 10 questions without signing up. Sign in to track your progress and practice historical questions!
          </p>
        </div>

      {questionData ? (
        <AnonymousQuestionSet
          questions={questionData.questions}
          setId={questionData.setId}
          date={questionData.date}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Questions Available</CardTitle>
            <CardDescription>
              Today's question set hasn't been generated yet. Check back later!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Questions are generated daily at 5:00 AM IST.
              </p>
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      </main>
    </div>
  );
}
