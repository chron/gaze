import { Link } from "@tanstack/react-router"
import { useAction, useMutation, useQuery } from "convex/react"
import { Loader2, RefreshCcwIcon } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Label } from "./ui/label"

type Props = {
	campaignId: Id<"campaigns">
}

type CharacterWithImageUrl = Doc<"characters"> & { imageUrl?: string | null }

export const CharacterPage: React.FC<Props> = ({ campaignId }) => {
	const characters = useQuery(api.characters.list, {
		campaignId,
	})

	return (
		<div className="flex flex-col gap-4 px-4 w-full h-full max-h-[calc(100dvh-52px)] overflow-y-auto">
			<h1 className="text-2xl font-title text-white">Characters</h1>
			<div className="flex flex-col gap-2">
				{characters?.map((character) => (
					<Link
						key={character._id}
						to="/campaigns/$campaignId/characters/$characterId"
						params={{ campaignId, characterId: character._id }}
					>
						<CharacterCard character={character} />
					</Link>
				))}
			</div>
		</div>
	)
}

type CharacterCardProps = {
	character: CharacterWithImageUrl
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
	const [isLoading, setIsLoading] = useState(false)
	const regenerateImage = useAction(api.characters.generateImageForCharacter)
	const toggleActive = useMutation(api.characters.toggleActive)

	return (
		<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow border border-gray-200 relative group">
			{character.imageUrl && (
				<img
					src={character.imageUrl}
					alt={character.name}
					className="w-16 h-16 object-cover rounded-full border border-gray-300 bg-gray-100"
				/>
			)}
			<div className="flex flex-col gap-1 flex-1 min-w-0">
				<h2 className="text-lg font-bold">{character.name}</h2>
				<p className="text-sm text-gray-500">{character.description}</p>
			</div>

			<div className="flex items-center gap-2">
				<div
					className="flex items-center gap-2"
					onClick={(e) => {
						e.preventDefault()
						e.stopPropagation()
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault()
							e.stopPropagation()
						}
					}}
				>
					<Checkbox
						id={`active-${character._id}`}
						checked={character.active}
						onCheckedChange={() => {
							toggleActive({ characterId: character._id })
						}}
					/>
					<Label
						htmlFor={`active-${character._id}`}
						className="text-sm cursor-pointer"
					>
						Active
					</Label>
				</div>
			</div>

			<Button
				className="block md:hidden md:group-hover:block absolute bottom-2 left-2"
				onClick={async (e) => {
					setIsLoading(true)
					e.preventDefault()
					e.stopPropagation()
					await regenerateImage({ characterId: character._id })
					setIsLoading(false)
				}}
			>
				{isLoading ? (
					<Loader2 className="w-4 h-4 animate-spin" />
				) : (
					<RefreshCcwIcon className="w-4 h-4" />
				)}
			</Button>
		</div>
	)
}
