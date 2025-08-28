import { google } from "@ai-sdk/google"
import { openai } from "@ai-sdk/openai"
import {
	type GeneratedFile,
	experimental_generateImage as generateImage,
	generateText,
} from "ai"
import { v } from "convex/values"
import { api } from "./_generated/api"
import { action, mutation, query } from "./_generated/server"
import { googleSafetySettings } from "./utils"

export const generateImageForModel = async (
	prompt: string,
	modelString: string,
) => {
	if (modelString === "gpt-image-1") {
		const result = await generateImage({
			model: openai.image(modelString),
			providerOptions: {
				openai: { quality: "medium" },
			},
			aspectRatio: "1:1",
			prompt,
		})

		console.log(result)

		return result.images
	}

	if (modelString === "gemini-2.5-flash-image") {
		console.log(prompt)

		const { files, providerMetadata } = await generateText({
			model: google("gemini-2.5-flash-image-preview"),
			providerOptions: {
				google: {
					...googleSafetySettings,
					responseModalities: ["TEXT", "IMAGE"],
				},
			},
			prompt,
		})

		console.log("Generated image!", providerMetadata)

		const filesToReturn: GeneratedFile[] = []

		for (const file of files) {
			if (file.mimeType.startsWith("image/")) {
				filesToReturn.push(file)
			}
		}

		return files
	}

	throw new Error(`Unknown image model: ${modelString}`)
}

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
		imagePrompt: v.string(),
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("characters", {
			name: args.name,
			description: args.description,
			campaignId: args.campaignId,
			imagePrompt: args.imagePrompt,
		})
	},
})

export const update = mutation({
	args: {
		characterId: v.id("characters"),
		name: v.string(),
		description: v.string(),
		imagePrompt: v.string(),
	},
	handler: async (ctx, args) => {
		const { characterId, name, description, imagePrompt } = args
		await ctx.db.patch(characterId, { name, description, imagePrompt })
	},
})

export const storeImageForCharacter = mutation({
	args: {
		characterId: v.id("characters"),
		storageId: v.optional(v.id("_storage")),
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

		if (character.image) {
			// Delete old image from storage first!
			await ctx.storage.delete(character.image)
			await ctx.runMutation(api.characters.storeImageForCharacter, {
				characterId: args.characterId,
				storageId: undefined,
			})
		}

		const campaign = await ctx.runQuery(api.campaigns.get, {
			id: character.campaignId,
		})

		if (!campaign) throw new Error("Campaign not found")

		const prompt = `
      Generate a portrait of ${character.name}: ${character.imagePrompt}.

      The portrait should be from the waist up. It should be a square. Don't include any text.

      The style of the image should be ${campaign.imagePrompt}. The background must be transparent.
    `

		const images = await generateImageForModel(prompt, campaign.imageModel)

		for (const file of images) {
			if (file.mimeType.startsWith("image/")) {
				const blob = new Blob([file.uint8Array], { type: file.mimeType })
				const storageId = await ctx.storage.store(blob)
				await ctx.runMutation(api.characters.storeImageForCharacter, {
					characterId: args.characterId,
					storageId,
				})
			}
		}

		await ctx.runMutation(api.campaigns.addActiveCharacter, {
			campaignId: character.campaignId,
			activeCharacter: character.name,
		})
	},
})
