type Props = {
	parameters: {
		name: string
		description: string
	}
}

export const CharacterIntroduction: React.FC<Props> = ({ parameters }) => {
	return (
		<div className="rounded-md border border-gray-200 bg-teal-600 text-white p-2">
			<h3 className="text-lg font-bold">New character: {parameters.name}</h3>
			<p>{parameters.description}</p>
		</div>
	)
}
