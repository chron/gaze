import { useMutation, useQuery } from "convex/react"
import { useRef, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { CharacterList } from "./CharacterList"
import { MessageList } from "./MessageList"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"

type Props = {
	campaignId: Id<"campaigns">
}

export const ChatInterface: React.FC<Props> = ({ campaignId }) => {
	const messagePanelRef = useRef<HTMLDivElement>(null)
	const campaign = useQuery(api.campaigns.get, { id: campaignId })

	if (campaign === undefined) {
		return null
	}

	if (campaign === null) {
		return <div>No campaign found</div>
	}

	return (
		<div className="flex flex-col w-full h-screen max-h-[calc(100dvh-52px)]">
			<div ref={messagePanelRef} className="flex-1 min-h-0 overflow-y-auto">
				<MessageList
					campaignId={campaign._id}
					messagePanelRef={messagePanelRef}
				/>
			</div>

			<div className="flex items-end gap-4 p-4 relative">
				<CharacterList campaignId={campaign._id} />
				<ChatInput campaignId={campaign._id} />
			</div>
		</div>
	)
}

const ChatInput: React.FC<{ campaignId: Id<"campaigns"> }> = ({
	campaignId,
}) => {
	const addUserMessage = useMutation(api.messages.addUserMessage)

	const [isLoading, setIsLoading] = useState(false)
	const [input, setInput] = useState("")

	const handleSend = async () => {
		setIsLoading(true)
		const newMessage = {
			campaignId: campaignId,
			content: input,
		} as const

		setInput("")
		await addUserMessage(newMessage)
		setIsLoading(false)
	}

	return (
		<>
			<Textarea
				autoFocus
				rows={1}
				value={input}
				onChange={(e) => setInput(e.target.value)}
				placeholder="Enter your message"
				className="flex-grow py-[7px]"
				onKeyDown={(e) => {
					if (
						e.key === "Enter" &&
						!isLoading &&
						input.length > 0 &&
						!e.shiftKey
					) {
						e.preventDefault()
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
		</>
	)
}
