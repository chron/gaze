import React from "react"

interface ErrorBoundaryProps {
	children: React.ReactNode
}

interface ErrorBoundaryState {
	hasError: boolean
	error: Error | null
}

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error }
	}

	componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
		// TODO: logs, etc
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-8">
					<div className="bg-white rounded-lg shadow-md p-8 max-w-2xl w-full text-center border border-red-200">
						<h1 className="text-2xl font-bold text-red-600 mb-2">
							Something went wrong
						</h1>
						<p className="text-gray-700 mb-4">
							An unexpected error has occurred. Please try refreshing the page.
						</p>
						{this.state.error?.message && (
							<pre className="bg-red-100 text-red-800 rounded p-4 text-sm overflow-x-auto mb-4 max-w-full whitespace-pre-wrap break-words">
								{this.state.error.message}
							</pre>
						)}
						<button
							type="button"
							className="mt-2 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium shadow"
							onClick={() => window.location.reload()}
						>
							Reload Page
						</button>
					</div>
				</div>
			)
		}
		return this.props.children
	}
}
