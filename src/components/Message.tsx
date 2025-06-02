import type { Message } from "@anthropic-ai/sdk/resources"
import { cn } from "../lib/utils"
import type { Message as MessageType } from "../types"

type Props = {
	message: MessageType
}

export const Message: React.FC<Props> = ({ message }) => {
	const content =
		typeof message.content === "string"
			? message.content
			: message.content.map((block) => blockToText(block)).join("")

	return (
		<div
			className={cn(
				"flex flex-col gap-2 p-2 rounded-md max-w-[80%]",
				message.role === "user"
					? "self-end bg-blue-100 text-blue-800"
					: "self-start bg-gray-100 text-gray-800",
			)}
		>
			<div className="flex flex-col gap-2 whitespace-pre-wrap">{content}</div>
		</div>
	)
}

const blockToText = (block: Message["content"][number]) => {
	if (block.type === "text") {
		return block.text
	}

	if (block.type === "tool_use") {
		if (block.name === "roll_dice") {
			const toolArgs = block.input as { number: number; faces: number }
			return `[Roll ${toolArgs.number}d${toolArgs.faces}]`
		}
	}

	if (block.type === "tool_result") {
		return block.content
	}

	return JSON.stringify(block, null, 2)
}
