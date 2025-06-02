import Anthropic from "@anthropic-ai/sdk"
import type { MessageParam } from "@anthropic-ai/sdk/resources"
import { env } from "../../env"

const SYSTEM_PROMPT = "You are a helpful assistant."

const client = new Anthropic({
	apiKey: env.VITE_ANTHROPIC_API_KEY,
	dangerouslyAllowBrowser: true,
})

export const sendToClaude = async (messageList: MessageParam[]) => {
	const messagePayload = messageList.map(({ role, content }) => ({
		role,
		content,
	}))

	const message = await client.messages.create({
		max_tokens: 1024,
		messages: messagePayload,
		system: SYSTEM_PROMPT,
		model: "claude-3-5-sonnet-latest",
	})

	return message
}
