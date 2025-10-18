import { ListChecks } from "lucide-react"
import type React from "react"
import ReactMarkdown from "react-markdown"
import { ToolCallContainer } from "./ToolCallContainer"

type Props = {
	parameters: {
		plan: string
		part?:
			| "current_scene"
			| "future_events"
			| "player_requests"
			| "overall_story"
			| "key_details"
	}
	className?: string
}

const partLabels = {
	current_scene: "Current Scene",
	future_events: "Future Events",
	player_requests: "Player Requests",
	overall_story: "Overall Story",
	key_details: "Key Details",
}

export const PlanUpdate: React.FC<Props> = ({ parameters, className }) => {
	const title = parameters.part
		? `Plan updated: ${partLabels[parameters.part]}`
		: "Plan updated"

	return (
		<ToolCallContainer icon={ListChecks} title={title} className={className}>
			<ReactMarkdown>{parameters.plan}</ReactMarkdown>
		</ToolCallContainer>
	)
}
