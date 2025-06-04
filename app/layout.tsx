import type { Metadata } from "next";
import { Lato, Gentium_Plus } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

const lato = Lato({
  variable: "--font-lato",
  weight: ["400"],
});

const gentiumPlus = Gentium_Plus({
  variable: "--font-gentium-plus",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "churchfeed",
  description: "Your feed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
       <html lang="en">
        <body className={`${lato.variable} ${gentiumPlus.variable}`}>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
