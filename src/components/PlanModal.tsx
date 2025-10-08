import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { cn } from "../lib/utils"
import { MessageMarkdown } from "./MessageMarkdown"
import { AutoResizeTextarea } from "./ui/auto-resize-textarea"
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog"

type Props = {
	campaignId: Id<"campaigns">
	onClose: () => void
}

export const PlanModal: React.FC<Props> = ({ campaignId, onClose }) => {
	const [editingPart, setEditingPart] = useState<string | null>(null)
	const [editingText, setEditingText] = useState("")
	const [isSaving, setIsSaving] = useState(false)

	const updatePlan = useMutation(api.campaigns.updatePlan)

	const campaign = useQuery(api.campaigns.get, {
		id: campaignId as Id<"campaigns">,
	})

	const plans =
		typeof campaign?.plan === "string"
			? [["overall_story", campaign?.plan]]
			: Object.entries(campaign?.plan ?? {})
	return (
		<Dialog open={true} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-2xl max-h-[80dvh] overflow-y-auto">
				<DialogTitle>Plan</DialogTitle>

				<div className="flex flex-col gap-2">
					{plans.map(([part, plan]) => (
						<div
							key={part}
							className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg"
						>
							<h3 className="text-lg font-bold">{part}</h3>
							<div
								className={cn(isSaving && "animate-pulse")}
								onDoubleClick={() => {
									if (editingPart !== part) {
										setEditingPart(part)
										setEditingText(plan)
									}
								}}
							>
								{editingPart === part ? (
									<AutoResizeTextarea
										autoFocus
										value={editingText}
										onChange={(e) => setEditingText(e.target.value)}
										onSave={async (text) => {
											setIsSaving(true)
											await updatePlan({
												campaignId,
												plan: text,
												part,
											})
											setIsSaving(false)
											setEditingPart(null)
										}}
										onCancel={() => setEditingPart(null)}
									/>
								) : (
									<MessageMarkdown>{plan}</MessageMarkdown>
								)}
							</div>
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
