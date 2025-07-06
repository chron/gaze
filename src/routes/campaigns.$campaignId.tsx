import { createFileRoute } from "@tanstack/react-router"
import type { Id } from "../../convex/_generated/dataModel"
import { ChatInterface } from "../components/ChatInterface"

export const Route = createFileRoute("/campaigns/$campaignId")({
	component: ChatPage,
})

function ChatPage() {
	const { campaignId } = Route.useParams()
	return <ChatInterface campaignId={campaignId as Id<"campaigns">} />
}
