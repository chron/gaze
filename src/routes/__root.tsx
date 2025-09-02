import { SignInButton } from "@clerk/clerk-react"
import { Outlet, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react"
import { Loader2 } from "lucide-react"
import { MainSidebar } from "../components/MainSidebar"
import { SidebarProvider, SidebarTrigger } from "../components/ui/sidebar"

export const Route = createRootRoute({
	component: () => (
		<>
			<Unauthenticated>
				<SignInButton />
			</Unauthenticated>

			<Authenticated>
				<SidebarProvider>
					<MainSidebar />

					<main className="w-full relative max-h-screen overflow-hidden">
						<SidebarTrigger className="absolute top-3 left-2 text-white z-1" />
						<Outlet />
					</main>

					<TanStackRouterDevtools />
				</SidebarProvider>
			</Authenticated>

			<AuthLoading>
				<Loader2 className="animate-spin" />
			</AuthLoading>
		</>
	),
})
