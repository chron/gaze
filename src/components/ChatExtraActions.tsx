import { useParams } from "@tanstack/react-router"
import { useAction, useMutation, useQuery } from "convex/react"
import {
	BarChart3,
	BetweenHorizontalStart,
	BookText,
	Brain,
	Command,
	Landmark,
	Trash,
} from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { MessageMarkdown } from "./MessageMarkdown"
import { PlanModal } from "./PlanModal"
import { ProgressModal } from "./ProgressModal"
import { PromptAnalysisModal } from "./PromptAnalysisModal"
import { Button } from "./ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "./ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu"

export const ChatExtraActions: React.FC = () => {
	const { campaignId } = useParams({ from: "/campaigns/$campaignId" })
	const [result, setResult] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
	const [isPromptAnalysisOpen, setIsPromptAnalysisOpen] = useState(false)
	const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
	const [progressJobId, setProgressJobId] = useState<Id<"jobProgress"> | null>(
		null,
	)
	const collapseHistory = useAction(api.summaries.collapseHistory)
	const summarizeChatHistory = useAction(api.messages.summarizeChatHistory)
	const chatWithHistory = useAction(api.messages.chatWithHistory)
	const deleteJob = useMutation(api.jobProgress.deleteJob)

	const updatePlan = useMutation(api.campaigns.updatePlan)
	const lookForThemesInCampaignSummaries = useAction(
		api.campaigns.lookForThemesInCampaignSummaries,
	)
	const campaign = useQuery(api.campaigns.get, {
		id: campaignId as Id<"campaigns">,
	})

	return (
		<>
			{result ? (
				<Dialog open={!!result} onOpenChange={(v) => !v && setResult(null)}>
					<DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
						<DialogTitle>Result</DialogTitle>
						<DialogDescription>The result of the action</DialogDescription>
						<MessageMarkdown>{result}</MessageMarkdown>
					</DialogContent>
				</Dialog>
			) : null}

			<DropdownMenu>
				<DropdownMenuTrigger disabled={isLoading} asChild>
					<Button variant="outline" isLoading={isLoading}>
						<Command />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						onClick={async () => {
							setIsLoading(true)
							try {
								const result = await lookForThemesInCampaignSummaries({})
								setResult(result.text)
								console.log(result.usage)
							} finally {
								setIsLoading(false)
							}
						}}
					>
						<Landmark />
						Cross-campaign themes
					</DropdownMenuItem>

					<DropdownMenuItem
						onClick={async () => {
							// TODO: real modal
							const question = prompt("Ask a question about the campaign")
							if (question) {
								setIsLoading(true)
								try {
									const result = await chatWithHistory({
										campaignId: campaignId as Id<"campaigns">,
										question,
									})

									setResult(result)
								} finally {
									setIsLoading(false)
								}
							}
						}}
					>
						<Brain />
						Ask a question
					</DropdownMenuItem>

					<DropdownMenuItem onClick={() => setIsPromptAnalysisOpen(true)}>
						<BarChart3 />
						Analyze prompt
					</DropdownMenuItem>

					<DropdownMenuItem
						onClick={async () => {
							// Show modal immediately
							setIsProgressModalOpen(true)
							try {
								const jobId = await collapseHistory({
									campaignId: campaignId as Id<"campaigns">,
								})
								setProgressJobId(jobId)
							} catch (error) {
								console.error("Failed to collapse history:", error)
								setIsProgressModalOpen(false)
							}
						}}
					>
						<BetweenHorizontalStart />
						Collapse history
					</DropdownMenuItem>

					<DropdownMenuItem
						onClick={async () => {
							setIsLoading(true)
							try {
								const summary = await summarizeChatHistory({
									campaignId: campaignId as Id<"campaigns">,
								})
								setResult(summary)
							} finally {
								setIsLoading(false)
							}
						}}
					>
						<BookText />
						Summarise
					</DropdownMenuItem>

					{campaign?.plan && (
						<>
							<DropdownMenuItem onClick={() => setIsPlanModalOpen(true)}>
								<Brain />
								View plan
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={async () => {
									await updatePlan({
										campaignId: campaignId as Id<"campaigns">,
										plan: "",
									})
								}}
							>
								<Trash />
								Clear plan
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			{isPlanModalOpen && (
				<PlanModal
					campaignId={campaignId as Id<"campaigns">}
					onClose={() => setIsPlanModalOpen(false)}
				/>
			)}

			{isPromptAnalysisOpen && (
				<PromptAnalysisModal
					campaignId={campaignId as Id<"campaigns">}
					onClose={() => setIsPromptAnalysisOpen(false)}
				/>
			)}

			<ProgressModal
				isOpen={isProgressModalOpen}
				jobId={progressJobId}
				onClose={async () => {
					if (progressJobId) {
						await deleteJob({ jobId: progressJobId })
					}
					setProgressJobId(null)
					setIsProgressModalOpen(false)
				}}
				title="Collapsing History"
				description="Breaking your chat history into chapters and creating summaries"
			/>
		</>
	)
}
