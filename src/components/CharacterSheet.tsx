import type { JSONValue } from "ai"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Badge } from "./ui/badge"
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
		<div className="flex flex-col gap-2 px-4 h-full max-h-[calc(100dvh-52px)] overflow-y-auto pb-4">
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

const RecursiveStatBlock: React.FC<{
	name: string
	value: JSONValue
	showName?: boolean
}> = ({ name, value, showName = true }) => {
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
					{showName && <StatLabel name={name} />}

					<StatBar current={value.current} max={value.max} />
				</>
			)
		}

		if (Array.isArray(value)) {
			return (
				<>
					{showName && <StatLabel name={name} />}

					{value.length > 0 ? (
						typeof value[0] === "string" ? (
							<ul className="list-disc list-inside">
								{value.map((item, index) => (
									<li className="text-sm" key={`${item}-${index}`}>
										<PrimitiveValue value={item} />
									</li>
								))}
							</ul>
						) : (
							<div className="flex flex-col gap-2">
								{value.map((item, index) => (
									<RecursiveStatBlock
										showName={false}
										key={`${name}-${index}`}
										name={name}
										value={item}
									/>
								))}
							</div>
						)
					) : (
						<div>–</div>
					)}
				</>
			)
		}

		return (
			<>
				{showName && <StatLabel name={name} />}

				<table className="table-auto border-collapse border border-gray-300 text-left text-sm">
					<tbody>
						{Object.entries(value).map(([key, val]) => (
							<tr key={key} className="border-b border-gray-200">
								<td className="px-2 py-1 font-semibold whitespace-nowrap align-top border-r border-gray-200">
									<StatLabel name={key} />
								</td>
								<td className="px-2 py-1 align-top">
									<PrimitiveValue value={val} parentValue={key} />
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
				{showName && <StatLabel name={name} />}
				<PrimitiveValue value={value} />
			</>
		)
	}

	// Backup plan if we can't figure out what it is
	return (
		<>
			{showName && <StatLabel name={name} />}

			<PrimitiveValue value={value} />
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

const PrimitiveValue: React.FC<{
	value: JSONValue
	inline?: boolean
	parentValue?: string
}> = ({ value, parentValue, inline = false }) => {
	const Element = inline ? "span" : "div"

	if (parentValue?.toLowerCase().includes("tags") && Array.isArray(value)) {
		return (
			<div className="flex flex-wrap gap-2">
				{value.map((item, index) => (
					<Badge key={`${item}-${index}`}>{item}</Badge>
				))}
			</div>
		)
	}

	if (typeof value === "string") {
		return <Element className="whitespace-pre-wrap">{value}</Element>
	}

	if (value === null) {
		return <Element className="text-gray-400">–</Element>
	}

	return <Element>{JSON.stringify(value, null, 2)}</Element>
}
