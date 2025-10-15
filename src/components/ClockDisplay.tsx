import { useMutation } from "convex/react"
import { ChevronUpIcon, ClockIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { ClockWheel } from "./ui/clock-wheel"

type Props = {
	clocks: NonNullable<Doc<"campaigns">["clocks"]>
	campaignId: Id<"campaigns">
}

const Clock: React.FC<{
	name: string
	currentTicks: number
	maxTicks: number
	hint?: string
	onDelete: () => void
}> = ({ name, currentTicks, maxTicks, hint, onDelete }) => {
	const isFull = currentTicks >= maxTicks

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-2">
				<span className={cn("text-sm font-bold", isFull && "text-red-600")}>
					{name}
				</span>
				<div className="flex items-center gap-1">
					<span className="text-xs text-gray-600">
						{currentTicks}/{maxTicks}
					</span>
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={onDelete}
						title="Delete clock"
					>
						<Trash2Icon className="h-3 w-3" />
					</Button>
				</div>
			</div>

			{/* Clock wheel visualization */}
			<ClockWheel
				currentTicks={currentTicks}
				maxTicks={maxTicks}
				size="md"
				isFull={isFull}
				className="mx-auto"
			/>

			{hint && (
				<p className="text-xs text-gray-600 italic text-center">{hint}</p>
			)}
		</div>
	)
}

export const ClockDisplay: React.FC<Props> = ({ clocks, campaignId }) => {
	const [expanded, setExpanded] = useState(false)
	const deleteClock = useMutation(api.campaigns.deleteClock)

	const handleDelete = (name: string) => {
		deleteClock({ campaignId, name })
	}

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
								onDelete={() => handleDelete(clock.name)}
							/>
						))
					)}
				</div>
			)}
		</div>
	)
}
