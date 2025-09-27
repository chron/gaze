import { CheckCircle } from "lucide-react"
import type React from "react"

type Props = {
	parameters: {
		action: "add" | "update" | "complete" | "fail"
		quest_title: string
		objective_description: string
	}
}

export const QuestUpdate: React.FC<Props> = ({ parameters }) => {
	return (
		<div className="p-3 bg-purple-50 border border-purple-200 rounded-md text-purple-800 text-sm">
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2 ">
					<CheckCircle className="h-4 w-4" />
					{parameters.action === "add" ? "New quest added:" : "Quest updated:"}{" "}
					<span className="font-bold">{parameters.quest_title}</span>
				</div>

				<p>{parameters.objective_description}</p>
			</div>
		</div>
	)
}
