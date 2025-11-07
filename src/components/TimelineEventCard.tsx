import { useQuery } from "convex/react"
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, XCircle } from "lucide-react"
import { History } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"

type Props = {
	event: Doc<"timelineEvents">
}

export const TimelineEventCard: React.FC<Props> = ({ event }) => {
	const [isExpanded, setIsExpanded] = useState(event.status === "running")
	const eventWithJob = useQuery(api.timelineEvents.get, {
		eventId: event._id,
	})

	const jobProgress = eventWithJob?.jobProgress

	// Format duration in a human-readable way
	const formatDuration = (ms: number) => {
		const seconds = Math.floor(ms / 1000)
		if (seconds < 60) return `${seconds}s`
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return `${minutes}m ${remainingSeconds}s`
	}

	const getEventIcon = () => {
		switch (event.type) {
			case "collapseHistory":
				return <History className="w-5 h-5" />
			default:
				return <History className="w-5 h-5" />
		}
	}

	const getEventTitle = () => {
		switch (event.type) {
			case "collapseHistory":
				return "History Collapsed"
			default:
				return "System Event"
		}
	}

	const getStatusIcon = () => {
		switch (event.status) {
			case "running":
				return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
			case "completed":
				return <CheckCircle2 className="w-4 h-4 text-green-600" />
			case "failed":
				return <XCircle className="w-4 h-4 text-red-600" />
		}
	}

	const renderCollapseHistoryStats = () => {
		if (event.status === "running") {
			const currentStep = jobProgress?.currentStep
			const completedSteps = jobProgress?.steps.filter(
				(s) => s.status === "completed",
			).length
			const totalSteps = jobProgress?.steps.length

			return (
				<div className="text-sm text-gray-600">
					<p className="animate-pulse">Collapsing history...</p>
					{currentStep && <p className="text-xs mt-1">{currentStep}</p>}
					{completedSteps !== undefined && totalSteps && (
						<p className="text-xs mt-1">
							Step {completedSteps + 1} of {totalSteps}
						</p>
					)}
				</div>
			)
		}

		if (event.status === "completed" && event.metadata) {
			const { summaryCount, messagesCollapsed, unsummarizedMessages, duration } =
				event.metadata

			return (
				<div className="text-sm space-y-1">
					<div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-700">
						<span className="font-medium">
							{summaryCount} {summaryCount === 1 ? "summary" : "summaries"} created
						</span>
						<span>•</span>
						<span>{messagesCollapsed} messages collapsed</span>
					</div>
					<div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600 text-xs">
						<span>{unsummarizedMessages} unsummarized messages remaining</span>
						{duration && (
							<>
								<span>•</span>
								<span>Completed in {formatDuration(duration)}</span>
							</>
						)}
					</div>
				</div>
			)
		}

		if (event.status === "failed" && event.error) {
			return (
				<div className="text-sm text-red-600">
					<p>Failed: {event.error}</p>
				</div>
			)
		}

		return null
	}

	const hasExpandableContent =
		jobProgress && jobProgress.steps && jobProgress.steps.length > 2

	return (
		<div
			className={cn(
				"flex flex-col gap-2 p-4 rounded-md w-full max-w-[95%] sm:max-w-[80%] self-center",
				"border-2 border-dashed",
				event.status === "running" && "bg-blue-50 border-blue-300",
				event.status === "completed" && "bg-green-50 border-green-300",
				event.status === "failed" && "bg-red-50 border-red-300",
			)}
		>
			<div className="flex items-start gap-3">
				<div className="flex-shrink-0 mt-0.5 text-gray-600">
					{getEventIcon()}
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-2">
						<h3 className="font-semibold text-sm">{getEventTitle()}</h3>
						{getStatusIcon()}
					</div>

					{event.type === "collapseHistory" && renderCollapseHistoryStats()}
				</div>

				{hasExpandableContent && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsExpanded(!isExpanded)}
						className="flex-shrink-0"
					>
						{isExpanded ? (
							<ChevronUp className="w-4 h-4" />
						) : (
							<ChevronDown className="w-4 h-4" />
						)}
					</Button>
				)}
			</div>

			{isExpanded && jobProgress && jobProgress.steps.length > 2 && (
				<div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-300 pl-4">
					{jobProgress.steps.slice(2).map((step, index) => (
						<div
							key={index}
							className={cn(
								"flex items-start gap-2 p-2 rounded text-xs",
								step.status === "completed" && "bg-white/50",
								step.status === "running" && "bg-blue-100/50",
								step.status === "failed" && "bg-red-100/50",
							)}
						>
							<div className="flex-shrink-0 mt-0.5">
								{step.status === "completed" && (
									<CheckCircle2 className="w-3 h-3 text-green-600" />
								)}
								{step.status === "running" && (
									<Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
								)}
								{step.status === "failed" && (
									<XCircle className="w-3 h-3 text-red-600" />
								)}
							</div>

							<div className="flex-1 min-w-0">
								<h4 className="font-medium">{step.title}</h4>
								{step.data?.summary && (
									<p className="text-gray-600 mt-1">{step.data.summary}</p>
								)}
								{step.data?.characters && step.data.characters.length > 0 && (
									<div className="mt-1 flex flex-wrap gap-1">
										{step.data.characters.map((char: string) => (
											<span
												key={char}
												className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded"
											>
												{char}
											</span>
										))}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
