import { anthropic } from "@ai-sdk/anthropic"
import { type GoogleGenerativeAIProviderOptions, google } from "@ai-sdk/google"
import { groq } from "@ai-sdk/groq"
import { openai } from "@ai-sdk/openai"
import {
	PersistentTextStreaming,
	type StreamId,
	StreamIdValidator,
} from "@convex-dev/persistent-text-streaming"
import { GoogleGenAI } from "@google/genai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import {
	type AssistantContent,
	type CoreAssistantMessage,
	type CoreMessage,
	type CoreToolMessage,
	type CoreUserMessage,
	type FilePart,
	type TextPart,
	type ToolCallPart,
	type ToolContent,
	embed,
	experimental_generateImage as generateImage,
	generateText,
	streamText,
} from "ai"
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { compact } from "../src/utils/compact"
import { api, components, internal } from "./_generated/api"

import type { Doc, Id } from "./_generated/dataModel"
import {
	action,
	httpAction,
	internalAction,
	internalQuery,
	mutation,
	query,
} from "./_generated/server"
import { getImageModel } from "./characters"
import systemPrompt from "./prompts/system"
import { changeScene } from "./tools/changeScene"
import { introduceCharacter } from "./tools/introduceCharacter"
import { requestDiceRoll } from "./tools/requestDiceRoll"
import { updateCharacterSheet } from "./tools/updateCharacterSheet"
import { updatePlan } from "./tools/updatePlan"

type ArrayElement<ArrayType extends readonly unknown[]> =
	ArrayType extends readonly (infer ElementType)[] ? ElementType : never

const persistentTextStreaming = new PersistentTextStreaming(
	components.persistentTextStreaming,
)

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
		const messages = await ctx.db
			.query("messages")
			.withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
			.collect()

		// Add scene image URLs
		return await Promise.all(
			messages.map(async (message) => {
				if (message.scene?.image) {
					return {
						...message,
						scene: {
							...message.scene,
							imageUrl: await ctx.storage.getUrl(message.scene.image),
						},
					}
				}
				return message
			}),
		)
	},
})

export const paginatedList = query({
	args: {
		campaignId: v.id("campaigns"),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const result = await ctx.db
			.query("messages")
			.withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
			.order("desc")
			.paginate(args.paginationOpts)

		// Add scene image URLs
		const page = await Promise.all(
			result.page.map(async (message) => {
				if (message.scene?.image) {
					return {
						...message,
						scene: {
							...message.scene,
							imageUrl: await ctx.storage.getUrl(message.scene.image),
						},
					}
				}
				return message
			}),
		)

		return {
			...result,
			page,
		}
	},
})

export const getByStreamId = query({
	args: {
		streamId: StreamIdValidator,
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("messages")
			.withIndex("by_streamId", (q) => q.eq("streamId", args.streamId))
			.unique()
	},
})

export const update = mutation({
	args: {
		messageId: v.id("messages"),
		content: v.array(
			v.union(
				v.object({
					type: v.literal("text"),
					text: v.string(),
				}),
				v.object({
					type: v.literal("tool-call"),
					toolName: v.string(),
					args: v.any(),
					toolCallId: v.string(),
				}),
				// v.object({
				// 	type: v.literal("tool-result"),
				// 	toolName: v.string(),
				// 	result: v.any(),
				// 	toolCallId: v.string(),
				// }),
				v.object({
					type: v.literal("reasoning"),
					text: v.string(),
				}),
			),
		),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.messageId, {
			content: args.content,
		})
	},
})

export const addUserMessage = mutation({
	args: {
		campaignId: v.id("campaigns"),
		content: v.string(),
	},
	handler: async (ctx, args): Promise<{ streamId: StreamId }> => {
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

		const { streamId } = await ctx.runMutation(
			api.messages.addAssistantMessage,
			{
				campaignId: args.campaignId,
			},
		)

		return { streamId }
	},
})

export const addAssistantMessage = mutation({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const streamId = await persistentTextStreaming.createStream(ctx)

		const messageId = await ctx.db.insert("messages", {
			campaignId: args.campaignId,
			role: "assistant",
			content: [{ type: "text", text: "" }],
			streamId,
		})

		return { messageId, streamId }
	},
})

export const regenerateLastMessage = mutation({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args): Promise<{ streamId: StreamId }> => {
		const message = await ctx.db.get(args.messageId)
		if (!message) throw new Error("Message not found")

		await ctx.db.delete(args.messageId)

		const { streamId } = await ctx.runMutation(
			api.messages.addAssistantMessage,
			{
				campaignId: message.campaignId,
			},
		)

		return { streamId }
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

export const appendReasoning = mutation({
	args: {
		messageId: v.id("messages"),
		text: v.string(),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId)
		if (!message) throw new Error("Message not found")

		await ctx.db.patch(args.messageId, {
			reasoning: message.reasoning ? message.reasoning + args.text : args.text,
		})
	},
})

export const getMessageBody = query({
	args: {
		streamId: StreamIdValidator,
	},
	handler: async (ctx, args) => {
		return await persistentTextStreaming.getStreamBody(
			ctx,
			args.streamId as StreamId,
		)
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
	handler: async (
		ctx,
		args,
	): Promise<{ streamId: StreamId; results: number[]; total: number }> => {
		const message = await ctx.db.get(args.messageId)
		if (!message) throw new Error("Message not found")

		const toolCall = message.content[args.toolCallIndex]
		if (
			!toolCall ||
			toolCall.type !== "tool-call" ||
			toolCall.toolName !== "request_dice_roll"
		) {
			throw new Error("Invalid dice roll tool call")
		}
		const { number, faces } = toolCall.args

		// Generate the dice roll results
		const results: number[] = []
		for (let i = 0; i < number; i++) {
			results.push(Math.floor(Math.random() * faces) + 1)
		}
		const total = results.reduce((acc, curr) => acc + curr, 0)

		// Add a tool result message
		await ctx.db.insert("messages", {
			campaignId: message.campaignId,
			role: "tool",
			content: [
				{
					type: "tool-result",
					toolName: "request_dice_roll",
					result: { results, total },
					toolCallId: toolCall.toolCallId,
				},
			],
		})

		const { streamId } = await ctx.runMutation(
			api.messages.addAssistantMessage,
			{
				campaignId: message.campaignId,
			},
		)

		return { streamId, results, total }
	},
})

export const sendToLLM = httpAction(async (ctx, request) => {
	const args = (await request.json()) as {
		streamId: StreamId
	}

	const message = await ctx.runQuery(api.messages.getByStreamId, {
		streamId: args.streamId,
	})

	if (!message) {
		throw new Error("Message not found")
	}

	const campaign = await ctx.runQuery(api.campaigns.get, {
		id: message.campaignId,
	})

	if (!campaign) {
		throw new Error("Campaign not found")
	}

	// Fetch previous messages for the campaign
	const allMessages = await ctx.runQuery(api.messages.list, {
		campaignId: campaign._id,
	})

	// Don't include the current message when sending message history to the LLM!
	const messages = allMessages.slice(0, -1)

	let formattedMessages: CoreMessage[] = messages.map((msg) => {
		if (msg.role === "user") {
			return {
				role: "user",
				content: msg.content.filter((block) => block.type === "text"),
			} satisfies CoreUserMessage
		}

		if (msg.role === "tool") {
			return {
				role: "tool",
				// Should be the case anyway, but we have to convince TS
				content: msg.content.filter((block) => block.type === "tool-result"),
			} satisfies CoreToolMessage
		}

		return {
			role: "assistant",
			content: msg.content.filter(
				(block) =>
					block.type === "text" ||
					// For now let's not send reasoning data back. If we do send it later,
					// Claude needs the signature as well as the text itself.
					// block.type === "reasoning" ||
					block.type === "tool-call",
			),
		} satisfies CoreAssistantMessage
	})

	// Intro message for a new campaign
	if (formattedMessages.length === 0) {
		formattedMessages = [
			{
				role: "user",
				content: "Hello! Let's play an RPG together!",
			},
		]
	}

	let uploadedFiles: (FilePart | null)[] = []

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

		// The file upload stuff we're doing is google-specific so only Gemini models will have access
		// to the uploade PDFs for now.
		if (gameSystem && campaign.model.startsWith("google")) {
			const ai = new GoogleGenAI({
				apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
			})

			const listCurrentFiles = await ai.files.list()

			uploadedFiles = await Promise.all(
				gameSystem.files.map(async (file) => {
					// TODO: not handling pagination, but maybe we don't care
					const existingFile = listCurrentFiles.page.find(
						(f) => f.displayName === file.filename,
					)

					if (existingFile) {
						return {
							type: "file",
							data: existingFile.uri || "",
							mimeType: existingFile.mimeType || "",
							filename: existingFile.displayName || "",
						}
					}

					console.log("File not found, uploading", file.filename)

					const blob = await ctx.storage.get(file.storageId)

					if (!blob) {
						return null
					}

					const myfile = await ai.files
						.upload({
							file: blob,
							config: {
								displayName: file.filename,
							},
						})
						.catch((error) => {
							console.error("Error uploading file", error)
							return null
						})

					if (!myfile) {
						return null
					}

					return {
						type: "file",
						data: myfile.uri || "",
						mimeType: myfile.mimeType || "",
						filename: myfile.displayName || "",
					}
				}),
			)
		}
	}

	let characterSheet = await ctx.runQuery(api.characterSheets.get, {
		campaignId: campaign._id,
	})

	if (!characterSheet) {
		// TODO: can you do this in one operation?
		await ctx.runMutation(api.characterSheets.create, {
			campaignId: campaign._id,
			data: gameSystem?.defaultCharacterData ?? {},
		})

		characterSheet = await ctx.runQuery(api.characterSheets.get, {
			campaignId: campaign._id,
		})
	}

	const characters = await ctx.runQuery(api.characters.list, {
		campaignId: campaign._id,
	})

	const anyMemories = await ctx.runQuery(internal.memories.count, {
		campaignId: campaign._id,
	})

	let serializedMemories: {
		type: string
		summary: string
		context: string
		tags: string[]
	}[] = []

	if (anyMemories > 0) {
		const lastMessage = formattedMessages[formattedMessages.length - 1]
		const { embedding } = await embed({
			model: google.textEmbeddingModel("gemini-embedding-exp-03-07", {
				taskType: "RETRIEVAL_QUERY",
			}),
			value:
				typeof lastMessage.content === "string"
					? lastMessage.content
					: lastMessage.content
							.map((block) => {
								if (block.type === "text") {
									return block.text
								}

								return ""
							})
							.join(""),
		})

		const memoryRefs = await ctx.vectorSearch("memories", "by_embedding", {
			vector: embedding,
			limit: 10,
			filter: (q) => q.eq("campaignId", campaign._id),
		})

		const memories = await ctx.runQuery(internal.memories.findMany, {
			ids: memoryRefs.map((ref) => ref._id),
		})

		serializedMemories = memories.map((memory) => ({
			type: memory.type,
			summary: memory.summary,
			context: memory.context,
			tags: memory.tags,
		}))
	}

	const serializedCharacters = characters.map((character) => ({
		name: character.name,
		description: character.description,
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
		: "\n\nThe game will be a free-form narrative RPG without a specific ruleset."

	if (campaign.name !== "") {
		prompt += `\n\nThe campaign is called ${campaign.name}`
	}

	if (campaign.description !== "") {
		prompt += `\n\nThe description of the campaign is: ${campaign.description}`
	}

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

	if (campaign.plan) {
		prompt += `\n\nYour current internal plan for the session: ${campaign.plan}`
	}

	// Remove any that didn't upload successfully
	const compactedFiles = compact(uploadedFiles)

	if (compactedFiles.length > 0) {
		formattedMessages.push({
			role: "user",
			content: [
				{
					type: "text",
					text: "Here are the files that are relevant to the game system:",
				},
				...compactedFiles,
			],
		})
	}

	// TODO: put this somewhere smart
	const modelCanUseTools =
		campaign.model.startsWith("google") ||
		campaign.model === "x-ai/grok-4" ||
		campaign.model.startsWith("anthropic") ||
		campaign.model.startsWith("moonshotai")

	const openrouter = createOpenRouter({
		apiKey: process.env.OPENROUTER_API_KEY,
		headers: {
			// 'HTTP-Referer' once we have a public URL
			"X-Title": "Gaze Dev",
		},
	})

	console.log("formattedMessages", formattedMessages)

	const { fullStream } = streamText({
		system: prompt,
		model: campaign.model.startsWith("google")
			? google(campaign.model.split("/")[1])
			: campaign.model.startsWith("anthropic")
				? anthropic("claude-4-sonnet-20250514") // Temporarily hardcoded for testing
				: campaign.model.startsWith("moonshotai")
					? groq(campaign.model)
					: openrouter(campaign.model, {}),
		providerOptions: {
			google: {
				thinkingConfig: { thinkingBudget: 1024, includeThoughts: true },
			} satisfies GoogleGenerativeAIProviderOptions,
			openrouter: {
				reasoning: {
					max_tokens: 1024,
				},
			},
			anthropic: {
				thinking: { type: "enabled", budgetTokens: 1024 },
			},
		},
		messages: formattedMessages,
		maxSteps: 10,
		tools: modelCanUseTools
			? {
					update_character_sheet: updateCharacterSheet(
						ctx,
						message._id,
						characterSheet,
					),
					change_scene: changeScene(ctx, message._id),
					introduce_character: introduceCharacter(
						ctx,
						message._id,
						campaign._id,
					),
					request_dice_roll: requestDiceRoll(ctx, message._id),
					update_plan: updatePlan(ctx, message._id, campaign._id),
				}
			: undefined,
		onError: async (error) => {
			await ctx.runMutation(api.messages.appendTextBlock, {
				messageId: message._id,
				text: `\n\n\`\`\`\error n${JSON.stringify(error.error, null, 2)}\n\`\`\``,
			})
		},
		onFinish: async ({ response }) => {
			console.log("onFinish", response.messages)

			// Process all messages from all steps and combine their content
			const allContent: Extract<
				ArrayElement<Exclude<AssistantContent, string>>,
				{ type: "text" | "reasoning" | "tool-call" }
			>[] = []

			for (const responseMessage of response.messages) {
				if (responseMessage.role === "assistant") {
					const content = responseMessage.content
					if (typeof content === "string") {
						allContent.push({ type: "text", text: content })
					} else {
						for (const block of content) {
							if (block.type === "text") {
								allContent.push({
									type: "text",
									text: block.text,
								})
							} else if (block.type === "reasoning") {
								allContent.push({ type: "reasoning", text: block.text })
							} else if (block.type === "tool-call") {
								allContent.push({
									type: "tool-call",
									toolName: block.toolName,
									toolCallId: block.toolCallId,
									args: block.args,
								})
							}
						}
					}
				}
			}

			await ctx.runMutation(api.messages.update, {
				messageId: message._id,
				content: allContent,
			})
		},
	})

	const response = await persistentTextStreaming.stream(
		ctx,
		request,
		args.streamId as StreamId,
		async (ctx, _request, _streamId, chunkAppender) => {
			let reasoning = ""
			let text = ""

			for await (const chunk of fullStream) {
				if (chunk.type === "reasoning") {
					reasoning += chunk.textDelta
					chunkAppender(
						`${JSON.stringify({
							type: "reasoning",
							delta: chunk.textDelta,
						})}\n`,
					)
				} else if (chunk.type === "text-delta") {
					text += chunk.textDelta
					chunkAppender(
						`${JSON.stringify({
							type: "text",
							delta: chunk.textDelta,
						})}\n`,
					)
				} else if (chunk.type === "tool-call") {
					chunkAppender(
						`${JSON.stringify({
							type: "tool-call",
							toolName: chunk.toolName,
							toolCallId: chunk.toolCallId,
							args: chunk.args,
						})}\n`,
					)
				} else if (chunk.type === "tool-result") {
					chunkAppender(
						`${JSON.stringify({
							type: "tool-result",
							toolCallId: chunk.toolCallId,
							result: chunk.result,
						})}\n`,
					)
				} else if (chunk.type === "step-start") {
					chunkAppender(
						`${JSON.stringify({
							type: "step-start",
							messageId: chunk.messageId,
						})}\n`,
					)
				} else if (chunk.type === "step-finish") {
					chunkAppender(
						`${JSON.stringify({
							type: "step-finish",
							messageId: chunk.messageId,
							finishReason: chunk.finishReason,
							usage: chunk.usage,
							isContinued: chunk.isContinued,
						})}\n`,
					)
				} else if (chunk.type === "finish") {
					await ctx.runMutation(api.messages.addUsageToMessage, {
						messageId: message._id,
						usage: {
							promptTokens: chunk.usage.promptTokens,
							completionTokens: chunk.usage.completionTokens,
						},
					})
				}
			}
		},
	)

	response.headers.set("Access-Control-Allow-Origin", "*")
	response.headers.set("Vary", "Origin")

	return response
})

// export const summarizeChatHistory = action({
// 	args: {
// 		campaignId: v.id("campaigns"),
// 	},
// 	handler: async (ctx, args): Promise<string> => {
// 		// TODO: Don't summarise ALL messages, wait until a threshold and leave x tokens of recent messages.
// 		// Then mark all the summarised messages as summarised and store the summary somewhere (new table?)
// 		const messages = await ctx.runQuery(api.messages.list, {
// 			campaignId: args.campaignId,
// 		})

// 		const prompt =
// 			"You are an expert game master, compiling notes from a RPG session. Summarize the following transcript:"

// 		const { text } = await generateText({
// 			system: prompt,
// 			model: openai("gpt-4o-mini"),
// 			messages: [
// 				...messages.map((msg) => ({
// 					role: msg.role,
// 					content: msg.content
// 						.map((block) => {
// 							if (block.type === "text") {
// 								return block.text
// 							}

// 							return `[${block.toolName}: ${JSON.stringify(block.parameters)} -> ${JSON.stringify(block.result)}]`
// 						})
// 						.join(""),
// 				})),
// 				{
// 					role: "user",
// 					content: "Summarize the storyline so far.",
// 				},
// 			],
// 		})

// 		await ctx.scheduler.runAfter(0, internal.memories.scanForNewMemories, {
// 			messageIds: messages.map((msg) => msg._id),
// 		})

// 		return text
// 	},
// })

export const storeSceneImage = mutation({
	args: {
		messageId: v.id("messages"),
		description: v.string(),
		prompt: v.string(),
		storageId: v.id("_storage"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.patch(args.messageId, {
			scene: {
				description: args.description,
				prompt: args.prompt,
				image: args.storageId,
			},
		})
	},
})

export const generateSceneImage = action({
	args: {
		messageId: v.id("messages"),
		description: v.string(),
		prompt: v.string(),
	},
	handler: async (ctx, args) => {
		const message = await ctx.runQuery(api.messages.get, {
			messageId: args.messageId,
		})

		if (!message) throw new Error("Message not found")

		const campaign = await ctx.runQuery(api.campaigns.get, {
			id: message.campaignId,
		})

		if (!campaign) throw new Error("Campaign not found")

		const prompt = `
      Generate an image of a scene. ${args.prompt}.

      This should be a landscape or environment scene, not a character portrait.
      The image should be wide format. Don't include any text.

      The style of the image should be ${campaign.imagePrompt}.
    `

		const result = await generateImage({
			...getImageModel(campaign.imageModel),
			aspectRatio: "16:9",
			prompt,
		})

		for (const file of result.images) {
			if (file.mimeType.startsWith("image/")) {
				const blob = new Blob([file.uint8Array], { type: file.mimeType })
				const storageId = await ctx.storage.store(blob)
				await ctx.runMutation(api.messages.storeSceneImage, {
					messageId: args.messageId,
					description: args.description,
					prompt: args.prompt,
					storageId,
				})
			}
		}
	},
})

export const regenerateSceneImage = action({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		const message = await ctx.runQuery(api.messages.get, {
			messageId: args.messageId,
		})

		if (!message?.scene) {
			throw new Error("Message or scene not found")
		}

		await ctx.runAction(api.messages.generateSceneImage, {
			messageId: args.messageId,
			description: message.scene.description,
			// Old scenes don't have prompt, so this is just a fallback - won't happen going forward
			prompt: message.scene.prompt ?? message.scene.description,
		})
	},
})
