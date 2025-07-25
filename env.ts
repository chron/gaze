import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server: {},
	clientPrefix: "VITE_",
	client: {
		VITE_CONVEX_URL: z.string().min(1),
		VITE_CONVEX_HTTP_URL: z.string().min(1),
		VITE_GOOGLE_GEMINI_API_KEY: z.string().min(1),
		VITE_ANTHROPIC_API_KEY: z.string().min(1),
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
})
