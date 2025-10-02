import { ClockIcon } from "lucide-react"
import type React from "react"
import { cn } from "../lib/utils"

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

					{/* Mini clock visualization */}
					<div className="relative w-8 h-8">
						<svg
							className="w-full h-full -rotate-90"
							viewBox="0 0 100 100"
							xmlns="http://www.w3.org/2000/svg"
							aria-label={`Clock progress: ${parameters.current_ticks} of ${parameters.max_ticks}`}
						>
							<title>{`${parameters.name} clock: ${parameters.current_ticks}/${parameters.max_ticks}`}</title>
							{/* Background circle */}
							<circle
								cx="50"
								cy="50"
								r="40"
								fill="none"
								stroke="currentColor"
								strokeWidth="8"
								opacity="0.3"
							/>

							{/* Progress circle */}
							<circle
								cx="50"
								cy="50"
								r="40"
								fill="none"
								stroke="currentColor"
								strokeWidth="8"
								strokeDasharray={`${(parameters.current_ticks / parameters.max_ticks) * 251.327} 251.327`}
								strokeLinecap="round"
							/>
						</svg>
					</div>
				</div>

				{parameters.hint && <p className="text-xs italic">{parameters.hint}</p>}

				{isFull && (
					<p className="text-xs font-semibold">
						⚠️ The clock is full! Something significant is about to happen.
					</p>
				)}
			</div>
		</div>
	)
}
