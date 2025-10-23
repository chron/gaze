import { Shirt } from "lucide-react"
import type React from "react"
import { ToolCallContainer } from "./ToolCallContainer"

type Props = {
	parameters: {
		characterName: string
		outfitName: string
		outfitDescription: string
	}
	className?: string
}

export const CharacterOutfitUpdate: React.FC<Props> = ({
	parameters,
	className,
}) => {
	return (
		<ToolCallContainer
			icon={Shirt}
			title={`${parameters.characterName} changed into the "${parameters.outfitName}" outfit`}
			className={className}
		>
			<div className="text-sm space-y-1">
				<p className="text-muted-foreground">{parameters.outfitDescription}</p>
			</div>
		</ToolCallContainer>
	)
}
