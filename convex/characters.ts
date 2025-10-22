import { google } from "@ai-sdk/google"
import { openai } from "@ai-sdk/openai"
import {
	type GeneratedFile,
	experimental_generateImage as generateImage,
	generateText,
} from "ai"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import {
	action,
	internalAction,
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server"
import { googleSafetySettings } from "./utils"

export const generateImageForModel = async (
	prompt: string,
	modelString: string,
	_referenceImage: string | null = null,
) => {
	// TODO: support reference image
	if (modelString.startsWith("gpt-image")) {
		const result = await generateImage({
			model: openai.image(modelString),
			providerOptions: {
				openai: { quality: "medium" },
			},
			size: "1024x1024",
			prompt,
		})

		return result.images
	}

	if (modelString === "gemini-2.5-flash-image") {
		const { files } = await generateText({
			model: google("gemini-2.5-flash-image-preview"),
			providerOptions: {
				google: {
					...googleSafetySettings,
					responseModalities: ["TEXT", "IMAGE"],
				},
			},
			prompt,
		})

		const filesToReturn: GeneratedFile[] = []

		for (const file of files) {
			if (file.mediaType.startsWith("image/")) {
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
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const characters = await ctx.db
			.query("characters")
			.withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
			.collect()

		return Promise.all(
			characters.map(async (character) => {
				// Determine which image to use based on currentOutfit
				let imageUrl: string | null = null
				if (
					character.currentOutfit &&
					character.outfits &&
					character.outfits[character.currentOutfit]
				) {
					imageUrl = await ctx.storage.getUrl(
						character.outfits[character.currentOutfit].image,
					)
				} else if (character.image) {
					imageUrl = await ctx.storage.getUrl(character.image)
				}

				// Always provide base image URL separately
				const baseImageUrl = character.image
					? await ctx.storage.getUrl(character.image)
					: null

				// Build allOutfits array
				const allOutfits = character.outfits
					? await Promise.all(
							Object.entries(character.outfits).map(async ([name, outfit]) => ({
								name,
								description: outfit.description,
								imageUrl: await ctx.storage.getUrl(outfit.image),
							})),
						)
					: []

				return {
					...character,
					imageUrl,
					baseImageUrl,
					allOutfits,
				}
			}),
		)
	},
})

export const listInternal = internalQuery({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const characters = await ctx.db
			.query("characters")
			.withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
			.collect()

		return Promise.all(
			characters.map(async (character) => {
				// Determine which image to use based on currentOutfit
				let imageUrl: string | null = null
				if (
					character.currentOutfit &&
					character.outfits &&
					character.outfits[character.currentOutfit]
				) {
					imageUrl = await ctx.storage.getUrl(
						character.outfits[character.currentOutfit].image,
					)
				} else if (character.image) {
					imageUrl = await ctx.storage.getUrl(character.image)
				}

				// Always provide base image URL separately
				const baseImageUrl = character.image
					? await ctx.storage.getUrl(character.image)
					: null

				// Build allOutfits array
				const allOutfits = character.outfits
					? await Promise.all(
							Object.entries(character.outfits).map(async ([name, outfit]) => ({
								name,
								description: outfit.description,
								imageUrl: await ctx.storage.getUrl(outfit.image),
							})),
						)
					: []

				return {
					...character,
					imageUrl,
					baseImageUrl,
					allOutfits,
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
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const character = await ctx.db.get(args.characterId)
		if (!character) throw new Error("Character not found")

		// Determine which image to use based on currentOutfit
		let imageUrl: string | null = null
		if (
			character.currentOutfit &&
			character.outfits &&
			character.outfits[character.currentOutfit]
		) {
			imageUrl = await ctx.storage.getUrl(
				character.outfits[character.currentOutfit].image,
			)
		} else if (character.image) {
			imageUrl = await ctx.storage.getUrl(character.image)
		}

		// Always provide base image URL separately
		const baseImageUrl = character.image
			? await ctx.storage.getUrl(character.image)
			: null

		// Build allOutfits array
		const allOutfits = character.outfits
			? await Promise.all(
					Object.entries(character.outfits).map(async ([name, outfit]) => ({
						name,
						description: outfit.description,
						imageUrl: await ctx.storage.getUrl(outfit.image),
					})),
				)
			: []

		return {
			...character,
			imageUrl,
			baseImageUrl,
			allOutfits,
		}
	},
})

export const update = mutation({
	args: {
		characterId: v.id("characters"),
		name: v.string(),
		description: v.string(),
		imagePrompt: v.string(),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const { characterId, name, description, imagePrompt, notes } = args
		await ctx.db.patch(characterId, { name, description, imagePrompt, notes })
	},
})

export const toggleActive = mutation({
	args: {
		characterId: v.id("characters"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const character = await ctx.db.get(args.characterId)
		if (!character) throw new Error("Character not found")

		await ctx.db.patch(args.characterId, {
			active: !character.active,
		})
	},
})

export const destroy = mutation({
	args: {
		characterId: v.id("characters"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const character = await ctx.db.get(args.characterId)
		if (!character) throw new Error("Character not found")

		if (character.image) {
			await ctx.storage.delete(character.image)
		}

		await ctx.db.delete(args.characterId)
	},
})

export const generateImageForCharacter = action({
	args: {
		characterId: v.id("characters"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const character = await ctx.runQuery(internal.characters.getInternal, {
			characterId: args.characterId,
		})

		if (!character) throw new Error("Character not found")

		if (character.image) {
			// Delete old image from storage first!
			await ctx.storage.delete(character.image)
			await ctx.runMutation(
				internal.characters.storeImageForCharacterInternal,
				{
					characterId: args.characterId,
					storageId: undefined,
				},
			)
		}

		const campaign = await ctx.runQuery(internal.campaigns.getInternal, {
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
			if (file.mediaType.startsWith("image/")) {
				const blob = new Blob([file.uint8Array as BlobPart], {
					type: file.mediaType,
				})
				const storageId = await ctx.storage.store(blob)
				await ctx.runMutation(
					internal.characters.storeImageForCharacterInternal,
					{
						characterId: args.characterId,
						storageId,
					},
				)
			}
		}

		await ctx.runMutation(internal.campaigns.addActiveCharacterInternal, {
			campaignId: character.campaignId,
			activeCharacter: character.name,
		})
	},
})

// Internal mutations/actions (no auth required - for use within httpActions/internalActions)
export const getInternal = internalQuery({
	args: {
		characterId: v.id("characters"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.characterId)
	},
})

export const createInternal = internalMutation({
	args: {
		name: v.string(),
		description: v.string(),
		campaignId: v.id("campaigns"),
		imagePrompt: v.string(),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const characterId = await ctx.db.insert("characters", {
			name: args.name,
			description: args.description,
			campaignId: args.campaignId,
			imagePrompt: args.imagePrompt,
			notes: args.notes,
			active: true,
		})

		// Check if this character matches the campaign's character sheet
		const characterSheet = await ctx.db
			.query("characterSheets")
			.withIndex("by_campaignId_and_name", (q) =>
				q.eq("campaignId", args.campaignId).eq("name", args.name),
			)
			.first()

		// If there's a matching character sheet and the campaign doesn't have a primary character yet,
		// set this character as the primary
		if (characterSheet) {
			const campaign = await ctx.db.get(args.campaignId)
			if (campaign && !campaign.primaryCharacterId) {
				await ctx.db.patch(args.campaignId, {
					primaryCharacterId: characterId,
				})
			}
		}

		return characterId
	},
})

export const storeImageForCharacterInternal = internalMutation({
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

export const generateImageForCharacterInternal = internalAction({
	args: {
		characterId: v.id("characters"),
	},
	handler: async (ctx, args) => {
		const character = await ctx.runQuery(internal.characters.getInternal, {
			characterId: args.characterId,
		})

		if (!character) throw new Error("Character not found")

		if (character.image) {
			// Delete old image from storage first!
			await ctx.storage.delete(character.image)
			await ctx.runMutation(
				internal.characters.storeImageForCharacterInternal,
				{
					characterId: args.characterId,
					storageId: undefined,
				},
			)
		}

		const campaign = await ctx.runQuery(internal.campaigns.getInternal, {
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
			if (file.mediaType.startsWith("image/")) {
				const blob = new Blob([file.uint8Array as BlobPart], {
					type: file.mediaType,
				})
				const storageId = await ctx.storage.store(blob)
				await ctx.runMutation(
					internal.characters.storeImageForCharacterInternal,
					{
						characterId: args.characterId,
						storageId,
					},
				)
			}
		}

		await ctx.runMutation(internal.campaigns.addActiveCharacterInternal, {
			campaignId: character.campaignId,
			activeCharacter: character.name,
		})
	},
})

// Outfit management mutations and actions
export const storeOutfitForCharacterInternal = internalMutation({
	args: {
		characterId: v.id("characters"),
		outfitName: v.string(),
		outfitDescription: v.string(),
		storageId: v.id("_storage"),
	},
	handler: async (ctx, args) => {
		const character = await ctx.db.get(args.characterId)
		if (!character) throw new Error("Character not found")

		const updatedOutfits = {
			...(character.outfits ?? {}),
			[args.outfitName]: {
				description: args.outfitDescription,
				image: args.storageId,
			},
		}

		await ctx.db.patch(args.characterId, {
			outfits: updatedOutfits,
		})
	},
})

export const setCurrentOutfitInternal = internalMutation({
	args: {
		characterId: v.id("characters"),
		outfitName: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.characterId, {
			currentOutfit: args.outfitName,
		})
	},
})

export const generateOutfitForCharacterInternal = internalAction({
	args: {
		characterId: v.id("characters"),
		outfitName: v.string(),
		outfitDescription: v.string(),
	},
	handler: async (ctx, args) => {
		const character = await ctx.runQuery(internal.characters.getInternal, {
			characterId: args.characterId,
		})

		if (!character) throw new Error("Character not found")

		const campaign = await ctx.runQuery(internal.campaigns.getInternal, {
			id: character.campaignId,
		})

		if (!campaign) throw new Error("Campaign not found")

		const prompt = `
      Generate a portrait of ${character.name}: ${character.imagePrompt}.
      ${character.name} is now wearing: ${args.outfitDescription}.

      The portrait should be from the waist up. It should be a square. Don't include any text.

      The style of the image should be ${campaign.imagePrompt}. The background must be transparent.
    `

		const images = await generateImageForModel(
			prompt,
			campaign.imageModel,
			character.image,
		)

		for (const file of images) {
			if (file.mediaType.startsWith("image/")) {
				const blob = new Blob([file.uint8Array as BlobPart], {
					type: file.mediaType,
				})
				const storageId = await ctx.storage.store(blob)
				await ctx.runMutation(
					internal.characters.storeOutfitForCharacterInternal,
					{
						characterId: args.characterId,
						outfitName: args.outfitName,
						outfitDescription: args.outfitDescription,
						storageId,
					},
				)

				// Set this outfit as the current outfit
				await ctx.runMutation(internal.characters.setCurrentOutfitInternal, {
					characterId: args.characterId,
					outfitName: args.outfitName,
				})
			}
		}
	},
})

export const regenerateOutfitForCharacter = action({
	args: {
		characterId: v.id("characters"),
		outfitName: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const character = await ctx.runQuery(internal.characters.getInternal, {
			characterId: args.characterId,
		})

		if (!character) throw new Error("Character not found")
		if (!character.outfits || !character.outfits[args.outfitName]) {
			throw new Error("Outfit not found")
		}

		const outfit = character.outfits[args.outfitName]

		// Delete old image from storage
		await ctx.storage.delete(outfit.image)

		// Generate new image with same description
		const campaign = await ctx.runQuery(internal.campaigns.getInternal, {
			id: character.campaignId,
		})

		if (!campaign) throw new Error("Campaign not found")

		const prompt = `
      Generate a portrait of ${character.name}: ${character.imagePrompt}.
      ${character.name} is now wearing: ${outfit.description}.

      The portrait should be from the waist up. It should be a square. Don't include any text.

      The style of the image should be ${campaign.imagePrompt}. The background must be transparent.
    `

		const images = await generateImageForModel(prompt, campaign.imageModel)

		for (const file of images) {
			if (file.mediaType.startsWith("image/")) {
				const blob = new Blob([file.uint8Array as BlobPart], {
					type: file.mediaType,
				})
				const storageId = await ctx.storage.store(blob)
				await ctx.runMutation(
					internal.characters.storeOutfitForCharacterInternal,
					{
						characterId: args.characterId,
						outfitName: args.outfitName,
						outfitDescription: outfit.description,
						storageId,
					},
				)
			}
		}
	},
})
