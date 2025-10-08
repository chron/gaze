import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"

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

	const [isDeleting, setIsDeleting] = useState(false)
	const [name, setName] = useState("")
	const [description, setDescription] = useState("")
	const [imagePrompt, setImagePrompt] = useState("")
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		if (character) {
			setName(character.name)
			setDescription(character.description)
			setImagePrompt(character.imagePrompt)
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

					{character.imageUrl && (
						<img
							src={character.imageUrl}
							alt={character.name}
							className="w-full h-full object-contain"
						/>
					)}
				</div>
			</div>
		</div>
	)
}
