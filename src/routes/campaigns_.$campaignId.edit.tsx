import { createFileRoute } from "@tanstack/react-router"
import type { Id } from "../../convex/_generated/dataModel"
import { CampaignForm } from "../components/CampaignForm"

export const Route = createFileRoute("/campaigns_/$campaignId/edit")({
	component: EditCampaignPage,
})

function EditCampaignPage() {
	const { campaignId } = Route.useParams()

	return (
		<div className="p-6 w-full h-full bg-blue-500 overflow-y-auto">
			<div className="ms-10 mb-6 text-white">
				<h1 className="text-3xl font-title uppercase">Edit campaign</h1>
			</div>

			<div className="bg-white rounded-lg p-4">
				<CampaignForm campaignId={campaignId as Id<"campaigns">} />
			</div>
		</div>
	)
}
