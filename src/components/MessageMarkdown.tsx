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
				h1: ({ children }) => <h1 className="text-xl font-bold">{children}</h1>,
				h2: ({ children }) => <h2 className="font-bold">{children}</h2>,
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
			}}
		>
			{children}
		</ReactMarkdown>
	)
}
