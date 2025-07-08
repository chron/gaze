import { Code, FileIcon, FileText, Globe, Upload, X } from "lucide-react"
import { useCallback, useState } from "react"
import { Button } from "./button"

interface FileUploadProps {
	onFileUpload: (file: File) => Promise<void>
	maxSizeInBytes?: number
	acceptedTypes?: string[]
	className?: string
}

interface UploadingFile {
	file: File
	progress: number
	isUploading: boolean
	error?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
	onFileUpload,
	maxSizeInBytes = 50 * 1024 * 1024, // 50MB default
	acceptedTypes = [
		"application/pdf",
		"text/plain",
		"text/html",
		"text/xml",
		"application/xml",
		"text/markdown",
		"text/x-markdown",
		"application/rtf",
		"text/rtf",
	],
	className = "",
}) => {
	const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
	const [isDragOver, setIsDragOver] = useState(false)

	const formatFileSize = useCallback((bytes: number): string => {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}, [])

	const getFileIcon = useCallback((fileType: string) => {
		if (fileType === "application/pdf") {
			return <FileText className="h-5 w-5 text-red-500" />
		}
		if (fileType === "text/html") {
			return <Globe className="h-5 w-5 text-orange-500" />
		}
		if (fileType.includes("xml") || fileType.includes("markdown")) {
			return <Code className="h-5 w-5 text-blue-500" />
		}
		if (fileType === "text/plain" || fileType.includes("rtf")) {
			return <FileIcon className="h-5 w-5 text-gray-500" />
		}
		return <FileText className="h-5 w-5 text-gray-500" />
	}, [])

	const handleFileUpload = useCallback(
		async (file: File) => {
			const validateFile = (file: File): string | null => {
				if (!acceptedTypes.includes(file.type)) {
					return "Only PDF, text, HTML, XML, markdown, and RTF files are allowed"
				}
				if (file.size > maxSizeInBytes) {
					return `File size must be less than ${formatFileSize(maxSizeInBytes)}`
				}
				return null
			}

			const error = validateFile(file)
			if (error) {
				setUploadingFiles((prev) => [
					...prev,
					{ file, progress: 0, isUploading: false, error },
				])
				return
			}

			const uploadingFile: UploadingFile = {
				file,
				progress: 0,
				isUploading: true,
			}

			setUploadingFiles((prev) => [...prev, uploadingFile])

			try {
				await onFileUpload(file)
				setUploadingFiles((prev) =>
					prev.map((f) =>
						f.file === file ? { ...f, progress: 100, isUploading: false } : f,
					),
				)

				// Remove successful upload after 2 seconds
				setTimeout(() => {
					setUploadingFiles((prev) => prev.filter((f) => f.file !== file))
				}, 2000)
			} catch (error) {
				setUploadingFiles((prev) =>
					prev.map((f) =>
						f.file === file
							? {
									...f,
									isUploading: false,
									error:
										error instanceof Error ? error.message : "Upload failed",
								}
							: f,
					),
				)
			}
		},
		[onFileUpload, maxSizeInBytes, acceptedTypes, formatFileSize],
	)

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			setIsDragOver(false)

			const files = Array.from(e.dataTransfer.files)
			files.forEach(handleFileUpload)
		},
		[handleFileUpload],
	)

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(true)
	}, [])

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(false)
	}, [])

	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files || [])
			files.forEach(handleFileUpload)
			e.target.value = "" // Reset input
		},
		[handleFileUpload],
	)

	const removeFile = (file: File) => {
		setUploadingFiles((prev) => prev.filter((f) => f.file !== file))
	}

	return (
		<div className={`space-y-4 ${className}`}>
			<div
				className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
					isDragOver
						? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
						: "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
				}`}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
			>
				<FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
				<div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
					Drag and drop files here
				</div>
				<div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
					or click to browse files
				</div>
				<input
					type="file"
					accept=".pdf,.txt,.html,.xml,.md,.rtf"
					multiple
					onChange={handleFileInput}
					className="hidden"
					id="file-upload"
				/>
				<label htmlFor="file-upload">
					<Button type="button" variant="outline" className="cursor-pointer">
						<Upload className="h-4 w-4 mr-2" />
						Choose Files
					</Button>
				</label>
				<div className="text-xs text-gray-400 mt-2">
					Max file size: {formatFileSize(maxSizeInBytes)}
				</div>
			</div>

			{uploadingFiles.length > 0 && (
				<div className="space-y-2">
					{uploadingFiles.map((uploadingFile) => (
						<div
							key={`${uploadingFile.file.name}-${uploadingFile.file.size}`}
							className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
						>
							{getFileIcon(uploadingFile.file.type)}
							<div className="flex-1">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
										{uploadingFile.file.name}
									</span>
									<span className="text-xs text-gray-500">
										{formatFileSize(uploadingFile.file.size)}
									</span>
								</div>
								{uploadingFile.isUploading && (
									<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
										<div
											className="bg-blue-500 h-2 rounded-full transition-all duration-300"
											style={{ width: `${uploadingFile.progress}%` }}
										/>
									</div>
								)}
								{uploadingFile.error && (
									<div className="text-xs text-red-500 mt-1">
										{uploadingFile.error}
									</div>
								)}
								{uploadingFile.progress === 100 &&
									!uploadingFile.isUploading && (
										<div className="text-xs text-green-500 mt-1">
											Upload completed
										</div>
									)}
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => removeFile(uploadingFile.file)}
								className="h-8 w-8 p-0"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
