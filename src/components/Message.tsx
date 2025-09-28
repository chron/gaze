import type { StreamId } from "@convex-dev/persistent-text-streaming"
import { useAction, useMutation } from "convex/react"
import { Brain, Loader2, RefreshCcwIcon, Speech } from "lucide-react"
import React, { useEffect, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { useStructuredStream } from "../hooks/useStructuredStream"
import { cn } from "../lib/utils"
import { DiceRollResult } from "./DiceRollResult"
import { DisplayToolCallBlock } from "./DisplayToolCallBlock"
import { MessageMarkdown } from "./MessageMarkdown"
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
	scrollToBottom: () => void
}

export const Message: React.FC<Props> = ({
	message,
	isLastMessage,
	setStreamId,
	isStreaming,
	scrollToBottom,
}) => {
	const { steps, reasoning } = useStructuredStream(
		isStreaming,
		message.streamId as StreamId,
	)

	const updateTextBlockMutation = useMutation(api.messages.updateTextBlock)

	const [editingIndex, setEditingIndex] = useState<number | null>(null)
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

	if (message.error) {
		return (
			<pre className="text-sm bg-red-200 p-4 overflow-x-auto relative group">
				{message.error}

				<MessageActions
					message={message}
					isLastMessage={isLastMessage}
					setStreamId={setStreamId}
				/>
			</pre>
		)
	}

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
		}

		// We track tool results for all calls but there's usually nothing to show
		return null
	}

	return (
		<div
			className={cn(
				"flex flex-col gap-2 p-2 rounded-md max-w-[80%]",
				isSaving && "animate-pulse",
				message.role === "user"
					? "self-end bg-blue-100 text-blue-800"
					: "self-start bg-gray-100 text-gray-800",
			)}
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
								if (editingIndex === index) {
									return (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: Complex editor block without stable id
											key={`text-edit-${index}`}
											className="whitespace-pre-wrap outline outline-2 outline-black rounded-md"
											contentEditable
											// biome-ignore lint/a11y/noAutofocus: Intentional focus for editing UX
											autoFocus
											onKeyDown={async (e) => {
												if (e.key === "Escape") {
													e.preventDefault()
													setEditingIndex(null)
													return
												}

												if (e.key === "Enter" && !e.shiftKey) {
													e.preventDefault()
													setIsSaving(true)
													await updateTextBlockMutation({
														messageId: message._id,
														index,
														text: e.currentTarget.innerText,
													})
													setIsSaving(false)
													setEditingIndex(null)
												}
											}}
										>
											{block.text}
										</div>
									)
								}

								return (
									<div
										key={`text-${block.text}-${index}`}
										onDoubleClick={() => {
											setEditingIndex(index)
										}}
									>
										<MessageMarkdown
											linkClickHandler={
												isLastMessage
													? (text) => {
															navigator.clipboard.writeText(text)
														}
													: undefined
											}
										>
											{block.text}
										</MessageMarkdown>
									</div>
								)
							}

							if (block.type === "tool-call") {
								return (
									<DisplayToolCallBlock
										key={`${message._id}-step-${index}-tool-call`}
										block={block}
										message={message}
										toolCallIndex={index}
										setStreamId={setStreamId}
									/>
								)
							}
						})
					) : (
						<>
							{steps.map((step, stepIndex) => {
								return (
									<React.Fragment key={`step-${step.stepId}-${stepIndex}`}>
										{step.text && (
											<MessageMarkdown>{step.text}</MessageMarkdown>
										)}

										{step.toolCalls.map((toolCall) => {
											return (
												<DisplayToolCallBlock
													key={`${message._id}-step-${stepIndex}-tool-call`}
													block={{
														toolName: toolCall.toolName,
														toolCallId: toolCall.toolCallId,
														args: toolCall.args as Record<string, unknown>,
													}}
													message={message}
													setStreamId={setStreamId}
													toolCallIndex={stepIndex}
												/>
											)
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
