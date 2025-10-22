import { Link, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import models from "../models.json"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
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
import { Textarea } from "./ui/textarea"

type Props = {
	campaignId?: Id<"campaigns"> | null
}

export const AVAILABLE_TOOLS = [
	{
		id: "update_character_sheet",
		name: "Update Character Sheet",
		description: "Allow AI to update character stats and inventory",
	},
	{
		id: "change_scene",
		name: "Change Scene",
		description: "Allow AI to change scenes and generate images",
	},
	{
		id: "introduce_character",
		name: "Introduce Character",
		description: "Allow AI to introduce new characters",
	},
	{
		id: "update_character",
		name: "Update Character",
		description: "Allow AI to update existing character descriptions and notes",
	},
	{
		id: "update_character_outfit",
		name: "Update Character Outfit",
		description:
			"Allow AI to change character outfits and create new outfit variations",
	},
	{
		id: "request_dice_roll",
		name: "Request Dice Roll",
		description: "Allow AI to request dice rolls from the player",
	},
	{
		id: "update_plan",
		name: "Update Plan",
		description: "Allow AI to update the campaign plan",
	},
	{
		id: "update_quest_log",
		name: "Update Quest Log",
		description: "Allow AI to update quests",
	},
	{
		id: "update_clock",
		name: "Update Clock",
		description: "Allow AI to update progress clocks",
	},
	{
		id: "update_temporal",
		name: "Update Temporal",
		description: "Allow AI to update the in-game date and time",
	},
	{
		id: "choose_name",
		name: "Choose Name",
		description: "Allow AI to request name choices from the player",
	},
	{
		id: "set_campaign_info",
		name: "Set Campaign Info",
		description: "Allow AI to set campaign details (for new campaigns)",
	},
] as const

export const CampaignForm: React.FC<Props> = ({ campaignId = null }) => {
	const navigate = useNavigate()
	const campaign = useQuery(
		api.campaigns.get,
		campaignId ? { id: campaignId } : "skip",
	)
	const gameSystems = useQuery(api.gameSystems.list)

	const addCampaign = useMutation(api.campaigns.addCampaign)
	const updateCampaign = useMutation(api.campaigns.update)
	const archiveCampaign = useMutation(api.campaigns.archive)

	// Initialize enabled tools state - all enabled by default
	const [enabledTools, setEnabledTools] = useState<Record<string, boolean>>(
		() => {
			if (!campaign?.enabledTools) {
				// Default: all tools enabled
				return {}
			}
			return campaign.enabledTools
		},
	)

	// Update state when campaign loads
	useEffect(() => {
		if (campaign?.enabledTools) {
			setEnabledTools(campaign.enabledTools)
		}
	}, [campaign?.enabledTools])

	const handleToolToggle = (toolId: string, checked: boolean) => {
		setEnabledTools((prev) => ({
			...prev,
			[toolId]: checked,
		}))
	}

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
				enabledTools,
			})
			navigate({ to: "/campaigns/$campaignId", params: { campaignId } })
		} else {
			const newId = await addCampaign({
				name,
				description,
				imagePrompt,
				gameSystemId,
				model,
				imageModel,
				enabledTools,
			})
			navigate({ to: "/campaigns/$campaignId", params: { campaignId: newId } })
		}
	}

	const handleArchive = async () => {
		if (!campaignId) return

		if (
			confirm(
				"Are you sure you want to archive this campaign? It will no longer appear in your campaign list.",
			)
		) {
			await archiveCampaign({ id: campaignId })
			navigate({ to: "/" })
		}
	}

	return (
		<form className="grid items-start gap-6 max-w-2xl" onSubmit={handleSubmit}>
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
				<Textarea
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
						{models.map((model) => (
							<SelectItem key={model.code} value={model.code}>
								{model.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="grid gap-3">
				<Label htmlFor="imageModel">Image Model</Label>
				<Select
					name="imageModel"
					defaultValue={campaign?.imageModel || "gpt-image-1"}
					required
				>
					<SelectTrigger>
						<SelectValue placeholder="Select an image model" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="gpt-image-1">GPT Image 1</SelectItem>
						<SelectItem value="gpt-image-1-mini">GPT Image 1 Mini</SelectItem>
						<SelectItem value="gemini-2.5-flash-image">
							Gemini 2.5 Flash Image
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="grid gap-3">
				<Label className="text-base font-semibold">Enabled Tools</Label>
				<p className="text-sm text-slate-600 mb-2">
					Select which tools the AI can use during gameplay. Tools are enabled
					by default.
				</p>
				<div className="grid gap-3 border border-slate-200 rounded-lg p-4 bg-slate-50">
					{AVAILABLE_TOOLS.map((tool) => {
						const isChecked = enabledTools[tool.id] ?? true
						return (
							<div key={tool.id} className="flex items-start space-x-3">
								<Checkbox
									id={tool.id}
									checked={isChecked}
									onCheckedChange={(checked) =>
										handleToolToggle(tool.id, checked === true)
									}
								/>
								<div className="grid gap-1.5 leading-none">
									<Label
										htmlFor={tool.id}
										className="text-sm font-medium leading-none cursor-pointer"
									>
										{tool.name}
									</Label>
									<p className="text-sm text-slate-600">{tool.description}</p>
								</div>
							</div>
						)
					})}
				</div>
			</div>

			<div className="flex gap-2">
				<Button type="submit">Save</Button>
				<Button variant="ghost" asChild>
					<Link
						to={campaignId ? "/campaigns/$campaignId" : "/"}
						params={campaignId ? { campaignId } : undefined}
					>
						Cancel
					</Link>
				</Button>
			</div>

			{campaignId && (
				<div className="mt-8 pt-6 border-t border-slate-200">
					<div className="flex items-start gap-3">
						<div className="flex-1">
							<h3 className="text-sm font-semibold text-slate-900">
								Archive Campaign
							</h3>
							<p className="text-sm text-slate-600 mt-1">
								Archive this campaign to remove it from your campaign list. You
								can still access archived campaigns later if needed.
							</p>
						</div>
						<Button type="button" variant="destructive" onClick={handleArchive}>
							Archive
						</Button>
					</div>
				</div>
			)}
		</form>
	)
}
