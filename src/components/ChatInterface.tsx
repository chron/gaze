import type { StreamId } from "@convex-dev/persistent-text-streaming"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useRef, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { CharacterList } from "./CharacterList"
import { ChatExtraActions } from "./ChatExtraActions"
import { ClockDisplay } from "./ClockDisplay"
import { MessageList } from "./MessageList"
import { QuestLog } from "./QuestLog"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"

type Props = {
	campaignId: Id<"campaigns">
}

export const ChatInterface: React.FC<Props> = ({ campaignId }) => {
	const messagePanelRef = useRef<HTMLDivElement>(null)
	const campaign = useQuery(api.campaigns.get, { id: campaignId })
	const [streamId, setStreamId] = useState<StreamId | null>(null)

	if (campaign === undefined) {
		return null
	}

	if (campaign === null) {
		return <div>No campaign found</div>
	}

	return (
		<div className="flex flex-col w-full h-screen max-h-[calc(100dvh-52px)] relative">
			<div ref={messagePanelRef} className="flex-1 min-h-0 overflow-y-auto">
				<MessageList
					campaignId={campaign._id}
					messagePanelRef={messagePanelRef}
					streamId={streamId}
					setStreamId={setStreamId}
				/>
			</div>

			{campaign.questLog && <QuestLog questLog={campaign.questLog} />}
			{campaign.clocks && campaign.clocks.length > 0 && (
				<ClockDisplay clocks={campaign.clocks} campaignId={campaign._id} />
			)}

			<div className="flex items-end gap-2 p-4 relative">
				<CharacterList campaignId={campaign._id} />
				<ChatInput campaignId={campaign._id} setStreamId={setStreamId} />
			</div>
		</div>
	)
}

const ChatInput: React.FC<{
	campaignId: Id<"campaigns">
	setStreamId: (streamId: StreamId) => void
}> = ({ campaignId, setStreamId }) => {
	const addUserMessage = useMutation(api.messages.addUserMessage)

	const [isLoading, setIsLoading] = useState(false)
	const [input, setInput] = useState("")

	// Load draft from localStorage on mount
	useEffect(() => {
		const storageKey = `chat-draft-${campaignId}`
		const savedDraft = localStorage.getItem(storageKey)
		if (savedDraft) {
			setInput(savedDraft)
		}
	}, [campaignId])

	// Save draft to localStorage (debounced)
	useEffect(() => {
		const storageKey = `chat-draft-${campaignId}`
		const timeoutId = setTimeout(() => {
			if (input) {
				localStorage.setItem(storageKey, input)
			} else {
				localStorage.removeItem(storageKey)
			}
		}, 2000) // 2 second debounce

		return () => clearTimeout(timeoutId)
	}, [input, campaignId])

	const handleSend = async () => {
		setIsLoading(true)
		const newMessage = {
			campaignId: campaignId,
			content: input,
		} as const

		setInput("")
		// Clear the draft from localStorage when sent
		localStorage.removeItem(`chat-draft-${campaignId}`)
		const { streamId } = await addUserMessage(newMessage)
		setStreamId(streamId)
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

			<ChatExtraActions />

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
