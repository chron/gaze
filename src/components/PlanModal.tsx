import { useMutation, useQuery } from "convex/react"
import { Plus } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { cn } from "../lib/utils"
import { MessageMarkdown } from "./MessageMarkdown"
import { AutoResizeTextarea } from "./ui/auto-resize-textarea"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"

type Props = {
	campaignId: Id<"campaigns">
	onClose: () => void
}

export const PlanModal: React.FC<Props> = ({ campaignId, onClose }) => {
	const [editingPart, setEditingPart] = useState<string | null>(null)
	const [editingText, setEditingText] = useState("")
	const [isSaving, setIsSaving] = useState(false)
	const [isCreatingNew, setIsCreatingNew] = useState(false)
	const [newPartName, setNewPartName] = useState("")
	const [newPartText, setNewPartText] = useState("")

	const updatePlan = useMutation(api.campaigns.updatePlan)

	const campaign = useQuery(api.campaigns.get, {
		id: campaignId as Id<"campaigns">,
	})

	const plans = Object.entries(campaign?.plan ?? {})

	const handleCreateNewPart = async () => {
		if (!newPartName.trim() || !newPartText.trim()) return

		setIsSaving(true)
		await updatePlan({
			campaignId,
			plan: newPartText,
			part: newPartName.trim(),
		})
		setIsSaving(false)
		setIsCreatingNew(false)
		setNewPartName("")
		setNewPartText("")
	}

	return (
		<Dialog open={true} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-2xl max-h-[80dvh] overflow-y-auto">
				<DialogTitle>Plan</DialogTitle>

				<div className="flex flex-col gap-2">
					{plans.map(([part, plan]) => (
						<div
							key={part}
							className="flex flex-col gap-2 bg-gray-50 p-4  rounded-lg"
						>
							<h3 className="text-lg font-bold">{part}</h3>
							<div
								className={cn("min-h-[100px]", isSaving && "animate-pulse")}
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

					{isCreatingNew ? (
						<div className="flex flex-col gap-2 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
							<Input
								placeholder="Part name (e.g., 'player_requests', 'cool_secret_info')"
								value={newPartName}
								onChange={(e) => setNewPartName(e.target.value)}
								autoFocus
								onKeyDown={(e) => {
									if (e.key === "Escape") {
										setIsCreatingNew(false)
										setNewPartName("")
										setNewPartText("")
									}
								}}
							/>
							<AutoResizeTextarea
								placeholder="Describe this part of the plan..."
								value={newPartText}
								onChange={(e) => setNewPartText(e.target.value)}
								onSave={handleCreateNewPart}
								onCancel={() => {
									setIsCreatingNew(false)
									setNewPartName("")
									setNewPartText("")
								}}
								disabled={!newPartName.trim()}
							/>
						</div>
					) : (
						<Button
							variant="outline"
							className="w-full border-dashed"
							onClick={() => setIsCreatingNew(true)}
							disabled={isSaving}
						>
							<Plus className="h-4 w-4 mr-2" />
							Add New Part
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
