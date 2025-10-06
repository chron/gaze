import { useMutation } from "convex/react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
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

	if (toolResult) {
		return (
			<div className="rounded-md border border-teal-200 bg-teal-50 p-3">
				<div className="flex items-center gap-2">
					<span className="text-teal-700">✓ Name chosen:</span>
					<span className="text-teal-900">{toolResult.result.name}</span>
				</div>
				{toolResult.result.otherDetails && (
					<div className="mt-1 text-sm text-gray-600">
						{toolResult.result.otherDetails}
					</div>
				)}
			</div>
		)
	}

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

	return (
		<div className="p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg border border-teal-200">
			<div className="flex items-center gap-2 mb-3">
				<span className="text-gray-700">{parameters.description}</span>
			</div>

			<div className="flex flex-col gap-2 mb-3">
				<div className="flex items-center gap-2 mb-3">
					<Input
						value={chosenName}
						onChange={(e) => setChosenName(e.target.value)}
					/>

					<Button
						onClick={() => handleChooseName(chosenName)}
						disabled={isPending}
					>
						Choose Name
					</Button>
				</div>

				<div className="flex items-center gap-2 mb-3">
					<span className="text-gray-700 whitespace-nowrap">
						Other details:
					</span>
					<Textarea
						value={otherDetails}
						onChange={(e) => setOtherDetails(e.target.value)}
					/>
				</div>

				<div className="flex flex-wrap gap-2 mb-3">
					<span className="text-gray-700">Suggested names:</span>

					{parameters.suggestedNames.map((name) => (
						<Button
							key={`name-${messageId}-${name}`}
							onClick={() => handleChooseName(name)}
							disabled={isPending}
						>
							{name}
						</Button>
					))}
				</div>
			</div>
		</div>
	)
}
