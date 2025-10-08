import type { StreamId } from "@convex-dev/persistent-text-streaming"
import { useMutation } from "convex/react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
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
}

export const DiceRoll: React.FC<DiceRollProps> = ({
	messageId,
	toolCallIndex,
	parameters,
	setStreamId,
	toolResult,
}) => {
	const [isRolling, setIsRolling] = useState(false)
	const performUserDiceRoll = useMutation(api.messages.performUserDiceRoll)

	if (toolResult) {
		return (
			<div className="rounded-md border border-gray-200 bg-teal-600 text-white p-2">
				Roll completed
			</div>
		)
	}

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

	return (
		<div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
			<div className="flex items-center gap-2 mb-3">
				<span className="font-semibold text-gray-700">
					Roll {parameters.number}d{parameters.faces}{" "}
					{parameters.bonus > 0
						? `+ ${parameters.bonus}`
						: parameters.bonus < 0
							? parameters.bonus
							: ""}
				</span>
			</div>
			<div className="flex flex-wrap gap-2 mb-3">
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
				className="bg-blue-800 hover:bg-blue-700 text-white font-sans"
			>
				{isRolling ? "Rolling..." : "Roll the Dice!"}
			</Button>
		</div>
	)
}
