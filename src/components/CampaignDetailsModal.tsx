import { useMutation, useQuery } from "convex/react"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { ResponsiveModal } from "./ResponsiveModal"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

type Props = {
	campaignId: Id<"campaigns">
}

export const CampaignDetailsModal: React.FC<Props> = ({ campaignId }) => {
	const [open, setOpen] = useState(false)
	const campaign = useQuery(api.campaigns.get, { id: campaignId })
	const updateCampaign = useMutation(api.campaigns.update)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const formData = new FormData(e.target as HTMLFormElement)
		const name = formData.get("name") as string
		const imagePrompt = formData.get("imagePrompt") as string

		await updateCampaign({ id: campaignId, name, imagePrompt })

		setOpen(false)
	}

	return (
		<ResponsiveModal
			open={open}
			setOpen={setOpen}
			title="Edit campaign"
			description="Make changes to your campaign here. Click save when you're done."
			trigger={
				<Button variant="ghost" size="icon">
					<Pencil />
				</Button>
			}
		>
			<form className="grid items-start gap-6 px-4" onSubmit={handleSubmit}>
				<div className="grid gap-3">
					<Label htmlFor="name">Name</Label>
					<Input
						type="name"
						id="name"
						name="name"
						defaultValue={campaign?.name}
					/>
				</div>

				<div className="grid gap-3">
					<Label htmlFor="imagePrompt">Image Prompt</Label>
					<Input
						type="text"
						id="imagePrompt"
						name="imagePrompt"
						defaultValue={campaign?.imagePrompt}
					/>
				</div>
				<Button type="submit">Save changes</Button>
			</form>
		</ResponsiveModal>
	)
}
