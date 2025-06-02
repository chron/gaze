import { useState } from "react"
import { Message } from "./Message"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useAi } from "./useAi"

export const ChatInterface: React.FC = () => {
	const [input, setInput] = useState("")
	const [messages, sendMessage] = useAi()

	const handleSend = async () => {
		await sendMessage(input)
		setInput("")
	}
	return (
		<div className="flex flex-col h-screen p-4 w-full">
			<h1 className="text-4xl font-bold">Chat Interface</h1>

			<div className="flex flex-col items-center justify-end gap-4 flex-grow-1 overflow-y-auto py-4">
				{messages.map((message) => (
					<Message key={message.id} message={message} />
				))}
			</div>

			<div className="flex items-center gap-4">
				<Input
					autoFocus
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Enter your message"
					className="flex-grow-1"
					onKeyUp={(e) => {
						if (e.key === "Enter") {
							handleSend()
						}
					}}
				/>

				<Button variant="outline" onClick={handleSend}>
					Send
				</Button>
			</div>
		</div>
	)
}
