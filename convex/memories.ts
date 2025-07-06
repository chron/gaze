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

export const add = mutation({
	args: {
		campaignId: v.id("campaigns"),
		content: v.string(),
		embedding: v.array(v.float64()),
		importance: v.number(),
		relatedMessageId: v.optional(v.id("messages")),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("memories", {
			campaignId: args.campaignId,
			content: args.content,
			embedding: args.embedding,
			importance: args.importance,
			relatedMessageId: args.relatedMessageId,
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

export const scanForNewMemories = internalAction({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		const message = await ctx.runQuery(api.messages.get, {
			messageId: args.messageId,
		})

		if (!message) {
			throw new Error("Message not found")
		}

		// See if any memories are worth saving based on the content
		const { toolCalls } = await generateText({
			system:
				"You are a game master for a tabletop roleplaying game. You are tasked with creating a list of important memories based on the following message. Respond with a list of memories and an importance score from 1-10 for each.",
			prompt: message.content,
			tools: {
				memories: tool({
					description:
						"Respond with an array of memories, one string per memory.",
					parameters: z.object({
						memories: z.array(
							z.object({
								memory: z.string(),
								importance: z.number(),
							}),
						),
					}),
				}),
			},
			model: openai("gpt-4o-mini"),
			toolChoice: {
				type: "tool",
				toolName: "memories",
			},
		})

		for (const memoryList of toolCalls) {
			for (const memory of memoryList.args.memories) {
				const { embedding } = await embed({
					model: google.textEmbeddingModel("gemini-embedding-exp-03-07"),
					value: memory.memory,
				})

				await ctx.runMutation(api.memories.add, {
					campaignId: message.campaignId,
					content: memory.memory,
					importance: memory.importance,
					embedding,
					relatedMessageId: args.messageId,
				})
			}
		}
	},
})
