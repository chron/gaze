import { GoogleGenAI } from "@google/genai"
import type { ModelMessage } from "ai"
import { compact } from "../../src/utils/compact"
import { api, internal } from "../_generated/api"
import type { Doc, Id } from "../_generated/dataModel"
import type { ActionCtx } from "../_generated/server"
import { RECENT_CAMPAIGNS_CONTEXT_COUNT, isToolEnabled } from "../utils"
import systemPrompt from "./system"

// Constants for context window management
export const CONTEXT_WARNING_TOKEN_THRESHOLD = 60000
export const MESSAGES_TO_KEEP_AFTER_COLLAPSE = 40

// Helper to count tokens using Google's API
const countTokens = async (
	content: string | ModelMessage[],
	model: string,
): Promise<number> => {
	const ai = new GoogleGenAI({
		apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
	})

	try {
		// Convert content to string if it's an array of messages
		const textContent =
			typeof content === "string" ? content : JSON.stringify(content)

		const result = await ai.models.countTokens({
			model: model.replace("google/", ""),
			contents: textContent,
		})

		return result.totalTokens ?? 0
	} catch (error) {
		console.error("Error counting tokens:", error)
		// Fallback to character-based approximation
		const textContent =
			typeof content === "string" ? content : JSON.stringify(content)
		return Math.ceil(textContent.length / 4)
	}
}

export type PromptBreakdown = {
	systemPrompt: {
		basePrompt: number
		gameSystem: number
		campaignInfo: number
		total: number
	}
	messages: {
		uploadedFiles: number
		messageSummaries: number
		recentMessages: number
		otherCampaignSummaries: number
		introInstruction: number
		currentContext: {
			plan: number
			questLog: number
			activeClocks: number
			temporal: number
			characters: number
			characterSheet: number
			notices: number
			total: number
		}
		total: number
	}
	grandTotal: number
}

export const mainChatPrompt = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
): Promise<[string, ModelMessage[]]> => {
	const { prompt } = await componseSystemPrompt(ctx, campaign)

	// Intro message for a new campaign
	if (campaign.name === "") {
		const model = campaign.model
		const otherSummaries = await otherCampaignSummaries(ctx, model, false)
		const recent = await recentMessages(ctx, campaign, false)
		const introInstruction = {
			role: "user" as const,
			content: [
				{
					type: "text" as const,
					text: "<game_information>We have not yet locked in the campaign details. You can ask the user any questions you need to. Once you have enough information from the user, use the `set_campaign_info` tool to set the name, description, and imagePrompt.</game_information>",
				},
			],
		}

		return [
			prompt,
			[
				{
					role: "user" as const,
					content: [
						{
							type: "text" as const,
							text: "Here are the summaries of the other campaigns we have played together:",
						},
					],
				},
				...otherSummaries.messages,
				// ...(await uploadedFiles(ctx, campaign)),
				...recent.messages,
				introInstruction,
			],
		]
	}

	const formattedMessages = await constructMessages(ctx, campaign)

	return [prompt, formattedMessages]
}

export const componseSystemPrompt = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
	countTokensFlag = false,
): Promise<{ prompt: string; breakdown: PromptBreakdown["systemPrompt"] }> => {
	const basePrompt = systemPrompt

	const gameSystem = campaign.gameSystemId
		? await ctx.runQuery(internal.gameSystems.getInternal, {
				id: campaign.gameSystemId,
			})
		: null

	const gameSystemText = gameSystem
		? `\n\nYou are hosting a game of ${gameSystem.name}\n\n${gameSystem.prompt}`
		: "\n\nThe game is a dice-less free-form narrative RPG without a specific ruleset."

	const campaignInfoText =
		campaign.name !== ""
			? `\n\nThe campaign is called ${campaign.name}\n\n${campaign.description}`
			: ""

	const prompt = basePrompt + gameSystemText + campaignInfoText

	// Only count tokens if requested (for analysis)
	if (!countTokensFlag) {
		return {
			prompt,
			breakdown: {
				basePrompt: 0,
				gameSystem: 0,
				campaignInfo: 0,
				total: 0,
			},
		}
	}

	const model = campaign.model

	return {
		prompt,
		breakdown: {
			basePrompt: await countTokens(basePrompt, model),
			gameSystem: await countTokens(gameSystemText, model),
			campaignInfo: await countTokens(campaignInfoText, model),
			total: await countTokens(prompt, model),
		},
	}
}

const constructMessages = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
): Promise<ModelMessage[]> => {
	const uploaded = await uploadedFiles(ctx, campaign)
	const summaries = await messageSummaries(ctx, campaign)
	const recent = await recentMessages(ctx, campaign)
	const context = await currentGameContext(ctx, campaign)

	const allMessages: ModelMessage[] = [
		...uploaded.messages,
		...summaries.messages,
		...recent.messages,
		...context.messages,
	]

	return allMessages
}

export const messageSummaries = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
	countTokensFlag = false,
): Promise<{ messages: ModelMessage[]; charCount: number }> => {
	const allSummaries = await ctx.runQuery(internal.summaries.list, {
		campaignId: campaign._id,
	})

	const content =
		allSummaries.length > 0
			? `Here is the summary of the previous sessions:\n\n${allSummaries.map((summary) => summary.summary).join("\n")}`
			: ""

	const messages: ModelMessage[] =
		allSummaries.length > 0
			? [
					{
						role: "user" as const,
						content: [
							{
								type: "text" as const,
								text: content,
							},
						],
					},
				]
			: []

	if (!countTokensFlag) {
		return { messages, charCount: 0 }
	}

	const model = campaign.model

	return {
		messages,
		charCount: content ? await countTokens(content, model) : 0,
	}
}

export const recentMessages = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
	countTokensFlag = false,
): Promise<{ messages: ModelMessage[]; charCount: number }> => {
	const allMessages = await ctx.runQuery(internal.messages.listInternal, {
		campaignId: campaign._id,
	})

	const formatted: ModelMessage[] = []

	for (const msg of allMessages.slice(0, -1)) {
		if (msg.role === "user") {
			const userContent = msg.content.filter((block) => block.type === "text")
			// Skip messages with empty content (invalid in AI SDK v5)
			if (userContent.length === 0) continue

			formatted.push({
				role: "user",
				content: userContent,
			})
			continue
		}

		if (msg.role === "tool") {
			const toolContent = msg.content
				.filter((block) => block.type === "tool-result")
				.map((block) => ({
					type: "tool-result" as const,
					toolCallId: block.toolCallId,
					toolName: block.toolName,
					result: block.result,
				}))

			// Skip messages with empty content (invalid in AI SDK v5)
			if (toolContent.length === 0) continue

			formatted.push({
				role: "tool",
				content: toolContent as any, // Transform from stored format to AI SDK format
			})
			continue
		}

		// Assistant message - convert stored 'args' to AI SDK v5 'input'
		const assistantContent = msg.content
			.filter((block) => block.type === "text" || block.type === "tool-call")
			.map((block) => {
				if (block.type === "tool-call") {
					// Handle both old format (args) and new format (input) for backwards compat
					return {
						type: "tool-call" as const,
						toolCallId: block.toolCallId,
						toolName: block.toolName,
						input: block.input ?? block.args, // Support both formats
					}
				}
				return block
			})

		// Skip messages with empty content (invalid in AI SDK v5)
		if (assistantContent.length === 0) continue

		formatted.push({
			role: "assistant",
			content: assistantContent,
		})

		// If this assistant message has toolResults, synthesize a tool message after it
		if (msg.toolResults && msg.toolResults.length > 0) {
			formatted.push({
				role: "tool",
				content: msg.toolResults.map((tr) => {
					// v5 requires output to have structure: { type: 'content', value: [content parts] }
					let output: any
					const result = tr.result

					if (typeof result === "string") {
						// String results become text content part
						output = {
							type: "content",
							value: [{ type: "text", text: result }],
						}
					} else if (
						typeof result === "number" ||
						typeof result === "boolean" ||
						result === null ||
						result === undefined
					) {
						// Other primitives get stringified
						output = {
							type: "content",
							value: [{ type: "text", text: String(result) }],
						}
					} else {
						// Objects/arrays get JSON-serialized
						output = {
							type: "content",
							value: [{ type: "text", text: JSON.stringify(result) }],
						}
					}

					return {
						type: "tool-result" as const,
						toolCallId: tr.toolCallId,
						toolName: tr.toolName,
						output,
					}
				}),
			})
		}
	}

	if (!countTokensFlag) {
		return { messages: formatted, charCount: 0 }
	}

	const model = campaign.model
	const charCount =
		formatted.length > 0 ? await countTokens(formatted, model) : 0

	return {
		messages: formatted,
		charCount,
	}
}

export const uploadedFiles = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
	countTokensFlag = false,
) => {
	let uploadedFiles: (any | null)[] = [] // File parts from Google AI

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
			if (gameSystem.files.length === 0) {
				return { messages: [], charCount: 0 }
			}

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
							mediaType: existingFile.mimeType || "",
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
						mediaType: myfile.mimeType || "",
					}
				}),
			)

			// Remove any that didn't upload successfully
			const compactedFiles = compact(uploadedFiles)

			if (compactedFiles.length > 0) {
				const messages: ModelMessage[] = [
					{
						role: "user" as const,
						content: [
							{
								type: "text" as const,
								text: "Here are the files that are relevant to the game system:",
							},
							...compactedFiles,
						],
					},
				]

				if (!countTokensFlag) {
					return { messages, charCount: 0 }
				}

				const model = campaign.model
				const charCount = await countTokens(messages, model)

				return { messages, charCount }
			}
		}
	}

	return { messages: [], charCount: 0 }
}

export const currentGameContext = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
	countTokensFlag = false,
) => {
	let characterSheet = await ctx.runQuery(
		internal.characterSheets.getInternal,
		{
			campaignId: campaign._id,
		},
	)

	if (!characterSheet && isToolEnabled("update_character_sheet", campaign)) {
		let defaultCharacterData: Record<string, unknown> = {}

		if (campaign.gameSystemId) {
			// Already have a query for this, will it be cached? Or should we pass it around?
			const gameSystem = await ctx.runQuery(internal.gameSystems.getInternal, {
				id: campaign.gameSystemId,
			})

			defaultCharacterData = gameSystem?.defaultCharacterData ?? {}
		}
		// TODO: can you do this in one operation?
		await ctx.runMutation(internal.characterSheets.createInternal, {
			campaignId: campaign._id,
			name: "New Character",
			description: "",
			data: defaultCharacterData,
		})

		characterSheet = await ctx.runQuery(internal.characterSheets.getInternal, {
			campaignId: campaign._id,
		})
	}

	const characters = await ctx.runQuery(internal.characters.listInternal, {
		campaignId: campaign._id,
	})

	// Only send active characters to the LLM
	const activeCharacters = characters.filter((c) => c.active)

	const serializedCharacters = activeCharacters.map((character) => {
		let result = `<character_name>${character.name}</character_name>\n<character_description>${character.description}</character_description><character_image_prompt>${character.imagePrompt}</character_image_prompt>`
		if (character.notes) {
			result += `\n<character_notes>${character.notes}</character_notes>`
		}
		if (character.currentOutfit) {
			result += `\n<current_outfit>${character.currentOutfit}</current_outfit>`
		}
		if (character.outfits && Object.keys(character.outfits).length > 0) {
			const outfitNames = Object.keys(character.outfits).join(", ")
			result += `\n<available_outfits>${outfitNames}</available_outfits>`
		}
		return `${result}\n`
	})

	const formattedCharacterSheet = characterSheet
		? {
				name: characterSheet.name,
				description: characterSheet.description,
				data: characterSheet.data,
			}
		: null

	const formattedQuestLog = (campaign.questLog ?? [])
		.filter((quest) => quest.status === "active")
		.map(
			(quest) =>
				`- <quest_title>${quest.title}</quest_title> <quest_status>${quest.status}</quest_status> <objective_description>${quest.objective}</objective_description>`,
		)
		.join("\n")

	const formattedClocks = campaign.clocks
		?.filter((clock) => clock.currentTicks < clock.maxTicks)
		.map(
			(clock) =>
				`- <clock_name>${clock.name}</clock_name> <clock_current_ticks>${clock.currentTicks}</clock_current_ticks> <clock_max_ticks>${clock.maxTicks}</clock_max_ticks> <clock_hint>${clock.hint}</clock_hint>`,
		)
		.join("\n")

	// Build individual parts with character counts
	let planText = ""
	if (campaign.plan && Object.keys(campaign.plan).length > 0) {
		planText =
			"\n\nYour current internal plan for the session. The plan is divided into sections. Update it with the `update_plan tool when needed:"
		for (const part of Object.keys(campaign.plan)) {
			planText += `\n\n<${part}>${campaign.plan[part]}</${part}>`
		}
	} else {
		planText =
			"\n\nYou currently have no plan. You can use the `update_plan` tool to create one, including details about the current scene, future story arcs, and any other important details."
	}

	let questLogText = ""
	if (formattedQuestLog) {
		questLogText = `\n\nHere are the active quests:\n\n${formattedQuestLog}`
	} else {
		questLogText =
			"\n\nYou currently have no quests active. You can use the `update_quest_log` tool to create a quest for the player to track in their UI."
	}

	let activeClocksText = ""
	if (isToolEnabled("update_clock", campaign)) {
		if (formattedClocks) {
			activeClocksText = `\n\nHere are the active clocks:\n\n${formattedClocks}`
		} else {
			activeClocksText =
				"\n\nYou currently have no clocks active. You can use the `update_clock` tool to create a clock for the player to track in their UI."
		}
	}

	let temporalText = ""
	if (isToolEnabled("update_temporal", campaign)) {
		if (campaign.temporal) {
			temporalText = `\n\nCurrent in-game time: ${campaign.temporal.date}, ${campaign.temporal.timeOfDay}`
			if (campaign.temporal.notes) {
				temporalText += ` (notes: ${campaign.temporal.notes})`
			}
		} else {
			temporalText =
				"\n\nNo in-game time has been set yet. You can use the `update_temporal` tool to set the current date and time of day in the game world."
		}
	}

	let charactersText = ""
	if (serializedCharacters.length > 0) {
		charactersText = `\n\nHere are the existing characters: ${serializedCharacters.join("\n")}`
	}

	let characterSheetText = ""
	if (formattedCharacterSheet) {
		characterSheetText = `\n\nHere is the character sheet for the player: ${JSON.stringify(
			formattedCharacterSheet,
		)}`
	}

	// Build notices section - warnings and important messages for the LLM
	const notices: string[] = []

	// Check for missing characters that need introduction
	const missingCharacters = campaign.activeCharacters?.filter(
		(activeCharacterName) =>
			!characters.find((c) => c.name === activeCharacterName),
	)
	if (missingCharacters && missingCharacters.length > 0) {
		notices.push(
			`There are active characters in the scene that haven't been introduced yet. Use the \`introduce_character\` tool to introduce them: ${missingCharacters.join(", ")}`,
		)
	}

	// Check if we need to warn about context window getting full
	// We'll get the last assistant message to check token usage
	const allMessages = await ctx.runQuery(internal.messages.listInternal, {
		campaignId: campaign._id,
	})
	const lastAssistantMessage = allMessages
		.filter((m) => m.role === "assistant" && m.usage)
		.pop()

	if (
		lastAssistantMessage?.usage &&
		lastAssistantMessage.usage.inputTokens > CONTEXT_WARNING_TOKEN_THRESHOLD
	) {
		notices.push(
			`The context window is getting full (${lastAssistantMessage.usage.inputTokens} input tokens used in the last message). Soon, older messages will be collapsed into summaries, keeping only the last ${MESSAGES_TO_KEEP_AFTER_COLLAPSE} messages in full. Before this happens, review older messages for any important facts, requests, or details that might not be captured by automatic summaries, and use the \`update_plan\` tool to store them for future reference.`,
		)
	}

	let noticesText = ""
	if (notices.length > 0) {
		noticesText = `\n\n<important_notices>\n${notices.map((notice) => `- ${notice}`).join("\n")}\n</important_notices>`
	}

	const currentContext =
		planText +
		questLogText +
		activeClocksText +
		temporalText +
		charactersText +
		characterSheetText +
		noticesText

	if (!countTokensFlag) {
		return {
			messages: [
				{
					role: "user" as const,
					content: [
						{
							type: "text" as const,
							text: `Here is the current context of the game: ${currentContext}`,
						},
					],
				},
			],
			breakdown: {
				plan: 0,
				questLog: 0,
				activeClocks: 0,
				temporal: 0,
				characters: 0,
				characterSheet: 0,
				notices: 0,
				total: 0,
			},
		}
	}

	const model = campaign.model

	return {
		messages: [
			{
				role: "user" as const,
				content: [
					{
						type: "text" as const,
						text: `Here is the current context of the game: ${currentContext}`,
					},
				],
			},
		],
		breakdown: {
			plan: await countTokens(planText, model),
			questLog: await countTokens(questLogText, model),
			activeClocks: await countTokens(activeClocksText, model),
			temporal: await countTokens(temporalText, model),
			characters: await countTokens(charactersText, model),
			characterSheet: await countTokens(characterSheetText, model),
			notices: await countTokens(noticesText, model),
			total: await countTokens(currentContext, model),
		},
	}
}

// const _campaignMemories = async (
// 	ctx: ActionCtx,
// 	campaign: Doc<"campaigns">,
// 	lastMessage: ModelMessage,
// ): Promise<ModelMessage[]> => {
// 	const anyMemories = await ctx.runQuery(internal.memories.count, {
// 		campaignId: campaign._id,
// 	})

// 	let serializedMemories: {
// 		type: string
// 		summary: string
// 		context: string
// 		tags: string[]
// 	}[] = []

// 	if (anyMemories > 0) {
// 		const { embedding } = await embed({
// 			model: google.textEmbeddingModel("gemini-embedding-exp-03-07"),
// 			providerOptions: {
// 				google: {
// 					embeddingTaskType: "RETRIEVAL_QUERY",
// 				},
// 			},
// 			value:
// 				typeof lastMessage.content === "string"
// 					? lastMessage.content
// 					: lastMessage.content
// 							.map((block) => {
// 								if (block.type === "text") {
// 									return block.text
// 								}

// 								return ""
// 							})
// 							.join(""),
// 		})

// 		const memoryRefs = await ctx.vectorSearch("memories", "by_embedding", {
// 			vector: embedding,
// 			limit: 10,
// 			filter: (q) => q.eq("campaignId", campaign._id),
// 		})

// 		const memories = await ctx.runQuery(internal.memories.findMany, {
// 			ids: memoryRefs.map((ref) => ref._id),
// 		})

// 		serializedMemories = memories.map((memory) => ({
// 			type: memory.type,
// 			summary: memory.summary,
// 			context: memory.context,
// 			tags: memory.tags,
// 		}))
// 	}

// 	if (serializedMemories.length > 0) {
// 		// TOOD: maybe split these out into individual messages?
// 		return [
// 			{
// 				role: "user" as const,
// 				content: [
// 					{
// 						type: "text" as const,
// 						text: `\n\nHere are some memories from the game that might relate to this situation: ${JSON.stringify(
// 							serializedMemories,
// 						)}`,
// 					},
// 				],
// 			},
// 		]
// 	}

// 	return []
// }

export const otherCampaignSummaries = async (
	ctx: ActionCtx,
	model: string,
	countTokensFlag = false,
): Promise<{ messages: ModelMessage[]; charCount: number }> => {
	const allCampaigns = await ctx.runQuery(internal.campaigns.listInternal, {})

	const formattedMessages = allCampaigns
		.map((c) => {
			if (!c.lastCampaignSummary) {
				return null
			}

			return {
				role: "user" as const,
				content: [
					{
						type: "text" as const,
						text: `## ${c.name}: ${c.description}\n\n### Summary\n\n${c.lastCampaignSummary}`,
					},
				],
			}
		})
		.filter((m) => m !== null)
		.slice(-RECENT_CAMPAIGNS_CONTEXT_COUNT) // Max last N campaigns to keep token count down

	const messages = compact(formattedMessages)

	if (!countTokensFlag) {
		return { messages, charCount: 0 }
	}

	const charCount = messages.length > 0 ? await countTokens(messages, model) : 0

	return { messages, charCount }
}
