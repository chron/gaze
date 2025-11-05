import { AlertCircle, Shirt } from "lucide-react"
import type React from "react"
import { ToolCallContainer } from "./ToolCallContainer"
import { Badge } from "./ui/badge"

type Props = {
	parameters: {
		characterName: string
		outfitName: string
		outfitDescription: string
	}
	result?:
		| {
				success: true
				message: string
				isNew: boolean
				characterName: string
				outfitName: string
				outfitDescription: string
		  }
		| {
				error: string
				characterName?: string
				outfitName?: string
				outfitDescription?: string
		  }
	isNew?: boolean
	className?: string
}

export const CharacterOutfitUpdate: React.FC<Props> = ({
	parameters,
	result,
	isNew,
	className,
}) => {
	const hasError = result && "error" in result
	const errorMessage = hasError ? result.error : null

	// Check if parameters are missing or invalid
	const hasMissingParams =
		!parameters.characterName ||
		!parameters.outfitName ||
		!parameters.outfitDescription ||
		parameters.characterName === "undefined" ||
		parameters.outfitName === "undefined" ||
		parameters.outfitDescription === "undefined"

	// Treat missing parameters as an error
	const effectiveError = hasError || hasMissingParams
	const effectiveErrorMessage = errorMessage
		? errorMessage
		: hasMissingParams
			? "Invalid tool call: missing or undefined parameters. The LLM may have used incorrect parameter names."
			: null

	// Determine if this is a new outfit from either the result or the legacy isNew prop
	const isNewOutfit =
		result && "isNew" in result ? result.isNew : (isNew ?? false)

	// Use the result message if available, otherwise construct one
	const successMessage =
		result && "message" in result
			? result.message
			: `${parameters.characterName || "Unknown"} changed into the "${parameters.outfitName || "unknown"}" outfit`

	return (
		<ToolCallContainer
			icon={effectiveError ? AlertCircle : Shirt}
			title={
				<div className="flex items-center gap-2">
					<span>
						{effectiveError ? "Failed to change outfit" : successMessage}
					</span>
					{isNewOutfit && !effectiveError && <Badge>NEW</Badge>}
					{effectiveError && <Badge variant="destructive">ERROR</Badge>}
				</div>
			}
			className={className}
		>
			<div className="text-sm space-y-3">
				{effectiveErrorMessage && (
					<div className="text-red-600 bg-red-50 p-3 rounded border border-red-100">
						<strong className="block mb-1">Error:</strong>
						{effectiveErrorMessage}
					</div>
				)}

				<div className="space-y-2">
					<div>
						<span className="font-medium text-gray-700">Character:</span>{" "}
						<span
							className={
								!parameters.characterName ||
								parameters.characterName === "undefined"
									? "text-red-600 font-mono"
									: "text-gray-900"
							}
						>
							{parameters.characterName || "(missing)"}
						</span>
					</div>
					<div>
						<span className="font-medium text-gray-700">Outfit Name:</span>{" "}
						<span
							className={
								!parameters.outfitName || parameters.outfitName === "undefined"
									? "text-red-600 font-mono"
									: "text-gray-900"
							}
						>
							{parameters.outfitName || "(missing)"}
						</span>
					</div>
					<div>
						<span className="font-medium text-gray-700">Description:</span>
						<p
							className={
								!parameters.outfitDescription ||
								parameters.outfitDescription === "undefined"
									? "text-red-600 font-mono mt-1"
									: "text-gray-700 mt-1"
							}
						>
							{parameters.outfitDescription || "(missing)"}
						</p>
					</div>
				</div>

				{effectiveError && (
					<details className="mt-3">
						<summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
							Show full tool call details
						</summary>
						<pre className="mt-2 text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto">
							{JSON.stringify(
								{
									parameters,
									result,
								},
								null,
								2,
							)}
						</pre>
					</details>
				)}
			</div>
		</ToolCallContainer>
	)
}
