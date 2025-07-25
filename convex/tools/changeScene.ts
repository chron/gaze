import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import z from "zod"
import { api } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const changeScene = (
	ctx: GenericActionCtx<DataModel>,
	assistantMessageId: Id<"messages">,
) =>
	tool({
		description:
			"Whenever the scene changes, use this tool to describe the new scene. The description will be shown to the player, and the prompt will be given to an AI to generate an image.",
		parameters: z.object({
			description: z.string(),
			prompt: z.string(),
		}),
		execute: async ({ description, prompt }, toolCall) => {
			await ctx.scheduler.runAfter(0, api.messages.generateSceneImage, {
				messageId: assistantMessageId,
				description,
				prompt,
			})
		},
	})
