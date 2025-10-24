import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import { z } from "zod"
import { internal } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const updateCharacterSheet = (
	ctx: GenericActionCtx<DataModel>,
	campaignId: Id<"campaigns">,
) =>
	tool({
		description:
			"Update the player's character sheet with any changes, including changes to their name, stats, or notes. You must provide the name and description of the character, as well as any character sheet data in a JSON object within the `data` key. The entire contents of the character sheet must be provided each time, as it will be overwritten.",
		inputSchema: z.object({
			name: z.string(),
			description: z.string(),
			data: z.any(), //z.record(z.string(), z.any()), // Several models including GPT-5 don't seem to see this!
		}),
		execute: async ({ name, description, data }, _toolCall) => {
			const characterSheet = await ctx.runQuery(
				internal.characterSheets.getInternal,
				{
					campaignId,
				},
			)

			const oldData = characterSheet?.data ?? {}

			if (characterSheet) {
				await ctx.runMutation(internal.characterSheets.updateInternal, {
					characterSheetId: characterSheet._id,
					name,
					description,
					data: data ?? {},
				})
			} else {
				await ctx.runMutation(internal.characterSheets.createInternal, {
					campaignId,
					name,
					description,
					data: data,
				})
			}

			return {
				message: "Character sheet updated",
				oldData,
				newData: data ?? {},
			}
		},
	})
