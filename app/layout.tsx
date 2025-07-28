import type { Metadata } from "next";
import { Lato, Gentium_Plus } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "./context/ConvexClientProvider";
import { OrganizationProvider } from "./context/OrganizationProvider";
import { api } from "../convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { headers } from "next/headers";
import OrganizationLayout from "./components/OrganizationLayout";

const lato = Lato({
  variable: "--font-lato",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const gentiumPlus = Gentium_Plus({
  variable: "--font-gentium-plus",
  weight: ["400", "700"],
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
      <body className={`${lato.variable} ${gentiumPlus.variable}`}>
        <ClerkProvider>
          <ConvexClientProvider>
            <OrganizationProvider organization={preloadedOrg}>
              <OrganizationLayout>{children}</OrganizationLayout>
            </OrganizationProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
