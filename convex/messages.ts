import { google } from "@ai-sdk/google"
import { streamText, tool } from "ai"
import { v } from "convex/values"
import { z } from "zod"
import { api, internal } from "./_generated/api"
import { internalAction, mutation, query } from "./_generated/server"

export const list = query({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("messages")
			.filter((q) => q.eq(q.field("campaignId"), args.campaignId))
			.collect()
	},
})

export const addUserMessage = mutation({
	args: {
		campaignId: v.id("campaigns"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("messages", {
			...args,
			role: "user",
		})

		await ctx.scheduler.runAfter(0, internal.messages.sendToLLM, {
			campaignId: args.campaignId,
		})
	},
})

export const addAssistantMessage = mutation({
	args: {
		campaignId: v.id("campaigns"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const messageId = await ctx.db.insert("messages", {
			...args,
			role: "assistant",
		})

		return messageId
	},
})

export const appendToMessage = mutation({
	args: {
		messageId: v.id("messages"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId)
		if (!message) throw new Error("Message not found")

		await ctx.db.patch(args.messageId, {
			content: message.content + args.content,
		})
	},
})

export const sendToLLM = internalAction({
	args: { campaignId: v.id("campaigns") },
	handler: async (ctx, args) => {
		// Fetch previous messages for the campaign
		const messages = await ctx.runQuery(api.messages.list, {
			campaignId: args.campaignId,
		})

		// Format messages for the LLM (user/assistant roles)
		const formattedMessages = messages.map((msg) => ({
			role: msg.role,
			content: msg.content,
		}))

		const assistantMessageId = await ctx.runMutation(
			api.messages.addAssistantMessage,
			{
				campaignId: args.campaignId,
				content: "",
			},
		)

		// Call Gemini via ai SDK
		const model = google("gemini-2.5-flash")
		const { textStream, toolCalls, toolResults } = streamText({
			model,
			messages: formattedMessages,
			maxSteps: 10,
			tools: {
				roll_dice: tool({
					description: "Roll one or more dice",
					parameters: z.object({
						number: z.number().min(1).max(100),
						faces: z.number().min(1).max(100),
					}),
					execute: async ({ number, faces }) => {
						console.log("rolling dice", number, faces)

						const results: number[] = []
						for (let i = 0; i < number; i++) {
							results.push(Math.floor(Math.random() * faces) + 1)
						}
						const total = results.reduce((acc, curr) => acc + curr, 0)
						return `Individual rolls: ${results.join(", ")}, total: ${total}`
					},
				}),
			},
			onError: async (error) => {
				await ctx.runMutation(api.messages.appendToMessage, {
					messageId: assistantMessageId,
					content: JSON.stringify(error.error),
				})
			},
			// onFinish: async (result) => {
			// 	await ctx.runMutation(api.messages.appendToMessage, {
			// 		messageId: assistantMessageId,
			// 		content: ` [${JSON.stringify(result)}]`,
			// 	})
			// },
		})

		for await (const textPart of textStream) {
			await ctx.runMutation(api.messages.appendToMessage, {
				messageId: assistantMessageId,
				content: textPart,
			})
		}

		// for (const toolResult of await toolResults) {
		// 	await ctx.runMutation(api.messages.appendToMessage, {
		// 		messageId: assistantMessageId,
		// 		content: ` [${JSON.stringify(toolResult)}]`,
		// 	})
		// }
	},
})
