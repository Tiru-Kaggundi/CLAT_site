"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GenerateQuestionsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": process.env.NEXT_PUBLIC_CRON_SECRET || "",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate questions");
      }

      setResult(`Success! Generated ${data.questionCount || 10} questions for ${data.date || "today"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Generate Questions</h1>
        <p className="text-muted-foreground">
          Manually trigger question generation for today
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Question Generation</CardTitle>
          <CardDescription>
            This will generate 10 new questions for today using Gemini AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Generating..." : "Generate Questions"}
          </Button>

          {result && (
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">{result}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Note: Make sure CRON_SECRET is set in your .env.local file
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <Link href="/dashboard/admin/anonymous-stats">
              <Button variant="outline" className="w-full">
                View Anonymous Attempt Stats
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
