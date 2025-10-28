import { motion } from "motion/react"
import { useState } from "react"

type CopyButtonProps = {
	children: React.ReactNode
	onCopy: (text: string) => void
	copiedDuration?: number
}

export const CopyButton: React.FC<CopyButtonProps> = ({
	children,
	onCopy,
	copiedDuration = 2000,
}) => {
	const [isCopied, setIsCopied] = useState(false)
	const [hasBeenClicked, setHasBeenClicked] = useState(false)

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		const text = e.currentTarget.innerText
		onCopy(text)
		setIsCopied(true)
		setHasBeenClicked(true)

		setTimeout(() => {
			setIsCopied(false)
		}, copiedDuration)
	}

	return (
		<motion.button
			type="button"
			className="bg-blue-500 text-white hover:text-gray-100 hover:bg-blue-600 rounded-md px-2 py-1 my-1 cursor-pointer text-left inline-block"
			onClick={handleClick}
			whileTap={{ scale: 1.05 }}
			transition={{ duration: 0.1 }}
		>
			<span className="relative inline-block">
				{/* Original text - always present to maintain width */}
				<span className={isCopied ? "invisible" : ""}>{children}</span>
				{/* Copied text - absolutely positioned on top */}
				{isCopied && (
					<motion.span
						initial={hasBeenClicked ? { opacity: 0 } : { opacity: 1 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.2 }}
						className="absolute inset-0 text-center"
					>
						Copied!
					</motion.span>
				)}
			</span>
		</motion.button>
	)
}
