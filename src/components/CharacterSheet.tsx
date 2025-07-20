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
				<h1 className="text-2xl font-title text-white">Characters</h1>
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
			<div className="flex flex-col gap-2 rounded-lg bg-white p-4">
				<h1 className="text-2xl font-title">{characterSheet.name}</h1>
				<p className="text-sm text-gray-500">{characterSheet.description}</p>

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
					<pre className="text-sm text-gray-500 whitespace-pre-wrap">
						{JSON.stringify(characterSheet.data, null, 2)}
					</pre>
				)}
			</div>
		</div>
	)
}
