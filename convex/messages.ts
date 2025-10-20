import { anthropic } from "@ai-sdk/anthropic"
import { type GoogleGenerativeAIProviderOptions, google } from "@ai-sdk/google"
import { groq } from "@ai-sdk/groq"
import { openai } from "@ai-sdk/openai"
import {
	PersistentTextStreaming,
	type StreamId,
	StreamIdValidator,
} from "@convex-dev/persistent-text-streaming"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import {
	type AssistantContent,
	type ModelMessage,
	generateText,
	streamText,
} from "ai"
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import models from "../src/models.json"
import { api, components, internal } from "./_generated/api"
import {
	action,
	httpAction,
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server"
import { generateImageForModel } from "./characters"
import { mainChatPrompt } from "./prompts/core"
import { changeScene } from "./tools/changeScene"
import { chooseName } from "./tools/chooseName"
import { introduceCharacter } from "./tools/introduceCharacter"
import { requestDiceRoll } from "./tools/requestDiceRoll"
import { setCampaignInfo } from "./tools/setCampaignInfo"
import { updateCharacterSheet } from "./tools/updateCharacterSheet"
import { updateClock } from "./tools/updateClock"
import { updatePlan } from "./tools/updatePlan"
import { updateQuestLog } from "./tools/updateQuestLog"
import { updateTemporal } from "./tools/updateTemporal"
import { googleSafetySettings, isToolEnabled } from "./utils"

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
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

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
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const messages = await ctx.db
			.query("messages")
			.withIndex("by_campaignId_and_summaryId", (q) =>
				q.eq("campaignId", args.campaignId).eq("summaryId", undefined),
			)
			.collect()

		return messages
	},
})

export const listInternal = internalQuery({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const messages = await ctx.db
			.query("messages")
			.withIndex("by_campaignId_and_summaryId", (q) =>
				q.eq("campaignId", args.campaignId).eq("summaryId", undefined),
			)
			.collect()

		return messages
	},
})

export const listAll = internalQuery({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const messages = await ctx.db
			.query("messages")
			.withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
			.collect()

		return messages
	},
})

export const paginatedList = query({
	args: {
		campaignId: v.id("campaigns"),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const result = await ctx.db
			.query("messages")
			.withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
			.order("desc")
			.paginate(args.paginationOpts)

		// Add scene image URLs
		const page = await Promise.all(
			result.page.map(async (message) => {
				return {
					...message,
					scene: message.scene?.image
						? {
								...message.scene,
								imageUrl: await ctx.storage.getUrl(message.scene.image),
							}
						: message.scene,
					audio: await Promise.all(
						message.audio?.map((audio) => ctx.storage.getUrl(audio)) ?? [],
					),
				}
			}),
		)

		return {
			...result,
			page,
		}
	},
})

export const getByStreamId = internalQuery({
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

export const update = internalMutation({
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
					toolCallId: v.string(),
					// v5 uses 'input'
					input: v.any(),
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

export const updateTextBlock = mutation({
	args: {
		messageId: v.id("messages"),
		index: v.number(),
		text: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const message = await ctx.db.get(args.messageId)
		if (!message) throw new Error("Message not found")

		const block = message.content[args.index]
		if (!block) throw new Error("Block not found")
		if (block.type !== "text") throw new Error("Block is not a text block")

		const updatedContent = [...message.content]
		updatedContent[args.index] = { type: "text", text: args.text }

		await ctx.db.patch(args.messageId, {
			content: updatedContent,
		})
	},
})

export const setSummaryId = mutation({
	args: {
		messageId: v.id("messages"),
		summaryId: v.id("summaries"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		await ctx.db.patch(args.messageId, {
			summaryId: args.summaryId,
		})
	},
})

export const addError = internalMutation({
	args: {
		messageId: v.id("messages"),
		error: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.messageId, {
			error: args.error,
		})
	},
})

export const addToolResultsMessage = internalMutation({
	args: {
		messageId: v.id("messages"),
		toolResults: v.array(
			v.object({
				type: v.literal("tool-result"),
				toolCallId: v.string(),
				toolName: v.string(),
				result: v.any(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId)

		if (!message) {
			throw new Error("Message not found")
		}

		await ctx.db.patch(args.messageId, {
			toolResults: [...(message.toolResults ?? []), ...args.toolResults],
		})
	},
})

export const addUserMessage = mutation({
	args: {
		campaignId: v.id("campaigns"),
		content: v.string(),
	},
	handler: async (ctx, args): Promise<{ streamId: StreamId }> => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

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

		// Update the campaign's last interaction timestamp
		await ctx.runMutation(api.campaigns.updateLastInteraction, {
			campaignId: args.campaignId,
		})

		// Increment message count
		await ctx.runMutation(internal.campaigns.incrementMessageCount, {
			campaignId: args.campaignId,
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
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const streamId = await persistentTextStreaming.createStream(ctx)

		const messageId = await ctx.db.insert("messages", {
			campaignId: args.campaignId,
			role: "assistant",
			content: [{ type: "text", text: "" }],
			streamId,
		})

		// Increment message count
		await ctx.runMutation(internal.campaigns.incrementMessageCount, {
			campaignId: args.campaignId,
		})

		return { messageId, streamId }
	},
})

export const regenerateLastMessage = mutation({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args): Promise<{ streamId: StreamId }> => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const message = await ctx.db.get(args.messageId)
		if (!message) throw new Error("Message not found")

		// If it's a user message, regen without deleting!
		if (message.role === "assistant") {
			await ctx.db.delete(args.messageId)
			// Decrement message count since we deleted a message
			await ctx.runMutation(internal.campaigns.decrementMessageCount, {
				campaignId: message.campaignId,
			})
		}

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
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

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
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const message = await ctx.db.get(args.messageId)
		if (!message) throw new Error("Message not found")

		await ctx.db.patch(args.messageId, {
			reasoningText: message.reasoningText
				? message.reasoningText + args.text
				: args.text,
		})
	},
})

export const getMessageBody = query({
	args: {
		streamId: StreamIdValidator,
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		return await persistentTextStreaming.getStreamBody(
			ctx,
			args.streamId as StreamId,
		)
	},
})

export const addUsageToMessage = internalMutation({
	args: {
		messageId: v.id("messages"),
		usage: v.object({
			inputTokens: v.number(),
			outputTokens: v.number(),
			totalTokens: v.number(),
			reasoningTokens: v.number(),
			cachedInputTokens: v.number(),
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
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

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
		const { number, faces, bonus } = toolCall.args

		// Generate the dice roll results
		const results: number[] = []
		for (let i = 0; i < number; i++) {
			results.push(Math.floor(Math.random() * faces) + 1)
		}
		const total = results.reduce((acc, curr) => acc + curr, 0) + bonus

		// Add a tool result message
		await ctx.db.patch(args.messageId, {
			toolResults: [
				...(message.toolResults ?? []),
				{
					type: "tool-result",
					toolName: "request_dice_roll",
					result: { results, bonus, total },
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

export const performUserChooseName = mutation({
	args: {
		messageId: v.id("messages"),
		toolCallIndex: v.number(),
		chosenName: v.string(),
		otherDetails: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<{ chosenName: string }> => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const message = await ctx.db.get(args.messageId)
		if (!message) throw new Error("Message not found")

		const toolCall = message.content[args.toolCallIndex]
		if (
			!toolCall ||
			toolCall.type !== "tool-call" ||
			toolCall.toolName !== "choose_name"
		) {
			throw new Error("Invalid choose name tool call")
		}

		// Add a tool result message
		await ctx.db.patch(args.messageId, {
			toolResults: [
				...(message.toolResults ?? []),
				{
					type: "tool-result",
					toolName: "choose_name",
					result: {
						name: args.chosenName,
						otherDetails: args.otherDetails,
					},
					toolCallId: toolCall.toolCallId,
				},
			],
		})

		return { chosenName: args.chosenName }
	},
})

export const sendToLLM = httpAction(async (ctx, request) => {
	const args = (await request.json()) as {
		streamId: StreamId
	}

	const message = await ctx.runQuery(internal.messages.getByStreamId, {
		streamId: args.streamId,
	})

	if (!message) {
		throw new Error("Message not found")
	}

	const campaign = await ctx.runQuery(internal.campaigns.getInternal, {
		id: message.campaignId,
	})

	if (!campaign) {
		throw new Error("Campaign not found")
	}

	const [prompt, formattedMessages] = await mainChatPrompt(ctx, campaign)

	const modelCanUseTools =
		models.find((m) => m.code === campaign.model)?.tools ?? false
	const openrouter = createOpenRouter({
		apiKey: process.env.OPENROUTER_API_KEY,
		headers: {
			// 'HTTP-Referer' once we have a public URL
			"X-Title": "Gaze Dev",
		},
	})

	// Build tools object with only enabled tools
	const allTools = {
		...(isToolEnabled("update_character_sheet", campaign)
			? { update_character_sheet: updateCharacterSheet(ctx, campaign._id) }
			: {}),
		...(isToolEnabled("change_scene", campaign)
			? { change_scene: changeScene(ctx, campaign._id, message._id) }
			: {}),
		// ...(isToolEnabled("introduce_character")
		// 	? {
		// 			introduce_character: introduceCharacter(
		// 				ctx,
		// 				message._id,
		// 				campaign._id,
		// 			),
		// 		}
		// 	: {}),
		// We need at least one always-on tool or the types break (cool)
		introduce_character: introduceCharacter(ctx, message._id, campaign._id),
		...(isToolEnabled("request_dice_roll", campaign)
			? { request_dice_roll: requestDiceRoll(ctx, message._id) }
			: {}),
		...(isToolEnabled("update_plan", campaign)
			? { update_plan: updatePlan(ctx, message._id, campaign._id) }
			: {}),
		...(isToolEnabled("update_quest_log", campaign)
			? { update_quest_log: updateQuestLog(ctx, campaign._id) }
			: {}),
		...(isToolEnabled("update_clock", campaign)
			? { update_clock: updateClock(ctx, campaign._id) }
			: {}),
		...(isToolEnabled("update_temporal", campaign)
			? { update_temporal: updateTemporal(ctx, campaign._id) }
			: {}),
		...(isToolEnabled("choose_name", campaign)
			? { choose_name: chooseName() }
			: {}),
		...(campaign.name === "" && isToolEnabled("set_campaign_info", campaign)
			? {
					set_campaign_info: setCampaignInfo(ctx, campaign._id),
				}
			: {}),
	}

	const { fullStream } = streamText({
		system: prompt,
		temperature: campaign.model.startsWith("openai") ? undefined : 1.2, // TODO: this works for Gemini but not for OpenAI (not sure about others)
		model: campaign.model.startsWith("google")
			? google(campaign.model.split("/")[1])
			: campaign.model.startsWith("anthropic")
				? anthropic(campaign.model.split("/")[1])
				: campaign.model.startsWith("moonshotai")
					? groq(campaign.model)
					: campaign.model.startsWith("openai")
						? openai(campaign.model.split("/")[1])
						: openrouter(campaign.model),
		providerOptions: {
			google: {
				thinkingConfig: { thinkingBudget: -1, includeThoughts: true },
				...googleSafetySettings,
				responseModalities: ["TEXT"],
			} satisfies GoogleGenerativeAIProviderOptions,
			openrouter: {
				// reasoning: {
				// 	max_tokens: 1024,
				// },
			},
			anthropic: {
				// thinking: { type: "enabled", budgetTokens: 1024 },
			},
			openai: {
				reasoningEffort: "minimal", // can be low, medium or high
				parallelToolCalls: true,
				maxToolCalls: 8,
				textVerbosity: "medium", // can be low or high
			},
		},
		messages: formattedMessages,
		// maxSteps: 10,
		tools: modelCanUseTools ? allTools : undefined,
		onError: async ({ error }) => {
			console.error("onError", error)

			await ctx.runMutation(internal.messages.addError, {
				messageId: message._id,
				error: JSON.stringify(error, null, 2),
			})
		},
		onFinish: async ({ finishReason, response }) => {
			console.log("onFinish", finishReason, response)

			if (finishReason === "unknown") {
				await ctx.runMutation(internal.messages.addError, {
					messageId: message._id,
					error: "Content filter blocked the request",
				})
				return
			}

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
									input: block.input,
								})
							}
						}
					}
				}
			}

			await ctx.runMutation(internal.messages.update, {
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
			const toolResults: {
				type: "tool-result"
				toolCallId: string
				toolName: string
				result: unknown
			}[] = []

			// Dedup consecutive identical deltas (provider can emit duplicates)
			let lastReasoningDelta: string | null = null

			for await (const chunk of fullStream) {
				if (chunk.type === "reasoning-delta") {
					if (chunk.text && chunk.text !== lastReasoningDelta) {
						lastReasoningDelta = chunk.text
						chunkAppender(
							`${JSON.stringify({
								type: "reasoning",
								delta: chunk.text,
							})}\n`,
						)
					}
				} else if (chunk.type === "text-delta") {
					chunkAppender(
						`${JSON.stringify({
							type: "text",
							delta: chunk.text,
						})}\n`,
					)
				} else if (chunk.type === "tool-call") {
					chunkAppender(
						`${JSON.stringify({
							type: "tool-call",
							toolName: chunk.toolName,
							toolCallId: chunk.toolCallId,
							args: chunk.input,
						})}\n`,
					)
				} else if (chunk.type === "tool-result") {
					toolResults.push({
						type: "tool-result",
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						result: chunk.output,
					})
					chunkAppender(
						`${JSON.stringify({
							type: "tool-result",
							toolCallId: chunk.toolCallId,
							result: chunk.output,
						})}\n`,
					)
				} else if (chunk.type === "finish") {
					await ctx.scheduler.runAfter(
						300,
						internal.messages.addUsageToMessage,
						{
							messageId: message._id,
							usage: {
								inputTokens: chunk.totalUsage.inputTokens ?? 0,
								outputTokens: chunk.totalUsage.outputTokens ?? 0,
								totalTokens: chunk.totalUsage.totalTokens ?? 0,
								reasoningTokens: chunk.totalUsage.reasoningTokens ?? 0,
								cachedInputTokens: chunk.totalUsage.cachedInputTokens ?? 0,
							},
						},
					)
				} else {
					// console.log("unknown chunk type", chunk)
				}
			}

			if (toolResults.length > 0) {
				await ctx.runMutation(internal.messages.addToolResultsMessage, {
					messageId: message._id,
					toolResults,
				})
			}
		},
	)

	response.headers.set("Access-Control-Allow-Origin", "*")
	response.headers.set("Vary", "Origin")

	return response
})

export const summarizeChatHistory = action({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args): Promise<string> => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		// For now we're ignoring summaries and summarising the entire history
		// Could get way too large at some point, so will have to revisit this
		const messages = await ctx.runQuery(internal.messages.listAll, {
			campaignId: args.campaignId,
		})

		const prompt =
			"You are an expert game master, compiling notes from a RPG session. Summarize the following transcript:"

		const formattedMessages = messages
			.map((msg) => {
				if (msg.role === "user") {
					return {
						role: "user" as const,
						content: msg.content.filter((block) => block.type === "text"),
					}
				}

				if (msg.role === "tool") {
					// Don't include tool results in the summary
					return null
				}

				return {
					role: "assistant" as const,
					content: msg.content.filter(
						// Remove tool calls and reasoning
						(block) => block.type === "text",
					),
				}
			})
			.filter((m) => m !== null) as ModelMessage[]

		const { text } = await generateText({
			system: prompt,
			model: google("gemini-2.5-flash"),
			messages: [
				...formattedMessages,
				{
					role: "user",
					content: [
						{
							type: "text",
							text: "Summarize the storyline so far.",
						},
					],
				},
			],
		})

		await ctx.runMutation(api.campaigns.updateCampaignSummary, {
			campaignId: args.campaignId,
			summary: text,
		})

		// Set message count at last summary
		await ctx.runMutation(api.campaigns.setMessageCountAtLastSummary, {
			campaignId: args.campaignId,
		})

		// After summarizing, generate tags for the campaign
		let tags: string[] = []
		try {
			tags = await ctx.runAction(api.campaigns.generateTags, {
				campaignId: args.campaignId,
			})
		} catch (error) {
			tags = ["Error generating tags"]
			console.error("Error generating tags", error)
		}

		return `${text}\n\nTotal messages: ${messages.length}\nTags: ${tags.join(", ")}`
	},
})

// Note that this doesn't have character sheets etc, only the transcript.
// Might want to centralize the prompt generation for this and the summary as well as sendToLLM?
export const chatWithHistory = action({
	args: {
		campaignId: v.id("campaigns"),
		question: v.string(),
	},
	handler: async (ctx, args): Promise<string> => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		// For now we're ignoring summaries and summarising the entire history
		// Could get way too large at some point, so will have to revisit this
		const messages = await ctx.runQuery(internal.messages.listAll, {
			campaignId: args.campaignId,
		})

		const prompt =
			"You are an expert game master, answering questions about a transcript of an RPG session."

		const formattedMessages: ModelMessage[] = messages
			.map((msg) => {
				if (msg.role === "user") {
					return {
						role: "user",
						content: msg.content.filter((block) => block.type === "text"),
					}
				}

				if (msg.role === "tool") {
					// Don't include tool results in the summary
					return null
				}

				return {
					role: "assistant" as const,
					content: msg.content.filter(
						// Remove tool calls and reasoning
						(block) => block.type === "text",
					),
				}
			})
			.filter((m) => m !== null) as ModelMessage[]

		const { text } = await generateText({
			system: prompt,
			model: openai("gpt-4o-mini"),
			messages: [
				...formattedMessages,
				{
					role: "user",
					content: [
						{
							type: "text",
							text: `The user's question is: ${args.question}`,
						},
					],
				},
			],
		})

		return text
	},
})

export const storeSceneImage = mutation({
	args: {
		messageId: v.id("messages"),
		description: v.string(),
		prompt: v.string(),
		activeCharacters: v.array(v.string()),
		storageId: v.id("_storage"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		return await ctx.db.patch(args.messageId, {
			scene: {
				description: args.description,
				prompt: args.prompt,
				image: args.storageId,
				activeCharacters: args.activeCharacters,
			},
		})
	},
})

export const clearSceneImage = mutation({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const message = await ctx.runQuery(api.messages.get, {
			messageId: args.messageId,
		})

		if (!message) throw new Error("Message not found")

		await ctx.db.patch(args.messageId, {
			scene: message.scene
				? {
						...message.scene,
						image: undefined,
					}
				: undefined,
		})
	},
})

export const generateSceneImage = action({
	args: {
		messageId: v.id("messages"),
		description: v.string(),
		prompt: v.string(),
		activeCharacters: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const message = await ctx.runQuery(api.messages.get, {
			messageId: args.messageId,
		})

		if (!message) throw new Error("Message not found")

		const campaign = await ctx.runQuery(api.campaigns.get, {
			id: message.campaignId,
		})

		const characterSheet = await ctx.runQuery(api.characterSheets.get, {
			campaignId: message.campaignId,
		})

		const characters = await ctx.runQuery(api.characters.list, {
			campaignId: message.campaignId,
		})
		const activeCharacters = characters.filter((c) =>
			args.activeCharacters.includes(c.name),
		)

		if (!campaign) throw new Error("Campaign not found")

		const prompt = `
      Generate an image of a scene. ${args.prompt}.

      This should be a landscape or environment scene, not a character portrait.
      The image should be wide format. Don't include any text.

			Here are descriptions of the characters that are active in the scene:

			${activeCharacters.map((c) => `- ${c.name}: ${c.description} (${c.imagePrompt})`).join("\n")}

			${characterSheet ? `The protagonist of the scene is ${characterSheet.name}` : ""}

      The style of the image should be ${campaign.imagePrompt}.
    `

		// TODO: error handling? AI_APICallError

		// TODO: this is no longer setting the 16:9 aspect ratio
		const images = await generateImageForModel(prompt, campaign.imageModel)

		for (const file of images) {
			if (file.mediaType.startsWith("image/")) {
				const blob = new Blob([file.uint8Array as BlobPart], {
					type: file.mediaType,
				})
				const storageId = await ctx.storage.store(blob)
				await ctx.runMutation(api.messages.storeSceneImage, {
					messageId: args.messageId,
					description: args.description,
					prompt: args.prompt,
					activeCharacters: args.activeCharacters,
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
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const message = await ctx.runQuery(api.messages.get, {
			messageId: args.messageId,
		})

		if (!message?.scene) {
			throw new Error("Message or scene not found")
		}

		// Delete old image before regenerating
		if (message.scene.image) {
			await ctx.storage.delete(message.scene.image)
			await ctx.runMutation(api.messages.clearSceneImage, {
				messageId: args.messageId,
			})
		}

		await ctx.runAction(api.messages.generateSceneImage, {
			messageId: args.messageId,
			description: message.scene.description,
			// Old scenes don't have prompt, so this is just a fallback - won't happen going forward
			prompt: message.scene.prompt ?? message.scene.description,
			activeCharacters: message.scene.activeCharacters ?? [],
		})
	},
})

export const analyzePrompt = action({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const campaign = await ctx.runQuery(api.campaigns.get, {
			id: args.campaignId,
		})

		if (!campaign) {
			throw new Error("Campaign not found")
		}

		// Import the breakdown functions from core
		const {
			componseSystemPrompt,
			uploadedFiles,
			messageSummaries,
			recentMessages,
			currentGameContext,
			otherCampaignSummaries,
		} = await import("./prompts/core")

		// Get system prompt breakdown
		const systemPromptData = await componseSystemPrompt(ctx, campaign, true)

		// For new campaigns
		if (campaign.name === "") {
			const model = campaign.model
			const otherSummaries = await otherCampaignSummaries(ctx, model, true)
			const recent = await recentMessages(ctx, campaign, true)
			const introInstruction =
				"<game_information>We have not yet locked in the campaign details. You can ask the user any questions you need to. Once you have enough information from the user, use the `set_campaign_info` tool to set the name, description, and imagePrompt.</game_information>"

			// Use a simple helper to count tokens for this string
			const googleAI = new (await import("@google/genai")).GoogleGenAI({
				apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
			})
			const introResult = await googleAI.models.countTokens({
				model,
				contents: introInstruction,
			})
			const introTokens = introResult.totalTokens ?? 0

			const messagesTotal =
				otherSummaries.charCount + recent.charCount + introTokens

			// Build the full prompt text
			const fullPromptText = `SYSTEM PROMPT:\n${systemPromptData.prompt}\n\n---\n\nMESSAGES:\n\n${[
				...otherSummaries.messages,
				...recent.messages,
				{ role: "user", content: [{ type: "text", text: introInstruction }] },
			]
				.map((msg, idx) => {
					const contentText =
						typeof msg.content === "string"
							? msg.content
							: msg.content
									.map((block) =>
										block.type === "text" ? block.text : "[non-text content]",
									)
									.join("\n")
					return `[${idx}] ${msg.role.toUpperCase()}:\n${contentText}`
				})
				.join("\n\n")}`

			return {
				systemPrompt: systemPromptData.breakdown,
				messages: {
					uploadedFiles: 0,
					messageSummaries: 0,
					recentMessages: recent.charCount,
					otherCampaignSummaries: otherSummaries.charCount,
					introInstruction: introTokens,
					currentContext: {
						plan: 0,
						questLog: 0,
						activeClocks: 0,
						characters: 0,
						characterSheet: 0,
						temporal: 0,
						notices: 0,
						total: 0,
					},
					total: messagesTotal,
				},
				grandTotal: systemPromptData.breakdown.total + messagesTotal,
				fullPromptText,
			}
		}

		// For active campaigns
		const uploaded = await uploadedFiles(ctx, campaign, true)
		const summaries = await messageSummaries(ctx, campaign, true)
		const recent = await recentMessages(ctx, campaign, true)
		const context = await currentGameContext(ctx, campaign, true)

		const messagesTotal =
			uploaded.charCount +
			summaries.charCount +
			recent.charCount +
			context.breakdown.total

		// Build the full prompt text
		const fullPromptText = `SYSTEM PROMPT:\n${systemPromptData.prompt}\n\n---\n\nMESSAGES:\n\n${[
			...uploaded.messages,
			...summaries.messages,
			...recent.messages,
			...context.messages,
		]
			.map((msg, idx) => {
				const contentText =
					typeof msg.content === "string"
						? msg.content
						: msg.content
								.map((block) =>
									block.type === "text" ? block.text : "[non-text content]",
								)
								.join("\n")
				return `[${idx}] ${msg.role.toUpperCase()}:\n${contentText}`
			})
			.join("\n\n")}`

		return {
			systemPrompt: systemPromptData.breakdown,
			messages: {
				uploadedFiles: uploaded.charCount,
				messageSummaries: summaries.charCount,
				recentMessages: recent.charCount,
				otherCampaignSummaries: 0,
				introInstruction: 0,
				currentContext: context.breakdown,
				total: messagesTotal,
			},
			grandTotal: systemPromptData.breakdown.total + messagesTotal,
			fullPromptText,
		}
	},
})
