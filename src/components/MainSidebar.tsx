import { Link } from "@tanstack/react-router"
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
	SidebarTrigger,
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
				<div className="flex items-center gap-1">
					<SidebarTrigger />
					<Link to="/" className="font-bold">
						Gaze
					</Link>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Campaigns</SidebarGroupLabel>

					<SidebarGroupAction
						onClick={handleAddCampaign}
						className="cursor-pointer"
					>
						<Plus /> <span className="sr-only">Add Campaign</span>
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
