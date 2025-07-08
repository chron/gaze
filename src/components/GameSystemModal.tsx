import { useMutation, useQuery } from "convex/react"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { ResponsiveModal } from "./ResponsiveModal"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

type Props = {
	gameSystem: Doc<"gameSystems"> | null
}

export const GameSystemModal: React.FC<Props> = ({ gameSystem }) => {
	const [open, setOpen] = useState(false)

	const addSystem = useMutation(api.gameSystems.add)
	const updateSystem = useMutation(api.gameSystems.update)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const formData = new FormData(e.target as HTMLFormElement)
		const name = formData.get("name") as string
		const prompt = formData.get("prompt") as string

		if (gameSystem) {
			await updateSystem({ id: gameSystem._id, name, prompt })
		} else {
			await addSystem({ name, prompt })
		}

		setOpen(false)
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
				<Button type="submit">Save changes</Button>
			</form>
		</ResponsiveModal>
	)
}
