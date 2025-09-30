import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import z from "zod"
import { api } from "../_generated/api"
import type { DataModel, Doc, Id } from "../_generated/dataModel"

export const updateCharacterSheet = (
	ctx: GenericActionCtx<DataModel>,
	campaignId: Id<"campaigns">,
) =>
	tool({
		description:
			"Update the player's character sheet with any changes, including changes to their name, stats, or notes. You must provide the name and description of the character, as well as any character sheet data in a JSON object within the `data` key. The entire contents of the character sheet must be provided each time, as it will be overwritten.",
		parameters: z.object({
			name: z.string(),
			description: z.string(),
			data: z.any(), //z.record(z.string(), z.any()), // Several models including GPT-5 don't seem to see this!
		}),
		execute: async ({ name, description, data }, _toolCall) => {
			const characterSheet = await ctx.runQuery(api.characterSheets.get, {
				campaignId,
			})

			if (characterSheet) {
				await ctx.runMutation(api.characterSheets.update, {
					characterSheetId: characterSheet._id,
					name,
					description,
					data: data ?? {},
				})
			} else {
				await ctx.runMutation(api.characterSheets.create, {
					campaignId,
					name,
					description,
					data: data,
				})
			}

			return "Character sheet updated"
		},
	})
