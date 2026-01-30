import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server-actions/auth";
import { Navbar } from "@/components/layout/Navbar";

// All dashboard routes use cookies (auth) and/or DB — must be dynamic, not statically prerendered
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
