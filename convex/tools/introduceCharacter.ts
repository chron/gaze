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
			"Whenever a new NPC is introduced, use this tool to describe the character. The NPC should have a name, and description, which will be used to generate an image. Don't introduce characters that are already in the game. Make sure you include enough detail on their appearance, clothing, hair, and any other relevant details.",
		parameters: z.object({
			name: z.string(),
			description: z.string(),
		}),
		execute: async ({ name, description }, toolCall) => {
			const characterId = await ctx.runMutation(api.characters.create, {
				name,
				description,
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
