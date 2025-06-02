import { useStore } from "@tanstack/react-store"
import { FileIcon, Plus, PlusIcon } from "lucide-react"
import { nanoid } from "nanoid"
import { mainStore, updateCampaign } from "../stores/main"
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./ui/sidebar"

export const MainSidebar: React.FC = () => {
	const campaigns = useStore(mainStore, (state) => state.campaigns)

	const addCampaign = () => {
		const id = nanoid()
		updateCampaign({
			id,
			name: "New Campaign",
			description: "New Campaign",
			messages: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		})
	}
	return (
		<Sidebar>
			<SidebarHeader>Gaze</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Campaigns</SidebarGroupLabel>

					<SidebarGroupAction onClick={addCampaign}>
						<Plus /> <span className="sr-only">Add Project</span>
					</SidebarGroupAction>

					<SidebarGroupContent>
						<SidebarMenu>
							{campaigns.map((campaign) => (
								<SidebarMenuItem key={campaign.id}>
									<SidebarMenuButton>{campaign.name}</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	)
}
