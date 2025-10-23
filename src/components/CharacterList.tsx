import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

type Props = {
	campaignId: Id<"campaigns">
}

export const CharacterList: React.FC<Props> = ({ campaignId }) => {
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
						</TooltipContent>
						<TooltipTrigger>
							<div className="w-[56px] sm:w-[80px] aspect-square -mx-2 sm:-mx-3">
								{character.imageUrl && (
									<img
										className="w-full h-full object-contain"
										src={character.imageUrl}
										alt={character.name}
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
