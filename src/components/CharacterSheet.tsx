import type { JSONValue } from "ai"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"

type Props = {
	campaignId: Id<"campaigns">
}

export const CharacterSheet: React.FC<Props> = ({ campaignId }) => {
	const characterSheet = useQuery(api.characterSheets.get, { campaignId })
	const updateCharacterSheet = useMutation(api.characterSheets.update)

	const [isEditing, setIsEditing] = useState(false)
	const [editingJson, setEditingJson] = useState("")
	const [jsonError, setJsonError] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)

	if (!characterSheet) {
		return null
	}

	const handleEditClick = () => {
		setEditingJson(JSON.stringify(characterSheet.data, null, 2))
		setJsonError(null)
		setIsEditing(true)
	}

	const handleCancelEdit = () => {
		setIsEditing(false)
		setEditingJson("")
		setJsonError(null)
	}

	const handleSaveEdit = async () => {
		try {
			setJsonError(null)
			const parsedData = JSON.parse(editingJson)

			setIsSaving(true)
			await updateCharacterSheet({
				characterSheetId: characterSheet._id,
				name: characterSheet.name,
				description: characterSheet.description || "",
				data: parsedData,
			})

			setIsEditing(false)
			setEditingJson("")
		} catch (error) {
			if (error instanceof SyntaxError) {
				setJsonError(`Invalid JSON: ${error.message}`)
			} else {
				setJsonError("Failed to save character sheet")
			}
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className="flex flex-col gap-2 px-4 h-full">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-title text-white">Character Sheet</h1>
				{!isEditing ? (
					<Button variant="outline" size="sm" onClick={handleEditClick}>
						Edit JSON
					</Button>
				) : (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleCancelEdit}
							disabled={isSaving}
						>
							Cancel
						</Button>
						<Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
							{isSaving ? "Saving..." : "Save"}
						</Button>
					</div>
				)}
			</div>
			<div className="flex flex-col rounded-lg bg-white gap-4 p-4">
				<h1 className="text-2xl font-title">{characterSheet.name}</h1>
				<p className="text-sm bg-gray-800 text-white p-4 rounded-lg">
					{characterSheet.description}
				</p>

				{isEditing ? (
					<div className="flex flex-col gap-2">
						<Textarea
							value={editingJson}
							onChange={(e) => setEditingJson(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && e.metaKey) {
									e.preventDefault()
									handleSaveEdit()
								}
							}}
							className="min-h-[300px] font-mono text-sm"
							placeholder="Enter JSON data..."
						/>
						{jsonError && <p className="text-sm text-red-500">{jsonError}</p>}
					</div>
				) : (
					<div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 items-start">
						{Object.entries(characterSheet.data ?? {}).map(([key, value]) => {
							return <RecursiveStatBlock key={key} name={key} value={value} />
						})}
					</div>
				)}
			</div>
		</div>
	)
}

const RecursiveStatBlock: React.FC<{ name: string; value: JSONValue }> = ({
	name,
	value,
}) => {
	if (typeof value === "object" && value !== null) {
		// Special case for stat bars, objects of the form { current: number, max: number }
		if (
			Object.keys(value).length === 2 &&
			"current" in value &&
			"max" in value &&
			typeof value.current === "number" &&
			typeof value.max === "number"
		) {
			return (
				<>
					<StatLabel name={name} />

					<StatBar current={value.current} max={value.max} />
				</>
			)
		}

		if (Array.isArray(value)) {
			return (
				<>
					<StatLabel name={name} />

					{value.length > 0 ? (
						<ul className="list-disc list-inside">
							{value.map((item, index) => (
								<li className="text-sm" key={`${item}-${index}`}>
									<PrimitiveValue value={item} />
								</li>
							))}
						</ul>
					) : (
						<div>–</div>
					)}
				</>
			)
		}

		return (
			<>
				<StatLabel name={name} />

				<table className="table-auto border-collapse border border-gray-300 text-left text-sm">
					<tbody>
						{Object.entries(value).map(([key, val]) => (
							<tr key={key} className="border-b border-gray-200">
								<td className="px-2 py-1 font-semibold whitespace-nowrap align-top border-r border-gray-200">
									<StatLabel name={key} />
								</td>
								<td className="px-2 py-1 align-top">
									<PrimitiveValue value={val} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</>
		)
	}

	if (typeof value === "string") {
		return (
			<>
				<StatLabel name={name} />
				<PrimitiveValue value={value} />
			</>
		)
	}

	// Backup plan if we can't figure out what it is
	return (
		<>
			<StatLabel name={name} />

			<div>{JSON.stringify(value, null, 2)}</div>
		</>
	)
}

const StatBar: React.FC<{ current: number; max: number }> = ({
	current,
	max,
}) => {
	return (
		<div className="flex gap-4 w-full items-center">
			<div className="h-2 bg-gray-200 rounded-full overflow-hidden flex-grow-1">
				<div
					className="h-full bg-blue-500"
					style={{ width: `${(current / max) * 100}%` }}
				/>
			</div>
			<div className="text-sm text-gray-500">
				{current} / {max}
			</div>
		</div>
	)
}

const StatLabel: React.FC<{ name: string }> = ({ name }) => {
	const friendlyName = name
		.replace(/_/g, " ")
		.replace(/^\w/, (c) => c.toUpperCase())

	return <div className="font-semibold">{friendlyName}</div>
}

const PrimitiveValue: React.FC<{ value: JSONValue }> = ({ value }) => {
	if (typeof value === "string") {
		return <div className="whitespace-pre-wrap">{value}</div>
	}

	return <div>{JSON.stringify(value, null, 2)}</div>
}
