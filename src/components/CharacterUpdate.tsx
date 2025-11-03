import { UserPen } from "lucide-react"
import type React from "react"
import { ToolCallContainer } from "./ToolCallContainer"
import { StringDiff } from "./ui/string-diff"

type Props = {
	parameters: {
		name: string
		description?: string
		notes?: string
	}
	result?: {
		message: string
		oldDescription?: string
		newDescription?: string
		oldNotes?: string
		newNotes?: string
	}
	className?: string
}

export const CharacterUpdate: React.FC<Props> = ({ parameters, result, className }) => {
	const showDescriptionDiff =
		result?.oldDescription &&
		result?.newDescription &&
		result.oldDescription !== result.newDescription

	const showNotesDiff =
		result?.oldNotes &&
		result?.newNotes &&
		result.oldNotes !== result.newNotes

	return (
		<ToolCallContainer
			icon={UserPen}
			title={`Updated character: ${parameters.name}`}
			className={className}
		>
			<div className="text-sm space-y-3">
				{parameters.description && (
					<div>
						<span className="font-medium">Description:</span>
						{showDescriptionDiff ? (
							<div className="mt-1">
								<StringDiff
									oldText={result.oldDescription}
									newText={result.newDescription}
									mode="side-by-side"
								/>
							</div>
						) : (
							<div className="mt-1">{parameters.description}</div>
						)}
					</div>
				)}
				{parameters.notes && (
					<div>
						<span className="font-medium">Notes:</span>
						{showNotesDiff ? (
							<div className="mt-1">
								<StringDiff
									oldText={result.oldNotes || ""}
									newText={result.newNotes || ""}
									mode="side-by-side"
								/>
							</div>
						) : (
							<div className="mt-1">{parameters.notes}</div>
						)}
					</div>
				)}
			</div>
		</ToolCallContainer>
	)
}
