import { ChevronUpIcon, ClockIcon } from "lucide-react"
import { useState } from "react"
import type { Doc } from "../../convex/_generated/dataModel"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"

type Props = {
	clocks: NonNullable<Doc<"campaigns">["clocks"]>
}

const Clock: React.FC<{
	name: string
	currentTicks: number
	maxTicks: number
	hint?: string
}> = ({ name, currentTicks, maxTicks, hint }) => {
	const isFull = currentTicks >= maxTicks
	const percentage = (currentTicks / maxTicks) * 100

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-2">
				<span className={cn("text-sm font-bold", isFull && "text-red-600")}>
					{name}
				</span>
				<span className="text-xs text-gray-600">
					{currentTicks}/{maxTicks}
				</span>
			</div>

			{/* Clock circle visualization */}
			<div className="relative w-16 h-16 mx-auto">
				<svg
					className="w-full h-full -rotate-90"
					viewBox="0 0 100 100"
					xmlns="http://www.w3.org/2000/svg"
					aria-label={`Clock progress: ${currentTicks} of ${maxTicks}`}
				>
					<title>{`${name} clock: ${currentTicks}/${maxTicks}`}</title>
					{/* Background circle */}
					<circle
						cx="50"
						cy="50"
						r="40"
						fill="none"
						stroke="#e5e7eb"
						strokeWidth="8"
					/>

					{/* Progress circle */}
					<circle
						cx="50"
						cy="50"
						r="40"
						fill="none"
						stroke={isFull ? "#dc2626" : "#3b82f6"}
						strokeWidth="8"
						strokeDasharray={`${percentage * 2.51327} 251.327`}
						strokeLinecap="round"
					/>

					{/* Segment dividers */}
					{Array.from({ length: maxTicks }).map((_, i) => {
						const angle = (360 / maxTicks) * i
						const radians = ((angle - 90) * Math.PI) / 180
						const x1 = 50 + 32 * Math.cos(radians)
						const y1 = 50 + 32 * Math.sin(radians)
						const x2 = 50 + 48 * Math.cos(radians)
						const y2 = 50 + 48 * Math.sin(radians)

						return (
							<line
								key={`segment-${name}-${angle}-${maxTicks}`}
								x1={x1}
								y1={y1}
								x2={x2}
								y2={y2}
								stroke="#9ca3af"
								strokeWidth="2"
							/>
						)
					})}
				</svg>
			</div>

			{hint && (
				<p className="text-xs text-gray-600 italic text-center">{hint}</p>
			)}
		</div>
	)
}

export const ClockDisplay: React.FC<Props> = ({ clocks }) => {
	const [expanded, setExpanded] = useState(false)

	return (
		<div className="absolute top-20 right-2 max-w-[300px] flex flex-col gap-2 items-end">
			<Button onClick={() => setExpanded(!expanded)}>
				{expanded ? (
					<ChevronUpIcon />
				) : (
					<>
						<ClockIcon className="h-4 w-4" />
						<span>Clocks ({clocks.length})</span>
					</>
				)}
			</Button>

			{expanded && (
				<div className="flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-md">
					{clocks.length === 0 ? (
						<p className="text-sm text-gray-500">No active clocks</p>
					) : (
						clocks.map((clock) => (
							<Clock
								key={clock.name}
								name={clock.name}
								currentTicks={clock.currentTicks}
								maxTicks={clock.maxTicks}
								hint={clock.hint}
							/>
						))
					)}
				</div>
			)}
		</div>
	)
}
