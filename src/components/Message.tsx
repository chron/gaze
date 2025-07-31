import type { StreamId } from "@convex-dev/persistent-text-streaming"
import { useAction, useMutation } from "convex/react"
import { Brain, Loader2, RefreshCcwIcon, Speech } from "lucide-react"
import React, { useEffect, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { useStructuredStream } from "../hooks/useStructuredStream"
import { cn } from "../lib/utils"
import { CharacterIntroduction } from "./CharacterIntroduction"
import { CharacterSheetUpdate } from "./CharacterSheetUpdate"
import { DiceRoll } from "./DiceRoll"
import { DiceRollResult } from "./DiceRollResult"
import { MessageMarkdown } from "./MessageMarkdown"
import { PlanUpdate } from "./PlanUpdate"
import { SceneChange } from "./SceneChange"
import { SequentialAudioPlayer } from "./SequentialAudioPlayer"
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
	followupToolResult: Doc<"messages"> | null
	scrollToBottom: () => void
}

export const Message: React.FC<Props> = ({
	message,
	isLastMessage,
	setStreamId,
	isStreaming,
	followupToolResult,
	scrollToBottom,
}) => {
	const { steps, reasoning } = useStructuredStream(
		isStreaming,
		message.streamId as StreamId,
	)

	const updateMessageMutation = useMutation(api.messages.update)

	const [isEditing, setIsEditing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [showReasoning, setShowReasoning] = useState(true)

	const noDatabaseContent =
		message.content.length === 0 ||
		(message.content.length === 1 &&
			"text" in message.content[0] &&
			message.content[0].text === "")

	const noStreamingContent =
		steps.length === 0 ||
		(steps.length === 1 && steps[0].text === "" && steps[0].reasoning === "")

	const noContent = noDatabaseContent && noStreamingContent

	const combinedReasoning = noDatabaseContent
		? reasoning
		: message.content.reduce((acc, block) => {
				if (block.type === "reasoning") {
					return acc + block.text
				}
				return acc
			}, "")

	// Once the message is fully streamed, collapse the reasoning section
	useEffect(() => {
		if (!noDatabaseContent) {
			setShowReasoning(false)
		}
	}, [noDatabaseContent])

	useEffect(() => {
		if (isLastMessage && steps.length > 0) {
			scrollToBottom()
		}
	}, [isLastMessage, scrollToBottom, steps])

	if (message.role === "tool") {
		if (
			message.content.length === 1 &&
			message.content[0].type === "tool-result"
		) {
			if (message.content[0].toolName === "request_dice_roll") {
				return (
					<DiceRollResult
						results={message.content[0].result.results}
						bonus={message.content[0].result.bonus}
						total={message.content[0].result.total}
					/>
				)
			}

			return (
				<div className="text-sm text-gray-500 bg-white p-4">
					Unknown tool result
				</div>
			)
		}
	}

	return (
		<div
			className={cn(
				"flex flex-col gap-2 p-2 rounded-md max-w-[80%]",
				isSaving && "animate-pulse",
				message.role === "user"
					? "self-end bg-blue-100 text-blue-800"
					: "self-start bg-gray-100 text-gray-800",
				isEditing && "outline outline-2 outline-black",
			)}
			contentEditable={isEditing}
			onDoubleClick={() => setIsEditing(true)}
			onKeyDown={async (e) => {
				if (e.key === "Escape") {
					e.preventDefault()
					setIsEditing(false)
				}

				if (e.key === "Enter" && !e.shiftKey) {
					e.preventDefault()
					if (
						message.content.length === 1 &&
						message.content[0].type === "text"
					) {
						setIsSaving(true)
						await updateMessageMutation({
							messageId: message._id,
							content: [
								{
									type: "text",
									text: e.currentTarget.innerText,
								},
							],
						})
					} else {
						console.error("Message content is not a text block")
					}
					setIsSaving(false)
					setIsEditing(false)
				}
			}}
		>
			{noContent ? (
				<div className="flex flex-col gap-2 font-serif relative group">
					<p className="animate-pulse text-xl">...</p>

					<MessageActions
						message={message}
						isLastMessage={isLastMessage}
						setStreamId={setStreamId}
					/>
				</div>
			) : (
				<div className="flex flex-col font-serif relative group gap-2">
					{combinedReasoning && (
						<Collapsible open={showReasoning} onOpenChange={setShowReasoning}>
							<CollapsibleTrigger asChild>
								<Button variant="outline" size="sm" className="mb-2">
									<Brain className="h-4 w-4 mr-2" />
									Reasoning
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<div className="p-3 bg-gray-50 rounded-md text-sm">
									<MessageMarkdown>{combinedReasoning}</MessageMarkdown>
								</div>
							</CollapsibleContent>
						</Collapsible>
					)}

					{!noDatabaseContent ? (
						message.content.map((block, index) => {
							if (block.type === "text") {
								return (
									<MessageMarkdown key={`text-${block.text}`}>
										{block.text}
									</MessageMarkdown>
								)
							}

							if (block.type === "tool-call") {
								if (block.toolName === "change_scene") {
									return (
										<SceneChange
											key={`scene-${block.toolCallId}`}
											messageId={message._id}
											scene={message.scene}
											description={block.args.description}
										/>
									)
								}

								if (block.toolName === "request_dice_roll") {
									return (
										<DiceRoll
											key={`dice-${block.toolCallId}`}
											messageId={message._id}
											toolCallIndex={index}
											parameters={
												block.args as {
													number: number
													faces: number
													bonus: number
												}
											}
											followupToolResult={followupToolResult}
											setStreamId={setStreamId}
										/>
									)
								}

								if (block.toolName === "update_character_sheet") {
									return (
										<CharacterSheetUpdate
											key={`character-sheet-${block.toolCallId}`}
											parameters={
												block.args as {
													name: string
													description: string
													data: Record<string, unknown>
												}
											}
										/>
									)
								}

								if (block.toolName === "introduce_character") {
									return (
										<CharacterIntroduction
											key={`character-introduction-${block.toolCallId}`}
											parameters={
												block.args as { name: string; description: string }
											}
										/>
									)
								}

								if (block.toolName === "update_plan") {
									return (
										<PlanUpdate
											key={`plan-update-${block.toolCallId}`}
											parameters={block.args as { plan: string }}
										/>
									)
								}
							}

							return null
						})
					) : (
						<>
							{steps.map((step, stepIndex) => {
								return (
									<React.Fragment key={`step-${step.stepId}-${stepIndex}`}>
										{step.text && (
											<MessageMarkdown>{step.text}</MessageMarkdown>
										)}

										{step.toolCalls.map((toolCall, index) => {
											if (toolCall.toolName === "change_scene") {
												return (
													<SceneChange
														key={`${message._id}-step-${stepIndex}-scene-${index}`}
														messageId={message._id}
														scene={message.scene}
														description={toolCall.args.description}
													/>
												)
											}

											if (toolCall.toolName === "request_dice_roll") {
												return (
													<DiceRoll
														key={`${message._id}-step-${stepIndex}-dice-${index}`}
														messageId={message._id}
														toolCallIndex={index}
														parameters={
															toolCall.args as {
																number: number
																faces: number
																bonus: number
															}
														}
														result={
															toolCall.result as {
																results: number[]
																total: number
															} | null
														}
													/>
												)
											}

											if (toolCall.toolName === "update_character_sheet") {
												return (
													<CharacterSheetUpdate
														key={`${message._id}-step-${stepIndex}-character-sheet-${index}`}
														parameters={
															toolCall.args as {
																name: string
																description: string
																data: Record<string, unknown>
															}
														}
													/>
												)
											}

											if (toolCall.toolName === "introduce_character") {
												return (
													<CharacterIntroduction
														key={`${message._id}-step-${stepIndex}-character-introduction-${index}`}
														parameters={
															toolCall.args as {
																name: string
																description: string
															}
														}
													/>
												)
											}

											if (toolCall.toolName === "update_plan") {
												return (
													<PlanUpdate
														key={`${message._id}-step-${stepIndex}-plan-update-${index}`}
														parameters={toolCall.args as { plan: string }}
													/>
												)
											}

											return null
										})}
									</React.Fragment>
								)
							})}
						</>
					)}

					<MessageActions
						message={message}
						isLastMessage={isLastMessage}
						setStreamId={setStreamId}
					/>

					{message?.audio && (
						<SequentialAudioPlayer audioUrls={message.audio} />
					)}
				</div>
			)}
		</div>
	)
}

type MessageActionsProps = {
	message: Doc<"messages">
	isLastMessage: boolean
	setStreamId: (streamId: StreamId) => void
}

const MessageActions: React.FC<MessageActionsProps> = ({
	message,
	isLastMessage,
	setStreamId,
}) => {
	const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
	const generateAudio = useAction(api.speech.generateAudioForMessage)
	const regenerateLastMessageMutation = useMutation(
		api.messages.regenerateLastMessage,
	)

	return (
		<div className="gap-2 hidden group-hover:flex absolute bottom-0 right-0">
			<Button
				disabled={isGeneratingAudio}
				onClick={async () => {
					setIsGeneratingAudio(true)
					await generateAudio({ messageId: message._id })
					setIsGeneratingAudio(false)
				}}
			>
				{isGeneratingAudio ? <Loader2 className="animate-spin" /> : <Speech />}
			</Button>

			{isLastMessage && (
				<Button
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
	)
}
