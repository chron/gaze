import { AlertCircle } from "lucide-react"
import type React from "react"
import { ToolCallContainer } from "./ToolCallContainer"

type Props = {
	toolName: string
	parameters: unknown
	toolResult: {
		type: "tool-result"
		toolCallId: string
		toolName: string
		result: unknown
	} | null
	className?: string
}

export const UnknownToolCall: React.FC<Props> = ({
	toolName,
	parameters,
	toolResult,
	className,
}) => {
	const hasError =
		toolResult?.result &&
		typeof toolResult.result === "object" &&
		"error" in toolResult.result

	const errorMessage = hasError
		? String((toolResult.result as { error: string }).error)
		: null

	return (
		<ToolCallContainer
			icon={AlertCircle}
			title={`Unknown tool call: ${toolName}`}
			className={className}
		>
			{errorMessage && (
				<div className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-100">
					{errorMessage}
				</div>
			)}
			<pre className="text-xs whitespace-pre-wrap bg-red-50 p-2 rounded border border-red-100">
				{JSON.stringify(parameters, null, 2)}
			</pre>
		</ToolCallContainer>
	)
}
