import type { Metadata } from "next";
import { AuthSessionProvider } from "./components/AuthSessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Squad Portal | Team dashboard",
  description: "A calm workspace for your team's projects, knowledge, and daily momentum.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AuthSessionProvider>{children}</AuthSessionProvider></body>
    </html>
  );
}
