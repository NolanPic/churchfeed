import { httpRouter } from "convex/server";
import { uploadFile } from "./uploadAction";

const http = httpRouter();

// File upload endpoint
http.route({
  path: "/upload",
  method: "POST",
  handler: uploadFile,
});

export default http;
