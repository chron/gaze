import { google } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { v } from "convex/values"
import z from "zod"
import { api, internal } from "./_generated/api"
import { action, internalMutation, internalQuery } from "./_generated/server"

export const list = internalQuery({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("summaries")
			.withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
			.collect()
	},
})

export const collapseHistory = action({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const messages = await ctx.runQuery(api.messages.list, {
			campaignId: args.campaignId,
		})

		const characters = await ctx.runQuery(api.characters.list, {
			campaignId: args.campaignId,
		})

		const prompt = `
   You will be given a transcript of a role-playing game session. You need to break it up into chapters
	 and provide a summary of each chapter. Along with the summary include a list of characters that were
	 present in the chapter.

	 Each message will begin with a number in square brackets. This is the message index.
	 Return the start and end message indices for each chapter.

	 Here are the characters that are available:
	 ${characters.map((c) => c.name).join(", ")}
    `

		const formattedMessages = messages
			.map((message) => {
				// TODO: we need to somehow mark these tool messages otherwise they will keep coming back!
				if (message.role === "tool") {
					return null
				}

				return {
					id: message._id,
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
			.slice(0, -60) // Keep the last 60 messages so we have full access to the recent content
			.map((message, index) => {
				return {
					...message,
					content: `[${index}] ${message.content}`,
				}
			})

		await ctx.scheduler.runAfter(0, internal.memories.scanForNewMemories, {
			messageIds: formattedMessages.map((msg) => msg.id),
		})

		const { toolCalls } = await generateText({
			system: prompt,
			model: google("gemini-2.5-flash"),
			messages: formattedMessages,
			toolChoice: {
				type: "tool",
				toolName: "chapters",
			},
			tools: {
				chapters: tool({
					description: "A list of chapters in the story",
					parameters: z.object({
						chapters: z.array(
							z.object({
								summary: z.string(),
								startMessageIndex: z.number(),
								endMessageIndex: z.number(),
								characters: z.array(z.string()),
							}),
						),
					}),
				}),
			},
		})

		const chapters = toolCalls[0].args.chapters

		// Ignore the last chapter because it might be in progress
		for (const chapter of chapters.slice(0, -1)) {
			const relevantCharacterIds = characters
				.filter((c) => chapter.characters.includes(c.name))
				.map((c) => c._id)

			const summaryId = await ctx.runMutation(internal.summaries.create, {
				campaignId: args.campaignId,
				summary: chapter.summary,
				characterIds: relevantCharacterIds,
			})

			const startMessageIndex = chapter.startMessageIndex
			const endMessageIndex = chapter.endMessageIndex

			const relevantMessages = formattedMessages.slice(
				startMessageIndex,
				endMessageIndex + 1,
			)

			for (const message of relevantMessages) {
				await ctx.runMutation(api.messages.setSummaryId, {
					messageId: message.id,
					summaryId: summaryId,
				})
			}
		}
	},
})

export const create = internalMutation({
	args: {
		campaignId: v.id("campaigns"),
		summary: v.string(),
		characterIds: v.array(v.id("characters")),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("summaries", {
			campaignId: args.campaignId,
			summary: args.summary,
			characterIds: args.characterIds,
		})
	},
})
