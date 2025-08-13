/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as feeds from "../feeds.js";
import type * as messages from "../messages.js";
import type * as organizations from "../organizations.js";
import type * as posts from "../posts.js";
import type * as seed from "../seed.js";
import type * as user from "../user.js";
import type * as utils_postContentConverter from "../utils/postContentConverter.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  feeds: typeof feeds;
  messages: typeof messages;
  organizations: typeof organizations;
  posts: typeof posts;
  seed: typeof seed;
  user: typeof user;
  "utils/postContentConverter": typeof utils_postContentConverter;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
