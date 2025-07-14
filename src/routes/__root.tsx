import { Outlet, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { MainSidebar } from "../components/MainSidebar"
import { SidebarProvider, SidebarTrigger } from "../components/ui/sidebar"

export const Route = createRootRoute({
	component: () => (
		<SidebarProvider>
			<MainSidebar />

			<main className="w-full relative">
				<SidebarTrigger className="absolute top-3 left-2 text-white" />
				<Outlet />
			</main>

			<TanStackRouterDevtools />
		</SidebarProvider>
	),
})
