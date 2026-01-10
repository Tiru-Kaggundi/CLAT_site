import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">GK Daily Scan</h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-4xl font-bold mb-4">
              Top 10 Questions for CLAT/UPSC/competitive exams
            </h2>
            <p className="text-xl text-muted-foreground">
              AI-powered daily MCQs based on the latest news and static GK
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Daily Questions</CardTitle>
                <CardDescription>
                  10 fresh MCQs every day from the last 72 hours of news
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Track Your Progress</CardTitle>
                <CardDescription>
                  Build streaks and monitor your improvement over time
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Historical Practice</CardTitle>
                <CardDescription>
                  Practice questions from any previous date
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-12">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
