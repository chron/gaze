import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

type Props = {
	campaignId: Id<"campaigns">
}

export const CharacterSheet: React.FC<Props> = ({ campaignId }) => {
	const characterSheet = useQuery(api.characterSheets.get, { campaignId })

	if (!characterSheet) {
		return null
	}

	return (
		<div className="flex flex-col gap-2 px-4 h-full">
			<div className="flex flex-col gap-2 rounded-lg bg-white p-4">
				<h1 className="text-2xl font-title">{characterSheet.name}</h1>
				<p className="text-sm text-gray-500">{characterSheet.description}</p>
				<pre className="text-sm text-gray-500 whitespace-pre-wrap">
					{JSON.stringify(characterSheet.data, null, 2)}
				</pre>
			</div>
		</div>
	)
}
