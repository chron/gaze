import { CheckCircle } from "lucide-react"
import type React from "react"

type Props = {
	parameters: {
		plan: string
	}
}

export const PlanUpdate: React.FC<Props> = () => {
	return (
		<div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
			<CheckCircle className="h-4 w-4" />
			<span>Plan updated!</span>
		</div>
	)
}
