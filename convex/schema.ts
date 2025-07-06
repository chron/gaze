import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
	profile: defineTable({
		name: v.string(),
	}),
	campaigns: defineTable({
		name: v.string(),
		description: v.string(),
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
	}),
})
