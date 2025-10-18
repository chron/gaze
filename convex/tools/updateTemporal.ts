import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import { z } from "zod"
import { internal } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const updateTemporal = (
	ctx: GenericActionCtx<DataModel>,
	campaignId: Id<"campaigns">,
) =>
	tool({
		description:
			"Updates the current in-game date and time for the campaign. Use this to track the passage of time in the story. Update it when significant time passes (hours, days, weeks, etc.) or when the time of day meaningfully changes. The notes field can be used to add context like countdowns to important events.",
		inputSchema: z.object({
			date: z
				.string()
				.describe(
					"The current in-game date (e.g., 'Day 3', 'March 15, 1923', 'Year 2, Month of the Raven'). Use any format that fits the campaign setting.",
				),
			time_of_day: z
				.enum([
					"dawn",
					"morning",
					"midday",
					"afternoon",
					"dusk",
					"evening",
					"night",
					"midnight",
				])
				.describe("The current time of day in the game world"),
			notes: z
				.string()
				.optional()
				.describe(
					"Optional notes about time-sensitive events or countdowns (e.g., '2 days until the festival', 'The ritual must be completed by dawn')",
				),
		}),
		execute: async ({ date, time_of_day, notes }) => {
			const result = await ctx.runMutation(
				internal.campaigns.updateTemporalInternal,
				{
					campaignId,
					date,
					timeOfDay: time_of_day,
					notes,
				},
			)

			// Return structured data including previous values for UI
			return {
				message: `Time updated to ${date} (${time_of_day})${notes ? `. ${notes}` : ""}`,
				date,
				time_of_day,
				notes,
				previous_date: result?.previousDate,
				previous_time_of_day: result?.previousTimeOfDay,
			}
		},
	})
