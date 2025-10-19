import { Link, createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "convex/react"
import { ArrowUpDown, Plus, X } from "lucide-react"
import { useMemo, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { RECENT_CAMPAIGNS_CONTEXT_COUNT } from "../../convex/utils"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { DataTable } from "../components/ui/data-table"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../components/ui/tooltip"

export const Route = createFileRoute("/")({
	component: HomePage,
})

type CampaignWithDetails = Doc<"campaigns"> & {
	gameSystemName: string | null | undefined
	primaryCharacterImageUrl: string | null
}

function formatNumber(num: number): string {
	return new Intl.NumberFormat().format(num)
}

function formatDate(timestamp: number): string {
	const date = new Date(timestamp)
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
	const diffMinutes = Math.floor(diffMs / (1000 * 60))

	if (diffMinutes < 1) return "Just now"
	if (diffMinutes < 60) return `${diffMinutes}m ago`
	if (diffHours < 24) return `${diffHours}h ago`
	if (diffDays < 7) return `${diffDays}d ago`
	if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
	if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
	return `${Math.floor(diffDays / 365)}y ago`
}

function truncateText(text: string, maxLength = 60): string {
	if (text.length <= maxLength) return text
	return `${text.slice(0, maxLength)}...`
}

const columns: ColumnDef<CampaignWithDetails>[] = [
	{
		accessorKey: "primaryCharacterImageUrl",
		header: "",
		cell: ({ row }) => {
			const imageUrl = row.getValue("primaryCharacterImageUrl") as string | null
			const campaignName = row.original.name

			return (
				<div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
					{imageUrl ? (
						<img
							src={imageUrl}
							alt={campaignName}
							className="w-full h-full object-cover object-top"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-semibold">
							{campaignName[0]?.toUpperCase() || "?"}
						</div>
					)}
				</div>
			)
		},
	},
	{
		accessorKey: "name",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="hover:bg-transparent !px-0 py-0 font-semibold"
				>
					Campaign
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			)
		},
		cell: ({ row }) => {
			const campaign = row.original
			return (
				<Link
					to="/campaigns/$campaignId"
					params={{ campaignId: campaign._id }}
					className="font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
				>
					{campaign.name}
				</Link>
			)
		},
		size: 180,
	},
	{
		accessorKey: "messageCount",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="hover:bg-transparent !px-0 py-0 font-semibold"
				>
					Msgs
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			)
		},
		cell: ({ row }) => {
			const count = row.getValue("messageCount") as number
			const messageCountAtLastSummary = row.original.messageCountAtLastSummary
			const messagesSinceLastSummary = count - messageCountAtLastSummary
			const needsSummary = messagesSinceLastSummary > 100

			if (needsSummary) {
				return (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="text-red-600 font-semibold whitespace-nowrap cursor-help">
									{formatNumber(count)}
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									Over 100 messages since last summary (
									{messagesSinceLastSummary} new messages)
								</p>
								<p className="text-xs text-gray-400 mt-1">
									Last summary at: {formatNumber(messageCountAtLastSummary)}{" "}
									messages
								</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)
			}

			return (
				<div className="text-gray-700 whitespace-nowrap">
					{formatNumber(count)}
				</div>
			)
		},
		size: 80,
	},
	{
		accessorKey: "_creationTime",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="hover:bg-transparent !px-0 py-0 font-semibold hidden md:flex"
				>
					Created
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			)
		},
		cell: ({ row }) => {
			const creationTime = row.getValue("_creationTime") as number
			return (
				<div className="hidden md:block text-gray-600 text-sm whitespace-nowrap">
					{formatDate(creationTime)}
				</div>
			)
		},
	},
	{
		accessorKey: "lastInteractionAt",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="hover:bg-transparent !px-0 py-0 font-semibold hidden md:flex"
				>
					Last Played
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			)
		},
		cell: ({ row }) => {
			const lastInteraction = row.getValue("lastInteractionAt") as
				| number
				| undefined
			const creationTime = row.original._creationTime
			const timestamp = lastInteraction || creationTime
			return (
				<div className="hidden md:block text-gray-600 text-sm whitespace-nowrap">
					{formatDate(timestamp)}
				</div>
			)
		},
	},
	{
		accessorKey: "description",
		header: () => (
			<div className="hidden xl:block font-semibold">Description</div>
		),
		cell: ({ row }) => {
			const description = row.getValue("description") as string
			const truncated = truncateText(description, 50)
			const isTruncated = description.length > 50

			if (!isTruncated) {
				return (
					<div className="hidden xl:block text-gray-600 text-sm">
						{description}
					</div>
				)
			}

			return (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="hidden xl:block text-gray-600 text-sm cursor-help">
								{truncated}
							</div>
						</TooltipTrigger>
						<TooltipContent className="max-w-sm">
							<p>{description}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)
		},
		size: 250,
	},
	{
		accessorKey: "tags",
		header: () => <div className="hidden lg:block font-semibold">Tags</div>,
		cell: ({ row }) => {
			const tags = (row.getValue("tags") as string[] | undefined) || []

			if (tags.length === 0) {
				return <div className="hidden lg:block text-gray-400 text-xs">—</div>
			}

			return (
				<div className="hidden lg:flex gap-1 flex-wrap">
					{tags.map((tag) => (
						<Badge key={tag} className="text-[10px] px-1.5 py-0 h-5 leading-5">
							{tag}
						</Badge>
					))}
				</div>
			)
		},
		size: 200,
	},
]

function HomePage() {
	const campaigns = useQuery(api.campaigns.listWithDetails, {})
	const [selectedTag, setSelectedTag] = useState<string | null>(null)

	// Get all unique tags from campaigns
	const allTags = useMemo(() => {
		if (!campaigns) return []
		const tagSet = new Set<string>()
		for (const campaign of campaigns) {
			if (campaign.tags) {
				for (const tag of campaign.tags) {
					tagSet.add(tag)
				}
			}
		}
		return Array.from(tagSet).sort()
	}, [campaigns])

	// Filter campaigns by selected tag
	const filteredCampaigns = useMemo(() => {
		if (!campaigns) return undefined
		if (!selectedTag) return campaigns
		return campaigns.filter((campaign) => campaign.tags?.includes(selectedTag))
	}, [campaigns, selectedTag])

	if (campaigns === undefined) {
		return (
			<div className="p-4 w-full h-full bg-blue-500 flex items-center justify-center">
				<h1 className="text-6xl font-title text-white mb-2 ms-10">
					Gaze Into The Abyss
				</h1>
			</div>
		)
	}

	return (
		<div className="p-4 md:p-6 lg:p-8 w-full h-full bg-blue-500 overflow-y-auto">
			<div className="max-w-7xl mx-auto">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="text-3xl md:text-4xl font-title text-white mb-2">
							Gaze Into The Abyss
						</h1>
						<p className="text-blue-100 text-sm">
							{filteredCampaigns?.length || 0}{" "}
							{(filteredCampaigns?.length || 0) === 1
								? "campaign"
								: "campaigns"}
							{selectedTag && " · filtered by tag"}
						</p>
					</div>
					<Button className="gap-2" asChild>
						<Link to="/campaigns/new">
							<Plus size={16} />
							<span className="hidden sm:inline">New Campaign</span>
							<span className="sm:hidden">New</span>
						</Link>
					</Button>
				</div>

				{/* Tag Filter */}
				{allTags.length > 0 && (
					<div className="mb-4 flex flex-wrap gap-2 items-center">
						<span className="text-white text-sm font-medium">Filter:</span>
						{allTags.map((tag) => (
							<Badge
								key={tag}
								variant={selectedTag === tag ? "default" : "secondary"}
								className="cursor-pointer hover:opacity-80 transition-opacity"
								onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
							>
								{tag}
								{selectedTag === tag && <X className="ml-1 h-3 w-3" />}
							</Badge>
						))}
						{selectedTag && (
							<Button
								variant="ghost"
								size="sm"
								className="text-white hover:bg-white/20 h-7"
								onClick={() => setSelectedTag(null)}
							>
								Clear filter
							</Button>
						)}
					</div>
				)}

				{filteredCampaigns && filteredCampaigns.length === 0 ? (
					<div className="bg-white rounded-lg shadow p-12 text-center">
						<p className="text-lg text-gray-600 mb-6">
							No campaigns yet. Create your first campaign to get started!
						</p>
						<Button className="gap-2" size="lg" asChild>
							<Link to="/campaigns/new">
								<Plus size={16} />
								Create Your First Campaign
							</Link>
						</Button>
					</div>
				) : (
					filteredCampaigns && (
						<DataTable
							columns={columns}
							data={filteredCampaigns}
							getRowClassName={(row) => {
								// Highlight the most recent campaigns that are included as context for new campaign creation
								// Only show highlight when viewing all campaigns (no tag filter)
								// and using default sort (by last interaction/creation time)
								const rowIndex = row.index
								const isInContextGroup =
									rowIndex < RECENT_CAMPAIGNS_CONTEXT_COUNT
								const isDefaultView = !selectedTag

								if (isInContextGroup && isDefaultView) {
									return "bg-blue-50"
								}
								return ""
							}}
						/>
					)
				)}
			</div>
		</div>
	)
}
