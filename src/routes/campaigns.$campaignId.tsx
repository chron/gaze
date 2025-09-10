import { Link, Outlet, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Pencil } from "lucide-react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { CharacterPage } from "../components/CharacterPage"
import { CharacterSheet } from "../components/CharacterSheet"
import { ChatInterface } from "../components/ChatInterface"
import { MemoriesPage } from "../components/MemoriesPage"
import { ReferenceSidebar } from "../components/ReferenceSidebar"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { SidebarProvider, SidebarTrigger } from "../components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { cn } from "../lib/utils"

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
		<>
			<div className="flex h-full w-full flex-col gap-6 bg-blue-500 relative">
				<Tabs defaultValue="chat">
					<div className="flex justify-between items-center group me-2 mt-2 ms-10 text-white">
						<div className="flex items-center gap-2">
							<h1 className="text-3xl font-title uppercase truncate">
								{campaign.name || "New Campaign"}
							</h1>
							<Badge>{campaign.model.split("/")[1]}</Badge>

							<div className="group-hover:block hidden">
								<Button variant="ghost" asChild>
									<Link
										to="/campaigns/$campaignId/edit"
										params={{ campaignId: campaign._id }}
									>
										<Pencil />
									</Link>
								</Button>
							</div>
						</div>

						<TabsList className={cn(campaign.gameSystemId && "me-10")}>
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

			<Outlet />

			{/* TODO: ideally don't show this button if the gameSystem has no reference data */}
			{campaign.gameSystemId && (
				<SidebarProvider defaultOpen={false}>
					<SidebarTrigger className="absolute top-3 right-2 text-white" />

					<ReferenceSidebar gameSystemId={campaign.gameSystemId} />
				</SidebarProvider>
			)}
		</>
	)
}
