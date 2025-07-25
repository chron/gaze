import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { sendToLLM } from "./messages"

const http = httpRouter()

http.route({
	path: "/message_stream",
	method: "POST",
	handler: sendToLLM,
})

// Pre-flight request for /sendImage
http.route({
	path: "/message_stream",
	method: "OPTIONS",
	handler: httpAction(async (_, request) => {
		// Make sure the necessary headers are present
		// for this to be a valid pre-flight request
		const headers = request.headers
		if (
			headers.get("Origin") !== null &&
			headers.get("Access-Control-Request-Method") !== null &&
			headers.get("Access-Control-Request-Headers") !== null
		) {
			return new Response(null, {
				headers: new Headers({
					"Access-Control-Allow-Origin": "*", // TODO:
					"Access-Control-Allow-Methods": "POST",
					"Access-Control-Allow-Headers": "Content-Type, Digest",
					"Access-Control-Max-Age": "86400",
				}),
			})
		}

		return new Response()
	}),
})

export default http
