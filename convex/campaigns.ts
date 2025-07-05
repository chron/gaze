import { v } from "convex/values"
import { nanoid } from "nanoid"
import { query } from "./_generated/server"
import { mutation } from "./_generated/server"

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("campaigns").collect()
	},
})

export const get = query({
	args: {
		id: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id)
	},
})

export const addCampaign = mutation({
	args: {
		name: v.string(),
		description: v.string(),
	},

	handler: async (ctx, args) => {
		const campaign = {
			name: args.name,
			description: args.description,
		}
		const id = await ctx.db.insert("campaigns", campaign)

		return await ctx.db.get(id)
	},
})
