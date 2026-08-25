import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ga South Teacher Attendance",
  description: "Check-in / check-out attendance for every school in Ga South district.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Self-hosting via next/font/google needs internet access to
            fonts.googleapis.com at BUILD time, which not every self-hosted
            build environment (a locked-down CI runner, an offline build
            step) has. Loading as a stylesheet only needs the END USER'S
            browser to reach it, which is a much safer assumption — and it's
            still just two font families' worth of requests, cached after
            the first visit. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- that
            rule targets the Pages Router's _document.js; a <link> in the App
            Router's root layout is the documented, correct place for this. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
