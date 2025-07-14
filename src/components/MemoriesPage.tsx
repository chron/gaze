import type { Id } from "@convex-dev/web"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"

type Props = {
	campaignId: Id<"campaigns">
}

export const MemoriesPage: React.FC<Props> = ({ campaignId }) => {
	const memories = useQuery(api.memories.list, {
		campaignId,
	})

	return (
		<div className="flex flex-col gap-4 px-4 h-full">
			<h1 className="text-2xl font-title text-white">Memories</h1>
			<div className="flex flex-col gap-2">
				{memories?.map((memory) => (
					<MemoryCard key={memory._id} memory={memory} />
				))}
			</div>
		</div>
	)
}

type MemoryCardProps = {
	memory: Doc<"memories">
}

const MemoryCard: React.FC<MemoryCardProps> = ({ memory }) => {
	return (
		<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow border border-gray-200">
			<div className="flex flex-col gap-1 flex-1 min-w-0">
				<h2 className="text-lg font-bold">{memory.summary}</h2>
				<p className="text-sm text-gray-500">{memory.context}</p>
				<p className="text-sm text-gray-500">{memory.tags.join(", ")}</p>
				<p className="text-sm text-gray-500">{memory.type}</p>
			</div>
		</div>
	)
}
