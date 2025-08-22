import { tool } from "ai"
import z from "zod"

export const chooseName = () =>
	tool({
		description:
			"When you want to create a new character or location, use this tool to ask the player for a name. You can provide some suggestions and they might take one or choose something of their own.",
		parameters: z.object({
			description: z
				.string()
				.describe("A description of the thing we're choosing a name for"),
			suggestedNames: z
				.array(z.string())
				.describe("Some names that might be suitable"),
		}),
	})
