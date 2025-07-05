import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import { MessageList } from "./MessageList"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

export const ChatInterface: React.FC = () => {
	const campaigns = useQuery(api.campaigns.list)
	const addUserMessage = useMutation(api.messages.addUserMessage)

	const campaign = campaigns?.[0] // TODO: router later

	const [isLoading, setIsLoading] = useState(false)
	const [input, setInput] = useState(
		"Can you help me roll the dice to choose attributes for a new D&D character?",
	)

	const handleSend = async () => {
		if (!campaign) throw new Error("No campaign found")

		setIsLoading(true)
		const newMessage = {
			campaignId: campaign._id,
			content: input,
		} as const

		setInput("")
		await addUserMessage(newMessage)
		setIsLoading(false)
	}

	if (!campaign) {
		return <div>No campaign found</div>
	}

	return (
		<div className="flex flex-col w-full h-screen">
			<h1 className="text-4xl font-bold p-4">{campaign.name}</h1>

			<MessageList campaignId={campaign._id} />

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
