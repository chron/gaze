import { Link, Outlet, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Calendar, Moon, Pencil, Sun, Sunrise, Sunset } from "lucide-react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { CharacterPage } from "../components/CharacterPage"
import { CharacterSheet } from "../components/CharacterSheet"
import { ChatInterface } from "../components/ChatInterface"
import { ReferenceSidebar } from "../components/ReferenceSidebar"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { SidebarProvider, SidebarTrigger } from "../components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { cn } from "../lib/utils"

export const Route = createFileRoute("/campaigns/$campaignId")({
	component: ChatPage,
})

type TimeOfDay =
	| "dawn"
	| "morning"
	| "midday"
	| "afternoon"
	| "dusk"
	| "evening"
	| "night"
	| "midnight"

function getTimeIcon(timeOfDay: TimeOfDay) {
	switch (timeOfDay) {
		case "dawn":
		case "morning":
			return <Sunrise className="h-3.5 w-3.5" />
		case "midday":
		case "afternoon":
			return <Sun className="h-3.5 w-3.5" />
		case "dusk":
		case "evening":
			return <Sunset className="h-3.5 w-3.5" />
		case "night":
		case "midnight":
			return <Moon className="h-3.5 w-3.5" />
	}
}

function formatTimeOfDay(timeOfDay: TimeOfDay): string {
	return timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)
}

function ChatPage() {
	const { campaignId } = Route.useParams()
	const campaign = useQuery(api.campaigns.get, {
		id: campaignId as Id<"campaigns">,
	})

	if (!campaign) return null

	const isCharacterSheetEnabled =
		campaign.enabledTools?.update_character_sheet !== false

	return (
		<>
			<div className="flex h-full w-full flex-col gap-6 bg-blue-500 relative">
				<Tabs defaultValue="chat">
					<div className="flex flex-col gap-2">
						<div className="flex justify-between items-center group me-2 mt-2 ms-10 text-white">
							<div className="flex items-center gap-2">
								<h1 className="text-3xl font-title uppercase truncate hidden sm:block">
									{campaign.name || "New Campaign"}
								</h1>
								<Badge className="hidden sm:block">
									{campaign.model.split("/")[1]}
								</Badge>

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
								{isCharacterSheetEnabled && (
									<TabsTrigger value="character_sheet">
										Character sheet
									</TabsTrigger>
								)}
								<TabsTrigger value="characters">Characters</TabsTrigger>
								{/* <TabsTrigger value="memories">Memories</TabsTrigger> */}
							</TabsList>
						</div>

						{campaign.temporal && (
							<div className="ms-10 flex items-center gap-2">
								<Badge
									variant="secondary"
									className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
								>
									<Calendar className="h-3.5 w-3.5" />
									<span>{campaign.temporal.date}</span>
								</Badge>
								<Badge
									variant="secondary"
									className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
								>
									{getTimeIcon(campaign.temporal.timeOfDay)}
									<span>{formatTimeOfDay(campaign.temporal.timeOfDay)}</span>
								</Badge>
								{campaign.temporal.notes && (
									<span className="text-xs text-white/80 italic">
										{campaign.temporal.notes}
									</span>
								)}
							</div>
						)}
					</div>

					<TabsContent value="chat">
						<ChatInterface campaignId={campaignId as Id<"campaigns">} />
					</TabsContent>
					{isCharacterSheetEnabled && (
						<TabsContent value="character_sheet">
							<CharacterSheet campaignId={campaignId as Id<"campaigns">} />
						</TabsContent>
					)}
					<TabsContent value="characters">
						<CharacterPage campaignId={campaignId as Id<"campaigns">} />
					</TabsContent>
					{/* <TabsContent value="memories">
						<MemoriesPage campaignId={campaignId as Id<"campaigns">} />
					</TabsContent> */}
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
