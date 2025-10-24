import { create } from "jsondiffpatch"
import { UserCog } from "lucide-react"
import type React from "react"
import { useMemo } from "react"
import { ToolCallContainer } from "./ToolCallContainer"

const jsondiff = create({
	objectHash: (obj: object) => {
		// biome-ignore lint/suspicious/noExplicitAny: Need to check for optional properties
		return (obj as any)?._id || (obj as any)?.id || JSON.stringify(obj)
	},
})

type Props = {
	parameters: {
		name: string
		description: string
		data: Record<string, unknown>
	}
	result?: {
		message: string
		oldData: Record<string, unknown>
		newData: Record<string, unknown>
	}
	className?: string
}

// Simplified diff renderer
const renderDiff = (delta: unknown, key?: string): React.JSX.Element[] => {
	if (!delta || typeof delta !== "object") {
		return []
	}

	const elements: React.JSX.Element[] = []
	const uniqueKey = key ? `${key}-` : ""

	// Handle array changes
	// biome-ignore lint/suspicious/noExplicitAny: Delta structure is complex
	if ((delta as any)._t === "a") {
		// Array modifications
		for (const [k, v] of Object.entries(delta)) {
			if (k === "_t") continue
			const idx = k.replace("_", "")
			if (Array.isArray(v)) {
				if (v.length === 1) {
					// Added
					elements.push(
						<div key={`${uniqueKey}arr-${idx}`} className="ml-2">
							<span className="text-gray-600">[{idx}]</span>{" "}
							<span className="bg-green-100 text-green-800 px-1 rounded">
								+ {JSON.stringify(v[0])}
							</span>
						</div>,
					)
				} else if (v.length === 3 && v[2] === 0) {
					// Deleted
					elements.push(
						<div key={`${uniqueKey}arr-${idx}`} className="ml-2">
							<span className="text-gray-600">[{idx}]</span>{" "}
							<span className="bg-red-100 text-red-800 px-1 rounded">
								- {JSON.stringify(v[0])}
							</span>
						</div>,
					)
				} else if (v.length === 2) {
					// Modified
					elements.push(
						<div key={`${uniqueKey}arr-${idx}`} className="ml-2">
							<span className="text-gray-600">[{idx}]</span>{" "}
							<span className="bg-red-100 text-red-800 px-1 rounded line-through">
								{JSON.stringify(v[0])}
							</span>{" "}
							<span className="bg-green-100 text-green-800 px-1 rounded">
								{JSON.stringify(v[1])}
							</span>
						</div>,
					)
				}
			}
		}
		return elements
	}

	for (const [k, v] of Object.entries(delta)) {
		const keyDisplay = k.replace(/^_/, "")

		if (Array.isArray(v)) {
			if (v.length === 1) {
				// Added
				elements.push(
					<div key={`${uniqueKey}${k}`} className="mb-1">
						<span className="font-medium text-gray-700">{keyDisplay}:</span>{" "}
						<span className="bg-green-100 text-green-800 px-1 rounded">
							+ {JSON.stringify(v[0], null, 2)}
						</span>
					</div>,
				)
			} else if (v.length === 3 && v[2] === 0) {
				// Deleted
				elements.push(
					<div key={`${uniqueKey}${k}`} className="mb-1">
						<span className="font-medium text-gray-700">{keyDisplay}:</span>{" "}
						<span className="bg-red-100 text-red-800 px-1 rounded">
							- {JSON.stringify(v[0], null, 2)}
						</span>
					</div>,
				)
			} else if (v.length === 2) {
				// Modified
				elements.push(
					<div key={`${uniqueKey}${k}`} className="mb-1">
						<span className="font-medium text-gray-700">{keyDisplay}:</span>{" "}
						<span className="bg-red-100 text-red-800 px-1 rounded line-through">
							{JSON.stringify(v[0], null, 2)}
						</span>{" "}
						<span className="bg-green-100 text-green-800 px-1 rounded">
							{JSON.stringify(v[1], null, 2)}
						</span>
					</div>,
				)
			}
		} else if (typeof v === "object" && v !== null) {
			// Nested object changes
			elements.push(
				<div key={`${uniqueKey}${k}`} className="mb-1">
					<span className="font-medium text-gray-700">{keyDisplay}:</span>
					<div className="ml-4 mt-1">{renderDiff(v, `${uniqueKey}${k}`)}</div>
				</div>,
			)
		}
	}

	return elements
}

export const CharacterSheetUpdate: React.FC<Props> = ({
	parameters,
	result,
	className,
}) => {
	const diffElements = useMemo(() => {
		if (!result?.oldData || !result?.newData) {
			return null
		}

		const delta = jsondiff.diff(result.oldData, result.newData)

		if (!delta) {
			return (
				<div className="text-sm text-gray-500 italic">No changes to data</div>
			)
		}

		const elements = renderDiff(delta)

		return elements.length > 0 ? (
			<div className="space-y-1 font-mono text-xs">{elements}</div>
		) : (
			<div className="text-sm text-gray-500 italic">No changes to data</div>
		)
	}, [result?.oldData, result?.newData])

	return (
		<ToolCallContainer
			icon={UserCog}
			title={`Character Sheet Updated: ${parameters.name}`}
			className={className}
		>
			<div className="space-y-3">
				<p className="text-sm">{parameters.description}</p>
				{diffElements && (
					<div className="border-t border-gray-200 pt-3">
						<div className="text-sm font-medium text-gray-700 mb-2">
							Data Changes:
						</div>
						{diffElements}
					</div>
				)}
			</div>
		</ToolCallContainer>
	)
}
