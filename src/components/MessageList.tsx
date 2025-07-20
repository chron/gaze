import type { StreamId } from "@convex-dev/persistent-text-streaming"
import { usePaginatedQuery, useQuery } from "convex/react"
import { useCallback, useEffect, useRef, useState } from "react"
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
	const [summary, setSummary] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const resizeObserverRef = useRef<ResizeObserver | null>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	// const summarizeChatHistory = useAction(api.messages.summarizeChatHistory)
	const totalTokens = useQuery(api.campaigns.sumTokens, { campaignId })
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

		console.log("isNearBottom", {
			scrollTop,
			scrollHeight,
			clientHeight,
			total: scrollHeight - scrollTop - clientHeight,
		})

		return scrollHeight - scrollTop - clientHeight < 200 // Within 200px of bottom
	}, [messagePanelRef])

	// Set up ResizeObserver to handle content changes during streaming
	// biome-ignore lint/correctness/useExhaustiveDependencies: messagePanelRef.current would cause infinite re-renders
	useEffect(() => {
		const panel = messagePanelRef.current
		if (!panel) return

		resizeObserverRef.current = new ResizeObserver(() => {
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
				{reversedMessages?.map((message) => (
					<Message
						key={message._id}
						message={message}
						isLastMessage={message._id === lastMessage?._id}
						isStreaming={message.streamId === streamId}
						setStreamId={setStreamId}
					/>
				))}

				{/* Invisible element to anchor scrolling */}
				<div ref={messagesEndRef} style={{ overflowAnchor: "auto" }} />
			</div>

			{usage && (
				<div className="text-sm text-gray-200">
					{usage.promptTokens} input tokens, {usage.completionTokens} output
					tokens (total: {totalTokens?.promptTokens} input +{" "}
					{totalTokens?.completionTokens} output)
				</div>
			)}

			{summary ? (
				<div className="text-sm text-gray-500 p-4 bg-muted rounded-md">
					{summary}
				</div>
			) : messages?.length ? (
				<div className="flex">
					<Button
						variant="outline"
						size="sm"
						onClick={async () => {
							setIsLoading(true)
							try {
								const summary = "TODO" //await summarizeChatHistory({ campaignId })
								setSummary(summary)
							} finally {
								setIsLoading(false)
							}
						}}
						isLoading={isLoading}
					>
						Summarise
					</Button>
				</div>
			) : null}
		</div>
	)
}
