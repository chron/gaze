import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import z from "zod"
import { api } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const updateQuestLog = (
	ctx: GenericActionCtx<DataModel>,
	campaignId: Id<"campaigns">,
) =>
	tool({
		description:
			"Adds, updates, or completes a quest in the player's journal. Use this to manage the player's objectives. Once they are marked as complete or failed, they will be removed from the quest log. Feel free to add new sidequests as the game goes on when interesting opportunities arise.",
		parameters: z.object({
			action: z
				.enum(["add", "update_objective", "complete", "fail"])
				.describe("The operation to perform"),
			quest_title: z
				.string()
				.describe("The unique title of the quest to modify"),
			objective_description: z
				.string()
				.describe("The text for the new quest or the updated objective."),
		}),
		execute: async ({ action, quest_title, objective_description }) => {
			await ctx.runMutation(api.campaigns.updateQuest, {
				campaignId,
				status:
					action === "complete"
						? "completed"
						: action === "fail"
							? "failed"
							: "active",
				title: quest_title,
				objective: objective_description,
			})

			return "Quest log updated successfully"
		},
	})
