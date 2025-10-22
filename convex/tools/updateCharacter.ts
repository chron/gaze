import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import { z } from "zod"
import { internal } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const updateCharacter = (
	ctx: GenericActionCtx<DataModel>,
	_assistantMessageId: Id<"messages">,
	campaignId: Id<"campaigns">,
) => {
	return tool({
		description:
			"Update an existing character's description or notes. Use this when a character's appearance, personality, or other details change during the story, or when you need to add notes about their development. Do not use this for outfit changes - use update_character_outfit for that. You cannot update the imagePrompt with this tool.",
		inputSchema: z.object({
			name: z
				.string()
				.describe("The exact name of the character to update (case-sensitive)"),
			description: z
				.string()
				.optional()
				.describe("Updated description of the character"),
			notes: z
				.string()
				.optional()
				.describe("Updated notes about the character for future reference"),
		}),
		execute: async ({ name, description, notes }) => {
			// Need to update at least one field
			if (!description && !notes) {
				return "Error: Must provide either description or notes to update"
			}

			await ctx.runMutation(internal.characters.updateInternal, {
				campaignId,
				name,
				description,
				notes,
			})

			return `Character ${name} updated successfully`
		},
	})
}
