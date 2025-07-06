import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { routeTree } from "./routeTree.gen"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

// biome-ignore lint/style/noNonNullAssertion: if root isn't here we have bigger problems
createRoot(document.getElementById("root")!).render(
	<ConvexProvider client={convex}>
		<ErrorBoundary>
			<StrictMode>
				<RouterProvider router={router} />
			</StrictMode>
		</ErrorBoundary>
	</ConvexProvider>,
)
