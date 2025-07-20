import { useAction } from "convex/react"
import { RefreshCcwIcon } from "lucide-react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Button } from "./ui/button"

export const SceneChange = ({
	messageId,
	scene,
}: {
	messageId: Id<"messages">
	scene?: {
		description: string
		prompt?: string
		image?: string
		imageUrl?: string
	}
}) => {
	const regenerateImage = useAction(api.messages.regenerateSceneImage)

	if (!scene) {
		return null
	}

	const handleRegenerate = () => {
		regenerateImage({ messageId })
	}

	return (
		<div className="relative group">
			{scene.imageUrl ? (
				<img
					src={scene.imageUrl}
					alt={scene.description}
					className="h-full w-full object-contain rounded-md"
				/>
			) : (
				<div className="h-full w-full aspect-[16/9] bg-gray-700 rounded-md" />
			)}

			<div className="absolute bottom-0 right-0 m-4 bg-black/50 rounded-md p-2 hidden group-hover:block">
				<p className="text-white text-sm">{scene.description}</p>
			</div>

			<Button
				onClick={handleRegenerate}
				className="absolute top-2 right-2 hidden group-hover:block"
				aria-label="Click to regenerate scene image"
				title="Click to regenerate scene image"
			>
				<RefreshCcwIcon />
			</Button>
		</div>
	)
}
