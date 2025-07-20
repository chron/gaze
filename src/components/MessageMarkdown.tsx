import type { PropsWithChildren } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "../lib/utils"
import { Wiggly } from "./Wiggly"
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
		<div className="flex flex-col gap-2">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					p: ({ children }) => <p className=" last:mb-0">{children}</p>,
					h1: ({ children }) => (
						<h1 className="text-2xl font-bold mt-2">{children}</h1>
					),
					h2: ({ children }) => (
						<h2 className="text-xl font-bold">{children}</h2>
					),
					h3: ({ children }) => (
						<h3 className="text-lg font-bold">{children}</h3>
					),
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
						<li className="[&>p]:inline [&>p]:m-0">{children}</li>
					),
					blockquote: ({ children }) => (
						<blockquote className="border-gray-300 bg-gray-700 rounded-lg text-gray-200 p-4 pl-4">
							{children}
						</blockquote>
					),
					del: ({ children }) => (
						<Wiggly>
							{typeof children === "string"
								? children
								: "(non-string children)"}
						</Wiggly>
					),
					hr: ({ children }) => <hr className="text-gray-400 my-4 mx-4" />,
				}}
			>
				{children}
			</ReactMarkdown>
		</div>
	)
}
