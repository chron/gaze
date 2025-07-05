import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { App } from "./App.tsx"
import { ErrorBoundary } from "./components/ErrorBoundary"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

// biome-ignore lint/style/noNonNullAssertion: if root isn't here we have bigger problems
createRoot(document.getElementById("root")!).render(
	<ConvexProvider client={convex}>
		<ErrorBoundary>
			<StrictMode>
				<App />
			</StrictMode>
		</ErrorBoundary>
	</ConvexProvider>,
)
