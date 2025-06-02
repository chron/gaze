import type { MessageParam } from "@anthropic-ai/sdk/resources"
import type { sendToClaude } from "./lib/anthropic"

export type Message =
	| (MessageParam & { id: string })
	| Awaited<ReturnType<typeof sendToClaude>>
