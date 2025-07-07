import { createFileRoute } from "@tanstack/react-router"
import type { Id } from "../../convex/_generated/dataModel"
import { CharacterPage } from "../components/CharacterPage"
import { CharacterSheet } from "../components/CharacterSheet"
import { ChatInterface } from "../components/ChatInterface"
import { MemoriesPage } from "../components/MemoriesPage"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"

export const Route = createFileRoute("/campaigns/$campaignId")({
	component: ChatPage,
})

function ChatPage() {
	const { campaignId } = Route.useParams()

	return (
		<div className="flex w-full flex-col gap-6">
			<Tabs defaultValue="chat">
				<TabsList className="mx-4 mt-2">
					<TabsTrigger value="chat">Chat</TabsTrigger>
					<TabsTrigger value="character_sheet">Character sheet</TabsTrigger>
					<TabsTrigger value="characters">Characters</TabsTrigger>
					<TabsTrigger value="memories">Memories</TabsTrigger>
				</TabsList>
				<TabsContent value="chat">
					<ChatInterface campaignId={campaignId as Id<"campaigns">} />
				</TabsContent>
				<TabsContent value="character_sheet">
					<CharacterSheet campaignId={campaignId as Id<"campaigns">} />
				</TabsContent>
				<TabsContent value="characters">
					<CharacterPage campaignId={campaignId as Id<"campaigns">} />
				</TabsContent>
				<TabsContent value="memories">
					<MemoriesPage campaignId={campaignId as Id<"campaigns">} />
				</TabsContent>
			</Tabs>
		</div>
	)
}
