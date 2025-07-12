import { useMutation } from "convex/react"
import { RefreshCcwIcon } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { cn } from "../lib/utils"
import { CharacterIntroduction } from "./CharacterIntroduction"
import { CharacterSheetUpdate } from "./CharacterSheetUpdate"
import { DiceRoll } from "./DiceRoll"
import { Button } from "./ui/button"

type Props = {
	message: Doc<"messages">
	isLastMessage: boolean
}

export const Message: React.FC<Props> = ({ message, isLastMessage }) => {
	const regenerateLastMessageMutation = useMutation(
		api.messages.regenerateLastMessage,
	)

	return (
		<div
			className={cn(
				"flex flex-col gap-2 p-2 rounded-md max-w-[80%]",
				message.role === "user"
					? "self-end bg-blue-100 text-blue-800"
					: "self-start bg-gray-100 text-gray-800",
			)}
		>
			{message.content.length === 1 &&
			message.content[0].type === "text" &&
			message.content[0].text.trim().length === 0 ? (
				<div className="flex flex-col gap-2 font-serif">
					<p>...</p>
				</div>
			) : (
				<div className="flex flex-col gap-2 font-serif relative group">
					{message.content.map((block, index) => {
						if (block.type === "text") {
							return (
								<ReactMarkdown
									key={`${message._id}-text-${index}`}
									remarkPlugins={[remarkGfm]}
								>
									{block.text}
								</ReactMarkdown>
							)
						}

						if (block.type === "tool_call") {
							if (block.toolName === "change_scene") {
								return (
									<SceneChange
										key={`${message._id}-scene-${index}`}
										description={block.parameters.description}
										backgroundColor={block.parameters.backgroundColor}
									/>
								)
							}

							if (block.toolName === "roll_dice") {
								return (
									<DiceRoll
										key={`${message._id}-dice-${index}`}
										messageId={message._id}
										toolCallIndex={index}
										parameters={block.parameters}
										result={block.result}
									/>
								)
							}

							if (block.toolName === "update_character_sheet") {
								return (
									<CharacterSheetUpdate
										key={`${message._id}-character-sheet-${block.toolName}`}
										parameters={block.parameters}
									/>
								)
							}

							if (block.toolName === "introduce_character") {
								return (
									<CharacterIntroduction
										key={`${message._id}-character-introduction-${block.toolName}`}
										parameters={block.parameters}
									/>
								)
							}
						}

						return null
					})}

					{isLastMessage && (
						<Button
							className="hidden group-hover:block absolute bottom-0 right-0"
							onClick={() => {
								regenerateLastMessageMutation({ messageId: message._id })
							}}
						>
							<RefreshCcwIcon />
						</Button>
					)}
				</div>
			)}
		</div>
	)
}

const SceneChange = ({
	description,
	backgroundColor,
}: {
	description: string
	backgroundColor: string
}) => {
	return (
		<div className="px-4 py-2 rounded-md" style={{ backgroundColor }}>
			<p>{description}</p>
		</div>
	)
}
