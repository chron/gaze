import type { Doc } from "./_generated/dataModel"

// Number of recent campaigns to include as context for new campaign creation
export const RECENT_CAMPAIGNS_CONTEXT_COUNT = 30

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

// TODO: DRY this up with the other tool definition places
type ToolName =
	| "update_character_sheet"
	| "change_scene"
	| "introduce_character"
	| "update_character"
	| "request_dice_roll"
	| "update_plan"
	| "update_quest_log"
	| "update_clock"
	| "update_temporal"
	| "choose_name"
	| "set_campaign_info"
	| "update_character_outfit"

export const isToolEnabled = (
	toolName: ToolName,
	campaign: Doc<"campaigns">,
) => {
	if (!campaign.enabledTools) return true
	return campaign.enabledTools[toolName] ?? true
}
