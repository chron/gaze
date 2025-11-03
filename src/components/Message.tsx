import type { StreamId } from "@convex-dev/persistent-text-streaming"
import { useAction, useMutation } from "convex/react"
import { Loader2, RefreshCcwIcon, Speech } from "lucide-react"
import React, { useEffect, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { useStructuredStream } from "../hooks/useStructuredStream"
import { cn } from "../lib/utils"
import { DisplayToolCallBlock } from "./DisplayToolCallBlock"
import { MessageMarkdown } from "./MessageMarkdown"
import { ReasoningLozenges } from "./ReasoningLozenges"
import { SequentialAudioPlayer } from "./SequentialAudioPlayer"
import { AutoResizeTextarea } from "./ui/auto-resize-textarea"
import { Button } from "./ui/button"

type Props = {
	message: Omit<Doc<"messages">, "audio"> & {
		audio?: (string | null)[]
		scene?: Omit<NonNullable<Doc<"messages">["scene"]>, "image"> & {
			imageUrl?: string | null
		}
	}
	isLastMessage: boolean
	setStreamId: (streamId: StreamId | null) => void
	isStreaming: boolean
}

export const Message: React.FC<Props> = ({
	message,
	isLastMessage,
	setStreamId,
	isStreaming,
}) => {
	const { steps, reasoningText, reasoningChunks } = useStructuredStream(
		isStreaming,
		message.streamId as StreamId,
	)

	const updateTextBlockMutation = useMutation(api.messages.updateTextBlock)

	const [editingIndex, setEditingIndex] = useState<number | null>(null)
	const [editingText, setEditingText] = useState("")
	const [isSaving, setIsSaving] = useState(false)
	const [showReasoning, setShowReasoning] = useState(false)

	const noDatabaseContent =
		message.content.length === 0 ||
		(message.content.length === 1 &&
			"text" in message.content[0] &&
			message.content[0].text === "")

	const noStreamingContent =
		steps.length === 0 ||
		(steps.length === 1 &&
			steps[0].text === "" &&
			steps[0].reasoningText === "")

	const noContent = noDatabaseContent && noStreamingContent

	const combinedReasoning = noDatabaseContent
		? reasoningText
		: message.content.reduce((acc, block) => {
				if (block.type === "reasoning") {
					return acc + block.text
				}
				return acc
			}, "")

	// Get reasoning chunks for display - count headings for lozenge display
	const displayChunks = noDatabaseContent
		? reasoningChunks
		: (() => {
				if (!combinedReasoning) return []
				// Count bold headings in persisted reasoning text
				const headingMatches = combinedReasoning.match(/^\*\*.+\*\*$/gm)
				const count = headingMatches ? headingMatches.length : 0
				return count > 0 ? Array(count).fill(combinedReasoning) : []
			})()

	// Extract the current (most recent) title from reasoning text
	const currentTitle = (() => {
		const reasoningToUse = noDatabaseContent ? reasoningText : combinedReasoning
		if (!reasoningToUse) return undefined

		// Match all bold headings like "**Title**"
		const headingMatches = reasoningToUse.match(/^\*\*(.+?)\*\*$/gm)
		if (!headingMatches || headingMatches.length === 0) return undefined

		// Get the last heading and remove the asterisks
		const lastHeading = headingMatches[headingMatches.length - 1]
		return lastHeading.replace(/^\*\*|\*\*$/g, "")
	})()

	// Once the content of the message begins streaming, collapse the reasoning section
	const startedStreamingContent = steps.filter((s) => s.text).length > 0

	useEffect(() => {
		if (startedStreamingContent) {
			setShowReasoning(false)
		}
	}, [startedStreamingContent])

	useEffect(() => {
		if ((!noDatabaseContent && !noStreamingContent) || !!message.error) {
			setStreamId(null)
		}
	}, [noDatabaseContent, noStreamingContent, message.error, setStreamId])

	if (message.error) {
		return (
			<div
				data-message-id={message._id}
				className="rounded-md self-start bg-gray-100 text-gray-800 overflow-hidden"
			>
				<pre className="text-sm bg-red-200 p-4 overflow-x-auto relative group">
					{message.error}

					<MessageActions
						message={message}
						isLastMessage={isLastMessage}
						setStreamId={setStreamId}
					/>
				</pre>
			</div>
		)
	}

	if (noContent) {
		return (
			<div
				data-message-id={message._id}
				className="p-2 rounded-md self-start bg-gray-100 text-gray-800"
			>
				<div className="flex flex-col gap-2 font-serif relative group h-8">
					<p className="animate-pulse text-xl">...</p>

					<MessageActions
						message={message}
						isLastMessage={isLastMessage}
						setStreamId={setStreamId}
					/>
				</div>
			</div>
		)
	}

	return (
		<div
			data-message-id={message._id}
			className={cn(
				"flex flex-col gap-2 p-3 rounded-md w-full max-w-[95%] sm:max-w-[80%]",
				isSaving && "animate-pulse",
				message.role === "user"
					? "self-end bg-blue-100 text-blue-800"
					: "self-start bg-gray-100 text-gray-800",
			)}
		>
			<div className="flex flex-col font-serif relative group gap-2">
				{displayChunks.length > 0 && (
					<div className="flex flex-col gap-2">
						<ReasoningLozenges
							chunkCount={displayChunks.length}
							isStreaming={!startedStreamingContent} // Collapse as soon as the reasoning has finished flowing in
							isExpanded={showReasoning}
							onClick={() => setShowReasoning(!showReasoning)}
							currentTitle={currentTitle}
						/>

						{showReasoning && (
							<div className="text-sm text-gray-600">
								<MessageMarkdown>{combinedReasoning}</MessageMarkdown>
								{startedStreamingContent && (
									<hr className="text-gray-400 mt-4 mb-2" />
								)}
							</div>
						)}
					</div>
				)}

				{!noDatabaseContent ? (
					message.content.map((block, index, array) => {
						if (block.type === "text") {
							if (editingIndex === index) {
								return (
									<AutoResizeTextarea
										// biome-ignore lint/suspicious/noArrayIndexKey: Complex editor block without stable id
										key={`text-edit-${index}`}
										autoFocus
										value={editingText}
										onChange={(e) => setEditingText(e.target.value)}
										onSave={async (text) => {
											setIsSaving(true)
											await updateTextBlockMutation({
												messageId: message._id,
												index,
												text,
											})
											setIsSaving(false)
											setEditingIndex(null)
										}}
										onCancel={() => setEditingIndex(null)}
									/>
								)
							}

							return (
								<div
									key={`text-${block.text}-${index}`}
									onDoubleClick={() => {
										setEditingIndex(index)
										setEditingText(block.text)
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
							// Check if this is the first/last in a sequence of tool calls
							const prevIsToolCall =
								index > 0 && array[index - 1]?.type === "tool-call"
							const nextIsToolCall =
								index < array.length - 1 &&
								array[index + 1]?.type === "tool-call"

							return (
								<DisplayToolCallBlock
									key={`${message._id}-${index}-tool-call-${block.toolCallId}`}
									block={{
										...block,
										args: (block as any).input ?? (block as any).args,
									}}
									message={message}
									toolCallIndex={index}
									setStreamId={setStreamId}
									isFirstInGroup={!prevIsToolCall}
									isLastInGroup={!nextIsToolCall}
								/>
							)
						}
					})
				) : (
					<>
						{steps.map((step, stepIndex) => {
							return (
								<React.Fragment key={`step-${step.stepId}-${stepIndex}`}>
									{step.text && <MessageMarkdown>{step.text}</MessageMarkdown>}

									{step.toolCalls.map((toolCall, toolCallIndex) => {
										return (
											<DisplayToolCallBlock
												key={`${message._id}-tool-call-${toolCall.toolCallId}`}
												block={{
													toolName: toolCall.toolName,
													toolCallId: toolCall.toolCallId,
													args: toolCall.args as Record<string, unknown>,
												}}
												message={message}
												setStreamId={setStreamId}
												toolCallIndex={stepIndex}
												isFirstInGroup={toolCallIndex === 0}
												isLastInGroup={
													toolCallIndex === step.toolCalls.length - 1
												}
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
					<SequentialAudioPlayer
						audioUrls={message.audio.filter(
							(url): url is string => url !== null,
						)}
					/>
				)}
			</div>
		</div>
	)
}

type MessageActionsProps = {
	message: Props["message"]
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
		<div className="gap-2 flex md:hidden md:group-hover:flex absolute bottom-0 right-0">
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
