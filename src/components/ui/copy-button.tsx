import { motion } from "motion/react"
import { useState } from "react"

type CopyButtonProps = {
	children: React.ReactNode
	onCopy: (text: string) => Promise<void>
	onSend?: (text: string) => Promise<void>
	copiedDuration?: number
}

export const CopyButton: React.FC<CopyButtonProps> = ({
	children,
	onCopy,
	onSend,
	copiedDuration = 2000,
}) => {
	const [isCopied, setIsCopied] = useState(false)
	const [isSent, setIsSent] = useState(false)
	const [hasBeenClicked, setHasBeenClicked] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
		const text = e.currentTarget.innerText
		setIsLoading(true)

		try {
			// If Shift is held and onSend is provided, send the message
			if (e.shiftKey && onSend) {
				await onSend(text)
				setIsSent(true)
				setHasBeenClicked(true)

				setTimeout(() => {
					setIsSent(false)
				}, copiedDuration)
			} else {
				// Otherwise copy to clipboard
				await onCopy(text)
				setIsCopied(true)
				setHasBeenClicked(true)

				setTimeout(() => {
					setIsCopied(false)
				}, copiedDuration)
			}
		} catch (error) {
			console.error("Error handling click:", error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<motion.button
			type="button"
			className="bg-blue-500 text-white hover:text-gray-100 hover:bg-blue-600 rounded-md px-2 py-1 my-1 cursor-pointer text-left inline-block disabled:opacity-50 disabled:cursor-not-allowed"
			onClick={handleClick}
			disabled={isLoading}
			whileTap={{ scale: 1.05 }}
			transition={{ duration: 0.1 }}
		>
			<span className="relative inline-block">
				{/* Original text - always present to maintain width */}
				<span className={isCopied || isSent || isLoading ? "invisible" : ""}>
					{children}
				</span>
				{/* Loading text - absolutely positioned on top */}
				{isLoading && (
					<motion.span
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.2 }}
						className="absolute inset-0 text-center"
					>
						Converting...
					</motion.span>
				)}
				{/* Copied text - absolutely positioned on top */}
				{isCopied && !isLoading && (
					<motion.span
						initial={hasBeenClicked ? { opacity: 0 } : { opacity: 1 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.2 }}
						className="absolute inset-0 text-center"
					>
						Copied!
					</motion.span>
				)}
				{/* Sent text - absolutely positioned on top */}
				{isSent && !isLoading && (
					<motion.span
						initial={hasBeenClicked ? { opacity: 0 } : { opacity: 1 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.2 }}
						className="absolute inset-0 text-center"
					>
						Sent!
					</motion.span>
				)}
			</span>
		</motion.button>
	)
}
