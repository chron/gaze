import type React from "react"

type Props = {
	parameters: {
		name: string
		description: string
		imagePrompt: string
	}
}

export const SetCampaignInfo: React.FC<Props> = ({ parameters }) => {
	return (
		<div className="flex flex-col p-3 bg-teal-50 border border-teal-200 rounded-md text-teal-800 text-sm">
			<h2 className="text-lg font-bold mb-4">Campaign begins!</h2>

			<div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2">
				<strong>Name:</strong>
				<span>{parameters.name}</span>
				<strong>Description:</strong>
				<span>{parameters.description}</span>
				<strong>Image Prompt:</strong>
				<span>{parameters.imagePrompt}</span>
			</div>
		</div>
	)
}
