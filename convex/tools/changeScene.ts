import { tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import { z } from "zod"
import { internal } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"

export const changeScene = (
	ctx: GenericActionCtx<DataModel>,
	campaignId: Id<"campaigns">,
	_assistantMessageId: Id<"messages">,
) =>
	tool({
		description:
			"Whenever the scene changes, use this tool to describe the new scene. The description will be shown to the player, and the prompt will be given to an AI to generate an image. You must also provide a list of which of the known characters are active in the scene. Optionally, specify which outfit each character is wearing. If you have follow-up narration or prompts, there will be a chance to add that after the tool call.",
		inputSchema: z.object({
			description: z
				.string()
				.describe("A description of the scene, to display to the user."),
			prompt: z.string().describe("A prompt for the AI to generate an image."),
			activeCharacters: z
				.optional(z.array(z.string()))
				.describe("The characters that are active in the scene"),
			characterOutfits: z
				.optional(
					z.array(
						z.object({
							character: z.string().describe("The character's name"),
							outfit: z
								.string()
								.describe(
									"The name of the outfit they're wearing (must be a previously created outfit)",
								),
						}),
					),
				)
				.describe(
					"Optional: Specify which outfit each character is wearing in this scene",
				),
		}),
		execute: async ({
			description,
			prompt,
			activeCharacters,
			characterOutfits,
		}) => {
			await ctx.runMutation(internal.campaigns.updateActiveCharactersInternal, {
				campaignId,
				activeCharacters: activeCharacters ?? [],
			})

			// Update character outfits if specified
			if (characterOutfits && characterOutfits.length > 0) {
				const characters = await ctx.runQuery(
					internal.characters.listInternal,
					{ campaignId },
				)

				for (const {
					character: characterName,
					outfit: outfitName,
				} of characterOutfits) {
					const character = characters.find((c) => c.name === characterName)
					if (character) {
						// Check if outfit exists
						if (character.outfits?.[outfitName]) {
							await ctx.runMutation(
								internal.characters.setCurrentOutfitInternal,
								{
									characterId: character._id,
									outfitName,
								},
							)
						} else {
							console.warn(
								`Outfit "${outfitName}" not found for character "${characterName}"`,
							)
						}
					}
				}
			}

			// await ctx.scheduler.runAfter(0, api.messages.generateSceneImage, {
			// 	messageId: assistantMessageId,
			// 	description,
			// 	prompt,
			// 	activeCharacters: activeCharacters ?? [],
			// })

			return { description, prompt }
		},
	})
