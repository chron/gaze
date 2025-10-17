import { AlertCircle } from "lucide-react"
import type React from "react"
import { ToolCallContainer } from "./ToolCallContainer"

type Props = {
	toolName: string
	parameters: unknown
	className?: string
}

export const UnknownToolCall: React.FC<Props> = ({
	toolName,
	parameters,
	className,
}) => {
	return (
		<ToolCallContainer
			icon={AlertCircle}
			title={`Unknown tool call: ${toolName}`}
			className={className}
		>
			<pre className="text-xs whitespace-pre-wrap bg-white p-2 rounded border border-red-100">
				{JSON.stringify(parameters, null, 2)}
			</pre>
		</ToolCallContainer>
	)
}
