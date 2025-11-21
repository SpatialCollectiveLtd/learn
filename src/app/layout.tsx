import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spatial Collective Learning Platform",
  description: "Professional training platform for Digitization, Mobile Mapping, Household Survey, and Microtasking",
  keywords: ["mapping", "digitization", "training", "GIS", "OpenStreetMap"],
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
