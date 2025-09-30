import { type NextRequest, NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

const DEFAULT_DOMAIN = process.env.HOST || "";
const MOCK_SUBDOMAIN_FOR_LOCALHOST = process.env.MOCK_SUBDOMAIN_FOR_LOCALHOST || "";
const USE_LOCALHOST_TUNNELLING = process.env.USE_LOCALHOST_TUNNELLING || false;

export function customMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  const host = request.headers.get("host") || DEFAULT_DOMAIN;
  const orgSubdomain = getOrgSubdomain(host);

  let subdomainToUse = orgSubdomain || MOCK_SUBDOMAIN_FOR_LOCALHOST;
  if (USE_LOCALHOST_TUNNELLING) {
    subdomainToUse = MOCK_SUBDOMAIN_FOR_LOCALHOST;
  }
  response.headers.set("x-org-host", subdomainToUse);
  return response;
}

export default clerkMiddleware((_auth, request: NextRequest) => {
  return customMiddleware(request);
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

function getOrgSubdomain(host: string) {
  const parts = host.split(".");
  if (parts.length < 3 || parts[0] === "www") {
    return null;
  }
  return parts[0];
}
