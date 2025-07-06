import { Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Plus } from "lucide-react"
import { api } from "../../convex/_generated/api"
import { cn } from "../lib/utils"
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
			<SidebarHeader>
				<Link to="/">Gaze</Link>
			</SidebarHeader>
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
									<Link
										to="/campaigns/$campaignId"
										params={{ campaignId: campaign._id }}
									>
										{({ isActive }) => (
											<SidebarMenuButton
												isActive={isActive}
												className="cursor-pointer"
											>
												{campaign.name}
											</SidebarMenuButton>
										)}
									</Link>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	)
}
