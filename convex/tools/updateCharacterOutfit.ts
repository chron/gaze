import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import { z } from "zod"
import { internal } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const updateCharacterOutfit = (
	ctx: GenericActionCtx<DataModel>,
	_assistantMessageId: Id<"messages">,
	campaignId: Id<"campaigns">,
) => {
	return tool({
		description:
			"Use this tool to change a character's outfit or create a new outfit variation. When a character needs to wear different clothes (e.g., formal attire, swimwear, combat gear, disguise), use this tool. If the outfit already exists, the character will simply switch to it. If it's a new outfit, an image will be generated. The outfit will be saved and can be reused in future scenes without regenerating the image. If the outfit is tied to a specific mood or emotion, consider incorporating that into the name so it's clear when to re-use it.",
		inputSchema: z.object({
			characterName: z
				.string()
				.describe("The name of the character changing outfits"),
			outfitName: z
				.string()
				.describe(
					"A short descriptive name for the outfit (e.g., 'formal', 'swimwear', 'combat gear', 'casual')",
				),
			outfitDescription: z
				.string()
				.describe(
					"A detailed physical description of the outfit for image generation. Focus on clothing, accessories, and style. Be specific about colors, materials, and details. You can also include a description of pose, expression, mood, vibe, and other similar details.",
				),
		}),
		execute: async ({ characterName, outfitName, outfitDescription }) => {
			try {
				// Find the character by name
				const characters = await ctx.runQuery(
					internal.characters.listInternal,
					{
						campaignId,
					},
				)

				const character = characters.find((c) => c.name === characterName)
				if (!character) {
					return {
						error: `Character '${characterName}' not found in this campaign. Available characters: ${characters.map((c) => c.name).join(", ") || "none"}. Use the introduce_character tool first to create new characters.`,
						characterName,
						outfitName,
						outfitDescription,
					}
				}

				// Check if outfit already exists
				const existingOutfit = character.outfits?.[outfitName]

				if (existingOutfit) {
					// Just switch to existing outfit
					await ctx.runMutation(internal.characters.setCurrentOutfitInternal, {
						characterId: character._id,
						outfitName,
					})

					return {
						success: true,
						message: `${characterName} changed into their ${outfitName} outfit.`,
						isNew: false,
						characterName,
						outfitName,
						outfitDescription,
					}
				}

				// Generate new outfit
				await ctx.scheduler.runAfter(
					0,
					internal.characters.generateOutfitForCharacterInternal,
					{
						characterId: character._id,
						outfitName,
						outfitDescription,
					},
				)

				return {
					success: true,
					message: `${characterName} changed into their new ${outfitName} outfit. Image generating...`,
					isNew: true,
					characterName,
					outfitName,
					outfitDescription,
				}
			} catch (error) {
				console.error("update_character_outfit exception:", error)
				return {
					error: `Failed to change outfit: ${error instanceof Error ? error.message : String(error)}`,
					characterName,
					outfitName,
					outfitDescription,
				}
			}
		},
	})
}
