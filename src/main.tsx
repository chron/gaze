import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { ClerkProvider, useAuth } from "@clerk/clerk-react"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { env } from "../env"
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
	<ClerkProvider publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}>
		<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
			<ErrorBoundary>
				{/* <StrictMode> */}
				<RouterProvider router={router} />
				{/* </StrictMode> */}
			</ErrorBoundary>
		</ConvexProviderWithClerk>
	</ClerkProvider>,
)
