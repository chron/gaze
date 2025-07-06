import { Outlet, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { MainSidebar } from "../components/MainSidebar"
import { SidebarProvider } from "../components/ui/sidebar"

export const Route = createRootRoute({
	component: () => (
		<SidebarProvider>
			<MainSidebar />
			<Outlet />
			<TanStackRouterDevtools />
		</SidebarProvider>
	),
})
