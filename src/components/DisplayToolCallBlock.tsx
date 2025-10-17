import type { StreamId } from "@convex-dev/persistent-text-streaming"
import type { Doc } from "../../convex/_generated/dataModel"
import { CharacterIntroduction } from "./CharacterIntroduction"
import { CharacterSheetUpdate } from "./CharacterSheetUpdate"
import { ChooseName } from "./ChooseName"
import { ClockUpdate } from "./ClockUpdate"
import { DiceRoll } from "./DiceRoll"
import { PlanUpdate } from "./PlanUpdate"
import { QuestUpdate } from "./QuestUpdate"
import { SceneChange } from "./SceneChange"
import { SetCampaignInfo } from "./SetCampaignInfo"
import { UnknownToolCall } from "./UnknownToolCall"

type Props = {
	message: Omit<Doc<"messages">, "audio"> & {
		audio?: (string | null)[]
		scene?: Omit<NonNullable<Doc<"messages">["scene"]>, "image"> & {
			imageUrl?: string | null
		}
	}
	block: {
		toolName: string
		toolCallId: string
		args: Record<string, unknown> // Can be 'args' (old) or from streaming
		input?: Record<string, unknown> // Can be 'input' (new stored format)
	}
	setStreamId: (streamId: StreamId) => void
	toolCallIndex: number
	isFirstInGroup?: boolean
	isLastInGroup?: boolean
}

export const DisplayToolCallBlock: React.FC<Props> = ({
	block,
	message,
	toolCallIndex,
	setStreamId,
	isFirstInGroup = true,
	isLastInGroup = true,
}) => {
	const positionClass =
		`${isFirstInGroup ? "first-tool-call" : ""} ${isLastInGroup ? "last-tool-call" : ""}`.trim()
	const toolResult = message.toolResults?.find(
		(tr) => tr.toolCallId === block.toolCallId,
	)

	// Support both 'args' (old/streaming) and 'input' (new stored format)
	const params = (block.input ?? block.args) as Record<string, unknown>

	if (block.toolName === "change_scene") {
		return (
			<SceneChange
				key={`scene-${block.toolCallId}`}
				messageId={message._id}
				scene={message.scene}
				description={params.description as string}
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
					params as {
						number: number
						faces: number
						bonus: number
					}
				}
				toolResult={toolResult ?? null}
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
					params as {
						description: string
						suggestedNames: string[]
					}
				}
				toolResult={toolResult ?? null}
			/>
		)
	}

	if (block.toolName === "update_character_sheet") {
		return (
			<CharacterSheetUpdate
				key={`character-sheet-${block.toolCallId}`}
				parameters={
					params as {
						name: string
						description: string
						data: Record<string, unknown>
					}
				}
				className={positionClass}
			/>
		)
	}

	if (block.toolName === "introduce_character") {
		return (
			<CharacterIntroduction
				key={`character-introduction-${block.toolCallId}`}
				parameters={params as { name: string; description: string }}
				className={positionClass}
			/>
		)
	}

	if (block.toolName === "update_plan") {
		return (
			<PlanUpdate
				key={`plan-update-${block.toolCallId}`}
				parameters={
					params as {
						plan: string
						part?:
							| "current_scene"
							| "future_events"
							| "player_requests"
							| "overall_story"
					}
				}
				className={positionClass}
			/>
		)
	}

	if (block.toolName === "update_quest_log") {
		return (
			<QuestUpdate
				key={`quest-update-${block.toolCallId}`}
				parameters={
					params as {
						quest_title: string
						objective_description: string
						action: "add" | "update_objective" | "complete" | "fail"
					}
				}
				className={positionClass}
			/>
		)
	}

	if (block.toolName === "update_clock") {
		// If tool result is available and structured, use it (includes previous_ticks)
		// Otherwise fall back to params (tool call arguments)
		const clockParams =
			toolResult?.result &&
			typeof toolResult.result === "object" &&
			"current_ticks" in toolResult.result
				? (toolResult.result as {
						name: string
						current_ticks: number
						max_ticks: number
						previous_ticks?: number
						hint?: string
					})
				: (params as {
						name: string
						current_ticks: number
						max_ticks: number
						hint?: string
					})

		return (
			<ClockUpdate
				key={`clock-update-${block.toolCallId}`}
				parameters={clockParams}
				className={positionClass}
			/>
		)
	}

	if (block.toolName === "set_campaign_info") {
		return (
			<SetCampaignInfo
				key={`set-campaign-info-${block.toolCallId}`}
				parameters={
					params as {
						name: string
						description: string
						imagePrompt: string
					}
				}
				className={positionClass}
			/>
		)
	}

	return (
		<UnknownToolCall
			parameters={params}
			toolName={block.toolName}
			key={`unknown-tool-call-${block.toolName}`}
			className={positionClass}
		/>
	)
}
