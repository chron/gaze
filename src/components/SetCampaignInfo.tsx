import { Sparkles } from "lucide-react"
import type React from "react"
import { ToolCallContainer } from "./ToolCallContainer"

type Props = {
	parameters: {
		name: string
		description: string
		imagePrompt: string
	}
	className?: string
}

export const SetCampaignInfo: React.FC<Props> = ({ parameters, className }) => {
	return (
		<ToolCallContainer
			icon={Sparkles}
			title={`Campaign begins: ${parameters.name}`}
			className={className}
		>
			<div className="flex flex-col gap-2">
				<div>
					<strong className="text-sm">Description:</strong>
					<p className="text-sm mt-1">{parameters.description}</p>
				</div>
				<div>
					<strong className="text-sm">Image Prompt:</strong>
					<p className="text-sm mt-1 italic text-gray-500">
						{parameters.imagePrompt}
					</p>
				</div>
			</div>
		</ToolCallContainer>
	)
}
