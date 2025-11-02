import { useState } from "react"
import { Button } from "./ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

interface FindAndReplaceModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (oldText: string, newText: string) => Promise<void>
}

export const FindAndReplaceModal: React.FC<FindAndReplaceModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
}) => {
	const [oldText, setOldText] = useState("")
	const [newText, setNewText] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!oldText || !newText) return

		setIsSubmitting(true)
		try {
			await onSubmit(oldText, newText)
			setOldText("")
			setNewText("")
			onClose()
		} catch (error) {
			console.error("Find and replace failed:", error)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Find and Replace</DialogTitle>
					<DialogDescription>
						Replace text in the most recent message, tool results, active
						characters, and character names.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="oldText">Find</Label>
							<Input
								id="oldText"
								value={oldText}
								onChange={(e) => setOldText(e.target.value)}
								placeholder="Text to find"
								autoFocus
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="newText">Replace with</Label>
							<Input
								id="newText"
								value={newText}
								onChange={(e) => setNewText(e.target.value)}
								placeholder="New text"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={!oldText || !newText || isSubmitting}
							isLoading={isSubmitting}
						>
							Replace
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
