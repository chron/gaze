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
			"Whenever the scene changes, use this tool to describe the new scene. The background color should be a hex code that can be used with black text in the main chat interface. The description will be used to create an image.",
		parameters: z.object({
			description: z.string(),
			backgroundColor: z.string(),
		}),
		execute: async ({ description, backgroundColor }, toolCall) => {
			await ctx.runMutation(api.messages.addSceneToMessage, {
				messageId: assistantMessageId,
				scene: {
					description,
					backgroundColor,
				},
			})

			await ctx.runMutation(api.messages.appendToolCallBlock, {
				messageId: assistantMessageId,
				toolName: "change_scene",
				parameters: { description, backgroundColor },
				toolCallId: toolCall.toolCallId,
			})
		},
	})
