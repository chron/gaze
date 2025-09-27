import { ChevronUpIcon } from "lucide-react"
import { useState } from "react"
import type { Doc } from "../../convex/_generated/dataModel"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"

type Props = {
	questLog: NonNullable<Doc<"campaigns">["questLog"]>
}

export const QuestLog: React.FC<Props> = ({ questLog }) => {
	const [expanded, setExpanded] = useState(false)

	return (
		<div className="absolute top-0 right-2 max-w-[300px] flex flex-col gap-2 items-end">
			<Button onClick={() => setExpanded(!expanded)}>
				{expanded ? <ChevronUpIcon /> : `Quests (${questLog.length})`}
			</Button>

			{expanded && (
				<div className="flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-md">
					<div className="text-xs flex flex-col gap-2">
						{questLog.map((quest) => (
							<div key={quest.title} className="flex flex-col gap-1">
								<span
									className={cn(
										"text-sm font-bold",
										quest.status === "completed" && "text-green-600",
										quest.status === "failed" && "text-red-600",
									)}
								>
									{quest.title}
								</span>
								<span className="text-xs">{quest.objective}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
