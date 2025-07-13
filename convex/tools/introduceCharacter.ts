import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import { z } from "zod"
import { api } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const introduceCharacter = (
	ctx: GenericActionCtx<DataModel>,
	assistantMessageId: Id<"messages">,
) => {
	return tool({
		description:
			"Whenever a new NPC is introduced, use this tool to describe the character. The NPC should have a name, and description, which will be used to generate an image. Don't introduce characters that are already in the game.",
		parameters: z.object({
			name: z.string(),
			description: z.string(),
		}),
		execute: async ({ name, description }, toolCall) => {
			await ctx.runMutation(api.messages.appendToolCallBlock, {
				messageId: assistantMessageId,
				toolName: "introduce_character",
				parameters: { name, description },
				toolCallId: toolCall.toolCallId,
			})
		},
	})
}
