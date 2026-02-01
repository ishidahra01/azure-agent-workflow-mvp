import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ringi Workflow Manager",
  description: "AI-powered document approval workflow system with CopilotKit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
