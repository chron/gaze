import { useQuery } from "convex/react"
import { useEffect, useRef } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Message } from "./Message"

type Props = {
	campaignId: Id<"campaigns">
}

export const MessageList: React.FC<Props> = ({ campaignId }) => {
	const messages = useQuery(api.messages.list, {
		campaignId,
	})

	const messagePanelRef = useRef<HTMLDivElement>(null)

	// biome-ignore lint/correctness/useExhaustiveDependencies: I hate useEffect honestly
	useEffect(() => {
		if (messagePanelRef.current) {
			messagePanelRef.current.scrollTo({
				top: messagePanelRef.current.scrollHeight,
			})
		}
	}, [messages])

	return (
		<div
			ref={messagePanelRef}
			className="flex-1 flex flex-col justify-end gap-4 min-h-0 py-4 px-4 flex-grow overflow-y-auto"
		>
			{messages?.map((message) => (
				<Message key={message._id} message={message} />
			))}
		</div>
	)
}
