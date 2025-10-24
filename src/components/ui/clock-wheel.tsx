import { cn } from "../../lib/utils"

type ClockWheelProps = {
	currentTicks: number
	maxTicks: number
	size?: "sm" | "md" | "lg"
	isFull?: boolean
	className?: string
	previousTicks?: number // For animating newly added segments
	strokeColor?: string
}

/**
 * Trivial Pursuit-style clock visualization with individual segments that fill in
 */
export const ClockWheel: React.FC<ClockWheelProps> = ({
	currentTicks,
	maxTicks,
	size = "md",
	isFull = false,
	className,
	previousTicks,
	strokeColor = "#ffffff",
}) => {
	const sizeClasses = {
		sm: "w-8 h-8",
		md: "w-16 h-16",
		lg: "w-24 h-24",
	}

	// Calculate segment paths for each slice
	const getSegmentPath = (index: number, total: number): string => {
		const anglePerSegment = 360 / total
		const startAngle = index * anglePerSegment - 90 // Start from top
		const endAngle = startAngle + anglePerSegment

		// Convert to radians
		const startRad = (startAngle * Math.PI) / 180
		const endRad = (endAngle * Math.PI) / 180

		// Calculate points on the circle (center 50,50)
		const outerRadius = 45
		const centerX = 50
		const centerY = 50

		const x1 = centerX + outerRadius * Math.cos(startRad)
		const y1 = centerY + outerRadius * Math.sin(startRad)
		const x2 = centerX + outerRadius * Math.cos(endRad)
		const y2 = centerY + outerRadius * Math.sin(endRad)

		// Large arc flag for arcs > 180 degrees
		const largeArcFlag = anglePerSegment > 180 ? 1 : 0

		// Create path: move to center, line to start point, arc to end point, line back to center, close
		return `
			M ${centerX} ${centerY}
			L ${x1} ${y1}
			A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
			Z
		`
	}

	const filledColor = isFull ? "#dc2626" : "#1e40af" // red or darker blue
	const emptyColor = "#e5e7eb" // gray

	// Generate segments with stable identifiers
	const segments = Array.from({ length: maxTicks }, (_, i) => {
		const isFilled = i < currentTicks
		// Determine if this segment is newly added
		const isNew =
			previousTicks !== undefined && i >= previousTicks && i < currentTicks

		return {
			id: `${maxTicks}-${i}`,
			index: i,
			isFilled,
			isNew,
		}
	})

	return (
		<div className={cn(sizeClasses[size], className)}>
			<style>{`
				@keyframes clock-pulse {
					0%, 100% {
						opacity: 1;
					}
					50% {
						opacity: 0.4;
					}
				}
			`}</style>
			<svg
				className="w-full h-full -rotate-90"
				viewBox="0 0 100 100"
				xmlns="http://www.w3.org/2000/svg"
				aria-label={`Clock progress: ${currentTicks} of ${maxTicks}`}
			>
				<title>{`Clock: ${currentTicks}/${maxTicks}`}</title>

				{/* Render each segment */}
				{segments.map((segment) => (
					<path
						key={segment.id}
						d={getSegmentPath(segment.index, maxTicks)}
						fill={segment.isFilled ? filledColor : emptyColor}
						stroke={strokeColor}
						strokeWidth="1.5"
						style={
							segment.isNew
								? {
										animation: "clock-pulse 1s ease-in-out infinite",
									}
								: undefined
						}
					/>
				))}
			</svg>
		</div>
	)
}
