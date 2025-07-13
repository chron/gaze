import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import z from "zod"
import { api } from "../_generated/api"
import type { DataModel, Doc, Id } from "../_generated/dataModel"

export const updateCharacterSheet = (
	ctx: GenericActionCtx<DataModel>,
	assistantMessageId: Id<"messages">,
	characterSheet: Doc<"characterSheets"> | null,
) =>
	tool({
		description:
			"Update the player's character sheet with any changes, including changes to their name, stats, conditions, or notes.",
		parameters: z.object({
			name: z.string(),
			description: z.string(),
			data: z.record(z.string(), z.any()),
		}),
		execute: async ({ name, description, data }, toolCall) => {
			if (!characterSheet) {
				throw new Error("Character sheet not found")
			}

			await ctx.runMutation(api.characterSheets.update, {
				characterSheetId: characterSheet._id,
				name,
				description,
				data,
			})

			await ctx.runMutation(api.messages.appendToolCallBlock, {
				messageId: assistantMessageId,
				toolName: "update_character_sheet",
				parameters: { name, description, data },
				result: "Successfully updated character sheet",
				toolCallId: toolCall.toolCallId,
			})

			return `Character sheet updated: ${name}, ${JSON.stringify(data)}`
		},
	})
