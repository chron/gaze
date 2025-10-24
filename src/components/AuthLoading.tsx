import { Sparkles } from "lucide-react"
import { motion } from "motion/react"

export function AuthLoading() {
	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center overflow-hidden relative">
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<motion.div
					className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
					animate={{
						x: [0, 50, 0],
						y: [0, 30, 0],
						scale: [1, 1.1, 1],
					}}
					transition={{
						duration: 20,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				/>
				<motion.div
					className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl"
					animate={{
						x: [0, -30, 0],
						y: [0, 50, 0],
						scale: [1, 1.2, 1],
					}}
					transition={{
						duration: 25,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				/>
			</div>

			{/* Loading content */}
			<div className="relative z-10 text-center">
				<motion.div
					className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20"
					animate={{
						rotate: [0, 360],
						scale: [1, 1.05, 1],
					}}
					transition={{
						rotate: {
							duration: 3,
							repeat: Number.POSITIVE_INFINITY,
							ease: "linear",
						},
						scale: {
							duration: 2,
							repeat: Number.POSITIVE_INFINITY,
							ease: "easeInOut",
						},
					}}
				>
					<Sparkles className="w-12 h-12 text-white" />
				</motion.div>

				<motion.h1
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.6 }}
					className="text-5xl font-title text-white mb-3 tracking-wide"
				>
					Gaze Into The Abyss
				</motion.h1>

				<motion.div
					className="flex items-center justify-center gap-2"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.2 }}
				>
					<motion.div
						className="w-2 h-2 bg-white rounded-full"
						animate={{
							scale: [1, 1.2, 1],
							opacity: [0.5, 1, 0.5],
						}}
						transition={{
							duration: 1.5,
							repeat: Number.POSITIVE_INFINITY,
							delay: 0,
						}}
					/>
					<motion.div
						className="w-2 h-2 bg-white rounded-full"
						animate={{
							scale: [1, 1.2, 1],
							opacity: [0.5, 1, 0.5],
						}}
						transition={{
							duration: 1.5,
							repeat: Number.POSITIVE_INFINITY,
							delay: 0.2,
						}}
					/>
					<motion.div
						className="w-2 h-2 bg-white rounded-full"
						animate={{
							scale: [1, 1.2, 1],
							opacity: [0.5, 1, 0.5],
						}}
						transition={{
							duration: 1.5,
							repeat: Number.POSITIVE_INFINITY,
							delay: 0.4,
						}}
					/>
				</motion.div>

				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.4 }}
					className="text-blue-100 text-lg mt-4"
				>
					Loading your adventure...
				</motion.p>
			</div>
		</div>
	)
}
