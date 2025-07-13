import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import z from "zod"
import type { DataModel, Id } from "../_generated/dataModel"

export const rollDice = (ctx: GenericActionCtx<DataModel>) => {
	return tool({
		description:
			"Present one or more dice to the user, and ask them to roll them. You can also add a bonus to the roll. The user will click the dice to roll them. The result will be a list of numbers.",
		parameters: z.object({
			number: z.number().min(1).max(100),
			faces: z.number().min(1).max(100),
			bonus: z.number().min(-100).max(100),
		}),
	})
}
