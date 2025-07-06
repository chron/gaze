import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Doc } from "../../convex/_generated/dataModel"
import { cn } from "../lib/utils"

type Props = {
	message: Doc<"messages">
}

export const Message: React.FC<Props> = ({ message }) => {
	return (
		<div
			className={cn(
				"flex flex-col gap-2 p-2 rounded-md max-w-[80%]",
				message.role === "user"
					? "self-end bg-blue-100 text-blue-800"
					: "self-start bg-gray-100 text-gray-800",
			)}
		>
			<div className="flex flex-col gap-2">
				<ReactMarkdown remarkPlugins={[remarkGfm]}>
					{message.content}
				</ReactMarkdown>
			</div>
		</div>
	)
}

// const blockToText = (block: ContentBlockParam | ContentBlock) => {
// 	if (block.type === "text") {
// 		return block.text
// 	}

// 	if (block.type === "tool_use") {
// 		if (block.name === "roll_dice") {
// 			const toolArgs = block.input as { number: number; faces: number }
// 			return `[Roll ${toolArgs.number}d${toolArgs.faces}]`
// 		}
// 	}

// 	if (block.type === "tool_result") {
// 		return block.content
// 	}

// 	return JSON.stringify(block, null, 2)
// }
