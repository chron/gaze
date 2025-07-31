import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import { z } from "zod"
import { api } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const introduceCharacter = (
	ctx: GenericActionCtx<DataModel>,
	assistantMessageId: Id<"messages">,
	campaignId: Id<"campaigns">,
) => {
	return tool({
		description:
			"Whenever a new character is introduced, use this tool to describe the character. The character should have a name, and description, which will show up in the UI. There will also be an imagePrompt, which should be a purely physical description of the character's appearance. Make sure you include enough detail on their appearance, clothing, hair, and any other relevant details. Don't introduce characters that are already in the game.",
		parameters: z.object({
			name: z.string(),
			description: z.string(),
			imagePrompt: z.string(),
		}),
		execute: async ({ name, description, imagePrompt }, toolCall) => {
			const characterId = await ctx.runMutation(api.characters.create, {
				name,
				description,
				imagePrompt,
				campaignId,
			})

			await ctx.scheduler.runAfter(
				0,
				api.characters.generateImageForCharacter,
				{
					characterId,
				},
			)

			return `Character ${name} created`
		},
	})
}
