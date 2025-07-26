import { useAction, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

type Props = {
	campaignId: Id<"campaigns">
}

export const CharacterList: React.FC<Props> = ({ campaignId }) => {
	const regenerateImage = useAction(api.characters.generateImageForCharacter)
	const characters = useQuery(api.characters.list, {
		campaignId,
	})

	if (characters === undefined) {
		return null
	}

	return (
		<div className="flex flex-wrap absolute top-[-64px] right-0 ">
			{characters.map((character) => (
				<Tooltip key={character._id}>
					<TooltipContent className="max-w-[300px] p-4">
						<h3 className="text-lg font-bold mb-2">{character.name}</h3>
						<p className="text-sm">{character.description}</p>
					</TooltipContent>
					<TooltipTrigger>
						<div
							className="w-[80px] aspect-square cursor-pointer"
							onClick={() => regenerateImage({ characterId: character._id })}
						>
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
			))}
		</div>
	)
}
