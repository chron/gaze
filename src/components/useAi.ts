import { nanoid } from "nanoid"
import { useState } from "react"
import { sendToClaude } from "../lib/anthropic"
import type { Message } from "../types"

export const useAi = () => {
	const [messages, setMessages] = useState<Message[]>([])

	const sendMessage = async (
		messageHistory: Message[],
		newMessage: Message,
	) => {
		const response = await sendToClaude([...messageHistory, newMessage])
		setMessages((oldMessages) => [...oldMessages, newMessage, response])

		if (response.stop_reason === "tool_use") {
			const lastBlock = response.content[response.content.length - 1]

			// TODO: multiple tools at once? Tools in the non-last block?
			if (lastBlock.type === "tool_use") {
				const toolName = lastBlock.name
				// Should be able to infer a real type from the OpenAPI schema I guess?
				// Maybe type with Zod and then parse here?
				if (toolName === "roll_dice") {
					const toolUseId = lastBlock.id
					const toolArgs = lastBlock.input as { number: number; faces: number }

					const result = rollDice(toolArgs.number, toolArgs.faces)
					const toolResultMessage = {
						id: nanoid(),
						role: "user",
						content: [
							{
								tool_use_id: toolUseId,
								type: "tool_result",
								content: result, // can also be content blocks
								// is_error: false,
							},
						],
					} as const

					sendMessage(
						[...messageHistory, newMessage, response],
						toolResultMessage,
					)
				}
			}
		}
	}

	const handleSend = (newMessage: Message) => sendMessage(messages, newMessage)

	return [messages, handleSend] as const
}

const rollDice = (number: number, faces: number) => {
	const results = []
	for (let i = 0; i < number; i++) {
		results.push(Math.floor(Math.random() * faces) + 1)
	}
	const total = results.reduce((acc, curr) => acc + curr, 0)
	return `Individual rolls: ${results.join(", ")}, total: ${total}`
}
