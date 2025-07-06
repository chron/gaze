import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
	component: HomePage,
})

function HomePage() {
	return (
		<div className="p-8 text-center w-full h-full">
			<h1 className="text-4xl font-bold mb-4">Gaze Into The Abyss</h1>
			<p className="text-lg text-muted-foreground">
				Pretend this is a homepage
			</p>
		</div>
	)
}
