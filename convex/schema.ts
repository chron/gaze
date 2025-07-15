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
		}),
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
			role: v.union(v.literal("user"), v.literal("assistant")),
			content: v.array(
				v.union(
					v.object({
						type: v.literal("text"),
						text: v.string(),
					}),
					v.object({
						type: v.literal("tool_call"),
						toolName: v.string(),
						parameters: v.any(),
						result: v.optional(v.any()),
						toolCallId: v.optional(v.string()),
					}),
				),
			),
			reasoning: v.optional(v.string()),
			scene: v.optional(
				v.object({
					description: v.string(),
					backgroundColor: v.string(),
				}),
			),
			usage: v.optional(
				v.object({
					promptTokens: v.number(),
					completionTokens: v.number(),
				}),
			),
		}).index("by_campaign", ["campaignId"]),
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
	// {
	// 	schemaValidation: false,
	// },
)
