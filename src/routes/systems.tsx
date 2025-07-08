import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { GameSystemModal } from "../components/GameSystemModal"

export const Route = createFileRoute("/systems")({
	component: RouteComponent,
})

function RouteComponent() {
	const systems = useQuery(api.gameSystems.list)

	return (
		<div className="flex flex-col w-full gap-4 p-4">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Game Systems</h1>
				<GameSystemModal gameSystem={null} />
			</div>

			<div className="flex flex-col gap-4">
				{systems?.map((system) => (
					<div key={system._id}>
						<div className="flex justify-between items-center">
							<div className="flex flex-col gap-2">
								<div>
									{system.name} ({system.files?.length} files)
								</div>
								<div className="text-sm text-muted-foreground">
									{system.prompt}
								</div>
							</div>

							<GameSystemModal gameSystem={system} />
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
