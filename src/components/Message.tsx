import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Doc } from "../../convex/_generated/dataModel"
import { cn } from "../lib/utils"

type Props = {
	message: Doc<"messages">
}

export const Message: React.FC<Props> = ({ message }) => {
	if (message.content === "") return null

	return (
		<div
			className={cn(
				"flex flex-col gap-2 p-2 rounded-md max-w-[80%]",
				message.role === "user"
					? "self-end bg-blue-100 text-blue-800"
					: "self-start bg-gray-100 text-gray-800",
			)}
		>
			<div className="flex flex-col gap-2 font-serif">
				<ReactMarkdown remarkPlugins={[remarkGfm]}>
					{message.content}
				</ReactMarkdown>
			</div>
		</div>
	)
}
