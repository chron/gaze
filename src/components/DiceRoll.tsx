import type { StreamId } from "@convex-dev/persistent-text-streaming"
import { useMutation } from "convex/react"
import { Dices } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { ToolCallContainer } from "./ToolCallContainer"
import { Button } from "./ui/button"

type DiceRollProps = {
	messageId: Id<"messages">
	toolCallIndex: number
	parameters: {
		number: number
		faces: number
		bonus: number
	}
	setStreamId: (streamId: StreamId) => void
	toolResult: NonNullable<Doc<"messages">["toolResults"]>[number] | null
	className?: string
}

export const DiceRoll: React.FC<DiceRollProps> = ({
	messageId,
	toolCallIndex,
	parameters,
	setStreamId,
	toolResult,
	className,
}) => {
	const [isRolling, setIsRolling] = useState(false)
	const performUserDiceRoll = useMutation(api.messages.performUserDiceRoll)

	const handleRoll = async () => {
		if (isRolling) return

		setIsRolling(true)
		try {
			const { streamId } = await performUserDiceRoll({
				messageId,
				toolCallIndex,
			})

			setStreamId(streamId)
		} catch (error) {
			console.error("Failed to roll dice:", error)
		} finally {
			setIsRolling(false)
		}
	}

	const rollText = `${parameters.number}d${parameters.faces}${
		parameters.bonus > 0
			? ` + ${parameters.bonus}`
			: parameters.bonus < 0
				? ` ${parameters.bonus}`
				: ""
	}`

	if (toolResult) {
		return (
			<ToolCallContainer
				icon={Dices}
				title={`Dice Roll: ${rollText} - Completed`}
			/>
		)
	}

	return (
		<ToolCallContainer
			icon={Dices}
			title={`Roll ${rollText}`}
			defaultOpen
			className={className}
		>
			<div className="flex flex-col gap-3">
				<div className="flex flex-wrap gap-2">
					{Array.from({ length: parameters.number }, (_, index) => (
						<button
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							key={`dice-${messageId}-${index}`}
							type="button"
							className={`w-12 h-12 bg-white rounded-lg border-2 border-orange-300 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-orange-50 hover:border-orange-400 disabled:opacity-50 ${
								isRolling ? "animate-pulse" : ""
							}`}
							onClick={handleRoll}
							disabled={isRolling}
						>
							<span className="text-2xl select-none">
								{isRolling ? "🎯" : "?"}
							</span>
						</button>
					))}
				</div>
				<Button
					onClick={handleRoll}
					disabled={isRolling}
					className="bg-blue-800 hover:bg-blue-700 text-white font-sans w-full"
				>
					{isRolling ? "Rolling..." : "Roll the Dice!"}
				</Button>
			</div>
		</ToolCallContainer>
	)
}
