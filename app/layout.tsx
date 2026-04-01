import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

// Configure Sarabun with a CSS Variable
const sarabun = Sarabun({ 
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: '--font-sarabun', // Add CSS variable
});

export const metadata: Metadata = {
  title: "Corporate | Data Management System",
  description: "Enterprise Customer and Employee Data Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sans bg-brand-gray text-brand-dark antialiased`}>
        {children}
      </body>
    </html>
  );
}
