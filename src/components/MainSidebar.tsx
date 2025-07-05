import { useMutation, useQuery } from "convex/react"
import { Plus } from "lucide-react"
import { api } from "../../convex/_generated/api"
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
	const addCampaign = useMutation(api.campaigns.addCampaign)
	const campaigns = useQuery(api.campaigns.list)

	const handleAddCampaign = () => {
		addCampaign({
			name: "New Campaign",
			description: "New Campaign",
		})
	}

	return (
		<Sidebar>
			<SidebarHeader>Gaze</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Campaigns</SidebarGroupLabel>

					<SidebarGroupAction
						onClick={handleAddCampaign}
						className="cursor-pointer"
					>
						<Plus /> <span className="sr-only">Add Project</span>
					</SidebarGroupAction>

					<SidebarGroupContent>
						<SidebarMenu>
							{campaigns?.map((campaign) => (
								<SidebarMenuItem key={campaign._id}>
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
