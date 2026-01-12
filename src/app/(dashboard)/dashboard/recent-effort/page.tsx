import { getCurrentUser } from "@/server-actions/auth";
import { getRecentEffort } from "@/server-actions/questions";
import { RecentEffortClient } from "./RecentEffortClient";

export default async function RecentEffortPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const recentEffort = await getRecentEffort(user.id);

  return <RecentEffortClient recentEffort={recentEffort} />;
}
