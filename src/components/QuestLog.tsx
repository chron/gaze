import { ChevronUpIcon } from "lucide-react"
import { useState } from "react"
import type { Doc } from "../../convex/_generated/dataModel"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible"

type Props = {
	questLog: NonNullable<Doc<"campaigns">["questLog"]>
}

export const QuestLog: React.FC<Props> = ({ questLog }) => {
	const [expanded, setExpanded] = useState(false)

	const activeQuests = questLog.filter((quest) => quest.status === "active")
	const inactiveQuests = questLog.filter((quest) => quest.status !== "active")

	return (
		<div className="absolute top-0 right-2 max-w-[300px] flex flex-col gap-2 items-end">
			<Button onClick={() => setExpanded(!expanded)}>
				{expanded ? <ChevronUpIcon /> : `Quests (${activeQuests.length})`}
			</Button>

			{expanded && (
				<div className="flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-md">
					<Collapsible>
						<CollapsibleTrigger>
							<button
								className="text-sm font-bold cursor-pointer hover:text-blue-500"
								type="button"
							>
								Finished Quests ({inactiveQuests.length})
							</button>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<div className="text-xs flex flex-col gap-2 bg-gray-50 rounded-md p-2 max-h-[200px] overflow-y-auto">
								{inactiveQuests.length > 0 && (
									<div className="flex flex-col gap-1">
										{inactiveQuests.map((quest) => (
											<div key={quest.title} className="flex flex-col gap-1">
												<span className="text-sm font-bold">{quest.title}</span>
												<span className="text-xs">{quest.objective}</span>
											</div>
										))}
									</div>
								)}
							</div>
						</CollapsibleContent>
					</Collapsible>

					<div className="text-xs flex flex-col gap-2">
						{activeQuests.map((quest) => (
							<div key={quest.title} className="flex flex-col gap-1">
								<span
									className={cn(
										"text-sm font-bold",
										quest.status === "completed" && "text-green-700",
										quest.status === "failed" && "text-red-700",
									)}
								>
									{quest.title}
								</span>
								{quest.status === "active" && (
									<span className="text-xs">{quest.objective}</span>
								)}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
