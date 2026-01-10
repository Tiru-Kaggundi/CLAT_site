import { getCurrentUser } from "@/server-actions/auth";
import { getTodayQuestions, getTodayScore } from "@/server-actions/questions";
import { getUserStats } from "@/server-actions/user";
import { QuestionSet } from "@/components/questions/QuestionSet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/dashboard/DatePicker";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const questionData = await getTodayQuestions(user.id);
  
  // Check if all questions are answered
  const allQuestionsAnswered = questionData?.questions.every((q) => q.userResponse) ?? false;
  
  // If all answered, show clean results view
  if (allQuestionsAnswered && questionData) {
    const [todayScore, userStats] = await Promise.all([
      getTodayScore(user.id),
      getUserStats(user.id),
    ]);

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Your performance summary
          </p>
        </div>

        <div className="space-y-6">
          {/* Total Score */}
          {userStats && userStats.totalQuestions > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Total Score</CardTitle>
                <CardDescription>
                  Your cumulative score across all attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold mb-2">
                    <span className="text-primary">{userStats.totalScore}</span>
                    <span className="text-muted-foreground"> / {userStats.totalQuestions}</span>
                  </p>
                  <p className="text-lg font-semibold text-primary mb-1">
                    {((userStats.totalScore / userStats.totalQuestions) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current streak: <span className="font-semibold text-foreground">{userStats.streakCount} days</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Score */}
          {todayScore && (
            <Card>
              <CardHeader>
                <CardTitle>Today's Score</CardTitle>
                <CardDescription>
                  Your performance for today's questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold mb-2">
                    <span className="text-primary">{todayScore.score}</span>
                    <span className="text-muted-foreground"> / {todayScore.totalQuestions}</span>
                  </p>
                  <p className="text-lg font-semibold text-primary mb-1">
                    {((todayScore.score / todayScore.totalQuestions) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current streak: <span className="font-semibold text-foreground">{todayScore.streakCount} days</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* See Recent Effort */}
          <Card>
            <CardHeader>
              <CardTitle>See my recent effort</CardTitle>
              <CardDescription>
                View your performance over the last month with best scores for each day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/recent-effort">
                <Button variant="outline" className="w-full sm:w-auto">
                  View Recent Effort
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Practice More Link */}
          <Card>
            <CardHeader>
              <CardTitle>Want to practice more?</CardTitle>
              <CardDescription>
                Practice questions from previous dates to improve your knowledge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/historical">
                <Button variant="outline" className="w-full sm:w-auto">
                  Practice Historical Questions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show questions if not all answered or no questions available
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Today's Questions</h1>
        <p className="text-muted-foreground">
          Complete all 10 questions to maintain your streak!
        </p>
      </div>

      {questionData ? (
        <QuestionSet
          questions={questionData.questions}
          userId={user.id}
          isHistorical={false}
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
                Questions are generated daily at 8:00 AM IST. You can also practice
                questions from previous dates.
              </p>
              <Link href="/dashboard/historical">
                <Button variant="outline">Practice Historical Questions</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
