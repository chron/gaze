import { createFileRoute } from "@tanstack/react-router"
import { CampaignForm } from "../components/CampaignForm"

export const Route = createFileRoute("/campaigns/new")({
	component: NewCampaignPage,
})

function NewCampaignPage() {
	return (
		<div className="p-4 w-full h-full bg-blue-500 overflow-y-auto">
			<div className="ms-10 mb-6 text-white">
				<h1 className="text-3xl font-title uppercase">Create campaign</h1>
			</div>

			<div className="bg-white rounded-lg p-4">
				<CampaignForm />
			</div>
		</div>
	)
}
