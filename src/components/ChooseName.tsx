import type { StreamId } from "@convex-dev/persistent-text-streaming"
import { useMutation } from "convex/react"
import { useMemo, useState } from "react"
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
	setStreamId: (streamId: StreamId) => void
	followupToolResult: Doc<"messages"> | null
}

export const ChooseName: React.FC<ChooseNameProps> = ({
	messageId,
	toolCallIndex,
	parameters,
	setStreamId,
	followupToolResult,
}) => {
	const [isPending, setIsPending] = useState(false)
	const [chosenName, setChosenName] = useState<string>("")
	const [otherDetails, setOtherDetails] = useState<string>("")
	const performUserChooseName = useMutation(api.messages.performUserChooseName)

	const result = useMemo(() => {
		const maybeFromOriginal = (
			followupToolResult as unknown as Doc<"messages"> | null
		)?.toolResults?.find((tr) => tr.toolName === "choose_name") as
			| {
					type: "tool-result"
					toolCallId: string
					toolName: string
					result: { name: string; otherDetails?: string }
			  }
			| undefined

		if (maybeFromOriginal) return maybeFromOriginal.result

		if (
			followupToolResult?.content?.[0]?.type === "tool-result" &&
			followupToolResult.content[0].toolName === "choose_name"
		) {
			return followupToolResult.content[0].result as {
				name: string
				otherDetails?: string
			}
		}

		return undefined
	}, [followupToolResult])

	if (result) {
		return (
			<div className="rounded-md border border-gray-200 bg-teal-600 text-white p-2">
				Name chosen: {result.name}
			</div>
		)
	}

	const handleChooseName = async (name: string) => {
		if (isPending) return

		console.log(toolCallIndex)

		setIsPending(true)
		try {
			const { streamId } = await performUserChooseName({
				messageId,
				toolCallIndex,
				chosenName: name,
				otherDetails,
			})

			setStreamId(streamId)
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
