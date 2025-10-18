import { useMutation } from "convex/react"
import {
	Calendar,
	ClipboardList,
	Moon,
	Sun,
	Sunrise,
	Sunset,
	Trash2Icon,
} from "lucide-react"
import type React from "react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { cn } from "../lib/utils"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { ClockWheel } from "./ui/clock-wheel"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

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
	campaign: Doc<"campaigns">
}

function getTimeIcon(timeOfDay: TimeOfDay) {
	switch (timeOfDay) {
		case "dawn":
		case "morning":
			return <Sunrise className="h-3.5 w-3.5" />
		case "midday":
		case "afternoon":
			return <Sun className="h-3.5 w-3.5" />
		case "dusk":
		case "evening":
			return <Sunset className="h-3.5 w-3.5" />
		case "night":
		case "midnight":
			return <Moon className="h-3.5 w-3.5" />
	}
}

function formatTimeOfDay(timeOfDay: TimeOfDay): string {
	return timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)
}

export const CampaignInfoBar: React.FC<Props> = ({ campaign }) => {
	const deleteClock = useMutation(api.campaigns.deleteClock)

	const handleDeleteClock = (name: string) => {
		deleteClock({ campaignId: campaign._id, name })
	}

	const activeQuests =
		campaign.questLog?.filter((q) => q.status === "active") || []
	const inactiveQuests =
		campaign.questLog?.filter((q) => q.status !== "active") || []

	// Don't render anything if there's no content
	if (
		!campaign.temporal &&
		!campaign.clocks?.length &&
		!campaign.questLog?.length
	) {
		return null
	}

	return (
		<div className="ms-4 flex items-center gap-3">
			{/* Temporal info */}
			{campaign.temporal && (
				<>
					<Badge
						variant="secondary"
						className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
					>
						<Calendar className="h-3.5 w-3.5" />
						<span>{campaign.temporal.date}</span>
					</Badge>
					<Badge
						variant="secondary"
						className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
					>
						{getTimeIcon(campaign.temporal.timeOfDay)}
						<span>{formatTimeOfDay(campaign.temporal.timeOfDay)}</span>
					</Badge>
					{campaign.temporal.notes && (
						<span className="text-xs text-white/80 italic hidden sm:block">
							{campaign.temporal.notes}
						</span>
					)}
				</>
			)}

			{/* Clocks */}
			{campaign.clocks && campaign.clocks.length > 0 && (
				<div className="flex items-center gap-2">
					{campaign.clocks.map((clock) => {
						const isFull = clock.currentTicks >= clock.maxTicks
						return (
							<Tooltip key={clock.name}>
								<TooltipTrigger asChild>
									<div className="relative group cursor-pointer">
										<ClockWheel
											currentTicks={clock.currentTicks}
											maxTicks={clock.maxTicks}
											size="sm"
											isFull={isFull}
											strokeColor="var(--color-blue-500)"
										/>
										<Button
											variant="ghost"
											size="icon"
											className="absolute -top-1 -right-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-0"
											onClick={() => handleDeleteClock(clock.name)}
										>
											<Trash2Icon className="h-2.5 w-2.5" />
										</Button>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<div className="flex flex-col gap-1">
										<p className="font-semibold">{clock.name}</p>
										<p className="text-xs">
											{clock.currentTicks}/{clock.maxTicks} ticks
										</p>
										{clock.hint && (
											<p className="text-xs italic text-gray-300">
												{clock.hint}
											</p>
										)}
									</div>
								</TooltipContent>
							</Tooltip>
						)
					})}
				</div>
			)}

			{/* Quest Log */}
			{campaign.questLog && campaign.questLog.length > 0 && (
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="secondary"
							size="sm"
							className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
						>
							<ClipboardList className="h-3.5 w-3.5 mr-1.5" />
							Quests ({activeQuests.length})
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="w-80 overflow-y-auto max-h-[60vh]"
						align="start"
					>
						<div className="flex flex-col gap-3">
							<h3 className="font-semibold text-sm">Quest Log</h3>

							{/* Active Quests */}
							{activeQuests.length > 0 && (
								<div className="flex flex-col gap-2">
									<p className="text-xs font-semibold text-gray-500 uppercase">
										Active
									</p>
									{activeQuests.map((quest) => (
										<div
											key={quest.title}
											className="flex flex-col gap-1 pb-2 border-b last:border-b-0"
										>
											<p className="text-sm font-semibold">{quest.title}</p>
											<p className="text-xs text-gray-600">{quest.objective}</p>
										</div>
									))}
								</div>
							)}

							{/* Inactive Quests (Collapsible) */}
							{inactiveQuests.length > 0 && (
								<Collapsible>
									<CollapsibleTrigger asChild>
										<button
											type="button"
											className="text-xs font-semibold text-gray-500 uppercase hover:text-gray-700 cursor-pointer text-left"
										>
											Completed/Failed ({inactiveQuests.length})
										</button>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<div className="flex flex-col gap-2 mt-2">
											{inactiveQuests.map((quest) => (
												<div
													key={quest.title}
													className="flex flex-col gap-1 pb-2 border-b last:border-b-0"
												>
													<p
														className={cn(
															"text-sm font-semibold",
															quest.status === "completed" && "text-green-700",
															quest.status === "failed" && "text-red-700",
														)}
													>
														{quest.title}
													</p>
													<p className="text-xs text-gray-600">
														{quest.objective}
													</p>
												</div>
											))}
										</div>
									</CollapsibleContent>
								</Collapsible>
							)}
						</div>
					</PopoverContent>
				</Popover>
			)}
		</div>
	)
}
