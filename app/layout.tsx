import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import OptionalHeader from "@/components/layout/optionalHeader";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata for the application, including title and description for SEO and browser display.
// Defines how the application is represented in the browser and external platforms or previews.
// The title and description provide a concise summary of the application's purpose and functionality, 
// enhancing user engagement and search engine visibility.
export const metadata: Metadata = {
  title: "Smart Medication Tracker",
  description: "Analytics dashbord for interactive insights into glucose trends, adherence patterns, and effects from medication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <div className="root">
            <OptionalHeader />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
