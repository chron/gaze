import type React from "react"
import { ToolCallContainer } from "./ToolCallContainer"
import { ClockWheel } from "./ui/clock-wheel"

type Props = {
	parameters: {
		name: string
		current_ticks: number
		max_ticks: number
		previous_ticks?: number
		hint?: string
	}
	className?: string
}

export const ClockUpdate: React.FC<Props> = ({ parameters, className }) => {
	const isFull = parameters.current_ticks >= parameters.max_ticks
	const isNew =
		parameters.previous_ticks === undefined || parameters.previous_ticks === 0

	const title = isNew
		? `Clock started: ${parameters.name}`
		: isFull
			? `Clock completed: ${parameters.name}`
			: `Clock updated: ${parameters.name}`

	return (
		<ToolCallContainer
			iconSlot={
				<ClockWheel
					currentTicks={parameters.current_ticks}
					maxTicks={parameters.max_ticks}
					size="sm"
					isFull={isFull}
					previousTicks={parameters.previous_ticks}
				/>
			}
			title={title}
			className={className}
		>
			<div className="flex flex-col gap-2">
				<div className="text-sm">
					Progress: {parameters.current_ticks}/{parameters.max_ticks}
				</div>

				{/* TODO: ideally it should show the old hint even if it hasn't changed */}
				{parameters.hint && (
					<p className="text-sm italic text-gray-500">{parameters.hint}</p>
				)}
			</div>
		</ToolCallContainer>
	)
}
