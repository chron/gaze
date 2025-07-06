import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

type Props = {
	campaignId: Id<"campaigns">
}

export const CharacterSheet: React.FC<Props> = ({ campaignId }) => {
	const characterSheet = useQuery(api.characterSheets.get, { campaignId })

	return (
		<div className="flex flex-col gap-2 px-4">
			<h1 className="text-2xl font-bold">{characterSheet?.name}</h1>
			<p className="text-sm text-gray-500">{characterSheet?.description}</p>
			<p className="text-sm text-gray-500">XP: {characterSheet?.xp}</p>
			<p className="text-sm text-gray-500">
				Inventory: {characterSheet?.inventory.join(", ")}
			</p>
		</div>
	)
}
