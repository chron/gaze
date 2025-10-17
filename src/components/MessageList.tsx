import type { StreamId } from "@convex-dev/persistent-text-streaming"
import { usePaginatedQuery, useQuery } from "convex/react"
import { useEffect, useRef, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Message } from "./Message"
import { Button } from "./ui/button"

type Props = {
	campaignId: Id<"campaigns">
	messagePanelRef: React.RefObject<HTMLDivElement | null>
	streamId: StreamId | null
	setStreamId: (streamId: StreamId | null) => void
}

export const MessageList: React.FC<Props> = ({
	campaignId,
	messagePanelRef,
	streamId,
	setStreamId,
}) => {
	const isInitialLoadRef = useRef(true)
	const lastAssistantMessageIdRef = useRef<string | null>(null)
	const messagesContainerRef = useRef<HTMLDivElement>(null)
	const [spacerHeight, setSpacerHeight] = useState(0)

	const campaign = useQuery(api.campaigns.get, { id: campaignId })
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

	// Find the most recent assistant message
	const lastAssistantMessage = messages?.find((m) => m.role === "assistant")

	// Track initial load state
	useEffect(() => {
		if (lastMessage?._id) {
			if (isInitialLoadRef.current) {
				isInitialLoadRef.current = false
			}
		}
	}, [lastMessage?._id])

	// Scroll new assistant messages to top of viewport
	useEffect(() => {
		if (
			lastAssistantMessage?._id &&
			lastAssistantMessage._id !== lastAssistantMessageIdRef.current &&
			!isInitialLoadRef.current
		) {
			// New assistant message detected
			lastAssistantMessageIdRef.current = lastAssistantMessage._id

			// For new assistant messages, use spacer approach - scroll to bottom ONCE
			// Wait a couple frames for the message element and spacer to render
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					const container = messagePanelRef.current
					if (!container) return

					// Scroll to bottom - the spacer will keep the message at top
					container.scrollTo({
						top: container.scrollHeight,
						behavior: "instant", // ideally smooth for new messages, instant for page load
					})
				})
			})
		}
	}, [lastAssistantMessage?._id, messagePanelRef])

	// Calculate dynamic spacer height for the last assistant message
	useEffect(() => {
		if (
			!lastAssistantMessage ||
			!messagePanelRef.current ||
			!messagesContainerRef.current
		) {
			setSpacerHeight(0)
			return
		}

		const messageId = lastAssistantMessage._id
		const OFFSET_FROM_TOP = 32 // Keep message slightly below the top
		let retryCount = 0
		const MAX_RETRIES = 10 // Reduced since element exists immediately now

		const calculateSpacerHeight = () => {
			const container = messagePanelRef.current
			if (!container) return

			// Find the last assistant message element
			const messageElement = document.querySelector(
				`[data-message-id="${messageId}"]`,
			) as HTMLElement

			if (!messageElement) {
				// Element might not be rendered yet (rare), retry a few times
				if (retryCount < MAX_RETRIES) {
					retryCount++
					requestAnimationFrame(calculateSpacerHeight)
				}
				return
			}

			// Get the container's viewport height
			const containerHeight = container.clientHeight

			// Get just the message's height
			const messageHeight = messageElement.offsetHeight

			// Calculate spacer: container height - message height - offset
			// This keeps the message OFFSET_FROM_TOP pixels below the top
			const spacerNeeded = Math.max(
				0,
				containerHeight - messageHeight - OFFSET_FROM_TOP,
			)

			setSpacerHeight(spacerNeeded)
		}

		// Calculate initially with a small delay to let React render
		const timeoutId = setTimeout(calculateSpacerHeight, 10)

		// Watch the message element for size changes during streaming
		let resizeObserver: ResizeObserver | null = null
		const messageElement = document.querySelector(
			`[data-message-id="${messageId}"]`,
		) as HTMLElement

		if (messageElement) {
			// Recalculate when the message resizes (e.g., during streaming)
			resizeObserver = new ResizeObserver(calculateSpacerHeight)
			resizeObserver.observe(messageElement)
		}

		return () => {
			clearTimeout(timeoutId)
			resizeObserver?.disconnect()
		}
	}, [lastAssistantMessage, messagePanelRef])

	if (isLoadingMessages) {
		return (
			<div className="flex justify-center items-center w-full h-full">
				<div className="text-8xl font-title text-white animate-pulse">GAZE</div>
			</div>
		)
	}

	return (
		<div className="flex-1 flex flex-col justify-end gap-4 min-h-0 py-4 px-4">
			{status === "CanLoadMore" && (
				<Button
					variant="outline"
					size="sm"
					onClick={async () => {
						const container = messagePanelRef.current
						const prevScrollHeight = container?.scrollHeight ?? 0
						const prevScrollTop = container?.scrollTop ?? 0
						await loadMore(10)
						// Preserve viewport position after older messages prepend
						requestAnimationFrame(() => {
							if (!container) return
							const newScrollHeight = container.scrollHeight
							const heightDiff = newScrollHeight - prevScrollHeight
							container.scrollTop = prevScrollTop + heightDiff
						})
					}}
					className="mx-auto"
				>
					Load more
				</Button>
			)}
			<div
				ref={messagesContainerRef}
				className="messages-container flex flex-col gap-4"
			>
				{reversedMessages?.map((message) => {
					return (
						<Message
							key={message._id}
							message={message}
							isLastMessage={message._id === lastMessage?._id}
							isStreaming={message.streamId === streamId}
							setStreamId={setStreamId}
						/>
					)
				})}

				{/* Dynamic spacer to keep last assistant message at top */}
				{spacerHeight > 0 && streamId !== null && (
					<div style={{ height: `${spacerHeight}px` }} data-spacer="true" />
				)}
			</div>
			{usage && (
				<div className="text-sm text-gray-200">
					{usage.inputTokens} input
					{usage.cachedInputTokens
						? ` (${usage.cachedInputTokens} cached)`
						: ""}
					{Number.isNaN(usage.outputTokens)
						? ""
						: `, ${usage.outputTokens} output`}
					{usage.reasoningTokens ? `, ${usage.reasoningTokens} reasoning` : ""}
					{campaign && (
						<>
							, {campaign.messageCount} messages
							{campaign.messageCountAtLastSummary !== 0
								? ` (${campaign.messageCount - campaign.messageCountAtLastSummary} since last summary)`
								: ""}
						</>
					)}
				</div>
			)}
		</div>
	)
}
