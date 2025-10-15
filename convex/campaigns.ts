import { google } from "@ai-sdk/google"
import { type LanguageModelUsage, type ModelMessage, generateText } from "ai"
import { v } from "convex/values"
import { api } from "./_generated/api"
import {
	action,
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server"
import { googleSafetySettings } from "./utils"

export const list = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

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

export const listInternal = internalQuery({
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
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

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

export const getInternal = internalQuery({
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
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const messages = await ctx.db
			.query("messages")
			.withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
			.collect()
		const tokens = messages.reduce(
			(acc, message) => {
				return {
					inputTokens: acc.inputTokens + (message.usage?.inputTokens ?? 0),
					outputTokens: acc.outputTokens + (message.usage?.outputTokens ?? 0),
				}
			},
			{ inputTokens: 0, outputTokens: 0 },
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
		enabledTools: v.optional(v.record(v.string(), v.boolean())),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const campaign = {
			name: args.name,
			description: args.description,
			imagePrompt: args.imagePrompt,
			gameSystemId: args.gameSystemId,
			model: args.model,
			imageModel: args.imageModel,
			archived: false,
			enabledTools: args.enabledTools,
			messageCount: 0,
			messageCountAtLastSummary: 0,
		}

		const campaignId = await ctx.db.insert("campaigns", campaign)

		// await ctx.scheduler.runAfter(0, internal.messages.sendToLLM, {
		// 	campaignId,
		// })

		return campaignId
	},
})

export const quickAddCampaign = mutation({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const campaignId = await ctx.db.insert("campaigns", {
			name: "",
			description: "",
			imagePrompt: "",
			model: "google/gemini-2.5-pro",
			imageModel: "gpt-image-1",
			archived: false,
			messageCount: 0,
			messageCountAtLastSummary: 0,
		})

		return campaignId
	},
})

export const update = mutation({
	args: {
		id: v.id("campaigns"),
		name: v.optional(v.string()),
		description: v.string(),
		imagePrompt: v.string(),
		gameSystemId: v.optional(v.id("gameSystems")),
		model: v.string(),
		imageModel: v.string(),
		enabledTools: v.optional(v.record(v.string(), v.boolean())),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		await ctx.db.patch(args.id, {
			name: args.name,
			description: args.description,
			imagePrompt: args.imagePrompt,
			gameSystemId: args.gameSystemId,
			model: args.model,
			imageModel: args.imageModel,
			enabledTools: args.enabledTools,
		})
	},
})

export const updateCampaignSummary = mutation({
	args: {
		campaignId: v.id("campaigns"),
		summary: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		await ctx.db.patch(args.campaignId, {
			lastCampaignSummary: args.summary,
		})
	},
})

export const updatePlan = mutation({
	args: {
		campaignId: v.id("campaigns"),
		plan: v.string(),
		part: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<void> => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const campaign = await ctx.db.get(args.campaignId)

		if (!campaign) {
			throw new Error("Campaign not found")
		}
		let newPlan: string | Record<string, string>

		if (args.part) {
			const oldPlan =
				typeof campaign.plan === "string"
					? { overall_story: campaign.plan }
					: campaign.plan
			newPlan = { ...oldPlan, [args.part]: args.plan }
		} else {
			newPlan = args.plan
		}

		await ctx.db.patch(args.campaignId, {
			plan: newPlan,
		})
	},
})

export const updateLastInteraction = mutation({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		await ctx.db.patch(args.campaignId, {
			lastInteractionAt: Date.now(),
		})
	},
})

export const lookForThemesInCampaignSummaries = action({
	handler: async (
		ctx,
	): Promise<{ text: string; usage: LanguageModelUsage }> => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const allCampaigns = await ctx.runQuery(api.campaigns.list, {})

		const prompt = `
		You are a game master, responsible for several different campaigns with the user. You will be given the name, description, and a full summary of each campaign.
		`

		const formattedMessages = allCampaigns
			.map((c) => {
				if (!c.lastCampaignSummary) {
					return null
				}

				return {
					role: "user",
					content: `## ${c.name}: ${c.description}\n\nTotal messages: ${c.messageCount}\n\n### Summary\n\n${c.lastCampaignSummary}`,
				} satisfies ModelMessage
			})
			.filter((m) => m !== null)

		const { text, usage } = await generateText({
			system: prompt,
			model: google("gemini-2.5-pro"),
			providerOptions: {
				google: {
					...googleSafetySettings,
				},
			},
			messages: [
				...formattedMessages,
				{
					role: "user",
					content: [
						{
							type: "text",
							text: "Given the user's preferences based on what you've seen, suggest some possible themes, settings, storylines, or other aspects for future campaigns in a similar vein.", // "What are the repeated themes across the different campaigns? Anything else interesting to note?",
						},
					],
				},
			],
		})

		return { text, usage }
	},
})

// Internal mutations (no auth required - for use within httpActions/internalActions)
export const updateInternal = internalMutation({
	args: {
		id: v.id("campaigns"),
		name: v.optional(v.string()),
		description: v.string(),
		imagePrompt: v.string(),
		gameSystemId: v.optional(v.id("gameSystems")),
		model: v.string(),
		imageModel: v.string(),
		enabledTools: v.optional(v.record(v.string(), v.boolean())),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, {
			name: args.name,
			description: args.description,
			imagePrompt: args.imagePrompt,
			gameSystemId: args.gameSystemId,
			model: args.model,
			imageModel: args.imageModel,
			enabledTools: args.enabledTools,
		})
	},
})

export const updateActiveCharactersInternal = internalMutation({
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

export const updatePlanInternal = internalMutation({
	args: {
		campaignId: v.id("campaigns"),
		plan: v.string(),
		part: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<void> => {
		const campaign = await ctx.db.get(args.campaignId)

		if (!campaign) {
			throw new Error("Campaign not found")
		}
		let newPlan: string | Record<string, string>

		if (args.part) {
			const oldPlan =
				typeof campaign.plan === "string"
					? { overall_story: campaign.plan }
					: campaign.plan
			newPlan = { ...oldPlan, [args.part]: args.plan }
		} else {
			newPlan = args.plan
		}

		await ctx.db.patch(args.campaignId, {
			plan: newPlan,
		})
	},
})

export const updateQuestInternal = internalMutation({
	args: {
		campaignId: v.id("campaigns"),
		title: v.string(),
		objective: v.string(),
		status: v.union(
			v.literal("active"),
			v.literal("completed"),
			v.literal("failed"),
		),
	},
	handler: async (ctx, args) => {
		const campaign = await ctx.db.get(args.campaignId)

		if (!campaign) {
			throw new Error("Campaign not found")
		}

		const existingQuest = campaign.questLog?.find(
			(quest) => quest.title === args.title,
		)

		if (existingQuest) {
			const newQuestLog = (campaign.questLog ?? []).map((quest) => {
				if (quest.title === args.title) {
					return { ...quest, objective: args.objective, status: args.status }
				}
				return quest
			})

			await ctx.db.patch(args.campaignId, {
				questLog: newQuestLog,
			})
		} else {
			await ctx.db.patch(args.campaignId, {
				questLog: [
					...(campaign.questLog ?? []),
					{ title: args.title, objective: args.objective, status: "active" },
				],
			})
		}
	},
})

export const updateClockInternal = internalMutation({
	args: {
		campaignId: v.id("campaigns"),
		name: v.string(),
		currentTicks: v.number(),
		maxTicks: v.number(),
		hint: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const campaign = await ctx.db.get(args.campaignId)

		if (!campaign) {
			throw new Error("Campaign not found")
		}

		const existingClock = campaign.clocks?.find(
			(clock) => clock.name === args.name,
		)

		if (existingClock) {
			const newClocks = (campaign.clocks ?? [])
				.map((clock) => {
					if (clock.name === args.name) {
						if (args.currentTicks >= args.maxTicks) {
							return null
						}

						return {
							name: args.name,
							currentTicks: args.currentTicks,
							maxTicks: args.maxTicks,
							hint: args.hint,
						}
					}
					return clock
				})
				.filter((clock) => clock !== null)

			await ctx.db.patch(args.campaignId, {
				clocks: newClocks,
			})
		} else {
			await ctx.db.patch(args.campaignId, {
				clocks: [
					...(campaign.clocks ?? []),
					{
						name: args.name,
						currentTicks: args.currentTicks,
						maxTicks: args.maxTicks,
						hint: args.hint,
					},
				],
			})
		}
	},
})

export const deleteClock = mutation({
	args: {
		campaignId: v.id("campaigns"),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const campaign = await ctx.db.get(args.campaignId)

		if (!campaign) {
			throw new Error("Campaign not found")
		}

		const newClocks = (campaign.clocks ?? []).filter(
			(clock) => clock.name !== args.name,
		)

		await ctx.db.patch(args.campaignId, {
			clocks: newClocks,
		})
	},
})

export const addActiveCharacterInternal = internalMutation({
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

export const incrementMessageCount = internalMutation({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const campaign = await ctx.db.get(args.campaignId)
		if (!campaign) {
			throw new Error("Campaign not found")
		}

		await ctx.db.patch(args.campaignId, {
			messageCount: campaign.messageCount + 1,
		})
	},
})

export const decrementMessageCount = internalMutation({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const campaign = await ctx.db.get(args.campaignId)
		if (!campaign) {
			throw new Error("Campaign not found")
		}

		await ctx.db.patch(args.campaignId, {
			messageCount: Math.max(0, campaign.messageCount - 1),
		})
	},
})

export const setMessageCountAtLastSummary = mutation({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const campaign = await ctx.db.get(args.campaignId)
		if (!campaign) {
			throw new Error("Campaign not found")
		}

		await ctx.db.patch(args.campaignId, {
			messageCountAtLastSummary: campaign.messageCount,
		})
	},
})
