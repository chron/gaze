import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Plus } from "lucide-react"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { Button } from "../components/ui/button"

export const Route = createFileRoute("/")({
	component: HomePage,
})

function HomePage() {
	const campaigns = useQuery(api.campaigns.list)

	if (campaigns === undefined) {
		return (
			<div className="p-4 w-full h-full bg-blue-500 flex items-center justify-center">
				<h1 className="text-6xl font-title text-white mb-2 ms-10">
					Gaze Into The Abyss
				</h1>
			</div>
		)
	}

	return (
		<div className="p-4 w-full h-full bg-blue-500 overflow-y-auto">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-4xl font-title text-white mb-2 ms-10">
						Gaze Into The Abyss
					</h1>
				</div>
				<Button className="gap-2" asChild>
					<Link to="/campaigns/new">
						<Plus size={16} />
						New Campaign
					</Link>
				</Button>
			</div>

			{campaigns.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-lg text-muted-foreground mb-4">
						No campaigns yet. Create your first campaign to get started!
					</p>
					<Button className="gap-2" asChild>
						<Link to="/campaigns/new">
							<Plus size={16} />
							Create Your First Campaign
						</Link>
					</Button>
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{campaigns.map((campaign) => (
						<CampaignCard key={campaign._id} campaign={campaign} />
					))}
				</div>
			)}
		</div>
	)
}

function CampaignCard({ campaign }: { campaign: Doc<"campaigns"> }) {
	const campaignDetails = useQuery(api.campaigns.get, { id: campaign._id })
	const tokenUsage = useQuery(api.campaigns.sumTokens, {
		campaignId: campaign._id,
	})

	return (
		<Link
			to="/campaigns/$campaignId"
			params={{ campaignId: campaign._id }}
			className="group"
		>
			<div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow p-6 h-full flex flex-col">
				<div className="flex-1">
					<h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
						{campaign.name}
					</h3>
					<p className="text-sm text-gray-600 mb-4 line-clamp-2">
						{campaign.description}
					</p>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-gray-500">Model:</span>
							<span className="text-sm text-gray-900 font-mono truncate">
								{campaign.model.split("/")[1]}
							</span>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-gray-500">
								Game System:
							</span>
							<span className="text-sm text-gray-900 truncate">
								{campaignDetails?.gameSystemName || "Freeform"}
							</span>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-gray-500">
								Token Usage:
							</span>
							<div className="text-sm text-gray-900">
								{tokenUsage ? (
									<span className="font-mono">
										{tokenUsage.inputTokens + tokenUsage.outputTokens}
									</span>
								) : (
									<span className="text-gray-400">Loading...</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</Link>
	)
}
