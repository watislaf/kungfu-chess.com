"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Generate unique game ID and redirect
    const gameId = uuidv4();
    router.push(`/game?id=${gameId}`);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="text-4xl mb-4">♟️</div>
            <h1 className="text-2xl font-bold">Rapid Chess Online</h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <p className="text-muted-foreground">Creating your chess game...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
