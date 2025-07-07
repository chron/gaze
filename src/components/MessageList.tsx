import { useAction, usePaginatedQuery } from "convex/react"
import { useEffect, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Message } from "./Message"
import { Button } from "./ui/button"

type Props = {
	campaignId: Id<"campaigns">
	messagePanelRef: React.RefObject<HTMLDivElement | null>
}

export const MessageList: React.FC<Props> = ({
	campaignId,
	messagePanelRef,
}) => {
	const [summary, setSummary] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const summarizeChatHistory = useAction(api.messages.summarizeChatHistory)
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: I hate useEffect honestly
	useEffect(() => {
		setSummary(null)

		if (messagePanelRef.current) {
			messagePanelRef.current.scrollTo({
				top: messagePanelRef.current.scrollHeight,
			})
		}
	}, [messages])

	const lastMessage = messages?.[messages.length - 1]
	const usage = lastMessage?.usage
	const reversedMessages = [...(messages ?? [])]
	reversedMessages.reverse()

	return (
		<div className="flex-1 flex flex-col justify-end gap-4 min-h-0 py-4 px-4">
			{isLoadingMessages && <div>Loading...</div>}

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

			{reversedMessages?.map((message) => (
				<Message key={message._id} message={message} />
			))}

			{usage && (
				<div className="text-sm text-gray-500">
					Context: {usage.promptTokens} tokens
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
								const summary = await summarizeChatHistory({ campaignId })
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
