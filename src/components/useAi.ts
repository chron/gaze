import { nanoid } from "nanoid"
import { sendToClaude } from "../lib/anthropic"
import { mainStore } from "../stores/main"
import type { Message } from "../types"

const addOrUpdateMessage = (campaignId: string, message: Message) => {
	mainStore.setState((state) => {
		const campaign = state.campaigns.find((c) => c.id === campaignId)
		if (!campaign) return state

		const messageIndex = campaign.messages.findIndex((m) => m.id === message.id)
		const newCampaign = {
			...campaign,
			messages:
				messageIndex === -1
					? [...campaign.messages, message]
					: [
							...campaign.messages.slice(0, messageIndex),
							message,
							...campaign.messages.slice(messageIndex + 1),
						],
		}

		return {
			...state,
			campaigns: state.campaigns.map((c) =>
				c.id === campaignId ? newCampaign : c,
			),
		}
	})
}

export const useAi = (campaignId: string) => {
	const sendMessage = async (newMessage: Message) => {
		addOrUpdateMessage(campaignId, newMessage)

		const messageHistory =
			mainStore.state.campaigns.find((c) => c.id === campaignId)?.messages ?? []

		const response = await sendToClaude(
			[...messageHistory, newMessage],
			(id, _delta, snapshot) => {
				addOrUpdateMessage(campaignId, {
					id,
					role: "assistant",
					content: snapshot,
				})
			},
		)

		addOrUpdateMessage(campaignId, response)

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

	return sendMessage
}

const rollDice = (number: number, faces: number) => {
	const results = []
	for (let i = 0; i < number; i++) {
		results.push(Math.floor(Math.random() * faces) + 1)
	}
	const total = results.reduce((acc, curr) => acc + curr, 0)
	return `Individual rolls: ${results.join(", ")}, total: ${total}`
}
