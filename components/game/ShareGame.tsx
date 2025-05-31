"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeDisplay } from "./QRCodeDisplay";

interface ShareGameProps {
  shareableLink: string;
}

export function ShareGame({ shareableLink }: ShareGameProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs sm:text-lg">
          <span className="sm:hidden">Share</span>
          <span className="hidden sm:inline">Share Game</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-4 px-2 sm:px-6 pb-2 sm:pb-6">
        {/* QR Code - bigger and centered */}
        <div className="flex justify-center">
          <div className="transform hover:scale-105 transition-transform duration-200 scale-90 sm:scale-110">
            <QRCodeDisplay url={shareableLink} />
          </div>
        </div>

        {/* Link under QR code - smaller */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground text-center">
            Or share this link:
          </p>
          <div className="flex gap-1 sm:gap-2">
            <Input
              value={shareableLink}
              readOnly
              className="font-mono text-xs rounded-md sm:rounded-xl text-muted-foreground"
            />
            <Button
              onClick={copyLink}
              variant="outline"
              size="sm"
              className="shrink-0 rounded-md sm:rounded-xl h-6 w-6 sm:h-8 sm:w-8 p-0 transition-all duration-200 hover:scale-105"
            >
              {copied ? (
                <Check className="h-2 w-2 sm:h-3 sm:w-3 text-green-500 animate-in zoom-in duration-200" />
              ) : (
                <Copy className="h-2 w-2 sm:h-3 sm:w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
