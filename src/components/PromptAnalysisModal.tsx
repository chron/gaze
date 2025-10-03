import { useAction } from "convex/react"
import { BarChart3, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { PromptBreakdown } from "../../convex/prompts/core"
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./ui/tooltip"

type Props = {
	campaignId: Id<"campaigns">
	onClose: () => void
}

const MAX_TOKENS = 60000

type SegmentData = {
	label: string
	count: number
	color: string
	category: string
}

export const PromptAnalysisModal: React.FC<Props> = ({
	campaignId,
	onClose,
}) => {
	const [data, setData] = useState<PromptBreakdown | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const analyzePrompt = useAction(api.messages.analyzePrompt)

	useEffect(() => {
		const load = async () => {
			setIsLoading(true)
			try {
				const result = await analyzePrompt({ campaignId })
				setData(result)
			} finally {
				setIsLoading(false)
			}
		}
		load()
	}, [campaignId, analyzePrompt])

	// Build segments array from data in the order they appear in the prompt
	const segments: SegmentData[] = data
		? [
				// 1. System Prompt (always first)
				{
					label: "Base Prompt",
					count: data.systemPrompt.basePrompt,
					color: "bg-blue-500",
					category: "System Prompt",
				},
				{
					label: "Game System",
					count: data.systemPrompt.gameSystem,
					color: "bg-blue-400",
					category: "System Prompt",
				},
				{
					label: "Campaign Info",
					count: data.systemPrompt.campaignInfo,
					color: "bg-blue-300",
					category: "System Prompt",
				},
				// 2. Uploaded Files (for active campaigns)
				{
					label: "Uploaded Files",
					count: data.messages.uploadedFiles,
					color: "bg-purple-500",
					category: "Messages",
				},
				// 3. Message Summaries (for active campaigns)
				{
					label: "Message Summaries",
					count: data.messages.messageSummaries,
					color: "bg-purple-400",
					category: "Messages",
				},
				// 4. Other Campaign Summaries (for new campaigns)
				{
					label: "Other Campaign Summaries",
					count: data.messages.otherCampaignSummaries,
					color: "bg-indigo-400",
					category: "Messages",
				},
				// 5. Recent Messages
				{
					label: "Recent Messages",
					count: data.messages.recentMessages,
					color: "bg-purple-300",
					category: "Messages",
				},
				// 6. Intro Instruction (for new campaigns)
				{
					label: "Intro Instruction",
					count: data.messages.introInstruction,
					color: "bg-indigo-300",
					category: "Messages",
				},
				// 7. Current Context (for active campaigns)
				{
					label: "Plan",
					count: data.messages.currentContext.plan,
					color: "bg-green-500",
					category: "Current Context",
				},
				{
					label: "Quest Log",
					count: data.messages.currentContext.questLog,
					color: "bg-green-400",
					category: "Current Context",
				},
				{
					label: "Active Clocks",
					count: data.messages.currentContext.activeClocks,
					color: "bg-green-300",
					category: "Current Context",
				},
				{
					label: "Character Sheet",
					count: data.messages.currentContext.characterSheet,
					color: "bg-green-200",
					category: "Current Context",
				},
				{
					label: "Characters",
					count: data.messages.currentContext.characters,
					color: "bg-green-100",
					category: "Current Context",
				},
				{
					label: "Missing Characters",
					count: data.messages.currentContext.missingCharacters,
					color: "bg-green-50",
					category: "Current Context",
				},
			].filter((s) => s.count > 0)
		: []

	return (
		<Dialog open={true} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
				<DialogTitle className="flex items-center gap-2">
					<BarChart3 />
					Prompt Analysis
				</DialogTitle>

				{isLoading ? (
					<div className="flex items-center justify-center p-8">
						<Loader2 className="animate-spin" />
					</div>
				) : data ? (
					<div className="flex flex-col gap-4">
						<div className="text-sm text-gray-600">
							<span className="font-bold text-lg text-black">
								{data.grandTotal.toLocaleString()}
							</span>{" "}
							/ {MAX_TOKENS.toLocaleString()} tokens
							<span className="ml-2 text-xs">
								{((data.grandTotal / MAX_TOKENS) * 100).toFixed(1)}% of limit
							</span>
						</div>

						{/* Single Stacked Bar */}
						<TooltipProvider>
							<div className="w-full bg-gray-200 rounded-full h-8 flex overflow-hidden">
								{segments.map((segment) => {
									const widthPercent = (segment.count / MAX_TOKENS) * 100
									return (
										<Tooltip key={segment.label}>
											<TooltipTrigger asChild>
												<div
													className={`${segment.color} h-8 cursor-help transition-all hover:opacity-80`}
													style={{
														width: `${widthPercent}%`,
													}}
												/>
											</TooltipTrigger>
											<TooltipContent>
												<div className="text-sm">
													<div className="font-semibold">{segment.label}</div>
													<div className="text-xs text-gray-400">
														{segment.category}
													</div>
													<div className="mt-1">
														{segment.count.toLocaleString()} tokens (
														{((segment.count / data.grandTotal) * 100).toFixed(
															1,
														)}
														% of total)
													</div>
												</div>
											</TooltipContent>
										</Tooltip>
									)
								})}
							</div>
						</TooltipProvider>

						{/* Legend */}
						<div className="grid grid-cols-2 gap-2 text-sm mt-2">
							{segments.map((segment) => (
								<div key={segment.label} className="flex items-center gap-2">
									<div className={`w-3 h-3 rounded ${segment.color}`} />
									<span className="text-gray-700">{segment.label}</span>
									<span className="text-gray-500 text-xs ml-auto">
										{segment.count.toLocaleString()}
									</span>
								</div>
							))}
						</div>

						<div className="text-xs text-gray-500 mt-2 pt-2 border-t">
							Note: Token counts are calculated using Google's Gemini tokenizer
							API.
						</div>
					</div>
				) : (
					<div className="text-center p-8 text-gray-600">
						Failed to load analysis
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
