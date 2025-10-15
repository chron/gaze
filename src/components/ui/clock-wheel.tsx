import { cn } from "../../lib/utils"

type ClockWheelProps = {
	currentTicks: number
	maxTicks: number
	size?: "sm" | "md" | "lg"
	isFull?: boolean
	className?: string
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

		// Calculate points on the circle (radius 40, center 50,50)
		const outerRadius = 45
		const innerRadius = 8 // Center circle radius

		const x1 = 50 + innerRadius * Math.cos(startRad)
		const y1 = 50 + innerRadius * Math.sin(startRad)
		const x2 = 50 + outerRadius * Math.cos(startRad)
		const y2 = 50 + outerRadius * Math.sin(startRad)
		const x3 = 50 + outerRadius * Math.cos(endRad)
		const y3 = 50 + outerRadius * Math.sin(endRad)
		const x4 = 50 + innerRadius * Math.cos(endRad)
		const y4 = 50 + innerRadius * Math.sin(endRad)

		// Large arc flag for arcs > 180 degrees
		const largeArcFlag = anglePerSegment > 180 ? 1 : 0

		// Create path: move to inner start, line to outer start, arc to outer end, line to inner end, arc back
		return `
			M ${x1} ${y1}
			L ${x2} ${y2}
			A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x3} ${y3}
			L ${x4} ${y4}
			A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}
			Z
		`
	}

	const filledColor = isFull ? "#dc2626" : "#3b82f6" // red or blue
	const emptyColor = "#e5e7eb" // gray
	const strokeColor = "#ffffff" // white borders between segments

	// Generate segments with stable identifiers
	const segments = Array.from({ length: maxTicks }, (_, i) => ({
		id: `${maxTicks}-${i}`,
		index: i,
		isFilled: i < currentTicks,
	}))

	return (
		<div className={cn(sizeClasses[size], className)}>
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
					/>
				))}

				{/* Center circle */}
				<circle
					cx="50"
					cy="50"
					r="8"
					fill={filledColor}
					stroke={strokeColor}
					strokeWidth="1.5"
				/>
			</svg>
		</div>
	)
}
