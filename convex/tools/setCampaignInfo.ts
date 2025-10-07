import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import { z } from "zod"
import { internal } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const setCampaignInfo = (
	ctx: GenericActionCtx<DataModel>,
	campaignId: Id<"campaigns">,
) =>
	tool({
		description:
			"Once you have a plan for the campaign, use this tool to set a name, description, and imagePrompt.",
		inputSchema: z.object({
			name: z
				.string()
				.describe(
					"The name of the campaign — something short and evocative, that will show up in the user's interface",
				),
			description: z
				.string()
				.describe(
					"The description of the campaign — a paragraph or two that briefly describes the core premise, themes, and setting.",
				),
			imagePrompt: z
				.string()
				.describe(
					"The image prompt for the campaign - a very short description of the visual style of AI-generated images for the campaign. Examples: 'a simple cartoon style', '1990s anime', 'modern american comic book style'",
				),
		}),
		execute: async ({ name, description, imagePrompt }, toolCall) => {
			const campaign = await ctx.runQuery(internal.campaigns.getInternal, {
				id: campaignId,
			})

			if (!campaign) {
				throw new Error("Campaign not found")
			}

			await ctx.runMutation(internal.campaigns.updateInternal, {
				id: campaignId,
				name,
				description,
				imagePrompt,
				// TODO: there's probably a smarter way to do this, like a patch API
				gameSystemId: campaign.gameSystemId,
				model: campaign.model,
				imageModel: campaign.imageModel,
			})

			return "Plan updated successfully"
		},
	})
