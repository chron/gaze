import type { Doc } from "./_generated/dataModel"

export const googleSafetySettings = {
	safetySettings: [
		{
			category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as const,
			threshold: "BLOCK_NONE" as const,
		},
		{
			category: "HARM_CATEGORY_DANGEROUS_CONTENT" as const,
			threshold: "BLOCK_NONE" as const,
		},
		{
			category: "HARM_CATEGORY_HARASSMENT" as const,
			threshold: "BLOCK_NONE" as const,
		},
		{
			category: "HARM_CATEGORY_HATE_SPEECH" as const,
			threshold: "BLOCK_NONE" as const,
		},
		{
			category: "HARM_CATEGORY_CIVIC_INTEGRITY" as const,
			threshold: "BLOCK_NONE" as const,
		},
	],
}

export const isToolEnabled = (toolName: string, campaign: Doc<"campaigns">) => {
	if (!campaign.enabledTools) return true
	return campaign.enabledTools[toolName] ?? true
}
