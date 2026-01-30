import { getAnonymousAttemptStats } from "@/server-actions/anonymous";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default async function AnonymousStatsPage() {
  const stats = await getAnonymousAttemptStats();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Anonymous Attempts</h1>
        <p className="text-muted-foreground">
          Count and performance of users who try without logging in
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Attempts</CardTitle>
            <CardDescription>Number of anonymous users who completed a set</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{stats.totalAttempts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Score</CardTitle>
            <CardDescription>How well anonymous users do (score per attempt)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              {(stats.averageScore * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.totalQuestionsAnswered} total questions answered
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attempts</CardTitle>
          <CardDescription>
            Last 50 attempts (anon_user_1, anon_user_2, …)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentAttempts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No anonymous attempts yet.</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold">Label</th>
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Score</th>
                    <th className="text-left p-3 font-semibold">Attempted at</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAttempts.map((row) => (
                    <tr key={row.anonUserLabel + row.setDate + row.createdAt.toISOString()} className="border-b">
                      <td className="p-3 font-mono text-sm">{row.anonUserLabel}</td>
                      <td className="p-3">{row.setDate}</td>
                      <td className="p-3">
                        <span className="font-bold text-primary">{row.score}</span>
                        <span className="text-muted-foreground"> / {row.totalQuestions}</span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {format(row.createdAt, "MMM d, yyyy HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-4">
        <Link href="/dashboard/admin/generate">
          <Button variant="outline">Back to Admin</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
