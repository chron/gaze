import { MessageCircleWarningIcon } from "lucide-react"
import type React from "react"

type Props = {
	parameters: {
		action: "add" | "update_objective" | "complete" | "fail"
		quest_title: string
		objective_description: string
	}
}

export const QuestUpdate: React.FC<Props> = ({ parameters }) => {
	return (
		<div className="p-3 bg-purple-50 border border-purple-200 rounded-md text-purple-800 text-sm">
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2 ">
					<MessageCircleWarningIcon className="h-4 w-4" />
					{getActionText(parameters.action)}{" "}
					<span className="font-bold">{parameters.quest_title}</span>
				</div>

				<p>{parameters.objective_description}</p>
			</div>
		</div>
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
