import { useParams } from "@tanstack/react-router"
import { useAction } from "convex/react"
import { BookText, Command } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { MessageMarkdown } from "./MessageMarkdown"
import { Button } from "./ui/button"
import { Dialog, DialogContent } from "./ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu"

export const ChatExtraActions: React.FC = () => {
	const { campaignId } = useParams({ from: "/campaigns/$campaignId" })
	const [summary, setSummary] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const summarizeChatHistory = useAction(api.messages.summarizeChatHistory)

	return (
		<>
			{summary ? (
				<Dialog open={!!summary} onOpenChange={(v) => !v && setSummary(null)}>
					<DialogContent className="sm:max-w-2xl">
						<MessageMarkdown>{summary}</MessageMarkdown>
					</DialogContent>
				</Dialog>
			) : null}

			<DropdownMenu>
				<DropdownMenuTrigger disabled={isLoading}>
					<Button variant="outline" isLoading={isLoading}>
						<Command />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						onClick={async () => {
							setIsLoading(true)
							try {
								const summary = await summarizeChatHistory({
									campaignId: campaignId as Id<"campaigns">,
								})
								setSummary(summary)
							} finally {
								setIsLoading(false)
							}
						}}
					>
						<BookText />
						Summarise
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	)
}
