import { v } from "convex/values"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { action, internalMutation, internalQuery } from "./_generated/server"

// Internal query to get the last assistant message
export const getLastAssistantMessage = internalQuery({
	args: { campaignId: v.id("campaigns") },
	handler: async (ctx, { campaignId }) => {
		const messages = await ctx.db
			.query("messages")
			.withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
			.order("desc")
			.take(50)

		return messages.find((m) => m.role === "assistant") ?? null
	},
})

// Internal mutation to update a message
export const updateMessage = internalMutation({
	args: {
		messageId: v.id("messages"),
		content: v.any(),
		toolResults: v.optional(v.any()),
	},
	handler: async (ctx, { messageId, content, toolResults }) => {
		await ctx.db.patch(messageId, {
			content,
			...(toolResults !== undefined && { toolResults }),
		})
	},
})

// Internal query to get campaign
export const getCampaign = internalQuery({
	args: { campaignId: v.id("campaigns") },
	handler: async (ctx, { campaignId }) => {
		return await ctx.db.get(campaignId)
	},
})

// Internal mutation to update campaign active characters
export const updateCampaignActiveCharacters = internalMutation({
	args: {
		campaignId: v.id("campaigns"),
		activeCharacters: v.array(v.string()),
	},
	handler: async (ctx, { campaignId, activeCharacters }) => {
		await ctx.db.patch(campaignId, { activeCharacters })
	},
})

// Internal query to get characters by campaign
export const getCharactersByCampaign = internalQuery({
	args: { campaignId: v.id("campaigns") },
	handler: async (ctx, { campaignId }) => {
		return await ctx.db
			.query("characters")
			.withIndex("by_campaignId", (q) => q.eq("campaignId", campaignId))
			.collect()
	},
})

// Internal mutation to update character name and text fields
export const updateCharacterFields = internalMutation({
	args: {
		characterId: v.id("characters"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		imagePrompt: v.optional(v.string()),
	},
	handler: async (ctx, { characterId, name, description, imagePrompt }) => {
		const updates: Record<string, string> = {}
		if (name !== undefined) updates.name = name
		if (description !== undefined) updates.description = description
		if (imagePrompt !== undefined) updates.imagePrompt = imagePrompt

		if (Object.keys(updates).length > 0) {
			await ctx.db.patch(characterId, updates)
		}
	},
})

export const findAndReplaceInLastMessage = action({
	args: {
		campaignId: v.id("campaigns"),
		oldText: v.string(),
		newText: v.string(),
	},
	handler: async (
		ctx,
		args,
	): Promise<{
		success: boolean
		updatedMessage: boolean
		updatedCharacters: number
		updatedActiveCharacters: boolean
	}> => {
		const { campaignId, oldText, newText } = args

		// Get the most recent assistant message
		const lastAssistantMessage = await ctx.runQuery(
			internal.findAndReplace.getLastAssistantMessage,
			{ campaignId },
		)

		if (!lastAssistantMessage) {
			throw new Error("No assistant message found")
		}

		// Perform find and replace in message content
		const updatedContent: Array<Record<string, unknown>> =
			lastAssistantMessage.content
		// Replace text in all text, reasoning, and tool-call blocks
		const regex = new RegExp(
			oldText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
			"g",
		)
		for (const block of updatedContent) {
			if (block.type === "text" && typeof block.text === "string") {
				block.text = block.text.replace(regex, newText)
			} else if (block.type === "reasoning" && typeof block.text === "string") {
				block.text = block.text.replace(regex, newText)
			} else if (block.type === "tool-call") {
				// Replace in args field
				if (block.args) {
					block.args = JSON.parse(
						JSON.stringify(block.args).replace(regex, newText),
					)
				}
				// Replace in input field
				if (block.input) {
					block.input = JSON.parse(
						JSON.stringify(block.input).replace(regex, newText),
					)
				}
			}
		}

		// Perform find and replace in tool results
		let updatedToolResults = lastAssistantMessage.toolResults
		if (updatedToolResults) {
			updatedToolResults = JSON.parse(
				JSON.stringify(updatedToolResults).replace(regex, newText),
			)
		}

		// Update the message
		await ctx.runMutation(internal.findAndReplace.updateMessage, {
			messageId: lastAssistantMessage._id,
			content: updatedContent,
			toolResults: updatedToolResults,
		})

		// Get campaign and update activeCharacters
		const campaign = await ctx.runQuery(internal.findAndReplace.getCampaign, {
			campaignId,
		})

		let updatedActiveCharacters = false
		if (campaign?.activeCharacters) {
			const newActiveCharacters = campaign.activeCharacters.map(
				(charId: string) => {
					if (charId === oldText) {
						return newText
					}
					return charId
				},
			)

			if (
				JSON.stringify(newActiveCharacters) !==
				JSON.stringify(campaign.activeCharacters)
			) {
				await ctx.runMutation(
					internal.findAndReplace.updateCampaignActiveCharacters,
					{
						campaignId,
						activeCharacters: newActiveCharacters,
					},
				)
				updatedActiveCharacters = true
			}
		}

		// Find and update character records with matching name
		const characters: Array<{
			_id: Id<"characters">
			name?: string
			description?: string
			imagePrompt?: string
		}> = await ctx.runQuery(internal.findAndReplace.getCharactersByCampaign, {
			campaignId,
		})

		const matchingCharacters: typeof characters = characters.filter(
			(c) => c.name?.trim().toLowerCase() === oldText.trim().toLowerCase(),
		)

		for (const character of matchingCharacters) {
			// Update name and replace text in description and imagePrompt
			const updates: {
				name: string
				description?: string
				imagePrompt?: string
			} = {
				name: newText,
			}

			// Replace in description if it exists
			if (character.description) {
				updates.description = character.description.replace(regex, newText)
			}

			// Replace in imagePrompt if it exists
			if (character.imagePrompt) {
				updates.imagePrompt = character.imagePrompt.replace(regex, newText)
			}

			await ctx.runMutation(internal.findAndReplace.updateCharacterFields, {
				characterId: character._id,
				...updates,
			})
		}

		return {
			success: true,
			updatedMessage: true,
			updatedCharacters: matchingCharacters.length,
			updatedActiveCharacters,
		}
	},
})
