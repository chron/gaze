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
import type * as campaigns from "../campaigns.js";
import type * as characterSheets from "../characterSheets.js";
import type * as characters from "../characters.js";
import type * as memories from "../memories.js";
import type * as messages from "../messages.js";
import type * as prompts_system from "../prompts/system.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  campaigns: typeof campaigns;
  characterSheets: typeof characterSheets;
  characters: typeof characters;
  memories: typeof memories;
  messages: typeof messages;
  "prompts/system": typeof prompts_system;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
