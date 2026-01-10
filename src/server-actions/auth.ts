"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get current user from Supabase session
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string) {
            cookieStore.delete(name);
          },
        },
      }
    );

    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Error getting user from Supabase:", authError);
      return null;
    }

    if (!supabaseUser) {
      return null;
    }

    // Check if user exists in our database, create if not
    try {
      const [dbUser] = await db.select().from(users).where(eq(users.email, supabaseUser.email!)).limit(1);

      if (!dbUser) {
        // Create user in database
        const [newUser] = await db
          .insert(users)
          .values({
            email: supabaseUser.email!,
          })
          .returning();

        return newUser;
      }

      return dbUser;
    } catch (dbError) {
      console.error("Database error in getCurrentUser:", dbError);
      // Return null if database operation fails - user can retry
      return null;
    }
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}
