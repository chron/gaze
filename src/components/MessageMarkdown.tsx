import type { PropsWithChildren } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
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
