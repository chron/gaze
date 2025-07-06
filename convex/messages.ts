import { google } from "@ai-sdk/google"
import { streamText, tool } from "ai"
import { v } from "convex/values"
import { z } from "zod"
import { api, internal } from "./_generated/api"
import { internalAction, mutation, query } from "./_generated/server"
import systemPrompt from "./prompts/system"

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

export const getLastScene = query({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("messages")
			.filter((q) => q.eq(q.field("campaignId"), args.campaignId))
			.order("desc")
			.first()
	},
})

export const addUserMessage = mutation({
	args: {
		campaignId: v.id("campaigns"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		if (args.content.length === 0) {
			throw new Error("Content cannot be empty")
		}

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

export const addSceneToMessage = mutation({
	args: {
		messageId: v.id("messages"),
		scene: v.object({
			description: v.string(),
			backgroundColor: v.string(),
		}),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.messageId, {
			scene: args.scene,
		})
	},
})

export const addUsageToMessage = mutation({
	args: {
		messageId: v.id("messages"),
		usage: v.object({
			promptTokens: v.number(),
			completionTokens: v.number(),
		}),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.messageId, {
			usage: args.usage,
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

		// Put together the main prompt
		let characterSheet = await ctx.runQuery(api.characterSheets.get, {
			campaignId: args.campaignId,
		})

		if (!characterSheet) {
			// TODO: can you do this in one operation?
			await ctx.runMutation(api.characterSheets.create, {
				campaignId: args.campaignId,
			})

			characterSheet = await ctx.runQuery(api.characterSheets.get, {
				campaignId: args.campaignId,
			})
		}

		// TODO: let's move to a real templating engine
		const prompt = `${systemPrompt}\n\nHere is the character sheet for the player: ${JSON.stringify(
			characterSheet,
		)}`

		const model = google("gemini-2.5-flash")
		const { textStream, usage } = streamText({
			system: prompt,
			model,
			messages: formattedMessages,
			maxSteps: 10,
			tools: {
				update_character_sheet: tool({
					description:
						"Update the player's character sheet with any changes, including when they set their name or when their stats change.",
					parameters: z.object({
						name: z.string(),
						description: z.string(),
						xp: z.number(),
						inventory: z.array(z.string()),
					}),
					execute: async ({ name, description, xp, inventory }) => {
						if (!characterSheet) {
							throw new Error("Character sheet not found")
						}

						await ctx.runMutation(api.characterSheets.update, {
							characterSheetId: characterSheet._id,
							name,
							description,
							xp,
							inventory,
						})

						return `Character sheet updated: ${name}, ${xp}, ${JSON.stringify(inventory)}`
					},
				}),
				change_scene: tool({
					description:
						"Whenever the scene changes, use this tool to describe the new scene. The background color should be a hex code that can be used with black text in the main chat interface. The description will be used to create an image.",
					parameters: z.object({
						description: z.string(),
						backgroundColor: z.string(),
					}),
					execute: async ({ description, backgroundColor }) => {
						await ctx.runMutation(api.messages.addSceneToMessage, {
							messageId: assistantMessageId,
							scene: {
								description,
								backgroundColor,
							},
						})
					},
				}),
				introduce_character: tool({
					description:
						"Whenever a new NPC is introduced, use this tool to describe the character. The NPC should have a name, and description, which will be used to generate an image.",
					parameters: z.object({
						name: z.string(),
						description: z.string(),
					}),
					execute: async ({ name, description }) => {
						const characterId = await ctx.runMutation(api.characters.create, {
							name,
							description,
							campaignId: args.campaignId,
						})

						await ctx.scheduler.runAfter(
							0,
							api.characters.generateImageForCharacter,
							{
								characterId,
							},
						)
					},
				}),
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
		})

		for await (const textPart of textStream) {
			await ctx.runMutation(api.messages.appendToMessage, {
				messageId: assistantMessageId,
				content: textPart,
			})
		}

		const usageInfo = await usage
		await ctx.runMutation(api.messages.addUsageToMessage, {
			messageId: assistantMessageId,
			usage: {
				promptTokens: usageInfo.promptTokens,
				completionTokens: usageInfo.completionTokens,
			},
		})
	},
})
