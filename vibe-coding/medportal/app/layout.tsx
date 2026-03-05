import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MedPortal | Patient Portal",
  description: "Modern healthcare patient portal for appointments, records, and prescriptions."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-[#f3f6fb] text-slate-900`}>
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
