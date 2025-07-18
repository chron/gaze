import { motion } from "motion/react"

type Props = {
	children: string
}

export const Wiggly: React.FC<Props> = ({ children }) => {
	const offset = -Math.random()

	return (
		<span className="inline-flex gap-[1px]">
			{children.split("").map((char, index) => (
				<motion.span
					key={`${index}-${char}`}
					animate={{
						y: [0, -5, 0],
					}}
					transition={{
						duration: 1,
						repeat: Number.POSITIVE_INFINITY,
						delay: offset + index * 0.1,
						ease: "easeInOut",
					}}
				>
					{char}
				</motion.span>
			))}
		</span>
	)
}
