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
			title={`${parameters.characterName} changed outfits`}
			className={className}
		>
			<div className="text-sm space-y-1">
				<p className="font-semibold">Outfit: {parameters.outfitName}</p>
				<p className="text-muted-foreground">{parameters.outfitDescription}</p>
			</div>
		</ToolCallContainer>
	)
}
