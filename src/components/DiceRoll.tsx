import { useMutation } from "convex/react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Button } from "./ui/button"

type DiceRollProps = {
	messageId: Id<"messages">
	toolCallIndex: number
	parameters: {
		number: number
		faces: number
	}
	result: {
		results: number[]
		total: number
	} | null
}

export const DiceRoll: React.FC<DiceRollProps> = ({
	messageId,
	toolCallIndex,
	parameters,
	result,
}) => {
	const [isRolling, setIsRolling] = useState(false)
	const performUserDiceRoll = useMutation(api.messages.performUserDiceRoll)

	const handleRoll = async () => {
		if (result !== null || isRolling) return

		setIsRolling(true)
		try {
			await performUserDiceRoll({
				messageId,
				toolCallIndex,
			})
		} catch (error) {
			console.error("Failed to roll dice:", error)
		} finally {
			setIsRolling(false)
		}
	}

	if (result !== null) {
		// Show completed dice roll
		return (
			<div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
				<div className="flex items-center gap-2 mb-2">
					<span className="font-semibold text-gray-700">
						Roll {parameters.number}d{parameters.faces}
					</span>
				</div>
				<div className="flex flex-wrap items-center gap-2 mb-2">
					<span className="text-sm text-gray-600">Rolls:</span>
					{result.results.map((roll, index) => (
						<span
							key={`roll-${index}-${roll}`}
							className="inline-flex items-center justify-center w-8 h-8 bg-white rounded border-2 border-gray-300 font-bold text-gray-800"
						>
							{roll}
						</span>
					))}
				</div>
				<div className="text-xl font-bold text-green-700">
					Total: {result.total}
				</div>
			</div>
		)
	}

	// Show pending dice roll (clickable)
	return (
		<div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
			<div className="flex items-center gap-2 mb-3">
				<span className="font-semibold text-gray-700">
					Roll {parameters.number}d{parameters.faces}
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
				className="w-full bg-orange-500 hover:bg-orange-600 text-white"
			>
				{isRolling ? "Rolling..." : "Roll the Dice!"}
			</Button>
		</div>
	)
}
