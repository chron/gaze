import type { StreamId } from "@convex-dev/persistent-text-streaming"
import { useStream } from "@convex-dev/persistent-text-streaming/react"
import { useAction, useMutation } from "convex/react"
import { Brain, RefreshCcwIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { env } from "../../env"
import { cn } from "../lib/utils"
import { CharacterIntroduction } from "./CharacterIntroduction"
import { CharacterSheetUpdate } from "./CharacterSheetUpdate"
import { DiceRoll } from "./DiceRoll"
import { MessageMarkdown } from "./MessageMarkdown"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible"

type Props = {
	message: Doc<"messages">
	isLastMessage: boolean
	setStreamId: (streamId: StreamId) => void
	isStreaming: boolean
}

export const Message: React.FC<Props> = ({
	message,
	isLastMessage,
	setStreamId,
	isStreaming,
}) => {
	const { text, status } = useStream(
		api.messages.getMessageBody,
		new URL(`${env.VITE_CONVEX_HTTP_URL}/message_stream`),
		isStreaming,
		message.streamId as StreamId,
	)

	const [showReasoning, setShowReasoning] = useState(true)
	const regenerateLastMessageMutation = useMutation(
		api.messages.regenerateLastMessage,
	)

	const noTextContent =
		message.content.length === 0 ||
		(message.content.length === 1 &&
			message.content[0].type === "text" &&
			message.content[0].text.trim().length === 0)

	useEffect(() => {
		if (!noTextContent) {
			setShowReasoning(false)
		}
	}, [noTextContent])

	return (
		<div
			className={cn(
				"flex flex-col gap-2 p-2 rounded-md max-w-[80%]",
				message.role === "user"
					? "self-end bg-blue-100 text-blue-800"
					: "self-start bg-gray-100 text-gray-800",
			)}
		>
			{!message.reasoning && noTextContent && !isStreaming ? (
				<div className="flex flex-col gap-2 font-serif">
					<p className="animate-pulse text-xl">...</p>
				</div>
			) : (
				<div className="flex flex-col font-serif relative group">
					{message.reasoning && (
						<Collapsible open={showReasoning}>
							<CollapsibleTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="mb-2"
									onClick={() => setShowReasoning((v) => !v)}
								>
									<Brain /> Reasoning
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<div className="p-4 rounded-md bg-blue-200 text-gray-800 mb-4">
									<MessageMarkdown>{message.reasoning}</MessageMarkdown>
								</div>
							</CollapsibleContent>
						</Collapsible>
					)}

					{noTextContent ? (
						<div className="p-4 rounded-md bg-blue-200 text-gray-800 mb-4">
							<Badge>{status}</Badge>
							<MessageMarkdown>{text}</MessageMarkdown>
						</div>
					) : (
						message.content.map((block, index) => {
							if (block.type === "text") {
								return (
									<MessageMarkdown key={`${message._id}-text-${index}`}>
										{block.text}
									</MessageMarkdown>
								)
							}

							if (block.type === "tool-call") {
								if (block.toolName === "change_scene") {
									return (
										<SceneChange
											key={`${message._id}-scene-${index}`}
											messageId={message._id}
											scene={message.scene}
										/>
									)
								}

								if (block.toolName === "request_dice_roll") {
									return (
										<DiceRoll
											key={`${message._id}-dice-${index}`}
											messageId={message._id}
											toolCallIndex={index}
											parameters={block.args}
											// result={block.result}
										/>
									)
								}

								if (block.toolName === "update_character_sheet") {
									return (
										<CharacterSheetUpdate
											key={`${message._id}-character-sheet-${block.toolName}`}
											parameters={block.args}
										/>
									)
								}

								if (block.toolName === "introduce_character") {
									return (
										<CharacterIntroduction
											key={`${message._id}-character-introduction-${block.toolName}`}
											parameters={block.args}
										/>
									)
								}
							}

							return null
						})
					)}

					{isLastMessage && (
						<Button
							className="hidden group-hover:block absolute bottom-0 right-0"
							onClick={async () => {
								const { streamId } = await regenerateLastMessageMutation({
									messageId: message._id,
								})
								setStreamId(streamId)
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
	messageId,
	scene,
}: {
	messageId: Id<"messages">
	scene?: {
		description: string
		prompt?: string
		image?: string
		imageUrl?: string
	}
}) => {
	const regenerateImage = useAction(api.messages.regenerateSceneImage)

	if (!scene) {
		return null
	}

	const handleRegenerate = () => {
		regenerateImage({ messageId })
	}

	return (
		<div className="relative group my-4">
			{scene.imageUrl && (
				<img
					src={scene.imageUrl}
					alt={scene.description}
					className="h-full w-full object-contain rounded-md"
				/>
			)}
			<div className="absolute bottom-0 right-0 m-4 bg-black/50 rounded-md p-2 hidden group-hover:block">
				<p className="text-white text-sm">{scene.description}</p>
			</div>

			<Button
				onClick={handleRegenerate}
				className="absolute top-2 right-2 hidden group-hover:block"
				aria-label="Click to regenerate scene image"
				title="Click to regenerate scene image"
			>
				<RefreshCcwIcon />
			</Button>
		</div>
	)
}
