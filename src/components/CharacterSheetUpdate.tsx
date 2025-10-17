import { UserCog } from "lucide-react"
import type React from "react"
import { ToolCallContainer } from "./ToolCallContainer"

type Props = {
	parameters: {
		name: string
		description: string
		data: Record<string, unknown>
	}
	className?: string
}

export const CharacterSheetUpdate: React.FC<Props> = ({
	parameters,
	className,
}) => {
	return (
		<ToolCallContainer
			icon={UserCog}
			title={`Character Sheet Updated: ${parameters.name}`}
			className={className}
		>
			<p className="text-sm">{parameters.description}</p>
		</ToolCallContainer>
	)
}
