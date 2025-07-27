import type { StreamId } from "@convex-dev/persistent-text-streaming"
import { usePaginatedQuery, useQuery } from "convex/react"
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
	const resizeObserverRef = useRef<ResizeObserver | null>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)

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

	// Smooth scroll to bottom
	const scrollToBottom = useCallback(() => {
		if (messagePanelRef.current) {
			messagePanelRef.current.scrollTo({
				top: messagePanelRef.current.scrollHeight,
				behavior: "smooth",
			})
		}
	}, [messagePanelRef])

	// Check if user is near the bottom of the scroll area
	const isNearBottom = useCallback(() => {
		if (!messagePanelRef.current) return true
		const { scrollTop, scrollHeight, clientHeight } = messagePanelRef.current

		return scrollHeight - scrollTop - clientHeight < 200 // Within 200px of bottom
	}, [messagePanelRef])

	// Set up ResizeObserver to handle content changes during streaming
	// biome-ignore lint/correctness/useExhaustiveDependencies: messagePanelRef.current would cause infinite re-renders
	useEffect(() => {
		const panel = messagePanelRef.current
		if (!panel) return

		resizeObserverRef.current = new ResizeObserver(() => {
			console.log("resizeObserverRef.current", isNearBottom())
			if (isNearBottom()) {
				scrollToBottom()
			}
		})

		// Observe the entire messages container for size changes
		const messagesContainer = panel.querySelector(".messages-container")
		if (messagesContainer) {
			resizeObserverRef.current.observe(messagesContainer)
		}

		return () => {
			resizeObserverRef.current?.disconnect()
		}
	}, [isNearBottom, scrollToBottom])

	// Scroll to bottom once a new message finishes coming in
	useEffect(() => {
		if (messages?.length) {
			scrollToBottom()
		}
	}, [messages?.length, scrollToBottom])

	const lastMessage = messages?.[0]
	const usage = lastMessage?.usage
	const reversedMessages = [...(messages ?? [])]
	reversedMessages.reverse()

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
			style={{
				// CSS scroll anchoring - keeps scroll position at bottom as content grows
				overflowAnchor: "none",
			}}
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
				style={{
					// Enable scroll anchoring for the messages container
					overflowAnchor: "auto",
				}}
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
						/>
					)
				})}

				{/* Invisible element to anchor scrolling */}
				<div ref={messagesEndRef} style={{ overflowAnchor: "auto" }} />
			</div>

			{usage && (
				<div className="text-sm text-gray-200">
					{usage.promptTokens} input tokens, {usage.completionTokens} output
					tokens
					{/* (total: {totalTokens?.promptTokens} input +{" "} {totalTokens?.completionTokens} output) */}
				</div>
			)}
		</div>
	)
}
