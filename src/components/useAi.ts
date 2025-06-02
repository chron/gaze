import { nanoid } from "nanoid"
import { useState } from "react"
import { sendToClaude } from "../lib/anthropic"
import type { Message } from "../types"

export const useAi = () => {
	const [messages, setMessages] = useState<Message[]>([])

	const sendMessage = async (text: string) => {
		const newMessage = { id: nanoid(), role: "user", content: text } as const

		const response = await sendToClaude([...messages, newMessage])
		setMessages([...messages, newMessage, response])
	}

	return [messages, sendMessage] as const
}
