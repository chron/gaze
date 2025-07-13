import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Plus } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import { CampaignDetailsModal } from "./CampaignDetailsModal"
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
	const campaigns = useQuery(api.campaigns.list)

	return (
		<>
			<Sidebar>
				<SidebarHeader>
					<div className="flex items-center gap-1">
						<Link to="/" className="font-bold">
							Gaze
						</Link>
					</div>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Campaigns</SidebarGroupLabel>

						<CampaignDetailsModal
							campaignId={null}
							trigger={
								<SidebarGroupAction className="cursor-pointer">
									<Plus /> <span className="sr-only">Add Campaign</span>
								</SidebarGroupAction>
							}
						/>

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

					<SidebarGroup>
						<SidebarGroupLabel>Setup</SidebarGroupLabel>

						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<Link to="/systems">
										{({ isActive }) => (
											<SidebarMenuButton
												isActive={isActive}
												className="cursor-pointer"
											>
												Game Systems
											</SidebarMenuButton>
										)}
									</Link>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>
		</>
	)
}
