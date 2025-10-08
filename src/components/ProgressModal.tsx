import { useQuery } from "convex/react"
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "./ui/dialog"

type Props = {
	isOpen: boolean
	jobId: Id<"jobProgress"> | null
	onClose: () => void
	title?: string
	description?: string
}

export const ProgressModal: React.FC<Props> = ({
	isOpen,
	jobId,
	onClose,
	title = "Processing",
	description = "Please wait while we process your request",
}) => {
	const job = useQuery(api.jobProgress.get, jobId ? { jobId } : "skip")
	const [visibleSteps, setVisibleSteps] = useState<number[]>([])

	// Track which steps have become visible for fade-in animation
	useEffect(() => {
		if (!job) return

		const currentStepCount = job.steps.length
		const visibleStepCount = visibleSteps.length

		if (currentStepCount > visibleStepCount) {
			// New steps have been added, reveal them one by one with a delay
			const newStepIndices = Array.from(
				{ length: currentStepCount - visibleStepCount },
				(_, i) => visibleStepCount + i,
			)

			newStepIndices.forEach((index, offset) => {
				setTimeout(() => {
					setVisibleSteps((prev) => [...prev, index])
				}, offset * 150) // Stagger the fade-in by 150ms
			})
		}
	}, [job, visibleSteps.length])

	// Reset visible steps when modal opens/closes
	useEffect(() => {
		if (!isOpen) {
			setVisibleSteps([])
		}
	}, [isOpen])

	// Auto-close after completion with a delay
	useEffect(() => {
		if (job?.status === "completed") {
			const timer = setTimeout(() => {
				onClose()
			}, 8000)
			return () => clearTimeout(timer)
		}
	}, [job?.status, onClose])

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-3xl max-h-[85dvh] flex flex-col">
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>

				<div className="space-y-2 mt-4 overflow-y-auto flex-1">
					{!job ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-2" />
							<span className="text-sm text-gray-600">Initializing...</span>
						</div>
					) : (
						<>
							{job.steps.map((step, index) => {
								const isVisible = visibleSteps.includes(index)

								return (
									<div
										key={`${job._id}-${index}`}
										className={`
											flex items-start gap-2 p-3 rounded-lg border
											transition-all duration-500 ease-out
											${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
											${step.status === "completed" ? "bg-green-50 border-green-200" : ""}
											${step.status === "failed" ? "bg-red-50 border-red-200" : ""}
											${step.status === "running" ? "bg-blue-50 border-blue-200" : ""}
											${step.status === "pending" ? "bg-gray-50 border-gray-200" : ""}
										`}
									>
										<div className="flex-shrink-0 mt-0.5">
											{step.status === "completed" && (
												<CheckCircle2 className="w-4 h-4 text-green-600" />
											)}
											{step.status === "running" && (
												<Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
											)}
											{step.status === "pending" && (
												<Circle className="w-4 h-4 text-gray-400" />
											)}
											{step.status === "failed" && (
												<XCircle className="w-4 h-4 text-red-600" />
											)}
										</div>

										<div className="flex-1 min-w-0">
											<h3 className="font-medium text-sm">{step.title}</h3>
											{step.data?.summary ? (
												<div
													className={`
														mt-1.5 p-2.5 rounded bg-white text-sm text-gray-700 border border-gray-200
														transition-all duration-500 delay-200
														${step.status === "completed" ? "opacity-100" : "opacity-0 max-h-0 p-0"}
													`}
												>
													<p className="leading-relaxed">{step.data.summary}</p>
													{step.data.characters &&
														step.data.characters.length > 0 && (
															<div className="mt-2 flex flex-wrap gap-1">
																{step.data.characters.map((char: string) => (
																	<span
																		key={char}
																		className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded"
																	>
																		{char}
																	</span>
																))}
															</div>
														)}
												</div>
											) : (
												step.description && (
													<p className="text-xs text-gray-600 mt-0.5">
														{step.description}
													</p>
												)
											)}
										</div>
									</div>
								)
							})}

							{job.status === "failed" && job.error && (
								<div className="p-3 rounded-lg bg-red-50 border border-red-200">
									<h3 className="font-medium text-sm text-red-800 mb-1">
										Error
									</h3>
									<p className="text-sm text-red-600">{job.error}</p>
								</div>
							)}

							{job.status === "completed" && (
								<div className="text-center text-sm text-green-600 font-medium py-2">
									✓ Completed successfully
								</div>
							)}
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
