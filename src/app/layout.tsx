import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAC QueueFlow | St. Anthony's College Smart Queuing",
  description: "Your Time Matters. Your Queue, Anywhere. Official Smart Queuing System for St. Anthony's College, Antique, Philippines.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SAC QueueFlow",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
