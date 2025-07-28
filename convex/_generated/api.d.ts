/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as campaigns from "../campaigns.js";
import type * as characterSheets from "../characterSheets.js";
import type * as characters from "../characters.js";
import type * as gameSystems from "../gameSystems.js";
import type * as http from "../http.js";
import type * as memories from "../memories.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as prompts_extractMemories from "../prompts/extractMemories.js";
import type * as prompts_system from "../prompts/system.js";
import type * as speech from "../speech.js";
import type * as tools_changeScene from "../tools/changeScene.js";
import type * as tools_introduceCharacter from "../tools/introduceCharacter.js";
import type * as tools_requestDiceRoll from "../tools/requestDiceRoll.js";
import type * as tools_updateCharacterSheet from "../tools/updateCharacterSheet.js";
import type * as tools_updatePlan from "../tools/updatePlan.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

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
  gameSystems: typeof gameSystems;
  http: typeof http;
  memories: typeof memories;
  messages: typeof messages;
  migrations: typeof migrations;
  "prompts/extractMemories": typeof prompts_extractMemories;
  "prompts/system": typeof prompts_system;
  speech: typeof speech;
  "tools/changeScene": typeof tools_changeScene;
  "tools/introduceCharacter": typeof tools_introduceCharacter;
  "tools/requestDiceRoll": typeof tools_requestDiceRoll;
  "tools/updateCharacterSheet": typeof tools_updateCharacterSheet;
  "tools/updatePlan": typeof tools_updatePlan;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  migrations: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        { sinceTs?: number },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { limit?: number; names?: Array<string> },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      migrate: FunctionReference<
        "mutation",
        "internal",
        {
          batchSize?: number;
          cursor?: string | null;
          dryRun: boolean;
          fnHandle: string;
          name: string;
          next?: Array<{ fnHandle: string; name: string }>;
        },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
    };
  };
  persistentTextStreaming: {
    lib: {
      addChunk: FunctionReference<
        "mutation",
        "internal",
        { final: boolean; streamId: string; text: string },
        any
      >;
      createStream: FunctionReference<"mutation", "internal", {}, any>;
      getStreamStatus: FunctionReference<
        "query",
        "internal",
        { streamId: string },
        "pending" | "streaming" | "done" | "error" | "timeout"
      >;
      getStreamText: FunctionReference<
        "query",
        "internal",
        { streamId: string },
        {
          status: "pending" | "streaming" | "done" | "error" | "timeout";
          text: string;
        }
      >;
      setStreamStatus: FunctionReference<
        "mutation",
        "internal",
        {
          status: "pending" | "streaming" | "done" | "error" | "timeout";
          streamId: string;
        },
        any
      >;
    };
  };
};
