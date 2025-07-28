import { Pause, Play } from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "./ui/button"

type SequentialAudioPlayerProps = {
	audioUrls: string[]
}

export const SequentialAudioPlayer: React.FC<SequentialAudioPlayerProps> = ({
	audioUrls,
}) => {
	const [currentIndex, setCurrentIndex] = useState(0)
	const [hasStartedPlaying, setHasStartedPlaying] = useState(false)
	const [isPaused, setIsPaused] = useState(false)
	const [isCurrentlyPlaying, setIsCurrentlyPlaying] = useState(false)
	const audioRef = useRef<HTMLAudioElement>(null)
	const nextAudioRef = useRef<HTMLAudioElement>(null)
	const audioUrlsRef = useRef(audioUrls)

	// Update refs and reset index when URLs change
	useEffect(() => {
		audioUrlsRef.current = audioUrls
		setCurrentIndex(0)
		setHasStartedPlaying(false)
		setIsPaused(false)
		setIsCurrentlyPlaying(false)
	}, [audioUrls])

	// Preload the next track when current index changes
	useEffect(() => {
		const nextIndex = currentIndex + 1
		if (nextIndex < audioUrlsRef.current.length && nextAudioRef.current) {
			console.log(
				"Preloading next track:",
				nextIndex,
				audioUrlsRef.current[nextIndex],
			)
			nextAudioRef.current.src = audioUrlsRef.current[nextIndex]
			nextAudioRef.current.load()
		}
	}, [currentIndex])

	// Handle when current audio ends
	const handleAudioEnd = () => {
		console.log(
			"Audio ended, current index:",
			currentIndex,
			"hasStartedPlaying:",
			hasStartedPlaying,
			"isPaused:",
			isPaused,
		)
		const nextIndex = currentIndex + 1
		if (nextIndex < audioUrlsRef.current.length && hasStartedPlaying) {
			console.log("Moving to next track:", nextIndex)

			// Swap the audio elements for instant transition
			if (
				audioRef.current &&
				nextAudioRef.current &&
				nextAudioRef.current.src
			) {
				// Copy the preloaded audio to the main player
				audioRef.current.src = nextAudioRef.current.src

				// Wait for the audio to be ready before playing
				const playWhenReady = () => {
					if (audioRef.current) {
						console.log("Playing preloaded track")
						audioRef.current.play().catch((error) => {
							console.warn("Failed to play next track:", error)
						})
					}
				}

				// Listen for when the audio is ready to play
				audioRef.current.addEventListener("canplay", playWhenReady, {
					once: true,
				})
				audioRef.current.load()
			}

			setCurrentIndex(nextIndex)
		}
	}

	// Track play/pause state
	const handlePlay = () => {
		setHasStartedPlaying(true)
		setIsPaused(false)
		setIsCurrentlyPlaying(true)
	}

	const handlePause = () => {
		setIsCurrentlyPlaying(false)
		// Only set isPaused if the audio hasn't ended (i.e., user manually paused)
		if (audioRef.current && !audioRef.current.ended) {
			console.log("User paused audio")
			setIsPaused(true)
		}
	}

	const handleEnded = () => {
		setIsCurrentlyPlaying(false)
		handleAudioEnd()
	}

	// Custom play/pause toggle
	const togglePlayPause = () => {
		if (audioRef.current) {
			if (isCurrentlyPlaying) {
				audioRef.current.pause()
			} else {
				audioRef.current.play().catch(console.warn)
			}
		}
	}

	if (!audioUrls || audioUrls.length === 0) {
		return null
	}

	const currentAudioUrl = audioUrls[currentIndex]

	return (
		<div className="flex items-center gap-2">
			{/* Hidden audio elements */}
			{/* biome-ignore lint/a11y/useMediaCaption: Hidden audio element */}
			<audio
				ref={audioRef}
				preload="auto"
				onEnded={handleEnded}
				onPlay={handlePlay}
				onPause={handlePause}
				src={currentAudioUrl}
				style={{ display: "none" }}
			/>

			{/* Hidden audio element for preloading next track */}
			{/* biome-ignore lint/a11y/useMediaCaption: Hidden preload element */}
			<audio ref={nextAudioRef} preload="auto" style={{ display: "none" }} />

			{/* Custom play/pause button */}
			<Button
				onClick={togglePlayPause}
				size="sm"
				className={`flex items-center gap-1 ${
					isCurrentlyPlaying ? "animate-pulse" : ""
				}`}
			>
				{isCurrentlyPlaying ? (
					<Pause className="h-4 w-4" />
				) : (
					<Play className="h-4 w-4" />
				)}
			</Button>

			{/* Track counter */}
			{/* {audioUrls.length > 1 && (
				<div className="text-xs text-gray-500">
					{currentIndex + 1} of {audioUrls.length}
				</div>
			)} */}
		</div>
	)
}
