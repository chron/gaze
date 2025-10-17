import { useMutation } from "convex/react"
import { Type } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { ToolCallContainer } from "./ToolCallContainer"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"

type ChooseNameProps = {
	messageId: Id<"messages">
	toolCallIndex: number
	parameters: {
		description: string
		suggestedNames: string[]
	}
	toolResult: NonNullable<Doc<"messages">["toolResults"]>[number] | null
}

export const ChooseName: React.FC<ChooseNameProps> = ({
	messageId,
	toolCallIndex,
	parameters,
	toolResult,
}) => {
	const [isPending, setIsPending] = useState(false)
	const [chosenName, setChosenName] = useState<string>("")
	const [otherDetails, setOtherDetails] = useState<string>("")
	const performUserChooseName = useMutation(api.messages.performUserChooseName)

	const handleChooseName = async (name: string) => {
		if (isPending) return

		setIsPending(true)
		try {
			await performUserChooseName({
				messageId,
				toolCallIndex,
				chosenName: name,
				otherDetails,
			})
		} catch (error) {
			console.error("Failed to choose name:", error)
		} finally {
			setIsPending(false)
		}
	}

	if (toolResult) {
		return (
			<ToolCallContainer
				icon={Type}
				title={`Name chosen: ${toolResult.result.name}`}
			>
				{toolResult.result.otherDetails && (
					<p className="text-sm">{toolResult.result.otherDetails}</p>
				)}
			</ToolCallContainer>
		)
	}

	return (
		<ToolCallContainer icon={Type} title={parameters.description} defaultOpen>
			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2">
					<Input
						value={chosenName}
						onChange={(e) => setChosenName(e.target.value)}
						placeholder="Enter custom name"
					/>
					<Button
						onClick={() => handleChooseName(chosenName)}
						disabled={isPending}
					>
						Choose
					</Button>
				</div>

				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium text-gray-700">
						Other details (optional):
					</span>
					<Textarea
						value={otherDetails}
						onChange={(e) => setOtherDetails(e.target.value)}
						placeholder="Additional information..."
					/>
				</div>

				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium text-gray-700">
						Suggested names:
					</span>
					<div className="flex flex-wrap gap-2">
						{parameters.suggestedNames.map((name) => (
							<Button
								key={`name-${messageId}-${name}`}
								onClick={() => handleChooseName(name)}
								disabled={isPending}
								variant="outline"
							>
								{name}
							</Button>
						))}
					</div>
				</div>
			</div>
		</ToolCallContainer>
	)
}
