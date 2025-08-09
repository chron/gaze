import { useParams } from "@tanstack/react-router"
import { useAction, useMutation, useQuery } from "convex/react"
import {
	BetweenHorizontalStart,
	BookText,
	Brain,
	Command,
	Trash,
} from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { MessageMarkdown } from "./MessageMarkdown"
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
	const collapseHistory = useAction(api.summaries.collapseHistory)
	const summarizeChatHistory = useAction(api.messages.summarizeChatHistory)
	const chatWithHistory = useAction(api.messages.chatWithHistory)

	const updatePlan = useMutation(api.campaigns.updatePlan)

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

					<DropdownMenuItem
						onClick={async () => {
							await collapseHistory({
								campaignId: campaignId as Id<"campaigns">,
							})
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
							<DropdownMenuItem
								onClick={async () => {
									setResult(campaign.plan ?? null)
								}}
							>
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
		</>
	)
}
