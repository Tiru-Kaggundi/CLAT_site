import { getCurrentUser } from "@/server-actions/auth";
import { getRecentEffort } from "@/server-actions/questions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default async function RecentEffortPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const recentEffort = await getRecentEffort(user.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Recent Effort</h1>
        <p className="text-muted-foreground">
          Your performance over the last month
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last 30 Days</CardTitle>
          <CardDescription>
            Your best scores for each day. Click on a date to practice or review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentEffort.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No question sets available for the last month.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Date</th>
                    <th className="text-left p-4 font-semibold">Score</th>
                    <th className="text-left p-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEffort.map((item) => {
                    const dateObj = new Date(item.date + "T00:00:00");
                    const formattedDate = format(dateObj, "MMM d, yyyy");
                    const dayName = format(dateObj, "EEEE");

                    return (
                      <tr key={item.date} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{formattedDate}</div>
                            <div className="text-sm text-muted-foreground">{dayName}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          {item.score !== null ? (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-primary">
                                {item.score}
                              </span>
                              <span className="text-muted-foreground">
                                / {item.totalQuestions}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ({((item.score / item.totalQuestions) * 100).toFixed(0)}%)
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">
                              Not attempted
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <Link href={`/dashboard/${item.date}`}>
                            <Button variant={item.score !== null ? "outline" : "default"} size="sm">
                              {item.score !== null ? "Review" : "Try Now"}
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
