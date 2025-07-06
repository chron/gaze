import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
	profile: defineTable({
		name: v.string(),
	}),
	campaigns: defineTable({
		name: v.string(),
		description: v.string(),
		imagePrompt: v.string(),
	}),
	characterSheets: defineTable({
		campaignId: v.id("campaigns"),
		name: v.string(),
		description: v.optional(v.string()),
		xp: v.number(),
		inventory: v.array(v.string()),
	}),
	messages: defineTable({
		campaignId: v.id("campaigns"),
		role: v.union(v.literal("user"), v.literal("assistant")),
		content: v.string(),
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
	}),
	characters: defineTable({
		campaignId: v.id("campaigns"),
		name: v.string(),
		description: v.string(),
		image: v.optional(v.id("_storage")),
	}),
})
