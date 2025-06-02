import { useStore } from "@tanstack/react-store"
import { nanoid } from "nanoid"
import { useEffect, useRef, useState } from "react"
import { mainStore } from "../stores/main"
import { Message } from "./Message"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useAi } from "./useAi"

export const ChatInterface: React.FC = () => {
	const campaign = useStore(mainStore, (state) => state.campaigns[0])

	const [isLoading, setIsLoading] = useState(false)
	const [input, setInput] = useState(
		"Can you help me roll the dice to choose attributes for a new D&D character?",
	)
	const sendMessage = useAi(campaign.id)
	const messagePanelRef = useRef<HTMLDivElement>(null)

	// biome-ignore lint/correctness/useExhaustiveDependencies: I hate useEffect honestly
	useEffect(() => {
		if (messagePanelRef.current) {
			messagePanelRef.current.scrollTo({
				top: messagePanelRef.current.scrollHeight,
			})
		}
	}, [campaign.messages])

	const handleSend = async () => {
		setIsLoading(true)
		const newMessage = {
			id: nanoid(),
			role: "user",
			content: input,
		} as const

		setInput("")
		await sendMessage(newMessage)
		setIsLoading(false)
	}
	return (
		<div className="flex flex-col w-full h-screen">
			<h1 className="text-4xl font-bold p-4">Chat Interface</h1>

			<div
				ref={messagePanelRef}
				className="flex-1 flex flex-col justify-end gap-4 min-h-0 py-4 px-4 flex-grow overflow-y-auto"
			>
				{campaign.messages.map((message) => (
					<Message key={message.id} message={message} />
				))}

				{JSON.stringify(campaign)}
			</div>

			<div className="flex items-center gap-4 p-4">
				<Input
					autoFocus
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Enter your message"
					className="flex-grow"
					onKeyUp={(e) => {
						if (e.key === "Enter") {
							handleSend()
						}
					}}
				/>

				<Button variant="outline" onClick={handleSend} isLoading={isLoading}>
					Send
				</Button>
			</div>
		</div>
	)
}
