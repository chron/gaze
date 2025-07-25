import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import z from "zod"
import { api } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const updatePlan = (
	ctx: GenericActionCtx<DataModel>,
	assistantMessageId: Id<"messages">,
	campaignId: Id<"campaigns">,
) =>
	tool({
		description:
			"Update your internal plan for the RPG session. This is for your own planning purposes and won't be shown to the player. Use this to keep track of upcoming events, plot developments, or session structure.",
		parameters: z.object({
			plan: z.string().describe("Your internal plan for the session"),
		}),
		execute: async ({ plan }, toolCall) => {
			await ctx.runMutation(api.campaigns.updatePlan, {
				campaignId,
				plan,
			})

			return "Plan updated successfully"
		},
	})
