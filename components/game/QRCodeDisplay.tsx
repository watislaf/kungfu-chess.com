"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QRCodeDisplayProps {
  url: string;
  title?: string;
}

export function QRCodeDisplay({
  url,
  title = "Scan to Join Game",
}: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: {
            dark: "#ffffff",
            light: "#000000",
          },
        });
        setQrCodeUrl(qrDataUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    };

    if (url) {
      generateQR();
    }
  }, [url]);

  if (!qrCodeUrl) {
    return (
      <Card className="w-fit">
        <CardContent className="p-6">
          <div className="w-[200px] h-[200px] bg-muted animate-pulse rounded-md flex items-center justify-center">
            <span className="text-muted-foreground">Generating QR...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <img
          src={qrCodeUrl}
          alt="QR Code for game link"
          className="w-[200px] h-[200px] rounded-md"
        />
      </CardContent>
    </Card>
  );
}
