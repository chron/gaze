import { Calendar, Clock, Moon, Sun, Sunrise, Sunset } from "lucide-react"
import type React from "react"
import { ToolCallContainer } from "./ToolCallContainer"

type TimeOfDay =
	| "dawn"
	| "morning"
	| "midday"
	| "afternoon"
	| "dusk"
	| "evening"
	| "night"
	| "midnight"

type Props = {
	parameters: {
		date: string
		time_of_day: TimeOfDay
		notes?: string
		previous_date?: string
		previous_time_of_day?: TimeOfDay
	}
	className?: string
}

const getTimeIcon = (timeOfDay: TimeOfDay) => {
	switch (timeOfDay) {
		case "dawn":
		case "morning":
			return <Sunrise className="h-4 w-4" />
		case "midday":
		case "afternoon":
			return <Sun className="h-4 w-4" />
		case "dusk":
		case "evening":
			return <Sunset className="h-4 w-4" />
		case "night":
		case "midnight":
			return <Moon className="h-4 w-4" />
	}
}

const formatTimeOfDay = (timeOfDay: TimeOfDay): string => {
	return timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)
}

export const TemporalUpdate: React.FC<Props> = ({ parameters, className }) => {
	const isNew = !parameters.previous_date && !parameters.previous_time_of_day

	const title = isNew ? "Time set" : "Time advanced"

	return (
		<ToolCallContainer
			iconSlot={
				<div className="flex items-center gap-1">
					<Calendar className="h-4 w-4" />
				</div>
			}
			title={title}
			className={className}
		>
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2 text-sm">
					{getTimeIcon(parameters.time_of_day)}
					<span className="font-medium">{parameters.date}</span>
					<span className="text-muted-foreground">•</span>
					<span className="text-muted-foreground">
						{formatTimeOfDay(parameters.time_of_day)}
					</span>
				</div>

				{parameters.notes && (
					<p className="text-sm italic text-gray-500">{parameters.notes}</p>
				)}

				{!isNew &&
					(parameters.previous_date || parameters.previous_time_of_day) && (
						<p className="text-xs text-gray-400">
							Previous: {parameters.previous_date || "Unknown"} (
							{formatTimeOfDay(parameters.previous_time_of_day || "morning")})
						</p>
					)}
			</div>
		</ToolCallContainer>
	)
}
