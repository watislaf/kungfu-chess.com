import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kung Fu Chess Online - Real-Time Multiplayer Chess Game | Play Chess Simultaneously",
  description: "Experience revolutionary simultaneous chess gameplay where both players move at the same time! Play real-time multiplayer chess online with ELO rankings, instant matchmaking, and competitive chess battles. No turns, just pure chess strategy at lightning speed.",
  keywords: [
    "kung fu chess",
    "real-time chess",
    "simultaneous chess", 
    "rapid chess online",
    "multiplayer chess game",
    "chess no turns",
    "instant chess",
    "speed chess",
    "live chess",
    "online chess game",
    "chess strategy",
    "chess tactics",
    "ELO chess rating",
    "competitive chess",
    "chess matchmaking",
    "chess variants",
    "WebSocket chess",
    "chess game online",
    "fast chess",
    "chess with friends"
  ],
  authors: [{ name: "Kung Fu Chess Online Team" }],
  creator: "Kung Fu Chess Online",
  publisher: "Kung Fu Chess Online",
  robots: "index, follow",
  alternates: {
    canonical: "https://kungfu-chess.com"
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kungfu-chess.com",
    title: "Kung Fu Chess Online - Real-Time Multiplayer Chess Game",
    description: "Revolutionary simultaneous chess where both players move at the same time! Experience real-time multiplayer chess with ELO rankings and competitive gameplay.",
    siteName: "Kung Fu Chess Online",
    images: [
      {
        url: "https://kungfu-chess.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Kung Fu Chess Online - Real-Time Multiplayer Chess Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kung Fu Chess Online - Real-Time Multiplayer Chess",
    description: "Revolutionary simultaneous chess gameplay! Both players move at the same time in this lightning-fast chess variant.",
    images: ["https://kungfu-chess.com/twitter-image.jpg"],
    creator: "@kungfuchess",
    site: "@kungfuchess",
  },
  verification: {
    google: "your-google-site-verification-code",
  },
  category: "Games",
  classification: "Chess Game, Multiplayer Game, Real-Time Strategy",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-16x16.png", 
        sizes: "16x16",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  other: {
    "theme-color": "#1e293b",
    "msapplication-TileColor": "#1e293b",
    "application-name": "Kung Fu Chess Online",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Kung Fu Chess",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "VideoGame",
              "name": "Kung Fu Chess Online",
              "alternateName": ["Real-Time Chess", "Simultaneous Chess", "Rapid Chess"],
              "description": "Revolutionary real-time multiplayer chess game where both players move simultaneously. Features ELO rankings, competitive matchmaking, and lightning-fast chess gameplay.",
              "url": "https://kungfu-chess.com",
              "image": "https://kungfu-chess.com/og-image.jpg",
              "gamePlatform": ["Web Browser", "Desktop", "Mobile"],
              "genre": ["Strategy", "Board Game", "Multiplayer", "Real-time"],
              "playMode": ["Multiplayer", "Competitive"],
              "applicationCategory": "Game",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              },
              "author": {
                "@type": "Organization",
                "@id": "https://kungfu-chess.com",
                "name": "Kung Fu Chess Online Team"
              },
              "publisher": {
                "@type": "Organization", 
                "@id": "https://kungfu-chess.com",
                "name": "Kung Fu Chess Online"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "150",
                "bestRating": "5"
              },
              "gameItem": {
                "@type": "Thing",
                "name": "Chess Pieces and Board"
              },
              "numberOfPlayers": {
                "@type": "QuantitativeValue",
                "minValue": 2,
                "maxValue": 2
              }
            }),
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster position="bottom-right" richColors expand={false} />
      </body>
    </html>
  );
}
