import { google } from "@ai-sdk/google"
import { GoogleGenAI } from "@google/genai"
import {
	type CoreAssistantMessage,
	type CoreMessage,
	type CoreToolMessage,
	type CoreUserMessage,
	type FilePart,
	embed,
} from "ai"
import { compact } from "../../src/utils/compact"
import { api, internal } from "../_generated/api"
import type { Doc, Id } from "../_generated/dataModel"
import type { ActionCtx } from "../_generated/server"
import systemPrompt from "./system"

// Helper to count tokens using Google's API
const countTokens = async (
	content: string | CoreMessage[],
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
			characters: number
			characterSheet: number
			missingCharacters: number
			total: number
		}
		total: number
	}
	grandTotal: number
}

export const mainChatPrompt = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
): Promise<[string, CoreMessage[]]> => {
	const { prompt } = await componseSystemPrompt(ctx, campaign)

	// Intro message for a new campaign
	if (campaign.name === "") {
		const model = campaign.model
		const otherSummaries = await otherCampaignSummaries(ctx, model, false)
		const recent = await recentMessages(ctx, campaign, false)
		const introInstruction = {
			role: "user",
			content:
				"<game_information>We have not yet locked in the campaign details. You can ask the user any questions you need to. Once you have enough information from the user, use the `set_campaign_info` tool to set the name, description, and imagePrompt.</game_information>",
		} as const

		return [
			prompt,
			[
				{
					role: "user",
					content:
						"Here are the summaries of the other campaigns we have played together:",
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
		? await ctx.runQuery(api.gameSystems.get, {
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
): Promise<CoreMessage[]> => {
	const uploaded = await uploadedFiles(ctx, campaign)
	const summaries = await messageSummaries(ctx, campaign)
	const recent = await recentMessages(ctx, campaign)
	const context = await currentGameContext(ctx, campaign)
	return [
		...uploaded.messages,
		...summaries.messages,
		...recent.messages,
		...context.messages,
	]
}

export const messageSummaries = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
	countTokensFlag = false,
): Promise<{ messages: CoreMessage[]; charCount: number }> => {
	const allSummaries = await ctx.runQuery(internal.summaries.list, {
		campaignId: campaign._id,
	})

	const content =
		allSummaries.length > 0
			? `Here is the summary of the previous sessions:\n\n${allSummaries.map((summary) => summary.summary).join("\n")}`
			: ""

	const messages: CoreMessage[] =
		allSummaries.length > 0
			? [
					{
						role: "user",
						content,
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
): Promise<{ messages: CoreMessage[]; charCount: number }> => {
	const allMessages = await ctx.runQuery(api.messages.list, {
		campaignId: campaign._id,
	})

	const formatted: CoreMessage[] = []

	for (const msg of allMessages.slice(0, -1)) {
		if (msg.role === "user") {
			formatted.push({
				role: "user",
				content: msg.content.filter((block) => block.type === "text"),
			} satisfies CoreUserMessage)
			continue
		}

		if (msg.role === "tool") {
			formatted.push({
				role: "tool",
				content: msg.content.filter((block) => block.type === "tool-result"),
			} satisfies CoreToolMessage)
			continue
		}

		// Assistant message
		formatted.push({
			role: "assistant",
			content: msg.content.filter(
				(block) =>
					block.type === "text" ||
					// See note above about reasoning
					block.type === "tool-call",
			),
		} satisfies CoreAssistantMessage)

		// If this assistant message has toolResults, synthesize a tool message after it
		if (msg.toolResults && msg.toolResults.length > 0) {
			formatted.push({
				role: "tool",
				content: msg.toolResults,
			} satisfies CoreToolMessage)
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

			// Remove any that didn't upload successfully
			const compactedFiles = compact(uploadedFiles)

			if (compactedFiles.length > 0) {
				const messages: CoreMessage[] = [
					{
						role: "user",
						content: [
							{
								type: "text",
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
	let characterSheet = await ctx.runQuery(api.characterSheets.get, {
		campaignId: campaign._id,
	})

	if (!characterSheet) {
		let defaultCharacterData: Record<string, unknown> = {}

		if (campaign.gameSystemId) {
			// Already have a query for this, will it be cached? Or should we pass it around?
			const gameSystem = await ctx.runQuery(api.gameSystems.get, {
				id: campaign.gameSystemId,
			})

			defaultCharacterData = gameSystem?.defaultCharacterData ?? {}
		}
		// TODO: can you do this in one operation?
		await ctx.runMutation(api.characterSheets.create, {
			campaignId: campaign._id,
			name: "New Character",
			description: "",
			data: defaultCharacterData,
		})

		characterSheet = await ctx.runQuery(api.characterSheets.get, {
			campaignId: campaign._id,
		})
	}

	const characters = await ctx.runQuery(api.characters.list, {
		campaignId: campaign._id,
	})

	const serializedCharacters = characters.map(
		(character) =>
			`<character_name>${character.name}</character_name>\n<character_description>${character.description}</character_description>\n<character_image_prompt>${character.imagePrompt}</character_image_prompt>`,
	)

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

	// Build individual parts with character counts
	let planText = ""
	if (campaign.plan) {
		planText =
			"\n\nYour current internal plan for the session. The plan is divided into sections. Update it with the `update_plan tool when needed:"
		if (typeof campaign.plan === "string") {
			planText += `\n\n<overall_story>${campaign.plan}</overall_story>`
		} else {
			for (const part of Object.keys(campaign.plan)) {
				planText += `\n\n<${part}>${campaign.plan[part]}</${part}>`
			}
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

	const missingCharacters = campaign.activeCharacters?.filter(
		(activeCharacterName) =>
			!characters.find((c) => c.name === activeCharacterName),
	)
	let missingCharactersText = ""
	if (missingCharacters && missingCharacters.length > 0) {
		missingCharactersText = `\n\nIMPORTANT: There are active characters in the scene that haven't been introduced yet. Use the \`introduce_character\` tool to introduce them: ${missingCharacters.join(", ")}`
	}

	const currentContext =
		planText +
		questLogText +
		charactersText +
		characterSheetText +
		missingCharactersText

	if (!countTokensFlag) {
		return {
			messages: [
				{
					role: "user",
					content: `Here is the current context of the game: ${currentContext}`,
				},
			] as const,
			breakdown: {
				plan: 0,
				questLog: 0,
				characters: 0,
				characterSheet: 0,
				missingCharacters: 0,
				total: 0,
			},
		}
	}

	const model = campaign.model

	return {
		messages: [
			{
				role: "user",
				content: `Here is the current context of the game: ${currentContext}`,
			},
		] as const,
		breakdown: {
			plan: await countTokens(planText, model),
			questLog: await countTokens(questLogText, model),
			characters: await countTokens(charactersText, model),
			characterSheet: await countTokens(characterSheetText, model),
			missingCharacters: await countTokens(missingCharactersText, model),
			total: await countTokens(currentContext, model),
		},
	}
}

const campaignMemories = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
	lastMessage: CoreMessage,
): Promise<CoreMessage[]> => {
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

	if (serializedMemories.length > 0) {
		// TOOD: maybe split these out into individual messages?
		return [
			{
				role: "user",
				content: `\n\nHere are some memories from the game that might relate to this situation: ${JSON.stringify(
					serializedMemories,
				)}`,
			},
		] as const
	}

	return []
}

export const otherCampaignSummaries = async (
	ctx: ActionCtx,
	model: string,
	countTokensFlag = false,
): Promise<{ messages: CoreMessage[]; charCount: number }> => {
	const allCampaigns = await ctx.runQuery(api.campaigns.list, {})

	const formattedMessages = allCampaigns
		.map((c) => {
			if (!c.lastCampaignSummary) {
				return null
			}

			return {
				role: "user",
				content: `## ${c.name}: ${c.description}\n\n### Summary\n\n${c.lastCampaignSummary}`,
			} satisfies CoreMessage
		})
		.filter((m) => m !== null)
		.slice(-20) // Max last 20 campaigns to keep token count down

	const messages = compact(formattedMessages)

	if (!countTokensFlag) {
		return { messages, charCount: 0 }
	}

	const charCount = messages.length > 0 ? await countTokens(messages, model) : 0

	return { messages, charCount }
}
