import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import z from "zod"
import { api } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const requestDiceRoll = (
	ctx: GenericActionCtx<DataModel>,
	assistantMessageId: Id<"messages">,
) => {
	return tool({
		description:
			"Present one or more dice to the user, and ask them to roll them. You can also add a bonus to the roll. Wait for the result before continuing.",
		parameters: z.object({
			number: z.number().min(1).max(100),
			faces: z.number().min(1).max(100),
			bonus: z.number().min(-100).max(100),
		}),
		execute: async ({ number, faces, bonus }, toolCall) => {
			// TODO: something?
		},
	})
}
