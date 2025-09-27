import type { StreamId } from "@convex-dev/persistent-text-streaming"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { CharacterIntroduction } from "./CharacterIntroduction"
import { CharacterSheetUpdate } from "./CharacterSheetUpdate"
import { ChooseName } from "./ChooseName"
import { DiceRoll } from "./DiceRoll"
import { PlanUpdate } from "./PlanUpdate"
import { QuestUpdate } from "./QuestUpdate"
import { SceneChange } from "./SceneChange"
import { SetCampaignInfo } from "./SetCampaignInfo"
import { UnknownToolCall } from "./UnknownToolCall"

type Props = {
	message: Doc<"messages">
	block: {
		toolName: string
		toolCallId: string
		args: Record<string, unknown>
	}
	followupToolResult: Doc<"messages"> | null
	setStreamId: (streamId: StreamId) => void
	toolCallIndex: number
}

export const DisplayToolCallBlock: React.FC<Props> = ({
	block,
	message,
	followupToolResult,
	toolCallIndex,
	setStreamId,
}) => {
	if (block.toolName === "change_scene") {
		return (
			<SceneChange
				key={`scene-${block.toolCallId}`}
				messageId={message._id}
				scene={message.scene}
				description={block.args.description as string}
			/>
		)
	}

	if (block.toolName === "request_dice_roll") {
		return (
			<DiceRoll
				key={`dice-${block.toolCallId}`}
				messageId={message._id}
				toolCallIndex={toolCallIndex}
				parameters={
					block.args as {
						number: number
						faces: number
						bonus: number
					}
				}
				followupToolResult={
					followupToolResult?.content[0].type === "tool-result" &&
					block.toolName === followupToolResult?.content[0].toolName
						? followupToolResult
						: null
				}
				setStreamId={setStreamId}
			/>
		)
	}

	if (block.toolName === "choose_name") {
		return (
			<ChooseName
				key={`choose-name-${block.toolCallId}`}
				messageId={message._id}
				toolCallIndex={toolCallIndex}
				parameters={
					block.args as {
						description: string
						suggestedNames: string[]
					}
				}
				followupToolResult={
					followupToolResult?.content[0].type === "tool-result" &&
					block.toolName === followupToolResult?.content[0].toolName
						? followupToolResult
						: null
				}
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
				parameters={block.args as { name: string; description: string }}
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

	if (block.toolName === "update_quest_log") {
		return (
			<QuestUpdate
				key={`quest-update-${block.toolCallId}`}
				parameters={
					block.args as { quest_title: string; objective_description: string }
				}
			/>
		)
	}

	if (block.toolName === "set_campaign_info") {
		return (
			<SetCampaignInfo
				key={`set-campaign-info-${block.toolCallId}`}
				parameters={
					block.args as {
						name: string
						description: string
						imagePrompt: string
					}
				}
			/>
		)
	}

	return (
		<UnknownToolCall
			parameters={block.args}
			key={`unknown-tool-call-${block.toolName}`}
		/>
	)
}
