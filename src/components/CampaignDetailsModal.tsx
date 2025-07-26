import { useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { ResponsiveModal } from "./ResponsiveModal"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "./ui/select"

type Props = {
	campaignId: Id<"campaigns"> | null
	trigger: React.ReactNode
}

export const CampaignDetailsModal: React.FC<Props> = ({
	campaignId,
	trigger,
}) => {
	const navigate = useNavigate()
	const [open, setOpen] = useState(false)
	const campaign = useQuery(
		api.campaigns.get,
		campaignId ? { id: campaignId } : "skip",
	)

	const addCampaign = useMutation(api.campaigns.addCampaign)
	const updateCampaign = useMutation(api.campaigns.update)
	const gameSystems = useQuery(api.gameSystems.list)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const formData = new FormData(e.target as HTMLFormElement)
		const name = formData.get("name") as string
		const description = formData.get("description") as string
		const imagePrompt = formData.get("imagePrompt") as string
		const model = formData.get("model") as string
		const imageModel = formData.get("imageModel") as string
		const gameSystemId =
			formData.get("gameSystemId") === "none"
				? undefined
				: (formData.get("gameSystemId") as Id<"gameSystems">)

		if (campaignId) {
			await updateCampaign({
				id: campaignId,
				name,
				description,
				imagePrompt,
				gameSystemId,
				model,
				imageModel,
			})
		} else {
			const newId = await addCampaign({
				name,
				description,
				imagePrompt,
				gameSystemId,
				model,
				imageModel,
			})
			navigate({
				to: "/campaigns/$campaignId",
				params: { campaignId: newId },
			})
		}

		setOpen(false)
	}

	return (
		<ResponsiveModal
			open={open}
			setOpen={setOpen}
			title={campaignId ? "Edit campaign" : "Add campaign"}
			description="Make changes to your campaign here. Click save when you're done."
			trigger={trigger}
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
					<Label htmlFor="description">Description</Label>
					<Input
						type="text"
						id="description"
						name="description"
						defaultValue={campaign?.description}
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

				<div className="grid gap-3">
					<Label htmlFor="gameSystemId">Game System</Label>
					<Select
						name="gameSystemId"
						defaultValue={campaign?.gameSystemId || "none"}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select a game system" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">Freeform, no specific system</SelectItem>

							<SelectSeparator />

							{gameSystems?.map((gameSystem) => (
								<SelectItem key={gameSystem._id} value={gameSystem._id}>
									{gameSystem.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="grid gap-3">
					<Label htmlFor="model">Text Model</Label>
					<Select name="model" defaultValue={campaign?.model} required>
						<SelectTrigger>
							<SelectValue placeholder="Select a text model" />
						</SelectTrigger>

						<SelectContent>
							<SelectItem value="moonshotai/kimi-k2-instruct">
								Moonshot AI Kimi K2 (Groq)
							</SelectItem>

							<SelectItem value="cognitivecomputations/dolphin3.0-r1-mistral-24b:free">
								Dolphin 3.0 Mistral 24B (free)
							</SelectItem>

							<SelectItem value="cognitivecomputations/dolphin-mistral-24b-venice-edition:free">
								Dolphin Mistral 24B Venice Edition (free)
							</SelectItem>

							<SelectItem value="thedrummer/skyfall-36b-v2">
								Skyfall 36B v2
							</SelectItem>

							<SelectItem value="thedrummer/anubis-pro-105b-v1">
								Anubis Pro 105B v1
							</SelectItem>

							<SelectItem value="sao10k/l3.3-euryale-70b">
								Llama 3.3 Euryale 70B
							</SelectItem>

							<SelectItem value="x-ai/grok-4">Grok 4</SelectItem>

							<SelectItem value="thedrummer/anubis-70b-v1.1">
								Anubis 70B v1.1
							</SelectItem>

							<SelectItem value="google/gemini-2.5-pro">
								Gemini 2.5 Pro
							</SelectItem>

							<SelectItem value="google/gemini-2.5-flash">
								Gemini 2.5 Flash
							</SelectItem>

							<SelectItem value="openai/gpt-4o">GPT 4o</SelectItem>

							<SelectItem value="openai/o3">O3</SelectItem>

							<SelectItem value="openai/o3-pro">O3 Pro</SelectItem>

							<SelectItem value="openai/o4-mini-high">O4 Mini High</SelectItem>

							<SelectItem value="openai/gpt-4.1">GPT-4.1</SelectItem>

							<SelectItem value="meta-llama/llama-4-maverick">
								Llama 4 Maverick
							</SelectItem>

							<SelectItem value="anthropic/claude-3.7-sonnet">
								Claude 3.7 Sonnet
							</SelectItem>

							<SelectItem value="anthropic/claude-3.7-sonnet:thinking">
								Claude 3.7 Sonnet Thinking
							</SelectItem>

							<SelectItem value="anthropic/claude-sonnet-4">
								Claude Sonnet 4
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="grid gap-3">
					<Label htmlFor="imageModel">Image Model</Label>
					<Select
						name="imageModel"
						defaultValue={campaign?.imageModel || "dall-e-3"}
						required
					>
						<SelectTrigger>
							<SelectValue placeholder="Select an image model" />
						</SelectTrigger>

						<SelectContent>
							<SelectItem value="dall-e-3">DALL-E 3</SelectItem>
							<SelectItem value="dall-e-2">DALL-E 2</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<Button type="submit">Save changes</Button>
			</form>
		</ResponsiveModal>
	)
}
