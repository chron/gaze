import React, { useLayoutEffect, useRef } from "react"
import { cn } from "../../lib/utils"

interface AutoResizeTextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	onSave?: (value: string) => void | Promise<void>
	onCancel?: () => void
}

export const AutoResizeTextarea = React.forwardRef<
	HTMLTextAreaElement,
	AutoResizeTextareaProps
>(({ className, onSave, onCancel, value, autoFocus, ...props }, ref) => {
	const internalRef = useRef<HTMLTextAreaElement>(null)
	const textareaRef =
		(ref as React.RefObject<HTMLTextAreaElement>) || internalRef
	const hasFocusedRef = useRef(false)

	// Use layout effect to adjust height synchronously before paint
	// biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally only want to re-run when value changes, not on every ref change
	useLayoutEffect(() => {
		const textarea = textareaRef.current
		if (textarea) {
			// Save scroll position before height adjustment
			const currentScrollY = window.scrollY

			// Reset height to auto to get the correct scrollHeight
			textarea.style.height = "auto"
			// Set the height to match the content
			textarea.style.height = `${textarea.scrollHeight}px`

			// Restore scroll position to prevent jarring jumps
			window.scrollTo(0, currentScrollY)

			// Handle autofocus without scrolling - only on first mount
			if (autoFocus && !hasFocusedRef.current) {
				hasFocusedRef.current = true
				// Use setTimeout to ensure it happens after all layout calculations
				setTimeout(() => {
					textarea.focus()
					// Already restored scroll position above
				}, 0)
			}
		}
	}, [value, autoFocus])

	const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Escape") {
			e.preventDefault()
			onCancel?.()
			return
		}

		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			if (onSave) {
				await onSave(e.currentTarget.value)
			}
		}

		// Call the original onKeyDown if provided
		props.onKeyDown?.(e)
	}

	const handleInput = () => {
		const textarea = textareaRef.current
		if (textarea) {
			textarea.style.height = "auto"
			textarea.style.height = `${textarea.scrollHeight}px`
		}
	}

	return (
		<textarea
			ref={textareaRef}
			className={cn(
				// Base styles for in-place editing appearance
				"w-full min-w-0 resize-none overflow-hidden",
				"bg-transparent border-none outline-none",
				"font-serif text-base leading-normal",
				"whitespace-pre-wrap",
				"rounded-md",
				// Focus styles with visible border using box-shadow (no layout shift)
				"focus:shadow-[0_0_0_2px_black]",
				className,
			)}
			value={value}
			onInput={handleInput}
			onKeyDown={handleKeyDown}
			{...props}
		/>
	)
})

AutoResizeTextarea.displayName = "AutoResizeTextarea"
