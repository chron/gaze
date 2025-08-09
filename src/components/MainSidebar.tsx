import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
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
	const campaigns = useQuery(api.campaigns.list, { limit: 10 })

	return (
		<>
			<Sidebar>
				<SidebarHeader className="bg-blue-500">
					<div className="flex items-center gap-1">
						<Link to="/" className="font-title uppercase text-3xl">
							Gaze
						</Link>
					</div>
				</SidebarHeader>
				<SidebarContent className="bg-blue-500">
					<SidebarGroup>
						<SidebarGroupLabel>Campaigns</SidebarGroupLabel>

						<Link to="/campaigns/new">
							<SidebarGroupAction className="cursor-pointer">
								<Plus /> <span className="sr-only">Add Campaign</span>
							</SidebarGroupAction>
						</Link>

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
								<SidebarMenuItem>
									<Link to="/">
										{({ isActive }) => (
											<SidebarMenuButton
												isActive={isActive}
												className="cursor-pointer text-blue-200"
											>
												View All Campaigns...
											</SidebarMenuButton>
										)}
									</Link>
								</SidebarMenuItem>
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
