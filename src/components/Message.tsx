import { useMutation } from "convex/react"
import { Brain, RefreshCcwIcon } from "lucide-react"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { cn } from "../lib/utils"
import { CharacterIntroduction } from "./CharacterIntroduction"
import { CharacterSheetUpdate } from "./CharacterSheetUpdate"
import { DiceRoll } from "./DiceRoll"
import { MessageMarkdown } from "./MessageMarkdown"
import { Button } from "./ui/button"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible"

type Props = {
	message: Doc<"messages">
	isLastMessage: boolean
}

export const Message: React.FC<Props> = ({ message, isLastMessage }) => {
	const regenerateLastMessageMutation = useMutation(
		api.messages.regenerateLastMessage,
	)

	const noTextContent =
		message.content.length === 0 ||
		(message.content.length === 1 &&
			message.content[0].type === "text" &&
			message.content[0].text.trim().length === 0)

	return (
		<div
			className={cn(
				"flex flex-col gap-2 p-2 rounded-md max-w-[80%]",
				message.role === "user"
					? "self-end bg-blue-100 text-blue-800"
					: "self-start bg-gray-100 text-gray-800",
			)}
		>
			{!message.reasoning && noTextContent ? (
				<div className="flex flex-col gap-2 font-serif">
					<p className="animate-pulse text-xl">...</p>
				</div>
			) : (
				<div className="flex flex-col font-serif relative group">
					{message.reasoning && (
						<Collapsible defaultOpen={noTextContent}>
							<CollapsibleTrigger>
								<Button variant="outline" size="sm" className="mb-2">
									<Brain /> Reasoning
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<div className="p-4 rounded-md bg-gray-200 text-gray-800 mb-4">
									<MessageMarkdown>{message.reasoning}</MessageMarkdown>
								</div>
							</CollapsibleContent>
						</Collapsible>
					)}

					{message.content.map((block, index) => {
						if (block.type === "text") {
							return (
								<MessageMarkdown key={`${message._id}-text-${index}`}>
									{block.text}
								</MessageMarkdown>
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

							if (block.toolName === "request_dice_roll") {
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
}: {
	description: string
	backgroundColor: string
}) => {
	return (
		<div className="px-4 py-2 rounded-md bg-blue-800 text-white mt-2 mb-4">
			<p>{description}</p>
		</div>
	)
}
