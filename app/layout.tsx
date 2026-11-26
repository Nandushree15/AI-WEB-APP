import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Briefly — Make sense of more",
  description:
    "Turn long reads into clear, useful summaries. Choose your style and watch the key ideas appear.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
