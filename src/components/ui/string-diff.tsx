import type React from "react"
import { useMemo } from "react"

type DiffPart = {
	type: "added" | "removed" | "unchanged"
	value: string
}

/**
 * Simple word-based diff algorithm
 * Splits by words and compares them to find additions and removals
 */
function computeDiff(oldText: string, newText: string): DiffPart[] {
	if (oldText === newText) {
		return [{ type: "unchanged", value: oldText }]
	}

	// Split by words while preserving whitespace
	const oldWords = oldText.split(/(\s+)/)
	const newWords = newText.split(/(\s+)/)

	const result: DiffPart[] = []
	let oldIndex = 0
	let newIndex = 0

	while (oldIndex < oldWords.length || newIndex < newWords.length) {
		const oldWord = oldWords[oldIndex]
		const newWord = newWords[newIndex]

		if (oldIndex >= oldWords.length) {
			// Only new words left
			result.push({ type: "added", value: newWord })
			newIndex++
		} else if (newIndex >= newWords.length) {
			// Only old words left
			result.push({ type: "removed", value: oldWord })
			oldIndex++
		} else if (oldWord === newWord) {
			// Words match
			result.push({ type: "unchanged", value: oldWord })
			oldIndex++
			newIndex++
		} else {
			// Check if newWord appears later in oldWords
			const newWordIndexInOld = oldWords
				.slice(oldIndex)
				.findIndex((w) => w === newWord)

			// Check if oldWord appears later in newWords
			const oldWordIndexInNew = newWords
				.slice(newIndex)
				.findIndex((w) => w === oldWord)

			if (newWordIndexInOld === -1 && oldWordIndexInNew === -1) {
				// Neither word found in the other sequence - assume replacement
				result.push({ type: "removed", value: oldWord })
				result.push({ type: "added", value: newWord })
				oldIndex++
				newIndex++
			} else if (
				newWordIndexInOld === -1 ||
				(oldWordIndexInNew !== -1 && oldWordIndexInNew < newWordIndexInOld)
			) {
				// newWord is not in old, or oldWord appears sooner in new
				result.push({ type: "added", value: newWord })
				newIndex++
			} else {
				// oldWord is not in new, or newWord appears sooner in old
				result.push({ type: "removed", value: oldWord })
				oldIndex++
			}
		}
	}

	return result
}

type Props = {
	oldText: string
	newText: string
	className?: string
	mode?: "inline" | "side-by-side"
}

export const StringDiff: React.FC<Props> = ({
	oldText,
	newText,
	className,
	mode = "inline",
}) => {
	const diffParts = useMemo(
		() => computeDiff(oldText, newText),
		[oldText, newText],
	)

	if (oldText === newText) {
		return <div className={className}>{newText}</div>
	}

	// Side-by-side mode: show old and new text separately
	if (mode === "side-by-side") {
		return (
			<div className={className}>
				<div className="space-y-3">
					<div className="border border-red-200 bg-red-50 rounded-md p-3">
						<div className="text-xs font-medium text-red-700 mb-1">Previous:</div>
						<div className="text-sm text-red-900 whitespace-pre-wrap">{oldText}</div>
					</div>
					<div className="border border-green-200 bg-green-50 rounded-md p-3">
						<div className="text-xs font-medium text-green-700 mb-1">Updated:</div>
						<div className="text-sm text-green-900 whitespace-pre-wrap">{newText}</div>
					</div>
				</div>
			</div>
		)
	}

	// Inline mode: show word-based diff
	return (
		<div className={className}>
			{diffParts.map((part, index) => {
				if (part.type === "removed") {
					return (
						<span
							key={index}
							className="bg-red-100 text-red-800 line-through"
						>
							{part.value}
						</span>
					)
				}
				if (part.type === "added") {
					return (
						<span key={index} className="bg-green-100 text-green-800">
							{part.value}
						</span>
					)
				}
				return <span key={index}>{part.value}</span>
			})}
		</div>
	)
}
