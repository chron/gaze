import { Brain } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "../lib/utils"

type Props = {
	chunkCount: number
	isStreaming: boolean
	isExpanded: boolean
	onClick: () => void
	currentTitle?: string
}

export const ReasoningLozenges: React.FC<Props> = ({
	chunkCount,
	isStreaming,
	isExpanded,
	onClick,
	currentTitle,
}) => {
	const [displayTitle, setDisplayTitle] = useState(currentTitle)
	const [isFading, setIsFading] = useState(false)
	const prevTitleRef = useRef(currentTitle)

	useEffect(() => {
		if (currentTitle !== prevTitleRef.current && currentTitle) {
			// Trigger fade out
			setIsFading(true)

			// After fade out, update title and fade in
			const timeout = setTimeout(() => {
				setDisplayTitle(currentTitle)
				setIsFading(false)
			}, 150) // Half of the transition duration

			prevTitleRef.current = currentTitle
			return () => clearTimeout(timeout)
		}

		if (!currentTitle) {
			setDisplayTitle(undefined)
		}
	}, [currentTitle])

	if (chunkCount === 0) return null

	return (
		<button
			type="button"
			onClick={onClick}
			className="flex items-center justify-between gap-3 group cursor-pointer w-full hover:opacity-75 transition-opacity"
		>
			<div className="flex items-center gap-1.5 flex-shrink-0">
				<Brain className="h-3.5 w-3.5 text-gray-500" />

				<div className="flex gap-1">
					{Array.from({ length: chunkCount }).map((_, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: Static array of visual indicators
							key={i}
							className={cn(
								"h-2 rounded-full transition-all",
								isStreaming
									? "w-4 bg-gray-400 animate-pulse"
									: "w-2 bg-gray-300",
								isExpanded && "opacity-100",
								!isExpanded && "opacity-50 group-hover:opacity-75",
							)}
						/>
					))}
				</div>
			</div>

			{displayTitle && !isExpanded && isStreaming && (
				<div
					className={cn(
						"text-xs text-gray-500 font-medium transition-opacity duration-300 flex-grow text-right truncate",
						"animate-pulse",
						isFading ? "opacity-0" : "opacity-100",
					)}
				>
					{displayTitle}
				</div>
			)}
		</button>
	)
}
