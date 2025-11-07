import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InstantTempMail - Temporary Email Service",
  description: "Get instant temporary email addresses with AI assistant",
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TempMail",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <body className="antialiased bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
