import { Brain } from "lucide-react"
import { cn } from "../lib/utils"

type Props = {
	chunkCount: number
	isStreaming: boolean
	isExpanded: boolean
	onClick: () => void
}

export const ReasoningLozenges: React.FC<Props> = ({
	chunkCount,
	isStreaming,
	isExpanded,
	onClick,
}) => {
	if (chunkCount === 0) return null

	return (
		<button
			type="button"
			onClick={onClick}
			className="flex items-center gap-1.5 group cursor-pointer w-fit hover:opacity-75 transition-opacity"
		>
			<Brain className="h-3.5 w-3.5 text-gray-500" />

			<div className="flex gap-1">
				{Array.from({ length: chunkCount }).map((_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: Static array of visual indicators
						key={i}
						className={cn(
							"h-2 rounded-full transition-all",
							isStreaming ? "w-4 bg-gray-400 animate-pulse" : "w-2 bg-gray-300",
							isExpanded && "opacity-100",
							!isExpanded && "opacity-50 group-hover:opacity-75",
						)}
					/>
				))}
			</div>
		</button>
	)
}
