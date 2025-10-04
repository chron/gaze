import type { StreamId } from "@convex-dev/persistent-text-streaming"
import { useStream } from "@convex-dev/persistent-text-streaming/react"
import { api } from "../../convex/_generated/api"
import { env } from "../../env"

type StreamChunk =
	| { type: "reasoning"; delta: string }
	| { type: "text"; delta: string }
	| { type: "tool-call"; toolName: string; toolCallId: string; args: unknown }
	| { type: "tool-result"; toolCallId: string; result: unknown }
	| { type: "step-start"; messageId: string }
	| {
			type: "step-finish"
			messageId: string
			finishReason: string
			usage: unknown
			isContinued: boolean
	  }

type ToolCall = {
	toolName: string
	toolCallId: string
	args: unknown // Stores as 'args' in streaming
	result?: unknown
}

type Step = {
	stepId: string
	reasoningText: string
	text: string
	toolCalls: ToolCall[]
	isFinished: boolean
	isContinued?: boolean
}

type StructuredStreamContent = {
	steps: Step[]
}

function parseStreamContent(rawText: string): StructuredStreamContent & {
	reasoningText: string
} {
	if (!rawText) {
		return {
			steps: [],
			reasoningText: "",
		}
	}

	const steps: Step[] = []

	// Split by lines and filter out empty lines
	const lines = rawText.split("\n").filter((line) => line.trim())

	for (const line of lines) {
		try {
			const chunk: StreamChunk = JSON.parse(line)

			switch (chunk.type) {
				case "step-start": {
					// Start a new step
					steps.push({
						stepId: chunk.messageId,
						reasoningText: "",
						text: "",
						toolCalls: [],
						isFinished: false,
					})
					break
				}

				case "step-finish": {
					// Mark the current step as finished
					const currentStepIndex = steps.findIndex(
						(step) => step.stepId === chunk.messageId,
					)
					if (currentStepIndex >= 0) {
						steps[currentStepIndex].isFinished = true
						steps[currentStepIndex].isContinued = chunk.isContinued
					}
					break
				}

				case "reasoning": {
					// Ensure we have at least one step (for backwards compatibility)
					if (steps.length === 0) {
						steps.push({
							stepId: "default",
							reasoningText: "",
							text: "",
							toolCalls: [],
							isFinished: false,
						})
					}

					// Add to current step
					const currentStep = steps[steps.length - 1]
					currentStep.reasoningText += chunk.delta
					break
				}

				case "text": {
					// Ensure we have at least one step (for backwards compatibility)
					if (steps.length === 0) {
						steps.push({
							stepId: "default",
							reasoningText: "",
							text: "",
							toolCalls: [],
							isFinished: false,
						})
					}

					// Add to current step
					const currentStep = steps[steps.length - 1]
					currentStep.text += chunk.delta
					break
				}

				case "tool-call": {
					// Ensure we have at least one step
					if (steps.length === 0) {
						steps.push({
							stepId: "default",
							reasoningText: "",
							text: "",
							toolCalls: [],
							isFinished: false,
						})
					}

					const currentStep = steps[steps.length - 1]

					// Check if this tool call already exists in current step
					const existingCallIndex = currentStep.toolCalls.findIndex(
						(tc: ToolCall) => tc.toolCallId === chunk.toolCallId,
					)

					if (existingCallIndex >= 0) {
						// Update existing tool call
						currentStep.toolCalls[existingCallIndex] = {
							...currentStep.toolCalls[existingCallIndex],
							...chunk,
						}
					} else {
						// Add new tool call
						currentStep.toolCalls.push({
							toolName: chunk.toolName,
							toolCallId: chunk.toolCallId,
							args: chunk.args,
						})
					}
					break
				}

				case "tool-result": {
					// Find the tool call across all steps and add the result
					for (const step of steps) {
						const toolCallIndex = step.toolCalls.findIndex(
							(tc: ToolCall) => tc.toolCallId === chunk.toolCallId,
						)

						if (toolCallIndex >= 0) {
							step.toolCalls[toolCallIndex].result = chunk.result
							break
						}
					}
					break
				}
			}
		} catch (error) {
			console.warn("Failed to parse stream chunk:", line, error)
		}
	}

	// Provide backward compatibility by flattening all steps
	const flattenedReasoning = steps.reduce(
		(acc, step) => acc + step.reasoningText,
		"",
	)

	return {
		steps,
		reasoningText: flattenedReasoning,
	}
}

export const useStructuredStream = (
	isStreaming: boolean,
	streamId?: StreamId,
): StructuredStreamContent & {
	reasoningText: string
	status: string
} => {
	const { text: rawText, status } = useStream(
		api.messages.getMessageBody,
		new URL(`${env.VITE_CONVEX_HTTP_URL}/message_stream`),
		isStreaming,
		streamId,
	)

	const parsedContent = parseStreamContent(rawText || "")

	return {
		...parsedContent,
		status,
	}
}
