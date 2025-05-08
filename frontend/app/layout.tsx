import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roomify",
  description: "Track your TFSA contributions and withdrawals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </main>
      </body>
    </html>
  );
}
