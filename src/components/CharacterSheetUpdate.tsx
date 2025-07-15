type Props = {
	parameters: {
		name: string
		description: string
		data: Record<string, unknown>
	}
}

export const CharacterSheetUpdate: React.FC<Props> = () => {
	return (
		<div className="rounded-md border border-gray-200 bg-blue-800 text-white p-2">
			<h3 className="text-lg font-bold">Character Sheet Updated!</h3>
		</div>
	)
}
