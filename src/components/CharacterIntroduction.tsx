import { UserPlus } from "lucide-react"
import type React from "react"
import { ToolCallContainer } from "./ToolCallContainer"

type Props = {
	parameters: {
		name: string
		description: string
	}
	className?: string
}

export const CharacterIntroduction: React.FC<Props> = ({
	parameters,
	className,
}) => {
	return (
		<ToolCallContainer
			icon={UserPlus}
			title={`New character: ${parameters.name}`}
			className={className}
		>
			<p className="text-sm">{parameters.description}</p>
		</ToolCallContainer>
	)
}
