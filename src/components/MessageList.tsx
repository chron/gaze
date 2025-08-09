import type { StreamId } from "@convex-dev/persistent-text-streaming"
import { usePaginatedQuery } from "convex/react"
import { useCallback, useEffect, useRef } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Message } from "./Message"
import { Button } from "./ui/button"

type Props = {
	campaignId: Id<"campaigns">
	messagePanelRef: React.RefObject<HTMLDivElement | null>
	streamId: StreamId | null
	setStreamId: (streamId: StreamId) => void
}

export const MessageList: React.FC<Props> = ({
	campaignId,
	messagePanelRef,
	streamId,
	setStreamId,
}) => {
	const isInitialLoadRef = useRef(true)

	// const totalTokens = useQuery(api.campaigns.sumTokens, { campaignId })
	const {
		results: messages,
		isLoading: isLoadingMessages,
		loadMore,
		status,
	} = usePaginatedQuery(
		api.messages.paginatedList,
		{
			campaignId,
		},
		{ initialNumItems: 10 },
	)

	const lastMessage = messages?.[0]
	const usage = messages.find((m) => m.role === "assistant")?.usage
	const reversedMessages = [...(messages ?? [])]
	reversedMessages.reverse()

	// Scroll to bottom with optional smooth behavior
	const scrollToBottom = useCallback(
		(smooth = true) => {
			if (messagePanelRef.current) {
				messagePanelRef.current.scrollTo({
					top: messagePanelRef.current.scrollHeight,
					behavior: smooth ? "smooth" : "instant",
				})
			}
		},
		[messagePanelRef],
	)

	// Scroll to bottom once messages load - instant on initial load
	useEffect(() => {
		if (lastMessage?._id) {
			if (isInitialLoadRef.current) {
				// First time loading messages - scroll instantly to bottom
				scrollToBottom(false)
				isInitialLoadRef.current = false
			}
		}
	}, [lastMessage?._id, scrollToBottom])

	if (isLoadingMessages) {
		return (
			<div className="flex justify-center items-center w-full h-full">
				<div className="text-8xl font-title text-white animate-pulse">GAZE</div>
			</div>
		)
	}

	return (
		<div
			className="flex-1 flex flex-col justify-end gap-4 min-h-0 py-4 px-4"
			// style={{
			// 	// CSS scroll anchoring - keeps scroll position at bottom as content grows
			// 	overflowAnchor: "none",
			// }}
		>
			{status === "CanLoadMore" && (
				<Button
					variant="outline"
					size="sm"
					onClick={() => loadMore(10)}
					className="mx-auto"
				>
					Load more
				</Button>
			)}

			<div
				className="messages-container flex flex-col gap-4"
				// style={{
				// 	// Enable scroll anchoring for the messages container
				// 	overflowAnchor: "auto",
				// }}
			>
				{reversedMessages?.map((message, index) => {
					// If the next message is a tool result, send that too for context
					const nextMessage = reversedMessages[index + 1]

					return (
						<Message
							key={message._id}
							message={message}
							isLastMessage={message._id === lastMessage?._id}
							isStreaming={message.streamId === streamId}
							setStreamId={setStreamId}
							followupToolResult={
								nextMessage?.role === "tool" ? nextMessage : null
							}
							scrollToBottom={scrollToBottom}
						/>
					)
				})}

				{/* Invisible element to anchor scrolling */}
				{/* <div ref={messagesEndRef} style={{ overflowAnchor: "auto" }} /> */}
			</div>

			{usage && (
				<div className="text-sm text-gray-200">
					{usage.promptTokens} input tokens
					{Number.isNaN(usage.completionTokens)
						? ""
						: `, ${usage.completionTokens} output tokens`}
					{/* (total: {totalTokens?.promptTokens} input +{" "} {totalTokens?.completionTokens} output) */}
				</div>
			)}
		</div>
	)
}
