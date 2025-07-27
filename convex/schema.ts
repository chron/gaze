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
			plan: v.optional(v.string()),
			archived: v.optional(v.boolean()),
			activeCharacters: v.optional(v.array(v.string())),
		}).index("by_archived", ["archived"]),
		characterSheets: defineTable({
			campaignId: v.id("campaigns"),
			name: v.string(),
			description: v.optional(v.string()),
			data: v.optional(v.record(v.string(), v.any())),
			inventory: v.optional(v.array(v.string())), // TODO: remove
			xp: v.optional(v.number()), // TODO: remove
		}),
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
						args: v.any(),
					}),
					v.object({
						type: v.literal("tool-result"),
						toolCallId: v.string(),
						toolName: v.string(),
						result: v.any(),
						isError: v.optional(v.boolean()),
					}),
					// Legacy tool call
					// v.object({
					// 	type: v.literal("tool_call"),
					// 	toolName: v.string(),
					// 	parameters: v.any(),
					// 	result: v.optional(v.any()),
					// 	toolCallId: v.optional(v.string()),
					// }),
				),
			),
			reasoning: v.optional(v.string()),
			scene: v.optional(
				v.object({
					description: v.string(),
					backgroundColor: v.optional(v.string()),
					image: v.optional(v.id("_storage")),
					prompt: v.optional(v.string()),
					activeCharacters: v.optional(v.array(v.string())),
				}),
			),
			usage: v.optional(
				v.object({
					promptTokens: v.number(),
					completionTokens: v.number(),
				}),
			),
		})
			.index("by_campaign", ["campaignId"])
			.index("by_streamId", ["streamId"]),
		memories: defineTable({
			campaignId: v.id("campaigns"),
			type: v.string(),
			summary: v.string(),
			context: v.string(),
			tags: v.array(v.string()),
			embedding: v.array(v.float64()),
		}).vectorIndex("by_embedding", {
			vectorField: "embedding",
			dimensions: 3072,
			filterFields: ["campaignId"],
		}),
		characters: defineTable({
			campaignId: v.id("campaigns"),
			name: v.string(),
			description: v.string(),
			image: v.optional(v.id("_storage")),
		}),
	},
	// For doing migrations and whatnot
	{
		schemaValidation: false,
	},
)
