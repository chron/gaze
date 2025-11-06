import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import { z } from "zod"
import { internal } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const updatePlan = (
	ctx: GenericActionCtx<DataModel>,
	_assistantMessageId: Id<"messages">,
	campaignId: Id<"campaigns">,
) =>
	tool({
		description:
			"Update your internal plan for the RPG session. This is for your own planning purposes and won't be shown to the player. Use this to keep track of upcoming events, plot developments, or session structure. You can pass which part of the plan you'd like to update, and it will only replace that part.",
		inputSchema: z.object({
			plan: z.string().describe("Your internal plan for the session"),
			part: z
				.enum([
					// "current_scene",
					"future_events",
					"player_requests",
					"overall_story",
					"key_details",
					// "feelings_and_reflections",
				])
				.optional()
				.describe("The part of the plan you'd like to update"),
		}),
		execute: async ({ plan, part }) => {
			const result = await ctx.runMutation(
				internal.campaigns.updatePlanInternal,
				{
					campaignId,
					plan,
					part,
				},
			)

			return {
				message: "Plan updated successfully",
				oldPlan: result.oldPlan,
				newPlan: plan,
				part,
			}
		},
	})
