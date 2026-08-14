import type { Metadata } from "next";
import "./globals.css";

// Fallback to system fonts to prevent build failures when fonts.googleapis.com is unreachable
const systemFontVariable = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const metadata: Metadata = {
  title: {
    default: "SafariNexa — Travel confidently across East Africa",
    template: "%s · SafariNexa"
  },
  description: "Discover, compare, and book verified East African accommodation, safaris, restaurants, and transport."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground" style={{ "--font-sans": systemFontVariable } as React.CSSProperties}>{children}</body>
    </html>
  );
}
