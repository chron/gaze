import { google } from "@ai-sdk/google"
import { openai } from "@ai-sdk/openai"
import {
	type CoreAssistantMessage,
	type CoreUserMessage,
	embed,
	generateText,
	streamText,
	tool,
} from "ai"
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { z } from "zod"
import { api, internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import {
	action,
	internalAction,
	internalQuery,
	mutation,
	query,
} from "./_generated/server"
import systemPrompt from "./prompts/system"

export const get = query({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.messageId)
	},
})

export const getMany = internalQuery({
	args: {
		ids: v.array(v.id("messages")),
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
			.query("messages")
			.withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
			.collect()
	},
})

export const paginatedList = query({
	args: {
		campaignId: v.id("campaigns"),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("messages")
			.withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
			.order("desc")
			.paginate(args.paginationOpts)
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
			.filter((q) => q.neq(q.field("scene"), undefined))
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
			campaignId: args.campaignId,
			role: "user",
			content: [
				{
					type: "text",
					text: args.content,
				},
			],
		})

		await ctx.scheduler.runAfter(0, internal.messages.sendToLLM, {
			campaignId: args.campaignId,
		})
	},
})

export const addAssistantMessage = mutation({
	args: {
		campaignId: v.id("campaigns"),
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
					timestamp: v.optional(v.number()),
				}),
			),
		),
	},
	handler: async (ctx, args) => {
		const messageId = await ctx.db.insert("messages", {
			campaignId: args.campaignId,
			role: "assistant",
			content: args.content,
		})

		return messageId
	},
})

export const appendTextBlock = mutation({
	args: {
		messageId: v.id("messages"),
		text: v.string(),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId)
		if (!message) throw new Error("Message not found")

		const lastBlock = message.content[message.content.length - 1]

		// If the last block is a text block, append to it
		if (lastBlock && lastBlock.type === "text") {
			const updatedContent = [...message.content]
			updatedContent[updatedContent.length - 1] = {
				type: "text",
				text: lastBlock.text + args.text,
			}
			await ctx.db.patch(args.messageId, {
				content: updatedContent,
			})
		} else {
			// Otherwise, add a new text block
			await ctx.db.patch(args.messageId, {
				content: [
					...message.content,
					{
						type: "text",
						text: args.text,
					},
				],
			})
		}
	},
})

export const appendToolCallBlock = mutation({
	args: {
		messageId: v.id("messages"),
		toolName: v.string(),
		parameters: v.any(),
		result: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId)
		if (!message) throw new Error("Message not found")

		await ctx.db.patch(args.messageId, {
			content: [
				...message.content,
				{
					type: "tool_call",
					toolName: args.toolName,
					parameters: args.parameters,
					result: args.result,
				},
			],
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

export const performUserDiceRoll = mutation({
	args: {
		messageId: v.id("messages"),
		toolCallIndex: v.number(),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId)
		if (!message) throw new Error("Message not found")

		const toolCall = message.content[args.toolCallIndex]
		if (
			!toolCall ||
			toolCall.type !== "tool_call" ||
			toolCall.toolName !== "roll_dice"
		) {
			throw new Error("Invalid dice roll tool call")
		}

		if (toolCall.result !== null) {
			throw new Error("Dice roll has already been performed")
		}

		const { number, faces } = toolCall.parameters

		// Generate the dice roll results
		const results: number[] = []
		for (let i = 0; i < number; i++) {
			results.push(Math.floor(Math.random() * faces) + 1)
		}
		const total = results.reduce((acc, curr) => acc + curr, 0)

		// Update the tool call with the results
		const updatedContent = [...message.content]
		updatedContent[args.toolCallIndex] = {
			...toolCall,
			result: { results, total },
		}

		await ctx.db.patch(args.messageId, {
			content: updatedContent,
		})

		await ctx.scheduler.runAfter(0, internal.messages.sendToLLM, {
			campaignId: message.campaignId,
		})

		return { results, total }
	},
})

export const sendToLLM = internalAction({
	args: { campaignId: v.id("campaigns") },
	handler: async (ctx, args) => {
		const campaign = await ctx.runQuery(api.campaigns.get, {
			id: args.campaignId,
		})

		if (!campaign) {
			throw new Error("Campaign not found")
		}

		// Fetch previous messages for the campaign
		const messages = await ctx.runQuery(api.messages.list, {
			campaignId: args.campaignId,
		})

		const formattedMessages: (CoreUserMessage | CoreAssistantMessage)[] =
			messages.map((msg) => ({
				role: msg.role,
				content: msg.content
					.map((block) => {
						if (block.type === "text") {
							return block.text
						}

						return `[${block.toolName}: ${JSON.stringify(block.parameters)} -> ${JSON.stringify(block.result)}]`
					})
					.join(""),
			}))

		const assistantMessageId = await ctx.runMutation(
			api.messages.addAssistantMessage,
			{
				campaignId: args.campaignId,
				content: [],
			},
		)

		let formattedFiles: {
			type: "file"
			data: string
			mimeType: string
			filename: string
		}[] = []

		let gameSystem: // TODO: there MUST be a way to get this type properly
			| (Omit<Doc<"gameSystems">, "files"> & {
					files: {
						storageId: Id<"_storage">
						filename: string
						url: string | null
					}[]
			  })
			| null = null

		if (campaign.gameSystemId) {
			gameSystem = await ctx.runQuery(api.gameSystems.get, {
				id: campaign.gameSystemId,
			})

			if (gameSystem) {
				formattedFiles = gameSystem.files.slice(0, 2).map((file) => ({
					type: "file",
					data: file.url || "", // TODO: filter these out maybe
					mimeType: "application/pdf", // TODO: unhardcode this
					filename: file.filename,
				}))
			}
		}

		let characterSheet = await ctx.runQuery(api.characterSheets.get, {
			campaignId: args.campaignId,
		})

		if (!characterSheet) {
			// TODO: can you do this in one operation?
			await ctx.runMutation(api.characterSheets.create, {
				campaignId: args.campaignId,
				data: gameSystem?.defaultCharacterData ?? {},
			})

			characterSheet = await ctx.runQuery(api.characterSheets.get, {
				campaignId: args.campaignId,
			})
		}

		const characters = await ctx.runQuery(api.characters.list, {
			campaignId: args.campaignId,
		})

		const lastMessage = formattedMessages[formattedMessages.length - 1]
		const { embedding } = await embed({
			model: google.textEmbeddingModel("gemini-embedding-exp-03-07"),
			value: lastMessage.content,
		})

		const memoryRefs = await ctx.vectorSearch("memories", "by_embedding", {
			vector: embedding,
			limit: 10,
			filter: (q) => q.eq("campaignId", args.campaignId),
		})

		const memories = await ctx.runQuery(internal.memories.findMany, {
			ids: memoryRefs.map((ref) => ref._id),
		})

		const serializedCharacters = characters.map((character) => ({
			name: character.name,
			description: character.description,
		}))

		const serializedMemories = memories.map((memory) => ({
			type: memory.type,
			summary: memory.summary,
			context: memory.context,
			tags: memory.tags,
		}))

		const formattedCharacterSheet = characterSheet
			? {
					name: characterSheet.name,
					description: characterSheet.description,
					data: characterSheet.data,
				}
			: null

		// TODO: let's move to a real templating engine
		let prompt = systemPrompt

		prompt += gameSystem
			? `\n\nYou are hosting a game of ${gameSystem.name}\n\n${gameSystem.prompt}`
			: ""

		prompt += `\n\nHere is the character sheet for the player: ${JSON.stringify(
			formattedCharacterSheet,
		)}`

		if (serializedCharacters.length > 0) {
			prompt += `\n\nHere are the existing characters: ${JSON.stringify(
				serializedCharacters,
			)}`
		}

		if (serializedMemories.length > 0) {
			prompt += `\n\nHere are some memories from the game that might relate to this situation: ${JSON.stringify(
				serializedMemories,
			)}`
		}

		if (formattedFiles.length > 0) {
			formattedMessages.push({
				role: "user",
				content: [
					{
						type: "text",
						text: "Here are the files that are relevant to the game system:",
					},
					...formattedFiles,
				],
			})
		}

		// I actually don't think this is necessary

		// Check if this is a continuation after a dice roll
		// const lastRawMessage = messages[messages.length - 1]
		// const hasDiceRoll = lastRawMessage?.content.some(
		// 	(c) => c.type === "tool_call" && c.toolName === "roll_dice",
		// )

		// if (hasDiceRoll) {
		// 	formattedMessages.push({
		// 		role: "user",
		// 		content: "Continue based on the dice roll result above.",
		// 	})
		// }

		const model = google("gemini-2.5-flash")
		const { textStream, usage, finishReason, toolCalls } = streamText({
			system: prompt,
			model,
			messages: formattedMessages,
			maxSteps: 10,
			tools: {
				update_character_sheet: tool({
					description:
						"Update the player's character sheet with any changes, including changes to their name, stats, conditions, or notes.",
					parameters: z.object({
						name: z.string(),
						description: z.string(),
						data: z.record(z.string(), z.any()),
					}),
					execute: async ({ name, description, data }) => {
						if (!characterSheet) {
							throw new Error("Character sheet not found")
						}

						await ctx.runMutation(api.characterSheets.update, {
							characterSheetId: characterSheet._id,
							name,
							description,
							data,
						})

						await ctx.runMutation(api.messages.appendToolCallBlock, {
							messageId: assistantMessageId,
							toolName: "update_character_sheet",
							parameters: { name, description, data },
							result: "Successfully updated character sheet",
						})

						return `Character sheet updated: ${name}, ${JSON.stringify(data)}`
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

						await ctx.runMutation(api.messages.appendToolCallBlock, {
							messageId: assistantMessageId,
							toolName: "change_scene",
							parameters: { description, backgroundColor },
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
					description:
						"Present one or more dice to the user, and ask them to roll them. The user will click the dice to roll them.",
					parameters: z.object({
						number: z.number().min(1).max(100),
						faces: z.number().min(1).max(100),
					}),
				}),
			},
			onError: async (error) => {
				await ctx.runMutation(api.messages.appendTextBlock, {
					messageId: assistantMessageId,
					text: JSON.stringify(error.error),
				})
			},
		})

		for await (const textPart of textStream) {
			await ctx.runMutation(api.messages.appendTextBlock, {
				messageId: assistantMessageId,
				text: textPart,
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

		// We need to handle dice rolls without an execute because we don't want to feed back into the LLM,
		// we need to wait for user input.
		if ((await finishReason) === "tool-calls") {
			for (const toolCall of await toolCalls) {
				if (toolCall.toolName === "roll_dice") {
					const { number, faces } = toolCall.args

					await ctx.runMutation(api.messages.appendToolCallBlock, {
						messageId: assistantMessageId,
						toolName: "roll_dice",
						parameters: { number, faces },
						result: null, // null indicates pending user interaction
					})
				}
			}
		}
	},
})

export const summarizeChatHistory = action({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args): Promise<string> => {
		// TODO: Don't summarise ALL messages, wait until a threshold and leave x tokens of recent messages.
		// Then mark all the summarised messages as summarised and store the summary somewhere (new table?)
		const messages = await ctx.runQuery(api.messages.list, {
			campaignId: args.campaignId,
		})

		const prompt =
			"You are an expert game master, compiling notes from a RPG session. Summarize the following transcript:"

		const { text } = await generateText({
			system: prompt,
			model: openai("gpt-4o-mini"),
			messages: [
				...messages.map((msg) => ({
					role: msg.role,
					content: msg.content
						.map((block) => {
							if (block.type === "text") {
								return block.text
							}

							return `[${block.toolName}: ${JSON.stringify(block.parameters)} -> ${JSON.stringify(block.result)}]`
						})
						.join(""),
				})),
				{
					role: "user",
					content: "Summarize the storyline so far.",
				},
			],
		})

		await ctx.scheduler.runAfter(0, internal.memories.scanForNewMemories, {
			messageIds: messages.map((msg) => msg._id),
		})

		return text
	},
})
