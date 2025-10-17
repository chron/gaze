import { ListChecks } from "lucide-react"
import type React from "react"
import { ToolCallContainer } from "./ToolCallContainer"

type Props = {
	parameters: {
		plan: string
		part?:
			| "current_scene"
			| "future_events"
			| "player_requests"
			| "overall_story"
	}
	className?: string
}

const partLabels = {
	current_scene: "Current Scene",
	future_events: "Future Events",
	player_requests: "Player Requests",
	overall_story: "Overall Story",
}

export const PlanUpdate: React.FC<Props> = ({ parameters, className }) => {
	const title = parameters.part
		? `Plan updated: ${partLabels[parameters.part]}`
		: "Plan updated"

	return (
		<ToolCallContainer icon={ListChecks} title={title} className={className}>
			<p className="text-sm whitespace-pre-wrap">{parameters.plan}</p>
		</ToolCallContainer>
	)
}
