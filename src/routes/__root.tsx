import { Outlet, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { MainSidebar } from "../components/MainSidebar"
import { SidebarProvider, SidebarTrigger } from "../components/ui/sidebar"

export const Route = createRootRoute({
	component: () => (
		<SidebarProvider>
			<SidebarTrigger />
			<MainSidebar />
			<Outlet />
			<TanStackRouterDevtools />
		</SidebarProvider>
	),
})
