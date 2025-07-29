import { google } from "@ai-sdk/google"
import { createHume } from "@ai-sdk/hume"
import { experimental_generateSpeech, generateText, tool } from "ai"
import { v } from "convex/values"
import { z } from "zod"
import { api, internal } from "./_generated/api"
import { action, internalMutation } from "./_generated/server"

export const hume = createHume({
	apiKey: process.env.HUME_API_KEY ?? "",
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

		const prompt = `
    You will be given a message that is part of a transcript of a role-playing game session.
    You need to break it up into utterances so it can be sent to a text-to-speech service.

    Make sure all text is included in the utterances.

    Some utterances belong to individual characters. If an utterance does not go with any specific
    character, use "Narrator" for the character.

    You will also provide instructions on delivery for the voice actor in the 'instructions' field.
    Include a short sentence which can cover things like:

    - Emotional tone: happiness, sadness, excitement, nervousness, etc.
    - Delivery style: whispering, shouting, rushed speaking, measured pace, etc.
    - Performance context: speaking to a crowd, intimate conversation, etc.

    The characters available are: ${characters.map((c) => c.name).join(", ")}

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

		console.log(utterances)

		const storageIds = []

		console.log("Generating speech for", utterances.length, "utterances")

		for (const utterance of utterances) {
			let humeVoiceId = "b89de4b1-3df6-4e4f-a054-9aed4351092d" // Default narrator

			const character = characters.find((c) => c.name === utterance.character)

			if (character?.humeVoiceId) {
				humeVoiceId = character.humeVoiceId
			}

			try {
				const result = await experimental_generateSpeech({
					model: hume.speech(),
					text: utterance.text,
					voice: humeVoiceId,
					instructions: utterance.instructions,
				})

				const { uint8Array, mimeType } = result.audio
				const blob = new Blob([uint8Array], { type: mimeType })
				const storageId = await ctx.storage.store(blob)

				console.log(
					"Generated speech for",
					utterance.text,
					"with voice",
					humeVoiceId,
				)

				storageIds.push(storageId)
			} catch (error) {
				console.error("Error generating speech for", utterance.text, error)
			}
		}

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
