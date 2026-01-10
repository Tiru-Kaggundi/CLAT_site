import { getCurrentUser } from "@/server-actions/auth";
import { getUserStats } from "@/server-actions/user";
import { StreakDisplay } from "@/components/dashboard/StreakDisplay";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const stats = await getUserStats(user.id);

  if (!stats) {
    return (
      <div>
        <p>Unable to load stats. Please try again later.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
        <p className="text-muted-foreground">Track your progress and achievements</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StreakDisplay streakCount={stats.streakCount} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold mb-1">
                <span className="text-primary">{stats.totalScore}</span>
                <span className="text-muted-foreground"> / {stats.totalQuestions}</span>
              </p>
              <p className="text-lg font-semibold text-primary mb-1">
                {stats.totalQuestions > 0 ? ((stats.totalScore / stats.totalQuestions) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Points earned from correct answers</p>
            </div>
          </CardContent>
        </Card>
        <StatsCard
          title="Accuracy"
          value={`${stats.accuracy}%`}
          description="Percentage of correct answers"
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <span className="font-semibold">Email:</span> {user.email}
            </p>
            <p>
              <span className="font-semibold">Member since:</span>{" "}
              {new Date(user.created_at).toLocaleDateString()}
            </p>
            {stats.lastActiveDate && (
              <p>
                <span className="font-semibold">Last active:</span>{" "}
                {new Date(stats.lastActiveDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
