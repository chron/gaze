import { google } from "@ai-sdk/google"
import { type CoreMessage, type LanguageModelUsage, generateText } from "ai"
import { v } from "convex/values"
import { api } from "./_generated/api"
import { action, query } from "./_generated/server"
import { mutation } from "./_generated/server"
import { googleSafetySettings } from "./utils"

export const list = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const campaigns = await ctx.db
			.query("campaigns")
			.withIndex("by_archived", (q) => q.eq("archived", false))
			.collect()

		// Sort by lastInteractionAt descending (most recent first), then by creation time
		const sortedCampaigns = campaigns.sort((a, b) => {
			const aTime = a.lastInteractionAt ?? a._creationTime
			const bTime = b.lastInteractionAt ?? b._creationTime
			return bTime - aTime
		})

		// Apply limit if specified
		if (args.limit !== undefined) {
			return sortedCampaigns.slice(0, args.limit)
		}

		return sortedCampaigns
	},
})

export const get = query({
	args: {
		id: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const campaign = await ctx.db.get(args.id)
		if (!campaign) {
			return null
		}

		return {
			...campaign,
			gameSystemName: campaign.gameSystemId
				? (await ctx.db.get(campaign.gameSystemId))?.name
				: null,
		}
	},
})

export const sumTokens = query({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const messages = await ctx.db
			.query("messages")
			.withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
			.collect()
		const tokens = messages.reduce(
			(acc, message) => {
				return {
					promptTokens: acc.promptTokens + (message.usage?.promptTokens ?? 0),
					completionTokens:
						acc.completionTokens + (message.usage?.completionTokens ?? 0),
				}
			},
			{ promptTokens: 0, completionTokens: 0 },
		)
		return tokens
	},
})

export const addCampaign = mutation({
	args: {
		name: v.string(),
		description: v.string(),
		imagePrompt: v.string(),
		gameSystemId: v.optional(v.id("gameSystems")),
		model: v.string(),
		imageModel: v.string(),
	},
	handler: async (ctx, args) => {
		const campaign = {
			name: args.name,
			description: args.description,
			imagePrompt: args.imagePrompt,
			gameSystemId: args.gameSystemId,
			model: args.model,
			imageModel: args.imageModel,
			archived: false,
		}

		const campaignId = await ctx.db.insert("campaigns", campaign)

		// await ctx.scheduler.runAfter(0, internal.messages.sendToLLM, {
		// 	campaignId,
		// })

		return campaignId
	},
})

export const update = mutation({
	args: {
		id: v.id("campaigns"),
		name: v.optional(v.string()),
		description: v.string(),
		imagePrompt: v.string(),
		gameSystemId: v.id("gameSystems"),
		model: v.string(),
		imageModel: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, {
			name: args.name,
			description: args.description,
			imagePrompt: args.imagePrompt,
			gameSystemId: args.gameSystemId,
			model: args.model,
			imageModel: args.imageModel,
		})
	},
})

export const updateCampaignSummary = mutation({
	args: {
		campaignId: v.id("campaigns"),
		summary: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.campaignId, {
			lastCampaignSummary: args.summary,
		})
	},
})

export const updateActiveCharacters = mutation({
	args: {
		campaignId: v.id("campaigns"),
		activeCharacters: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.campaignId, {
			activeCharacters: args.activeCharacters,
		})
	},
})

export const addActiveCharacter = mutation({
	args: {
		campaignId: v.id("campaigns"),
		activeCharacter: v.string(),
	},
	handler: async (ctx, args) => {
		const campaign = await ctx.db.get(args.campaignId)
		if (!campaign) {
			throw new Error("Campaign not found")
		}

		if (campaign.activeCharacters?.includes(args.activeCharacter)) {
			return
		}

		await ctx.db.patch(args.campaignId, {
			activeCharacters: [
				...(campaign.activeCharacters ?? []),
				args.activeCharacter,
			],
		})
	},
})

export const updatePlan = mutation({
	args: {
		campaignId: v.id("campaigns"),
		plan: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.campaignId, {
			plan: args.plan,
		})
	},
})

export const updateLastInteraction = mutation({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.campaignId, {
			lastInteractionAt: Date.now(),
		})
	},
})

export const lookForThemesInCampaignSummaries = action({
	handler: async (
		ctx,
		args,
	): Promise<{ text: string; usage: LanguageModelUsage }> => {
		const allCampaigns = await ctx.runQuery(api.campaigns.list, {})

		const prompt = `
		You are a game master, responsible for several different campaigns with the user. You will be given the name, description, and a full summary of each campaign.

		Your job is to look for themes in the summaries.
		`

		const formattedMessages = allCampaigns
			.map((c) => {
				if (!c.lastCampaignSummary) {
					return null
				}

				return {
					role: "user",
					content: `## ${c.name}: ${c.description}\n\n### Summary\n\n${c.lastCampaignSummary}`,
				} satisfies CoreMessage
			})
			.filter((m) => m !== null)

		const { text, usage } = await generateText({
			system: prompt,
			model: google("gemini-2.5-flash"),
			providerOptions: {
				google: {
					...googleSafetySettings,
				},
			},
			messages: [
				...formattedMessages,
				{
					role: "user",
					content:
						"What are the repeated themes across the different campaigns? Anything else interesting to note?",
				},
			],
		})

		return { text, usage }
	},
})
