import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { uploadFile } from "./uploadAction";

const http = httpRouter();

// Handle preflight OPTIONS request
http.route({
  path: "/upload",
  method: "OPTIONS",
  handler: httpAction(async (ctx, request) => {
    // Check that this is a valid CORS preflight request
    const headers = request.headers;
    const origin = headers.get("Origin");

    if (
      origin !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      // Validate that the origin matches an organization's host
      const { valid } = await ctx.runQuery(
        internal.organizations.validateOrigin,
        { origin }
      );

      if (!valid) {
        // Origin not recognized, reject the preflight request
        return new Response(null, { status: 403 });
      }

      // Origin is valid, return CORS headers with the specific origin
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        }),
      });
    }
    return new Response();
  }),
});

// File upload endpoint (CORS headers are added in uploadAction.ts)
http.route({
  path: "/upload",
  method: "POST",
  handler: uploadFile,
});

export default http;
