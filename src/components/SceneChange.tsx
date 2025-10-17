import { useAction } from "convex/react"
import { Image, Loader2Icon, RefreshCcwIcon } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { MessageMarkdown } from "./MessageMarkdown"
import { ToolCallContainer } from "./ToolCallContainer"
import { Button } from "./ui/button"

export const SceneChange = ({
	messageId,
	scene,
	description,
}: {
	messageId: Id<"messages">
	description: string
	scene?: {
		description: string
		prompt?: string
		image?: string
		imageUrl?: string | null
	}
}) => {
	const regenerateImage = useAction(api.messages.regenerateSceneImage)
	const [regenerating, setRegenerating] = useState(false)

	const handleRegenerate = async () => {
		setRegenerating(true)
		await regenerateImage({ messageId })
		setRegenerating(false)
	}

	return (
		<ToolCallContainer icon={Image} title="Scene Change" defaultOpen>
			<div className="flex flex-col gap-2">
				<div className="text-sm">
					<MessageMarkdown>
						{description ? description : (scene?.description ?? "")}
					</MessageMarkdown>
				</div>

				{scene?.imageUrl && (
					<div className="relative group/image mt-2">
						<img
							src={scene.imageUrl}
							alt={scene.description}
							className="h-full w-full object-contain rounded-md"
						/>
						<Button
							onClick={handleRegenerate}
							className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity"
							aria-label="Click to regenerate scene image"
							title="Click to regenerate scene image"
							disabled={regenerating}
							size="sm"
						>
							{regenerating ? (
								<Loader2Icon className="animate-spin" />
							) : (
								<RefreshCcwIcon />
							)}
						</Button>
					</div>
				)}
			</div>
		</ToolCallContainer>
	)
}
