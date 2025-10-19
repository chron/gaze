import { google } from "@ai-sdk/google"
import { embed, generateObject } from "ai"
import { v } from "convex/values"
import { z } from "zod"
import { api, internal } from "./_generated/api"
import {
	internalAction,
	internalQuery,
	mutation,
	query,
} from "./_generated/server"
import extractMemories from "./prompts/extractMemories"

export const add = mutation({
	args: {
		campaignId: v.id("campaigns"),
		type: v.string(),
		summary: v.string(),
		context: v.string(),
		tags: v.array(v.string()),
		embedding: v.array(v.float64()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		await ctx.db.insert("memories", {
			campaignId: args.campaignId,
			type: args.type,
			summary: args.summary,
			context: args.context,
			tags: args.tags,
			embedding: args.embedding,
		})
	},
})

export const count = internalQuery({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		return (
			await ctx.db
				.query("memories")
				.withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
				.collect()
		).length
	},
})
export const findMany = internalQuery({
	args: {
		ids: v.array(v.id("memories")),
	},
	handler: async (ctx, args) => {
		const results = []
		for (const id of args.ids) {
			const doc = await ctx.db.get(id)
			if (doc === null) {
				continue
			}
			results.push(doc)
		}
		return results
	},
})

export const list = query({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		return await ctx.db
			.query("memories")
			.withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
			.collect()
	},
})

export const scanForNewMemories = internalAction({
	args: {
		messageIds: v.array(v.id("messages")),
	},
	handler: async (ctx, args) => {
		const messages = await ctx.runQuery(internal.messages.getMany, {
			ids: args.messageIds,
		})

		const formattedMessages = messages
			.map((message) => {
				if (message.role === "tool") {
					return null
				}

				return {
					role: message.role,
					content: message.content
						.map((block) => {
							if (block.type === "text") {
								return block.text
							}

							return ""
						})
						.join(""),
				}
			})
			.filter((message) => message !== null)

		// See if any memories are worth saving based on the content
		const memoriesSchema = z.object({
			memories: z.array(
				z.object({
					type: z.string(),
					summary: z.string(),
					context: z.string(),
					tags: z.array(z.string()),
				}),
			),
		})

		const { object } = await generateObject({
			system: extractMemories,
			messages: formattedMessages,
			schema: memoriesSchema,
			model: google("gemini-2.5-flash"),
		})

		for (const memory of object.memories) {
			const { embedding } = await embed({
				model: google.textEmbeddingModel("gemini-embedding-exp-03-07"),
				value: memory.summary,
				providerOptions: {
					google: {
						embeddingTaskType: "RETRIEVAL_DOCUMENT",
					},
				},
			})

			await ctx.runMutation(api.memories.add, {
				campaignId: messages[0].campaignId,
				type: memory.type,
				summary: memory.summary,
				context: memory.context,
				tags: memory.tags,
				embedding,
			})
		}
	},
})
