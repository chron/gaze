import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
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

type Props = {
	children: string
	linkClickHandler?: (text: string) => void
}

export const MessageMarkdown: React.FC<Props> = ({
	children,
	linkClickHandler,
}) => {
	return (
		<div className="flex flex-col gap-2">
			<ReactMarkdown
				remarkPlugins={[remarkGfm, remarkBreaks]}
				components={{
					a: ({ children }) =>
						linkClickHandler ? (
							<button
								type="button"
								className="bg-blue-500 text-white hover:text-gray-100 hover:bg-blue-600 rounded-md px-2 py-1 my-1 cursor-pointer text-left"
								onClick={(e) => linkClickHandler?.(e.currentTarget.innerText)}
							>
								{children}
							</button>
						) : (
							children
							// <a href={href} className="text-blue-500 hover:text-blue-600">
							// 	{children}
							// </a>
						),
					p: ({ children }) => <p className="last:mb-0">{children}</p>,
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
									"rounded-md bg-gray-800 text-blue-100 px-1.5 py-1",
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
						<ol className="list-decimal ml-6">{children}</ol>
					),
					ul: ({ children }) => <ul className="list-disc ml-6">{children}</ul>,
					li: ({ children }) => (
						<li className="[&>p]:inline [&>p]:m-0">{children}</li>
					),
					blockquote: ({ children }) => (
						<blockquote className="border-blue-300 bg-gray-200 border-l-4 pl-4 py-2 my-2 text-gray-700">
							{children}
						</blockquote>
					),
					del: ({ children }) =>
						typeof children === "string" ? (
							<Wiggly>{children}</Wiggly>
						) : (
							children
						),
					hr: () => <hr className="text-gray-400 my-4 mx-4" />,
				}}
			>
				{children}
			</ReactMarkdown>
		</div>
	)
}
