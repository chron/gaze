import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { v } from "convex/values"
import { action } from "./_generated/server"

/**
 * Converts text from second person to first person for RPG choices
 * Uses a fast, cheap model (gemini-2.5-flash-lite) for the conversion
 */
export const convertToFirstPerson = action({
	args: {
		text: v.string(),
	},
	handler: async (ctx, args): Promise<string> => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const prompt = `You are a helpful assistant that converts second-person narrative text into first-person narrative text.

Convert the following text from second person (you/your) to first person (I/me/my).

Rules:
- DO NOT change any third-person pronouns (he/she/her/they/etc.)
- Keep the same tense and mood
- Keep the same meaning and tone
- Only change pronouns and verb forms in the NARRATIVE portions
- Do NOT change any text inside quotation marks (dialogue should remain exactly as written)
- Do NOT remove or change any punctuation or quotation marks
- Do not add explanations or extra text
- Return ONLY the converted text

Examples:

Input: You turn your back on her without a word and walk back into the house.
Output: I turn my back on her without a word and walk back into the house.

Input: Your voice is quiet, cold, and absolutely clear.
Output: My voice is quiet, cold, and absolutely clear.

Input: You make it sound like a game, you say, a hint of a watery smile on your face.
Output: I make it sound like a game, I say, a hint of a watery smile on my face.

Input: I don't know what you mean, she says. You look away, unable to meet her eyes.
Output: I don't know what you mean, she says. I look away, unable to meet her eyes.

Input: Call after her.
Output: Call after her.

Input: "Okay, Ms. Fuller. You've convinced me."
Output: "Okay, Ms. Fuller. You've convinced me."

Now convert this text:
${args.text}`

		try {
			const { text } = await generateText({
				model: google("gemini-2.5-flash-lite"),
				prompt,
				temperature: 0.3, // Low temperature for consistent, predictable conversions
			})

			// Return the trimmed result
			return text.trim()
		} catch (error) {
			console.error("Error converting to first person:", error)
			// Fall back to returning the original text if conversion fails
			return args.text
		}
	},
})
