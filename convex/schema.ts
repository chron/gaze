import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema(
	{
		gameSystems: defineTable({
			name: v.string(),
			prompt: v.string(),
			defaultCharacterData: v.optional(v.record(v.string(), v.any())),
			files: v.array(
				v.object({
					storageId: v.id("_storage"),
					filename: v.string(),
				}),
			),
			reference: v.optional(v.string()),
		}),
		campaigns: defineTable({
			name: v.string(),
			description: v.string(),
			imagePrompt: v.string(),
			gameSystemId: v.optional(v.id("gameSystems")),
			model: v.string(),
			imageModel: v.string(),
			plan: v.optional(v.union(v.string(), v.record(v.string(), v.string()))),
			questLog: v.optional(
				v.array(
					v.object({
						title: v.string(),
						objective: v.string(),
						status: v.union(
							v.literal("active"),
							v.literal("completed"),
							v.literal("failed"),
						),
					}),
				),
			),
			clocks: v.optional(
				v.array(
					v.object({
						name: v.string(),
						currentTicks: v.number(),
						maxTicks: v.number(),
						hint: v.optional(v.string()),
					}),
				),
			),
			temporal: v.optional(
				v.object({
					date: v.string(),
					timeOfDay: v.union(
						v.literal("dawn"),
						v.literal("morning"),
						v.literal("midday"),
						v.literal("afternoon"),
						v.literal("dusk"),
						v.literal("evening"),
						v.literal("night"),
						v.literal("midnight"),
					),
					notes: v.optional(v.string()),
				}),
			),
			archived: v.boolean(),
			activeCharacters: v.optional(v.array(v.string())),
			lastInteractionAt: v.optional(v.number()),
			lastCampaignSummary: v.optional(v.string()),
			enabledTools: v.optional(v.record(v.string(), v.boolean())),
			messageCount: v.number(),
			messageCountAtLastSummary: v.number(),
			primaryCharacterId: v.optional(v.id("characters")),
		})
			.index("by_archived", ["archived"])
			.index("by_lastInteractionAt", ["lastInteractionAt"]),
		characterSheets: defineTable({
			campaignId: v.id("campaigns"),
			name: v.string(),
			description: v.optional(v.string()),
			data: v.optional(v.record(v.string(), v.any())),
			inventory: v.optional(v.array(v.string())), // TODO: remove
			xp: v.optional(v.number()), // TODO: remove
		})
			.index("by_campaignId", ["campaignId"])
			.index("by_campaignId_and_name", ["campaignId", "name"]),
		messages: defineTable({
			campaignId: v.id("campaigns"),
			streamId: v.optional(v.string()),
			role: v.union(
				v.literal("user"),
				v.literal("assistant"),
				v.literal("tool"),
			),
			content: v.array(
				v.union(
					v.object({
						type: v.literal("text"),
						text: v.string(),
					}),
					v.object({
						type: v.literal("reasoning"),
						text: v.string(),
					}),
					v.object({
						type: v.literal("tool-call"),
						toolName: v.string(),
						toolCallId: v.string(),
						// v5 uses 'input', but we keep 'args' for backwards compat
						args: v.optional(v.any()),
						input: v.optional(v.any()),
					}),
					v.object({
						type: v.literal("tool-result"),
						toolCallId: v.string(),
						toolName: v.string(),
						result: v.any(),
						isError: v.optional(v.boolean()),
					}),
				),
			),
			// New place to persist tool results alongside the originating assistant message
			toolResults: v.optional(
				v.array(
					v.object({
						type: v.literal("tool-result"),
						toolCallId: v.string(),
						toolName: v.string(),
						result: v.any(),
						isError: v.optional(v.boolean()),
					}),
				),
			),
			error: v.optional(v.string()),
			reasoningText: v.optional(v.string()),
			scene: v.optional(
				v.object({
					description: v.string(),
					backgroundColor: v.optional(v.string()),
					image: v.optional(v.id("_storage")),
					prompt: v.optional(v.string()),
					activeCharacters: v.optional(v.array(v.string())),
				}),
			),
			audio: v.optional(v.array(v.id("_storage"))),
			summaryId: v.optional(v.id("summaries")),
			usage: v.optional(
				v.object({
					inputTokens: v.number(),
					outputTokens: v.number(),
					totalTokens: v.number(),
					reasoningTokens: v.number(),
					cachedInputTokens: v.number(),
				}),
			),
		})
			.index("by_campaign", ["campaignId"])
			.index("by_campaignId_and_summaryId", ["campaignId", "summaryId"])
			.index("by_streamId", ["streamId"]),
		memories: defineTable({
			campaignId: v.id("campaigns"),
			type: v.string(),
			summary: v.string(),
			context: v.string(),
			tags: v.array(v.string()),
			embedding: v.array(v.float64()),
			summaryId: v.optional(v.id("summaries")),
		})
			.vectorIndex("by_embedding", {
				vectorField: "embedding",
				dimensions: 3072,
				filterFields: ["campaignId"],
			})
			.index("by_campaignId", ["campaignId"]),
		summaries: defineTable({
			campaignId: v.id("campaigns"),
			summary: v.string(),
			characterIds: v.array(v.id("characters")),
		}).index("by_campaign", ["campaignId"]),
		characters: defineTable({
			campaignId: v.id("campaigns"),
			name: v.string(),
			description: v.string(),
			imagePrompt: v.string(),
			image: v.optional(v.id("_storage")),
			humeVoiceId: v.optional(v.string()),
			active: v.boolean(),
		})
			.index("by_campaignId", ["campaignId"])
			.index("by_campaignId_and_name", ["campaignId", "name"]),
		jobProgress: defineTable({
			campaignId: v.id("campaigns"),
			type: v.string(), // e.g., "collapseHistory", "generateSummary"
			status: v.union(
				v.literal("running"),
				v.literal("completed"),
				v.literal("failed"),
			),
			currentStep: v.optional(v.string()),
			steps: v.array(
				v.object({
					title: v.string(),
					description: v.optional(v.string()),
					status: v.union(
						v.literal("pending"),
						v.literal("running"),
						v.literal("completed"),
						v.literal("failed"),
					),
					data: v.optional(v.any()), // For storing step-specific data like summaries
				}),
			),
			error: v.optional(v.string()),
			startedAt: v.number(),
			completedAt: v.optional(v.number()),
		})
			.index("by_campaign", ["campaignId"])
			.index("by_campaign_and_type", ["campaignId", "type"]),
	},
	// For doing migrations and whatnot
	{
		schemaValidation: false,
	},
)
