import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Pencil } from "lucide-react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { CampaignDetailsModal } from "../components/CampaignDetailsModal"
import { CharacterPage } from "../components/CharacterPage"
import { CharacterSheet } from "../components/CharacterSheet"
import { ChatInterface } from "../components/ChatInterface"
import { MemoriesPage } from "../components/MemoriesPage"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"

export const Route = createFileRoute("/campaigns/$campaignId")({
	component: ChatPage,
})

function ChatPage() {
	const { campaignId } = Route.useParams()
	const campaign = useQuery(api.campaigns.get, {
		id: campaignId as Id<"campaigns">,
	})

	if (!campaign) return null

	return (
		<div className="flex w-full flex-col gap-6 bg-blue-500">
			<Tabs defaultValue="chat">
				<div className="flex justify-between items-center group ms-10 me-2 mt-2 text-white">
					<div className="flex items-center gap-2">
						<h1 className="text-3xl font-title uppercase">{campaign.name}</h1>

						<div className="group-hover:block hidden">
							<CampaignDetailsModal
								campaignId={campaign._id}
								trigger={
									<Button variant="ghost">
										<Pencil />
									</Button>
								}
							/>
						</div>
					</div>

					<TabsList>
						<TabsTrigger value="chat">Chat</TabsTrigger>
						<TabsTrigger value="character_sheet">Character sheet</TabsTrigger>
						<TabsTrigger value="characters">Characters</TabsTrigger>
						<TabsTrigger value="memories">Memories</TabsTrigger>
					</TabsList>
				</div>

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
