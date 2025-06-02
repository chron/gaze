import { ChatInterface } from "./components/ChatInterface"
import { MainSidebar } from "./components/MainSidebar"
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar"

export const App: React.FC = () => {
	return (
		<>
			<SidebarProvider>
				<SidebarTrigger />
				<MainSidebar />
				<ChatInterface />
			</SidebarProvider>
		</>
	)
}
