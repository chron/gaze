import { motion } from "motion/react"
import { memo, useMemo, useRef } from "react"

type Props = {
	children: string
}

export const Wiggly: React.FC<Props> = memo(({ children }) => {
	const offsetRef = useRef(Math.random())
	const chars = useMemo(() => children.split(""), [children])

	return (
		<span className="inline-flex gap-[2px]">
			{chars.map((char, index) => (
				<motion.span
					key={`${index}-${char}`}
					animate={{
						y: [0, -5, 0],
					}}
					transition={{
						duration: 1,
						repeat: Number.POSITIVE_INFINITY,
						delay: -offsetRef.current + index * 0.1,
						ease: "easeInOut",
					}}
				>
					{char}
				</motion.span>
			))}
		</span>
	)
})
