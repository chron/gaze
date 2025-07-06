import { openai } from "@ai-sdk/openai"
import { experimental_generateImage as generateImage } from "ai"
import { v } from "convex/values"
import { api } from "./_generated/api"
import { action, mutation, query } from "./_generated/server"

export const list = query({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const characters = await ctx.db
			.query("characters")
			.filter((q) => q.eq(q.field("campaignId"), args.campaignId))
			.collect()

		return Promise.all(
			characters.map(async (character) => {
				return {
					...character,
					imageUrl: character.image
						? await ctx.storage.getUrl(character.image)
						: null,
				}
			}),
		)
	},
})

export const get = query({
	args: {
		characterId: v.id("characters"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.characterId)
	},
})

export const create = mutation({
	args: {
		name: v.string(),
		description: v.string(),
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("characters", {
			name: args.name,
			description: args.description,
			campaignId: args.campaignId,
		})
	},
})

export const storeImageForCharacter = mutation({
	args: {
		characterId: v.id("characters"),
		storageId: v.id("_storage"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.patch(args.characterId, {
			image: args.storageId,
		})
	},
})

export const generateImageForCharacter = action({
	args: {
		characterId: v.id("characters"),
	},
	handler: async (ctx, args) => {
		const character = await ctx.runQuery(api.characters.get, {
			characterId: args.characterId,
		})

		if (!character) throw new Error("Character not found")

		const campaign = await ctx.runQuery(api.campaigns.get, {
			id: character.campaignId,
		})

		if (!campaign) throw new Error("Campaign not found")

		const prompt = `
      Generate an image. It should be a portrait of ${character.name}. ${character.description}.

      The portrait should be from the waist up. It should be a square. Don't include any text.

      The style of the image should be ${campaign.imagePrompt}. Use a transparent background.
    `

		const result = await generateImage({
			model: openai.image("gpt-image-1"),
			providerOptions: {
				openai: { quality: "medium" },
			},
			aspectRatio: "1:1",
			prompt,
		})

		for (const file of result.images) {
			if (file.mimeType.startsWith("image/")) {
				const blob = new Blob([file.uint8Array], { type: file.mimeType })
				const storageId = await ctx.storage.store(blob)
				await ctx.runMutation(api.characters.storeImageForCharacter, {
					characterId: args.characterId,
					storageId,
				})
			}
		}
	},
})
