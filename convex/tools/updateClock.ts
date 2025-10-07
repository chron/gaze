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
			max_ticks: z
				.number()
				.int()
				.min(1)
				.describe("The total number of segments (typically 4, 6, or 8)"),
			hint: z
				.string()
				.optional()
				.describe(
					"A hint about what will happen when the clock fills up (optional)",
				),
		}),
		execute: async ({ name, current_ticks, max_ticks, hint }) => {
			await ctx.runMutation(internal.campaigns.updateClockInternal, {
				campaignId,
				name,
				currentTicks: current_ticks,
				maxTicks: max_ticks,
				hint,
			})

			if (current_ticks >= max_ticks) {
				return `Clock "${name}" is now full! The event should occur.`
			}

			return `Clock "${name}" updated: ${current_ticks}/${max_ticks} segments filled`
		},
	})
