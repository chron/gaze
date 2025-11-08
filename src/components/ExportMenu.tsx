import { useAction } from "convex/react"
import { Download } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import { Button } from "./ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu"

export function ExportMenu() {
	const [isExporting, setIsExporting] = useState(false)
	const exportRecentCampaigns = useAction(api.campaigns.exportRecentCampaigns)

	const handleExportRecentCampaigns = async () => {
		setIsExporting(true)
		try {
			const markdown = await exportRecentCampaigns()

			// Create a blob and download it
			const blob = new Blob([markdown], { type: "text/markdown" })
			const url = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = url
			a.download = `recent-campaigns-${new Date().toISOString().split("T")[0]}.md`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
		} catch (error) {
			console.error("Failed to export campaigns:", error)
		} finally {
			setIsExporting(false)
		}
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Download size={16} />
					<span className="hidden sm:inline">Export</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={handleExportRecentCampaigns}
					disabled={isExporting}
				>
					{isExporting ? "Exporting..." : "Recent Campaigns Summary"}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

