type Props = {
	results: number[]
	bonus: number
	total: number
}

export const DiceRollResult: React.FC<Props> = ({ results, bonus, total }) => {
	return (
		<div className="bg-white p-4 mx-auto rounded-md">
			You rolled:{" "}
			{results.map((result, index) => (
				<div
					key={`dice-roll-result-${result}-${index}`}
					className="inline-flex items-center justify-center w-8 h-8 bg-gray-600 text-white rounded border-2 font-bold text-gray-800"
				>
					{result}
				</div>
			))}{" "}
			{bonus > 0 ? `+ ${bonus}` : bonus < 0 ? bonus : ""}
			{results.length > 1 ? `for a total of ${total}` : ""}
		</div>
	)
}
