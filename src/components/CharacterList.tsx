import { useQuery } from "convex/react"
import { User } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

type Props = {
	campaignId: Id<"campaigns">
}

export const CharacterList: React.FC<Props> = ({ campaignId }) => {
	const [zoomedCharacters, setZoomedCharacters] = useState<Set<string>>(
		new Set(),
	)

	const campaign = useQuery(api.campaigns.get, {
		id: campaignId,
	})

	const characters = useQuery(api.characters.list, {
		campaignId,
	})

	if (!campaign || characters === undefined) {
		return null
	}

	// Backwards compat, show all characters if no active characters are set
	const activeCharacters =
		campaign.activeCharacters ?? characters.map((c) => c.name)

	const toggleZoom = (characterId: string) => {
		setZoomedCharacters((prev) => {
			const next = new Set(prev)
			if (next.has(characterId)) {
				next.delete(characterId)
			} else {
				next.add(characterId)
			}
			return next
		})
	}

	return (
		<div className="flex flex-wrap absolute top-[-40px] sm:top-[-64px] right-0 pointer-events-none sm:pointer-events-auto">
			{activeCharacters.map((charName) => {
				const character = characters.find((c) => c.name === charName)
				if (!character)
					return (
						<div
							key={charName}
							className="flex justify-center items-center w-[56px] sm:w-[80px] aspect-square text-red-500 -mx-2 sm:-mx-3"
						>
							{charName}
						</div>
					)

				const isZoomed = zoomedCharacters.has(character._id)

				// Determine if we should show an image or fallback icon
				const currentOutfitData = character.currentOutfit
					? character.allOutfits?.find(
							(o) => o.name === character.currentOutfit,
						)
					: undefined
				const imageUrl = currentOutfitData
					? currentOutfitData.imageUrl
					: character.imageUrl
				const hasImageError =
					currentOutfitData?.imageError ?? character.imageError

				return (
					<Tooltip key={character._id}>
						<TooltipContent className="max-w-[300px] p-4">
							<h3 className="text-lg font-bold mb-2">{character.name}</h3>
							<p className="text-sm">{character.description}</p>
							{character.currentOutfit && (
								<p className="text-xs text-gray-400 mt-2 italic">
									Wearing: {character.currentOutfit}
								</p>
							)}
							{hasImageError && (
								<p className="text-xs text-red-400 mt-2">
									Image generation failed - showing fallback icon
								</p>
							)}
						</TooltipContent>
						<TooltipTrigger>
							<div
								className="w-[56px] sm:w-[80px] aspect-square -mx-2 sm:-mx-3 cursor-pointer overflow-hidden flex items-center justify-center"
								onClick={(e) => {
									e.preventDefault()
									toggleZoom(character._id)
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault()
										toggleZoom(character._id)
									}
								}}
							>
								{imageUrl && !hasImageError ? (
									<img
										className={`w-full h-full object-top ${
											isZoomed ? "object-cover" : "object-contain"
										}`}
										src={imageUrl}
										alt={character.name}
									/>
								) : (
									<User
										className={`w-8 h-8 sm:w-12 sm:h-12 ${hasImageError ? "text-red-500" : "text-gray-400"}`}
									/>
								)}
							</div>
						</TooltipTrigger>
					</Tooltip>
				)
			})}
		</div>
	)
}
