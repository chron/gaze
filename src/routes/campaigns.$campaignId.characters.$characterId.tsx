import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useAction, useMutation, useQuery } from "convex/react"
import { Loader2, RefreshCcwIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../components/ui/tooltip"

export const Route = createFileRoute(
	"/campaigns/$campaignId/characters/$characterId",
)({
	component: CharacterDetailsPage,
})

function CharacterDetailsPage() {
	const navigate = useNavigate()
	const { campaignId, characterId } = Route.useParams()
	const character = useQuery(api.characters.get, {
		characterId: characterId as Id<"characters">,
	})
	const update = useMutation(api.characters.update)
	const deleteCharacter = useMutation(api.characters.destroy)
	const regenerateOutfit = useAction(
		api.characters.regenerateOutfitForCharacter,
	)

	const [isDeleting, setIsDeleting] = useState(false)
	const [regeneratingOutfit, setRegeneratingOutfit] = useState<string | null>(
		null,
	)
	const [name, setName] = useState("")
	const [description, setDescription] = useState("")
	const [imagePrompt, setImagePrompt] = useState("")
	const [notes, setNotes] = useState("")
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		if (character) {
			setName(character.name)
			setDescription(character.description)
			setImagePrompt(character.imagePrompt)
			setNotes(character.notes ?? "")
		}
	}, [character])

	if (!character) return null

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await update({
				characterId: character._id as Id<"characters">,
				name,
				description,
				imagePrompt,
				notes,
			})
			navigate({
				to: "/campaigns/$campaignId",
				params: { campaignId },
			})
		} finally {
			setIsSaving(false)
		}
	}

	const handleDelete = async () => {
		setIsDeleting(true)
		await deleteCharacter({ characterId: character._id as Id<"characters"> })
		navigate({ to: "/campaigns/$campaignId", params: { campaignId } })
	}

	return (
		<div className="absolute inset-0 bg-black/30">
			<div className="absolute right-0 top-0 h-full w-full max-w-[560px] bg-white shadow-xl p-6 overflow-y-auto">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-2xl font-title">Character Details</h2>
					<Button variant="ghost" asChild>
						<Link to="/campaigns/$campaignId" params={{ campaignId }}>
							Close
						</Link>
					</Button>
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="char-name">Name</Label>
						<Input
							id="char-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="char-description">Description</Label>
						<Textarea
							id="char-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="min-h-[120px]"
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="char-notes">Notes</Label>
						<Textarea
							id="char-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							className="min-h-[120px]"
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="char-image-prompt">Image Prompt</Label>
						<Textarea
							id="char-image-prompt"
							value={imagePrompt}
							onChange={(e) => setImagePrompt(e.target.value)}
							className="min-h-[120px]"
						/>
					</div>

					<div className="flex gap-2 justify-between">
						<Button
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-red-500 text-white me-auto"
						>
							Delete
						</Button>

						<Button onClick={handleSave} disabled={isSaving}>
							{isSaving ? "Saving..." : "Save"}
						</Button>
						<Button variant="outline" asChild>
							<Link to="/campaigns/$campaignId" params={{ campaignId }}>
								Cancel
							</Link>
						</Button>
					</div>

					{character.baseImageUrl && (
						<div className="flex flex-col gap-2">
							<Label>Base Image</Label>
							<img
								src={character.baseImageUrl}
								alt={character.name}
								className="w-full h-full object-contain rounded-md border border-gray-200"
							/>
						</div>
					)}

					{character.allOutfits && character.allOutfits.length > 0 && (
						<div className="flex flex-col gap-2">
							<Label>Outfits</Label>
							<div className="grid grid-cols-2 gap-4">
								{character.allOutfits.map((outfit) => (
									<div key={outfit.name} className="relative group">
										<Tooltip>
											<TooltipTrigger asChild>
												<div
													className={`border-2 rounded-md overflow-hidden ${
														character.currentOutfit === outfit.name
															? "border-blue-500 ring-2 ring-blue-300"
															: "border-gray-200"
													}`}
												>
													{outfit.imageUrl && (
														<img
															src={outfit.imageUrl}
															alt={outfit.name}
															className="w-full h-full object-contain"
														/>
													)}
												</div>
											</TooltipTrigger>
											<TooltipContent className="max-w-[300px]">
												<div>
													<p className="font-semibold">{outfit.name}</p>
													<p className="text-sm">{outfit.description}</p>
												</div>
											</TooltipContent>
										</Tooltip>
										<div className="absolute top-2 right-2 flex gap-1">
											<Button
												size="sm"
												variant="secondary"
												onClick={async (e) => {
													e.preventDefault()
													e.stopPropagation()
													setRegeneratingOutfit(outfit.name)
													try {
														await regenerateOutfit({
															characterId: character._id as Id<"characters">,
															outfitName: outfit.name,
														})
													} finally {
														setRegeneratingOutfit(null)
													}
												}}
												disabled={regeneratingOutfit === outfit.name}
												className="opacity-0 group-hover:opacity-100 transition-opacity"
											>
												{regeneratingOutfit === outfit.name ? (
													<Loader2 className="w-3 h-3 animate-spin" />
												) : (
													<RefreshCcwIcon className="w-3 h-3" />
												)}
											</Button>
										</div>
										<p className="text-sm font-medium text-center mt-1">
											{outfit.name}
											{character.currentOutfit === outfit.name && (
												<span className="text-blue-500 ml-1">(current)</span>
											)}
										</p>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
