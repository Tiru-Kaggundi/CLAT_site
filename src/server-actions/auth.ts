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
        remove(name: string, options: any) {
          cookieStore.delete(name);
        },
      },
    }
  );

  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return null;
  }

  // Check if user exists in our database, create if not
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
}
