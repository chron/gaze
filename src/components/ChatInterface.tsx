import { useMutation, useQuery } from "convex/react"
import { useRef, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { CharacterList } from "./CharacterList"
import { MessageList } from "./MessageList"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

type Props = {
	campaignId: Id<"campaigns">
}

export const ChatInterface: React.FC<Props> = ({ campaignId }) => {
	const messagePanelRef = useRef<HTMLDivElement>(null)
	const campaign = useQuery(api.campaigns.get, { id: campaignId })
	const lastScene = useQuery(api.messages.getLastScene, { campaignId })
	const addUserMessage = useMutation(api.messages.addUserMessage)

	const [isLoading, setIsLoading] = useState(false)
	const [input, setInput] = useState("")

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

	if (campaign === undefined) {
		return null
	}

	if (campaign === null) {
		return <div>No campaign found</div>
	}

	return (
		<div
			className="flex flex-col w-full h-screen"
			style={{
				backgroundColor: lastScene?.scene?.backgroundColor ?? "white",
			}}
		>
			<h1 className="text-4xl font-bold p-4">{campaign.name}</h1>
			<div ref={messagePanelRef} className="flex-1 min-h-0 overflow-y-auto">
				<MessageList
					campaignId={campaign._id}
					messagePanelRef={messagePanelRef}
				/>
			</div>

			<div className="flex items-center gap-4 p-4 relative">
				<CharacterList campaignId={campaign._id} />
				<Input
					autoFocus
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Enter your message"
					className="flex-grow"
					onKeyUp={(e) => {
						if (e.key === "Enter" && !isLoading && input.length > 0) {
							handleSend()
						}
					}}
				/>

				<Button
					variant="outline"
					onClick={handleSend}
					isLoading={isLoading}
					disabled={isLoading || input.length === 0}
				>
					Send
				</Button>
			</div>
		</div>
	)
}
