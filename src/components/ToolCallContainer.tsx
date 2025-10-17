import type { LucideIcon } from "lucide-react"
import type React from "react"
import type { ReactNode } from "react"
import { cn } from "../lib/utils"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "./ui/accordion"

type ToolCallContainerProps = {
	icon?: LucideIcon
	iconSlot?: ReactNode
	title: string
	children?: ReactNode
	defaultOpen?: boolean
	className?: string
}

export const ToolCallContainer: React.FC<ToolCallContainerProps> = ({
	icon: Icon,
	iconSlot,
	title,
	children,
	defaultOpen = false,
	className,
}) => {
	const isFirst = className?.includes("first-tool-call")
	const isLast = className?.includes("last-tool-call")

	return (
		<div
			className={cn(
				"tool-call-container relative bg-white",
				// First item: top, left, right borders + top radius (NO bottom border)
				isFirst &&
					"border-t border-l border-r border-gray-200 rounded-t-lg mt-2",
				// Middle items: left and right borders only
				!isFirst && !isLast && "border-l border-r border-gray-200",
				// Last item: left, right, bottom borders + bottom radius
				isLast &&
					!isFirst &&
					"border-l border-r border-b border-gray-200 rounded-b-lg",
				// Last item when it's also first (single item): full border
				isFirst && isLast && "border-b rounded-b-lg",
				// Pull up to overlap with previous item
				!isFirst && "-mt-2",
				className,
			)}
		>
			<Accordion
				type="single"
				collapsible
				defaultValue={defaultOpen ? "item-1" : undefined}
			>
				<AccordionItem value="item-1" className="border-none">
					{/* Vertical line connecting upward to previous icon (hidden on first item) */}
					{!isFirst && (
						<div className="absolute left-[calc(0.75rem+1rem)] top-0 h-10 w-[1.5px] bg-gray-200" />
					)}

					{/* Vertical line connecting downward (hidden on last item) */}
					{children && !isLast && (
						<div className="absolute left-[calc(0.75rem+1rem)] top-10 bottom-0 w-[1.5px] bg-gray-200" />
					)}

					<AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-gray-50 transition-colors [&>svg]:hidden cursor-pointer">
						<div className="flex items-center gap-2.5 text-sm font-medium">
							{/* Icon with circular background */}
							<div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-400 flex-shrink-0 relative z-10">
								{iconSlot ? (
									iconSlot
								) : Icon ? (
									<Icon className="h-4 w-4 text-gray-600" />
								) : null}
							</div>
							<span className="text-gray-700 text-left">{title}</span>
						</div>
					</AccordionTrigger>

					{children && (
						<AccordionContent className="p-3">
							<div className="ml-10 text-sm text-gray-600">{children}</div>
						</AccordionContent>
					)}
				</AccordionItem>
			</Accordion>
		</div>
	)
}
