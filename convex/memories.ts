import { google } from "@ai-sdk/google"
import { openai } from "@ai-sdk/openai"
import { embed, generateText, tool } from "ai"
import { v } from "convex/values"
import z from "zod"
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
		return await ctx.db
			.query("memories")
			.filter((q) => q.eq(q.field("campaignId"), args.campaignId))
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

		const formattedMessages = messages.map((message) => ({
			role: message.role,
			content: message.content
				.map((block) => {
					if (block.type === "text") {
						return block.text
					}

					return `[${block.toolName}: ${JSON.stringify(block.parameters)} -> ${JSON.stringify(block.result)}]`
				})
				.join(""),
		}))

		// See if any memories are worth saving based on the content
		const { toolCalls } = await generateText({
			system: extractMemories,
			messages: formattedMessages,
			tools: {
				memories: tool({
					description:
						"Respond with an array of memories that you have identified in the transcript.",
					parameters: z.object({
						memories: z.array(
							z.object({
								type: z.string(),
								summary: z.string(),
								context: z.string(),
								tags: z.array(z.string()),
							}),
						),
					}),
				}),
			},
			model: google("gemini-2.5-flash"),
			toolChoice: {
				type: "tool",
				toolName: "memories",
			},
		})

		for (const memoryList of toolCalls) {
			for (const memory of memoryList.args.memories) {
				const { embedding } = await embed({
					model: google.textEmbeddingModel("gemini-embedding-exp-03-07"),
					value: memory.summary,
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
		}
	},
})
