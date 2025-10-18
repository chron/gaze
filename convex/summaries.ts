import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { v } from "convex/values"
import { z } from "zod"
import { api, internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { action, internalMutation, internalQuery } from "./_generated/server"
import { MESSAGES_TO_KEEP_AFTER_COLLAPSE } from "./prompts/core"

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
	handler: async (ctx, args): Promise<Id<"jobProgress">> => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		// Create a job to track progress
		const jobId: Id<"jobProgress"> = await ctx.runMutation(
			api.jobProgress.create,
			{
				campaignId: args.campaignId,
				type: "collapseHistory",
				steps: [
					{ title: "Loading messages", description: "Fetching chat history" },
					{
						title: "Analyzing chapters",
						description: "Breaking history into chapters",
					},
				],
			},
		)

		try {
			// Step 1: Load messages
			await ctx.runMutation(api.jobProgress.updateStep, {
				jobId,
				stepIndex: 0,
				status: "running",
			})

			const messages = await ctx.runQuery(api.messages.list, {
				campaignId: args.campaignId,
			})

			const characters = await ctx.runQuery(api.characters.list, {
				campaignId: args.campaignId,
			})

			await ctx.runMutation(api.jobProgress.updateStep, {
				jobId,
				stepIndex: 0,
				status: "completed",
			})

			// Step 2: Analyze chapters
			await ctx.runMutation(api.jobProgress.updateStep, {
				jobId,
				stepIndex: 1,
				status: "running",
			})

			const prompt = `
   You will be given a transcript of a role-playing game session. You need to break it up into chapters
	 and provide a summary of each chapter. Along with the summary include a list of characters that were
	 present in the chapter.

	 Each message will begin with a number in square brackets. This is the message index.
	 Return the start and end message indices for each chapter.

	 Here are the characters that are available:
	 ${characters.map((c: { name: string }) => c.name).join(", ")}
    `

			type FormattedMessage = {
				id: Id<"messages">
				role: "user" | "assistant"
				content: string
			}

			const formattedMessages = messages
				.map((message): FormattedMessage | null => {
					if (message.role === "tool") {
						return {
							id: message._id,
							role: "user" as const,
							content: message.content.map(() => "<tool response>").join(""),
						}
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
				.filter((message): message is FormattedMessage => message !== null)
				.slice(0, -MESSAGES_TO_KEEP_AFTER_COLLAPSE) // Keep the last N messages so we have full access to the recent content
				.map((message, index) => {
					return {
						...message,
						content: `[${index}] ${message.content}`,
					}
				})

			const chaptersSchema = z.object({
				chapters: z.array(
					z.object({
						summary: z.string(),
						startMessageIndex: z.number(),
						endMessageIndex: z.number(),
						characters: z.array(z.string()),
					}),
				),
			})

			const { object } = await generateObject({
				system: prompt,
				model: google("gemini-2.5-flash"),
				messages: formattedMessages,
				schema: chaptersSchema,
			})

			await ctx.runMutation(api.jobProgress.updateStep, {
				jobId,
				stepIndex: 1,
				status: "completed",
			})

			const chapters = object.chapters

			// Create steps for each chapter summary (ignore the last one as it might be in progress)
			const chaptersToProcess = chapters.slice(0, -1)
			for (let i = 0; i < chaptersToProcess.length; i++) {
				const chapter = chaptersToProcess[i]

				// Add new step for this chapter
				const stepIndex = await ctx.runMutation(api.jobProgress.addStep, {
					jobId,
					title: `Chapter ${i + 1}`,
					description: chapter.summary,
					status: "running",
				})

				const relevantCharacterIds = characters
					.filter((c: { name: string }) => chapter.characters.includes(c.name))
					.map((c: (typeof characters)[0]) => c._id)

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

				// Update step to completed with the summary data
				await ctx.runMutation(api.jobProgress.updateStep, {
					jobId,
					stepIndex,
					status: "completed",
					data: {
						summary: chapter.summary,
						characters: chapter.characters,
					},
				})
			}

			// Mark job as complete
			await ctx.runMutation(api.jobProgress.complete, {
				jobId,
				success: true,
			})

			return jobId
		} catch (error) {
			// Mark job as failed
			await ctx.runMutation(api.jobProgress.complete, {
				jobId,
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			})
			throw error
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
