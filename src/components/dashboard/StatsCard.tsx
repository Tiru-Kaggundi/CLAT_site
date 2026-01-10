"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}
