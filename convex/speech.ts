import { google } from "@ai-sdk/google"
import { openrouter } from "@openrouter/ai-sdk-provider"
import { generateText, tool } from "ai"
import { v } from "convex/values"
import { HumeClient } from "hume"
import { z } from "zod"
import { api, internal } from "./_generated/api"
import { action, internalMutation } from "./_generated/server"

const hume = new HumeClient({
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	apiKey: process.env.HUME_API_KEY!,
})

export const generateAudioForMessage = action({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		const message = await ctx.runQuery(api.messages.get, {
			messageId: args.messageId,
		})

		if (!message) {
			throw new Error("Message not found")
		}

		const characters =
			(await ctx.runQuery(api.characters.list, {
				campaignId: message.campaignId,
			})) ?? []

		const characterSheet = await ctx.runQuery(api.characterSheets.get, {
			campaignId: message.campaignId,
		})

		const prompt = `
    You will be given a message that is part of a transcript of a role-playing game session.
    You need to break it up into chunks divided by who is speaking so it can be sent to a text-to-speech service.

    Make sure all text is included in the chunks, even narration between speech.

    Some chunks belong to individual characters. If a chunk does not go with any specific
    character, use "Narrator" for the character.

    You will also provide instructions on delivery for the voice actor in the 'instructions' field. These instructions will be used to generate the audio.
    Include a short sentence which can cover things like:

    - Emotional tone: happiness, sadness, excitement, nervousness, etc.
    - Delivery style: whispering, shouting, rushed speaking, measured pace, etc.
    - Performance context: speaking to a crowd, intimate conversation, etc.

    The characters available are: ${characters.map((c) => c.name).join(", ")}

		${characterSheet ? `The protagonist of the game is: ${characterSheet.name}` : ""}

    The message to be split up is:
    `

		const { toolCalls } = await generateText({
			system: prompt,
			model: google("gemini-2.5-flash"),
			messages: [
				{
					role: "user",
					content: message.content
						.map((c) => {
							if (c.type === "text") {
								return c.text
							}
							return ""
						})
						.join("\n\n"),
				},
			],
			toolChoice: {
				type: "tool",
				toolName: "utterances",
			},
			tools: {
				utterances: tool({
					description: "A list of utterances",
					parameters: z.object({
						utterances: z.array(
							z.object({
								text: z.string(),
								character: z.string(),
								instructions: z.string(),
							}),
						),
					}),
				}),
			},
		})

		const utterances = toolCalls[0].args.utterances

		const storageIds = []

		console.log("Generating speech for", utterances.length, "utterances")

		const formattedUtterances = utterances.map((utterance) => {
			const character = characters.find((c) => c.name === utterance.character)
			const humeVoiceId = character?.humeVoiceId
				? character.humeVoiceId
				: "b89de4b1-3df6-4e4f-a054-9aed4351092d"
			return {
				text: utterance.text,
				voice: {
					id: humeVoiceId,
					provider: "HUME_AI" as const,
				},
				description: utterance.instructions,
				// Later: speed and trailing silence are options here. Also [pause] in the text itself.
			}
		})

		console.log(formattedUtterances)

		const result = await hume.tts.synthesizeJson({
			body: {
				utterances: formattedUtterances,
			},
		})
		const audio = result.generations[0].audio
		// Can't use Buffer in the Convex runtime
		const binaryString = atob(audio)
		const audioBuffer = new Uint8Array(binaryString.length)
		for (let i = 0; i < binaryString.length; i++) {
			audioBuffer[i] = binaryString.charCodeAt(i)
		}
		const blob = new Blob([audioBuffer], { type: "audio/wav" })
		const storageId = await ctx.storage.store(blob)

		storageIds.push(storageId)

		await ctx.runMutation(internal.speech.storeSpeech, {
			messageId: args.messageId,
			storageIds,
		})
	},
})

export const storeSpeech = internalMutation({
	args: {
		messageId: v.id("messages"),
		storageIds: v.array(v.id("_storage")),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.messageId, {
			audio: args.storageIds,
		})
	},
})
