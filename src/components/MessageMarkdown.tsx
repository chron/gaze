import type { PropsWithChildren } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "../lib/utils"
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table"

export const MessageMarkdown: React.FC<{ children: string }> = ({
	children,
}) => {
	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			components={{
				p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
				h1: ({ children }) => (
					<h1 className="text-2xl font-bold">{children}</h1>
				),
				h2: ({ children }) => <h2 className="text-xl font-bold">{children}</h2>,
				h3: ({ children }) => <h3 className="text-lg font-bold">{children}</h3>,
				pre: ({ children }) => (
					<pre className="bg-gray-800 text-white p-2 rounded-md whitespace-pre-wrap">
						{children}
					</pre>
				),
				code: ({ children, className }) => {
					return (
						<code
							className={cn(
								className?.includes("language-error") && "text-red-400",
								"p-1 rounded-md",
							)}
						>
							{children}
						</code>
					)
				},
				table: ({ children }) => <Table>{children}</Table>,
				thead: ({ children }) => <TableHeader>{children}</TableHeader>,
				tbody: ({ children }) => <TableBody>{children}</TableBody>,
				tfoot: ({ children }) => <TableFooter>{children}</TableFooter>,
				tr: ({ children }) => <TableRow>{children}</TableRow>,
				th: ({ children }) => <TableHead>{children}</TableHead>,
				td: ({ children }) => <TableCell>{children}</TableCell>,
				caption: ({ children }) => <TableCaption>{children}</TableCaption>,
				ol: ({ children }) => (
					<ol className="list-decimal pl-4 list-inside">{children}</ol>
				),
				ul: ({ children }) => (
					<ul className="list-disc pl-4 list-inside">{children}</ul>
				),
				li: ({ children }) => (
					<li className="[&>p]:inline [&>p]:m-0 mb-1">{children}</li>
				),
				blockquote: ({ children }) => (
					<blockquote className="border-l-4 border-gray-300 bg-gray-200 p-4 pl-4">
						{children}
					</blockquote>
				),
			}}
		>
			{children}
		</ReactMarkdown>
	)
}
