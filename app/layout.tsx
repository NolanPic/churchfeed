import type { Metadata } from "next";
import { Lato, Gentium_Plus } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "./context/ConvexClientProvider";
import { OrganizationProvider } from "./context/OrganizationProvider";
import { CurrentFeedAndPostProvider } from "./context/CurrentFeedAndPostProvider";
import { api } from "../convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { headers } from "next/headers";
import OrganizationLayout from "./components/OrganizationLayout";
import Script from "next/script";

const lato = Lato({
  variable: "--font-lato",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const gentiumPlus = Gentium_Plus({
  variable: "--font-gentium-plus",
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "churchfeed",
  description: "Your feed",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgSubdomain = (await headers()).get("x-org-host") || "";

  const preloadedOrg = await preloadQuery(
    api.organizations.getOrganizationBySubdomain,
    {
      subdomain: orgSubdomain,
    }
  );

  return (
    <html lang="en">
      <head>
        <Script id="anchor-positioning-polyfill" strategy="beforeInteractive">{`
        if (!('anchorName' in document.documentElement.style)) {
          window.ANCHOR_POSITIONING_POLYFILL_OPTIONS = {
            excludeInlineStyles: false,
            useAnimationFrame: false,
          };
          import('https://unpkg.com/@oddbird/css-anchor-positioning');
        }
      `}</Script>
      </head>
      <body className={`${lato.variable} ${gentiumPlus.variable}`}>
        <ClerkProvider>
          <ConvexClientProvider>
            <OrganizationProvider organization={preloadedOrg}>
              <CurrentFeedAndPostProvider>
                <OrganizationLayout>{children}</OrganizationLayout>
              </CurrentFeedAndPostProvider>
            </OrganizationProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
