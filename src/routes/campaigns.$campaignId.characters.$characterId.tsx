import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useAction, useMutation, useQuery } from "convex/react"
import {
	AlertCircleIcon,
	EditIcon,
	Loader2,
	RefreshCcwIcon,
	TrashIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Button } from "../components/ui/button"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "../components/ui/collapsible"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"

export const Route = createFileRoute(
	"/campaigns/$campaignId/characters/$characterId",
)({
	component: CharacterDetailsPage,
})

function CharacterDetailsPage() {
	const navigate = useNavigate()
	const { campaignId, characterId } = Route.useParams()
	const character = useQuery(api.characters.get, {
		characterId: characterId as Id<"characters">,
	})
	const update = useMutation(api.characters.update)
	const deleteCharacter = useMutation(api.characters.destroy)
	const regenerateOutfit = useAction(
		api.characters.regenerateOutfitForCharacter,
	)
	const regenerateBaseImage = useAction(
		api.characters.generateImageForCharacter,
	)
	const updateOutfit = useMutation(api.characters.updateOutfit)
	const deleteOutfit = useMutation(api.characters.deleteOutfit)
	const setCurrentOutfit = useMutation(api.characters.setCurrentOutfit)

	const [isDeleting, setIsDeleting] = useState(false)
	const [regeneratingOutfit, setRegeneratingOutfit] = useState<string | null>(
		null,
	)
	const [regeneratingBase, setRegeneratingBase] = useState(false)
	const [editingOutfit, setEditingOutfit] = useState<string | null>(null)
	const [editingOutfitName, setEditingOutfitName] = useState("")
	const [editingOutfitDescription, setEditingOutfitDescription] = useState("")
	const [outfitExpanded, setOutfitExpanded] = useState<string | null>(null)

	const [name, setName] = useState("")
	const [description, setDescription] = useState("")
	const [imagePrompt, setImagePrompt] = useState("")
	const [notes, setNotes] = useState("")
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		if (character) {
			setName(character.name)
			setDescription(character.description)
			setImagePrompt(character.imagePrompt)
			setNotes(character.notes ?? "")
		}
	}, [character])

	if (!character) return null

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await update({
				characterId: character._id as Id<"characters">,
				name,
				description,
				imagePrompt,
				notes,
			})
			navigate({
				to: "/campaigns/$campaignId",
				params: { campaignId },
			})
		} finally {
			setIsSaving(false)
		}
	}

	const handleDelete = async () => {
		setIsDeleting(true)
		await deleteCharacter({ characterId: character._id as Id<"characters"> })
		navigate({ to: "/campaigns/$campaignId", params: { campaignId } })
	}

	const handleEditOutfit = (outfitName: string, description: string) => {
		setEditingOutfit(outfitName)
		setEditingOutfitName(outfitName)
		setEditingOutfitDescription(description)
	}

	const handleSaveOutfit = async () => {
		if (!editingOutfit) return
		await updateOutfit({
			characterId: character._id as Id<"characters">,
			oldOutfitName: editingOutfit,
			newOutfitName: editingOutfitName,
			outfitDescription: editingOutfitDescription,
		})
		setEditingOutfit(null)
		setEditingOutfitName("")
		setEditingOutfitDescription("")
	}

	const handleCancelEditOutfit = () => {
		setEditingOutfit(null)
		setEditingOutfitName("")
		setEditingOutfitDescription("")
	}

	const handleDeleteOutfit = async (outfitName: string) => {
		if (
			confirm(
				`Are you sure you want to delete the "${outfitName}" outfit? This cannot be undone.`,
			)
		) {
			await deleteOutfit({
				characterId: character._id as Id<"characters">,
				outfitName,
			})
		}
	}

	const handleSetCurrentOutfit = async (outfitName: string) => {
		await setCurrentOutfit({
			characterId: character._id as Id<"characters">,
			outfitName:
				character.currentOutfit === outfitName ? undefined : outfitName,
		})
	}

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: optional enhancement, you can always close via the button
		<div
			className="absolute inset-0 bg-black/30"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					navigate({ to: "/campaigns/$campaignId", params: { campaignId } })
				}
			}}
		>
			<div className="absolute right-0 top-0 h-full w-full max-w-[560px] bg-white shadow-xl p-6 overflow-y-auto">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-2xl font-title">Character Details</h2>
					<Button variant="ghost" asChild>
						<Link to="/campaigns/$campaignId" params={{ campaignId }}>
							Close
						</Link>
					</Button>
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="char-name">Name</Label>
						<Input
							id="char-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="char-description">Description</Label>
						<Textarea
							id="char-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="min-h-[120px]"
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="char-notes">Notes</Label>
						<Textarea
							id="char-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							className="min-h-[120px]"
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="char-image-prompt">Image Prompt</Label>
						<Textarea
							id="char-image-prompt"
							value={imagePrompt}
							onChange={(e) => setImagePrompt(e.target.value)}
							className="min-h-[120px]"
						/>
					</div>

					<div className="flex gap-2 justify-between">
						<Button
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-red-500 text-white me-auto"
						>
							Delete
						</Button>

						<Button onClick={handleSave} disabled={isSaving}>
							{isSaving ? "Saving..." : "Save"}
						</Button>
						<Button variant="outline" asChild>
							<Link to="/campaigns/$campaignId" params={{ campaignId }}>
								Cancel
							</Link>
						</Button>
					</div>

					{/* Display the current outfit image or base image */}
					{character.imageUrl && (
						<div className="flex flex-col gap-2">
							<Label>
								{character.currentOutfit
									? `Current Outfit: ${character.currentOutfit}`
									: "Base Image"}
							</Label>
							<img
								src={character.imageUrl}
								alt={character.name}
								className="w-full h-full object-contain rounded-md border border-gray-200"
							/>
						</div>
					)}

					<div className="flex flex-col gap-2">
						<Label>Outfits</Label>
						<div className="flex flex-col gap-2">
							{/* Base Outfit as first accordion item */}
							<Collapsible
								open={outfitExpanded === "__base__"}
								onOpenChange={(open) =>
									setOutfitExpanded(open ? "__base__" : null)
								}
							>
								<div className="border rounded-md overflow-hidden">
									<CollapsibleTrigger asChild>
										<button
											type="button"
											className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
										>
											<div className="flex items-center gap-3">
												{character.baseImageUrl ? (
													<img
														src={character.baseImageUrl}
														alt={character.name}
														className="w-12 h-12 object-cover rounded"
													/>
												) : (
													<div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
														<AlertCircleIcon className="w-6 h-6 text-gray-400" />
													</div>
												)}
												<div className="text-left">
													<div className="flex items-center gap-2">
														<span className="font-medium">Base</span>
														{!character.currentOutfit && (
															<span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
																Current
															</span>
														)}
														{!character.baseImageUrl && (
															<span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
																No Image
															</span>
														)}
													</div>
													<p className="text-sm text-gray-500 line-clamp-1">
														{character.description}
													</p>
												</div>
											</div>
											<span className="text-gray-400">
												{outfitExpanded === "__base__" ? "▲" : "▼"}
											</span>
										</button>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<div className="p-3 border-t bg-gray-50 space-y-3">
											<div className="text-sm">
												<p className="text-gray-700">{character.description}</p>
											</div>
											<div className="flex gap-2 flex-wrap">
												{character.currentOutfit && (
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleSetCurrentOutfit("")}
													>
														Set as Current
													</Button>
												)}
												<Button
													size="sm"
													variant="outline"
													onClick={async (e) => {
														e.preventDefault()
														e.stopPropagation()
														setRegeneratingBase(true)
														try {
															await regenerateBaseImage({
																characterId: character._id as Id<"characters">,
															})
														} finally {
															setRegeneratingBase(false)
														}
													}}
													disabled={regeneratingBase}
												>
													{regeneratingBase ? (
														<Loader2 className="w-3 h-3 mr-1 animate-spin" />
													) : (
														<RefreshCcwIcon className="w-3 h-3 mr-1" />
													)}
													{character.baseImageUrl ? "Regenerate" : "Generate"}
												</Button>
											</div>
										</div>
									</CollapsibleContent>
								</div>
							</Collapsible>

							{/* Other outfits */}
							{character.allOutfits?.map((outfit) => (
								<Collapsible
									key={outfit.name}
									open={outfitExpanded === outfit.name}
									onOpenChange={(open) =>
										setOutfitExpanded(open ? outfit.name : null)
									}
								>
									<div className="border rounded-md overflow-hidden">
										<CollapsibleTrigger asChild>
											<button
												type="button"
												className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
											>
												<div className="flex items-center gap-3">
													{outfit.imageUrl ? (
														<img
															src={outfit.imageUrl}
															alt={outfit.name}
															className="w-12 h-12 object-cover rounded"
														/>
													) : (
														<div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
															<AlertCircleIcon className="w-6 h-6 text-gray-400" />
														</div>
													)}
													<div className="text-left">
														<div className="flex items-center gap-2">
															<span className="font-medium">{outfit.name}</span>
															{character.currentOutfit === outfit.name && (
																<span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
																	Current
																</span>
															)}
															{!outfit.imageUrl && (
																<span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
																	No Image
																</span>
															)}
														</div>
														<p className="text-sm text-gray-500 line-clamp-1">
															{outfit.description}
														</p>
													</div>
												</div>
												<span className="text-gray-400">
													{outfitExpanded === outfit.name ? "▲" : "▼"}
												</span>
											</button>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<div className="p-3 border-t bg-gray-50 space-y-3">
												{editingOutfit === outfit.name ? (
													<>
														<div className="flex flex-col gap-2">
															<Label htmlFor={`outfit-name-${outfit.name}`}>
																Name
															</Label>
															<Input
																id={`outfit-name-${outfit.name}`}
																value={editingOutfitName}
																onChange={(e) =>
																	setEditingOutfitName(e.target.value)
																}
															/>
														</div>
														<div className="flex flex-col gap-2">
															<Label
																htmlFor={`outfit-description-${outfit.name}`}
															>
																Description
															</Label>
															<Textarea
																id={`outfit-description-${outfit.name}`}
																value={editingOutfitDescription}
																onChange={(e) =>
																	setEditingOutfitDescription(e.target.value)
																}
																className="min-h-[80px]"
															/>
														</div>
														<div className="flex gap-2">
															<Button
																size="sm"
																onClick={handleSaveOutfit}
																className="flex-1"
															>
																Save
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={handleCancelEditOutfit}
																className="flex-1"
															>
																Cancel
															</Button>
														</div>
													</>
												) : (
													<>
														<div className="text-sm">
															<p className="text-gray-700">
																{outfit.description}
															</p>
														</div>
														<div className="flex gap-2 flex-wrap">
															<Button
																size="sm"
																variant="outline"
																onClick={() =>
																	handleSetCurrentOutfit(outfit.name)
																}
															>
																{character.currentOutfit === outfit.name
																	? "Unset Current"
																	: "Set as Current"}
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={() =>
																	handleEditOutfit(
																		outfit.name,
																		outfit.description,
																	)
																}
															>
																<EditIcon className="w-3 h-3 mr-1" />
																Edit
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={async (e) => {
																	e.preventDefault()
																	e.stopPropagation()
																	setRegeneratingOutfit(outfit.name)
																	try {
																		await regenerateOutfit({
																			characterId:
																				character._id as Id<"characters">,
																			outfitName: outfit.name,
																		})
																	} finally {
																		setRegeneratingOutfit(null)
																	}
																}}
																disabled={regeneratingOutfit === outfit.name}
															>
																{regeneratingOutfit === outfit.name ? (
																	<Loader2 className="w-3 h-3 mr-1 animate-spin" />
																) : (
																	<RefreshCcwIcon className="w-3 h-3 mr-1" />
																)}
																{outfit.imageUrl ? "Regenerate" : "Generate"}
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={() => handleDeleteOutfit(outfit.name)}
																className="text-red-600 hover:text-red-700"
															>
																<TrashIcon className="w-3 h-3 mr-1" />
																Delete
															</Button>
														</div>
													</>
												)}
											</div>
										</CollapsibleContent>
									</div>
								</Collapsible>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
