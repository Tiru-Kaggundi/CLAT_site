"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/auth/supabase-client-client";
import { useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex flex-col">
          <span className="text-2xl font-bold">GK Daily Scan</span>
          <span className="text-xs text-muted-foreground">AI powered top 10 questions for competitions</span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost">Profile</Button>
          </Link>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}
