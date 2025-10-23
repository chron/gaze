import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import { z } from "zod"
import { internal } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const updateClock = (
	ctx: GenericActionCtx<DataModel>,
	campaignId: Id<"campaigns">,
) =>
	tool({
		description:
			"Updates a progress clock in the campaign. Clocks are circular trackers divided into segments that fill up over time as certain events occur in the story. Use this to track tension, countdowns, or progress towards story events. When a clock fills up (currentTicks reaches maxTicks), the hinted event should occur.",
		inputSchema: z.object({
			name: z.string().describe("The unique name of the clock to update"),
			current_ticks: z
				.number()
				.int()
				.min(0)
				.describe("The current number of filled segments"),
			max_ticks: z.optional(
				z
					.number()
					.int()
					.min(1)
					.describe("The total number of segments (typically 4, 6, or 8)"),
			),
			hint: z
				.string()
				.optional()
				.describe(
					"A hint about what will happen when the clock fills up (optional)",
				),
		}),
		execute: async ({ name, current_ticks, max_ticks, hint }) => {
			const campaign = await ctx.runQuery(internal.campaigns.getInternal, {
				id: campaignId,
			})

			if (!campaign) {
				throw new Error("Campaign not found")
			}

			const existingClock = campaign.clocks?.find(
				(clock) => clock.name === name,
			)

			const maxTicks = max_ticks ?? existingClock?.maxTicks ?? 6

			const result = await ctx.runMutation(
				internal.campaigns.updateClockInternal,
				{
					campaignId,
					name,
					currentTicks: current_ticks,
					maxTicks,
					hint,
				},
			)

			const message =
				current_ticks >= maxTicks
					? `Clock "${name}" is now full! The event should occur.`
					: `Clock "${name}" updated: ${current_ticks}/${maxTicks} segments filled`

			// Return structured data including previous ticks for UI animation
			return {
				message,
				name,
				current_ticks,
				max_ticks: maxTicks,
				previous_ticks: result?.previousTicks ?? 0,
				hint,
			}
		},
	})
