import { Shirt } from "lucide-react"
import type React from "react"
import { ToolCallContainer } from "./ToolCallContainer"
import { Badge } from "./ui/badge"

type Props = {
	parameters: {
		characterName: string
		outfitName: string
		outfitDescription: string
	}
	isNew?: boolean
	className?: string
}

export const CharacterOutfitUpdate: React.FC<Props> = ({
	parameters,
	isNew,
	className,
}) => {
	return (
		<ToolCallContainer
			icon={Shirt}
			title={
				<div className="flex items-center gap-2">
					<span>{`${parameters.characterName} changed into the "${parameters.outfitName}" outfit`}</span>
					{isNew && <Badge>NEW</Badge>}
				</div>
			}
			className={className}
		>
			<div className="text-sm space-y-1">
				<p className="text-muted-foreground">{parameters.outfitDescription}</p>
			</div>
		</ToolCallContainer>
	)
}
