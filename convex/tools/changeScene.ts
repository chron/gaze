import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import z from "zod"
import { api } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const changeScene = (
	ctx: GenericActionCtx<DataModel>,
	campaignId: Id<"campaigns">,
	assistantMessageId: Id<"messages">,
) =>
	tool({
		description:
			"Whenever the scene changes, use this tool to describe the new scene. The description will be shown to the player, and the prompt will be given to an AI to generate an image. You must also provide a list of which of the known characters are active in the scene.",
		parameters: z.object({
			description: z.string(),
			prompt: z.string(),
			activeCharacters: z.array(z.string()),
		}),
		execute: async ({ description, prompt, activeCharacters }, toolCall) => {
			await ctx.runMutation(api.campaigns.updateActiveCharacters, {
				campaignId,
				activeCharacters,
			})

			await ctx.scheduler.runAfter(0, api.messages.generateSceneImage, {
				messageId: assistantMessageId,
				description,
				prompt,
				activeCharacters,
			})

			return { description, prompt }
		},
	})
