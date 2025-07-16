import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

const DEFAULT_DOMAIN = process.env.HOST || "";
const MOCK_SUBDOMAIN_FOR_LOCALHOST = process.env.MOCK_SUBDOMAIN_FOR_LOCALHOST || "";

export default convexAuthNextjsMiddleware((async (request: NextRequest) => {
  const response = NextResponse.next();
  const host = request.headers.get("host") || DEFAULT_DOMAIN;
  const orgSubdomain = getOrgSubdomain(host);
  response.headers.set("x-org-host", orgSubdomain || MOCK_SUBDOMAIN_FOR_LOCALHOST || "");
  return response;
}));

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
