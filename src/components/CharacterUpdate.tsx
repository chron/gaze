import { UserPen } from "lucide-react"
import type React from "react"
import { ToolCallContainer } from "./ToolCallContainer"

type Props = {
	parameters: {
		name: string
		description?: string
		notes?: string
	}
	className?: string
}

export const CharacterUpdate: React.FC<Props> = ({ parameters, className }) => {
	return (
		<ToolCallContainer
			icon={UserPen}
			title={`Updated character: ${parameters.name}`}
			className={className}
		>
			<div className="text-sm space-y-2">
				{parameters.description && (
					<div>
						<span className="font-medium">Description: </span>
						{parameters.description}
					</div>
				)}
				{parameters.notes && (
					<div>
						<span className="font-medium">Notes: </span>
						{parameters.notes}
					</div>
				)}
			</div>
		</ToolCallContainer>
	)
}
