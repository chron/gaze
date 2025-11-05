import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import { z } from "zod"
import { internal } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const introduceCharacter = (
	ctx: GenericActionCtx<DataModel>,
	_assistantMessageId: Id<"messages">,
	campaignId: Id<"campaigns">,
) => {
	return tool({
		description:
			"Whenever a new character is introduced, use this tool to describe the character. Don't introduce characters that are already in the game.",
		inputSchema: z.object({
			name: z.string(),
			description: z
				.string()
				.describe(
					"A description of the character, which will show up in the UI.",
				),
			imagePrompt: z
				.string()
				.describe(
					"A prompt for the AI to generate an image of the character. It should be a purely physical description of the character's appearance — don't include any details about the background or scene, just the character themselves. It must be self-contained, so don't reference other characters or details outside of the imagePrompt.",
				),
			notes: z
				.string()
				.optional()
				.describe(
					"Optional: Any additional information about the character that might be useful for later reference. You can add to this later with the update_character tool.",
				),
		}),
		execute: async ({ name, description, imagePrompt, notes }) => {
			const characterId = await ctx.runMutation(
				internal.characters.createInternal,
				{
					name,
					description,
					imagePrompt,
					notes,
					campaignId,
				},
			)

			await ctx.scheduler.runAfter(
				0,
				internal.characters.generateImageForCharacterInternal,
				{
					characterId,
				},
			)

			return `Character ${name} created`
		},
	})
}
