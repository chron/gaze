import { cn } from "../lib/utils"
import type { Message as MessageType } from "../types"

type Props = {
	message: MessageType
}

export const Message: React.FC<Props> = ({ message }) => {
	const content =
		typeof message.content === "string"
			? message.content
			: message.content
					.map((block) =>
						block.type === "text" ? block.text : `<<${block.type}>>`,
					)
					.join("")

	return (
		<div
			className={cn(
				"flex flex-col gap-2 p-2 rounded-md",
				message.role === "user"
					? "self-end bg-blue-100 text-blue-800"
					: "self-start bg-gray-100 text-gray-800",
			)}
		>
			<div className="flex flex-col gap-2">{content}</div>
		</div>
	)
}
