import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hoursDifferenceIST } from "./date";

/**
 * Update user streak based on flexible 48-hour grace period
 * - If completion is within 48 hours of last completion: increment streak
 * - If gap exceeds 48 hours: reset streak to 1
 */
export async function updateUserStreak(
  userId: string,
  completedAt: Date
): Promise<{ streakCount: number; isNewStreak: boolean }> {
  // Fetch user's current data
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  let newStreakCount: number;
  let isNewStreak = false;

  if (!user.last_completed_at) {
    // First time completing a set
    newStreakCount = 1;
    isNewStreak = true;
  } else {
    // Calculate hours difference in IST
    const hoursDiff = hoursDifferenceIST(new Date(user.last_completed_at), completedAt);

    if (hoursDiff < 48) {
      // Within grace period: increment streak
      newStreakCount = user.streak_count + 1;
      isNewStreak = true;
    } else {
      // Beyond grace period: reset to 1
      newStreakCount = 1;
      isNewStreak = true;
    }
  }

  // Update user record
  await db
    .update(users)
    .set({
      streak_count: newStreakCount,
      last_completed_at: completedAt,
      last_active_date: completedAt.toISOString().split("T")[0], // YYYY-MM-DD
    })
    .where(eq(users.id, userId));

  return { streakCount: newStreakCount, isNewStreak };
}
