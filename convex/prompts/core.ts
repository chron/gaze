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

export const mainChatPrompt = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
): Promise<[string, CoreMessage[]]> => {
	const prompt = await componseSystemPrompt(ctx, campaign)

	// Intro message for a new campaign
	if (campaign.name === "") {
		return [
			prompt,
			[
				{
					role: "user",
					content:
						"Here are the summaries of the other campaigns we have played together:",
				},
				...(await otherCampaignSummaries(ctx)),
				// ...(await uploadedFiles(ctx, campaign)),
				...(await recentMessages(ctx, campaign)),
				{
					role: "user",
					content:
						"<game_information>We have not yet locked in the campaign details. You can ask the user any questions you need to. Once you have enough information from the user, use the `set_campaign_info` tool to set the name, description, and imagePrompt.</game_information>",
				},
			],
		]
	}

	const formattedMessages = await constructMessages(ctx, campaign)

	return [prompt, formattedMessages]
}

const componseSystemPrompt = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
) => {
	let prompt = systemPrompt

	const gameSystem = campaign.gameSystemId
		? await ctx.runQuery(api.gameSystems.get, {
				id: campaign.gameSystemId,
			})
		: null

	prompt += gameSystem
		? `\n\nYou are hosting a game of ${gameSystem.name}\n\n${gameSystem.prompt}`
		: "\n\nThe game is a dice-less free-form narrative RPG without a specific ruleset."

	if (campaign.name !== "") {
		prompt += `\n\nThe campaign is called ${campaign.name}\n\n${campaign.description}`
	}

	return prompt
}

const constructMessages = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
): Promise<CoreMessage[]> => {
	return [
		...(await uploadedFiles(ctx, campaign)),
		...(await messageSummaries(ctx, campaign)),
		...(await recentMessages(ctx, campaign)),
		...(await currentGameContext(ctx, campaign)),
	]
}

const messageSummaries = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
): Promise<CoreMessage[]> => {
	const allSummaries = await ctx.runQuery(internal.summaries.list, {
		campaignId: campaign._id,
	})

	return allSummaries.length > 0
		? [
				{
					role: "user",
					content: `Here is the summary of the previous sessions:\n\n${allSummaries.map((summary) => summary.summary).join("\n")}`,
				},
			]
		: []
}

const recentMessages = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
): Promise<CoreMessage[]> => {
	const allMessages = await ctx.runQuery(api.messages.list, {
		campaignId: campaign._id,
	})

	return allMessages.slice(0, -1).map((msg) => {
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
}

const uploadedFiles = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
): Promise<CoreMessage[]> => {
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
				return []
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
				return [
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
				] as const
			}
		}
	}

	return []
}

const currentGameContext = async (
	ctx: ActionCtx,
	campaign: Doc<"campaigns">,
): Promise<CoreMessage[]> => {
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
			data: defaultCharacterData,
		})

		characterSheet = await ctx.runQuery(api.characterSheets.get, {
			campaignId: campaign._id,
		})
	}

	const characters = await ctx.runQuery(api.characters.list, {
		campaignId: campaign._id,
	})

	const serializedCharacters = characters.map((character) => ({
		name: character.name,
		description: character.description,
		imagePrompt: character.imagePrompt,
	}))

	const formattedCharacterSheet = characterSheet
		? {
				name: characterSheet.name,
				description: characterSheet.description,
				data: characterSheet.data,
			}
		: null

	const formattedQuestLog = (campaign.questLog ?? [])
		.map(
			(quest) =>
				`- <quest_title>${quest.title}</quest_title> <quest_status>${quest.status}</quest_status> <objective_description>${quest.objective}</objective_description>`,
		)
		.join("\n")

	let currentContext = ""

	if (campaign.plan) {
		currentContext += `\n\nYour current internal plan for the session. Update it with the \`update_plan\ tool when needed:\n\n${campaign.plan}`
	} else {
		currentContext +=
			"\n\nYou currently have no plan. You can use the `update_plan` tool to create one, including details about the current scene, future story arcs, and any other important details."
	}

	if (formattedQuestLog) {
		currentContext += `\n\nHere is the quest log:\n\n${formattedQuestLog}`
	} else {
		currentContext +=
			"\n\nYou currently have no quest log. You can use the `update_quest_log` tool to create a quest for the player to track in their UI."
	}

	if (serializedCharacters.length > 0) {
		currentContext += `\n\nHere are the existing characters: ${JSON.stringify(
			serializedCharacters,
		)}`
	}

	if (formattedCharacterSheet) {
		currentContext += `\n\nHere is the character sheet for the player: ${JSON.stringify(
			formattedCharacterSheet,
		)}`
	}

	const missingCharacters = campaign.activeCharacters?.filter(
		(activeCharacterName) =>
			!characters.find((c) => c.name === activeCharacterName),
	)
	if (missingCharacters && missingCharacters.length > 0) {
		currentContext += `\n\nIMPORTANT: There are active characters in the scene that haven't been introduced yet. Use the \`introduce_character\` tool to introduce them: ${missingCharacters.join(", ")}`
	}

	return [
		{
			role: "user",
			content: `Here is the current context of the game: ${currentContext}`,
		},
	] as const
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
): Promise<CoreMessage[]> => {
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

	return compact(formattedMessages)
}
