import { AlertCircle } from "lucide-react"
import type React from "react"

type Props = {
	toolName: string
	parameters: unknown
}

export const UnknownToolCall: React.FC<Props> = ({ toolName, parameters }) => {
	return (
		<div className="flex flex-col p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
			<div className="flex items-center gap-2">
				<AlertCircle className="h-4 w-4" />
				<span>Unknown tool call: {toolName}</span>
			</div>

			<pre className="text-xs whitespace-pre-wrap">
				{JSON.stringify(parameters, null, 2)}
			</pre>
		</div>
	)
}
