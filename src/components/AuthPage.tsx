import { SignIn } from "@clerk/clerk-react"
import { motion } from "motion/react"

export function AuthPage() {
	const clerkAppearance = {
		elements: {
			rootBox: "mx-auto",
			card: "bg-white shadow-2xl rounded-2xl border-0",
			headerTitle: "text-2xl font-bold text-gray-900",
			headerSubtitle: "text-gray-600",
			socialButtonsBlockButton:
				"bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 shadow-sm transition-all",
			socialButtonsBlockButtonText: "font-medium",
			formButtonPrimary:
				"bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all font-medium",
			formFieldInput:
				"border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md transition-all",
			formFieldLabel: "text-gray-700 font-medium",
			footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
			identityPreviewText: "text-gray-700",
			identityPreviewEditButton: "text-blue-600 hover:text-blue-700",
			formFieldInputShowPasswordButton:
				"text-gray-600 hover:text-gray-800 transition-colors",
			dividerLine: "bg-gray-200",
			dividerText: "text-gray-500",
			otpCodeFieldInput:
				"border-gray-300 focus:border-blue-500 focus:ring-blue-500",
		},
		layout: {
			socialButtonsPlacement: "top" as const,
			socialButtonsVariant: "blockButton" as const,
		},
	}

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-4 overflow-hidden relative">
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

			{/* Main content */}
			<div className="relative z-10 w-full max-w-md">
				{/* Logo/Title section */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="text-center mb-8"
				>
					<h1 className="text-5xl font-title text-white mb-3 tracking-wide">
						Gaze Into The Abyss
					</h1>
				</motion.div>

				{/* Auth component */}
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="w-full"
				>
					<SignIn
						appearance={clerkAppearance}
						routing="hash"
						afterSignInUrl="/"
						signUpFallbackRedirectUrl="/"
					/>
				</motion.div>
			</div>
		</div>
	)
}
