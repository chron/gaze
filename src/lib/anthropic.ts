import Anthropic from "@anthropic-ai/sdk"
import type { Tool } from "@anthropic-ai/sdk/resources"
import { nanoid } from "nanoid"
import { env } from "../../env"
import type { Message } from "../types"

const SYSTEM_PROMPT = "You are a helpful assistant."

const client = new Anthropic({
	apiKey: env.VITE_ANTHROPIC_API_KEY,
	dangerouslyAllowBrowser: true,
})

const tools: Tool[] = [
	{
		name: "roll_dice",
		description: "Roll one or more dice",
		input_schema: {
			type: "object",
			properties: {
				number: { type: "number", minimum: 1, maximum: 100 },
				faces: { type: "number", minimum: 1, maximum: 100 },
			},
			required: ["number", "faces"],
		},
	},
]

export const sendToClaude = async (
	messageList: Message[],
	newChunk: (id: string, text: string, textSnapshot: string) => void,
) => {
	const messagePayload = messageList.map(({ role, content }) => ({
		role,
		content,
	}))

	const id = nanoid()
	const stream = client.messages
		.stream({
			max_tokens: 1024,
			messages: messagePayload,
			system: SYSTEM_PROMPT,
			model: "claude-3-5-sonnet-latest",
			tools,
			tool_choice: {
				type: "auto",
			},
			stream: true,
		})
		.on("text", (text, textSnapshot) => newChunk(id, text, textSnapshot))

	const message = await stream.finalMessage()
	return { ...message, id }
}
