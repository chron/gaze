import { useAction } from "convex/react"
import { Loader2Icon, RefreshCcwIcon } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { cn } from "../lib/utils"
import { MessageMarkdown } from "./MessageMarkdown"
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
		imageUrl?: string
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
		<div className="relative group">
			{scene?.imageUrl ? (
				<img
					src={scene.imageUrl}
					alt={scene.description}
					className="h-full w-full object-contain rounded-md"
				/>
			) : (
				// <div className="h-full w-full min-w-[300px] aspect-[16/9] bg-gray-700 rounded-md" />
				<div />
			)}

			<div
				className={cn("bg-black rounded-md p-2", {
					"bg-black/50 absolute m-4 bottom-0 right-0 hidden group-hover:block":
						scene?.imageUrl,
				})}
			>
				<div className="text-white text-sm">
					<MessageMarkdown>
						{description ? description : (scene?.description ?? "")}
					</MessageMarkdown>
				</div>
			</div>

			{scene?.imageUrl && (
				<Button
					onClick={handleRegenerate}
					className="absolute top-2 right-2 hidden group-hover:block"
					aria-label="Click to regenerate scene image"
					title="Click to regenerate scene image"
					disabled={regenerating}
				>
					{regenerating ? (
						<Loader2Icon className="animate-spin" />
					) : (
						<RefreshCcwIcon />
					)}
				</Button>
			)}
		</div>
	)
}
