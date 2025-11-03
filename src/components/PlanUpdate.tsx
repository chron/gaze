import { ListChecks } from "lucide-react"
import type React from "react"
import ReactMarkdown from "react-markdown"
import { ToolCallContainer } from "./ToolCallContainer"
import { StringDiff } from "./ui/string-diff"

type Props = {
	parameters: {
		plan: string
		part?:
			| "current_scene"
			| "future_events"
			| "player_requests"
			| "overall_story"
			| "key_details"
			| "feelings_and_reflections"
	}
	result?: {
		message: string
		oldPlan: string
		newPlan: string
		part?: string
	}
	className?: string
}

const partLabels = {
	current_scene: "Current Scene",
	future_events: "Future Events",
	player_requests: "Player Requests",
	overall_story: "Overall Story",
	key_details: "Key Details",
	feelings_and_reflections: "Feelings and Reflections",
}

export const PlanUpdate: React.FC<Props> = ({
	parameters,
	result,
	className,
}) => {
	const title = parameters.part
		? `Plan updated: ${partLabels[parameters.part]}`
		: "Plan updated"

	const showDiff =
		result?.oldPlan && result?.newPlan && result.oldPlan !== result.newPlan

	return (
		<ToolCallContainer icon={ListChecks} title={title} className={className}>
			{showDiff ? (
				<StringDiff
					oldText={result.oldPlan}
					newText={result.newPlan}
					mode="side-by-side"
				/>
			) : (
				<ReactMarkdown>{parameters.plan}</ReactMarkdown>
			)}
		</ToolCallContainer>
	)
}
