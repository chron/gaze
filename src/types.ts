import type {
	Message as ClaudeMessage,
	MessageParam,
} from "@anthropic-ai/sdk/resources"

export type Message = (MessageParam & { id: string }) | ClaudeMessage
