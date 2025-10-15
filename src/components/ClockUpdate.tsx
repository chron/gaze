import { ClockIcon } from "lucide-react"
import type React from "react"
import { cn } from "../lib/utils"
import { ClockWheel } from "./ui/clock-wheel"

type Props = {
	parameters: {
		name: string
		current_ticks: number
		max_ticks: number
		hint?: string
	}
}

export const ClockUpdate: React.FC<Props> = ({ parameters }) => {
	const isFull = parameters.current_ticks >= parameters.max_ticks
	const isNew = parameters.current_ticks === 0

	return (
		<div
			className={cn(
				"p-3 border rounded-md text-sm",
				isFull
					? "bg-red-50 border-red-200 text-red-800"
					: "bg-blue-50 border-blue-200 text-blue-800",
			)}
		>
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<ClockIcon className="h-4 w-4" />
					<span className="font-bold">
						{isNew
							? "New clock:"
							: isFull
								? "Clock completed!"
								: "Clock updated:"}
					</span>
					<span className="font-bold">{parameters.name}</span>
				</div>

				<div className="flex items-center gap-2">
					<div className="text-xs">
						Progress: {parameters.current_ticks}/{parameters.max_ticks}
					</div>

					{/* Mini clock wheel visualization */}
					<ClockWheel
						currentTicks={parameters.current_ticks}
						maxTicks={parameters.max_ticks}
						size="sm"
						isFull={isFull}
					/>
				</div>

				{parameters.hint && <p className="text-xs italic">{parameters.hint}</p>}
			</div>
		</div>
	)
}
