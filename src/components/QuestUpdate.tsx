import { ScrollText } from "lucide-react"
import type React from "react"
import { ToolCallContainer } from "./ToolCallContainer"

type Props = {
	parameters: {
		action: "add" | "update_objective" | "complete" | "fail"
		quest_title: string
		objective_description: string
	}
	className?: string
}

export const QuestUpdate: React.FC<Props> = ({ parameters, className }) => {
	const title = `${getActionText(parameters.action)} ${parameters.quest_title}`

	return (
		<ToolCallContainer icon={ScrollText} title={title} className={className}>
			<p className="text-sm">{parameters.objective_description}</p>
		</ToolCallContainer>
	)
}

const getActionText = (
	action: "add" | "update_objective" | "complete" | "fail",
) => {
	switch (action) {
		case "add":
			return "New quest added:"
		case "complete":
			return "Quest completed:"
		case "fail":
			return "Quest failed:"
		case "update_objective":
			return "Quest updated:"
		default:
			return "Unknown action:"
	}
}
