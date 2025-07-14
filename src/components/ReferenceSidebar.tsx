import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Plus } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { CampaignDetailsModal } from "./CampaignDetailsModal"
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarTrigger,
} from "./ui/sidebar"

type Props = {
	gameSystemId: Id<"gameSystems">
}

export const ReferenceSidebar: React.FC<Props> = ({ gameSystemId }) => {
	const gameSystem = useQuery(api.gameSystems.get, {
		id: gameSystemId,
	})

	if (!gameSystem || !gameSystem.reference) {
		return null
	}

	return (
		<>
			<Sidebar
				collapsible="offcanvas"
				side="right"
				style={{ "--sidebar-width": "50%" } as React.CSSProperties}
			>
				<SidebarHeader className="bg-blue-500">
					<div className="flex items-center gap-1">
						<SidebarTrigger className="" />
						<h2 className="font-title uppercase text-3xl text-right w-full">
							Reference
						</h2>
					</div>
				</SidebarHeader>
				<SidebarContent className="bg-blue-500 px-4 h-full">
					<div>
						<ReactMarkdown
							components={{
								h1: ({ children }) => (
									<h1 className="text-2xl font-bold text-white mb-4 first:mt-0 border-b border-blue-300 pb-2">
										{children}
									</h1>
								),
								h2: ({ children }) => (
									<h2 className="text-xl font-semibold text-white mb-3">
										{children}
									</h2>
								),
								h3: ({ children }) => (
									<h3 className="text-lg font-medium text-white mb-2">
										{children}
									</h3>
								),
								p: ({ children }) => (
									<p className="text-blue-50 mb-3 leading-relaxed">
										{children}
									</p>
								),
								ul: ({ children }) => (
									<ul className="text-blue-50 mb-3 pl-4 space-y-1">
										{children}
									</ul>
								),
								ol: ({ children }) => (
									<ol className="text-blue-50 mb-3 pl-4 space-y-1 list-decimal">
										{children}
									</ol>
								),
								li: ({ children }) => (
									<li className="text-blue-50 list-disc ml-4">{children}</li>
								),
								code: ({ children, className }) => {
									const isInline =
										!className || !className.includes("language-")
									return isInline ? (
										<code className="bg-blue-600 text-blue-100 px-1 py-0.5 rounded text-sm font-mono">
											{children}
										</code>
									) : (
										<code className="block bg-blue-600 text-blue-100 p-3 rounded-lg text-sm font-mono whitespace-pre-wrap mb-3">
											{children}
										</code>
									)
								},
								blockquote: ({ children }) => (
									<blockquote className="border-l-4 border-blue-300 pl-4 italic text-blue-100 mb-3">
										{children}
									</blockquote>
								),
								strong: ({ children }) => (
									<strong className="font-bold text-white">{children}</strong>
								),
								em: ({ children }) => (
									<em className="italic text-blue-100">{children}</em>
								),
								table: ({ children }) => (
									<table className="w-full border-collapse border border-blue-300 mb-3">
										{children}
									</table>
								),
								th: ({ children }) => (
									<th className="border border-blue-300 bg-blue-600 text-white p-2 font-semibold">
										{children}
									</th>
								),
								td: ({ children }) => (
									<td className="border border-blue-300 text-blue-50 p-2">
										{children}
									</td>
								),
							}}
						>
							{gameSystem.reference}
						</ReactMarkdown>
					</div>
				</SidebarContent>
			</Sidebar>
		</>
	)
}
