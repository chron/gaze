import type { Id } from "@convex-dev/web"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"

type Props = {
	campaignId: Id<"campaigns">
}

type CharacterWithImageUrl = Doc<"characters"> & { imageUrl?: string | null }

export const CharacterPage: React.FC<Props> = ({ campaignId }) => {
	const characters = useQuery(api.characters.list, {
		campaignId,
	})

	return (
		<div className="flex flex-col gap-4 px-4 w-full">
			<h1 className="text-2xl font-bold">Characters</h1>
			<div className="flex flex-col gap-2">
				{characters?.map((character) => (
					<CharacterCard key={character._id} character={character} />
				))}
			</div>
		</div>
	)
}

type CharacterCardProps = {
	character: CharacterWithImageUrl
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
	return (
		<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow border border-gray-200">
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
		</div>
	)
}
