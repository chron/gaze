import { useMutation, useQuery } from "convex/react"
import { Code, FileIcon, FileText, Globe, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { ResponsiveModal } from "./ResponsiveModal"
import { Button } from "./ui/button"
import { FileUpload } from "./ui/file-upload"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"

type Props = {
	gameSystem: Doc<"gameSystems"> | null
}

export const GameSystemModal: React.FC<Props> = ({ gameSystem }) => {
	const [open, setOpen] = useState(false)

	const addSystem = useMutation(api.gameSystems.add)
	const updateSystem = useMutation(api.gameSystems.update)

	const generateUploadUrl = useMutation(api.gameSystems.generateUploadUrl)
	const addFile = useMutation(api.gameSystems.addFile)

	// Get game system with files when editing
	const gameSystemWithFiles = useQuery(
		api.gameSystems.getWithFiles,
		gameSystem ? { id: gameSystem._id } : "skip",
	)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const formData = new FormData(e.target as HTMLFormElement)
		const name = formData.get("name") as string
		const prompt = formData.get("prompt") as string
		const defaultCharacterData = formData.get("defaultCharacterData") as string

		if (gameSystem) {
			await updateSystem({
				id: gameSystem._id,
				name,
				prompt,
				defaultCharacterData: JSON.parse(defaultCharacterData),
			})
		} else {
			await addSystem({
				name,
				prompt,
				defaultCharacterData: JSON.parse(defaultCharacterData),
			})
		}

		setOpen(false)
	}

	const handleFileUpload = async (file: File) => {
		if (!gameSystem) {
			throw new Error(
				"Please save the game system first before uploading files",
			)
		}

		try {
			// Step 1: Generate upload URL
			const uploadUrl = await generateUploadUrl()

			// Step 2: Upload file to Convex storage
			const response = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			})

			if (!response.ok) {
				throw new Error("Failed to upload file")
			}

			const { storageId } = await response.json()

			// Step 3: Add file to game system
			await addFile({
				storageId: storageId as Id<"_storage">,
				gameSystemId: gameSystem._id,
				filename: file.name,
			})
		} catch (error) {
			console.error("File upload failed:", error)
			throw error
		}
	}

	const formatFileSize = (bytes: number): string => {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}

	const getFileIcon = (contentType: string) => {
		if (contentType === "application/pdf") {
			return <FileText className="h-5 w-5 text-red-500" />
		}
		if (contentType === "text/html") {
			return <Globe className="h-5 w-5 text-orange-500" />
		}
		if (contentType.includes("xml") || contentType.includes("markdown")) {
			return <Code className="h-5 w-5 text-blue-500" />
		}
		if (contentType === "text/plain" || contentType.includes("rtf")) {
			return <FileIcon className="h-5 w-5 text-gray-500" />
		}
		return <FileText className="h-5 w-5 text-gray-500" />
	}

	return (
		<ResponsiveModal
			open={open}
			setOpen={setOpen}
			title="Edit system"
			trigger={
				gameSystem ? (
					<Button variant="ghost" size="icon">
						<Pencil />
					</Button>
				) : (
					<Button>Add System</Button>
				)
			}
		>
			<form className="grid items-start gap-6" onSubmit={handleSubmit}>
				<div className="grid gap-3">
					<Label htmlFor="name">Name</Label>
					<Input
						type="name"
						id="name"
						name="name"
						defaultValue={gameSystem?.name}
					/>
				</div>

				<div className="grid gap-3">
					<Label htmlFor="prompt">Prompt</Label>
					<Input
						type="text"
						id="prompt"
						name="prompt"
						defaultValue={gameSystem?.prompt}
					/>
				</div>

				<div className="grid gap-3">
					<Label htmlFor="prompt">Default character data</Label>
					<Textarea
						id="defaultCharacterData"
						name="defaultCharacterData"
						defaultValue={JSON.stringify(
							gameSystem?.defaultCharacterData,
							null,
							2,
						)}
					/>
				</div>

				{gameSystem && (
					<div className="grid gap-3">
						<Label>Files</Label>

						{/* Display existing files */}
						{gameSystemWithFiles?.filesWithMetadata &&
							gameSystemWithFiles.filesWithMetadata.length > 0 && (
								<div className="space-y-2 mb-4">
									{gameSystemWithFiles.filesWithMetadata.map((file) => (
										<div
											key={file.id}
											className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
										>
											{getFileIcon(file.contentType)}
											<div className="flex-1">
												<div className="flex items-center justify-between">
													<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
														{file.name}
													</span>
													<span className="text-xs text-gray-500">
														{formatFileSize(file.size)}
													</span>
												</div>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => window.open(file.url || "", "_blank")}
												className="h-8 w-8 p-0"
												title="Open file"
											>
												<FileText className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							)}

						{/* File upload component */}
						<FileUpload
							onFileUpload={handleFileUpload}
							maxSizeInBytes={50 * 1024 * 1024} // 50MB
							acceptedTypes={[
								"application/pdf",
								"text/plain",
								"text/html",
								"text/xml",
								"application/xml",
								"text/markdown",
								"text/x-markdown",
								"application/rtf",
								"text/rtf",
							]}
						/>
					</div>
				)}

				<Button type="submit">Save changes</Button>
			</form>
		</ResponsiveModal>
	)
}
