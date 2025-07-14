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
		const campaign = await ctx.db.get(args.id)
		if (!campaign) {
			return null
		}

		return {
			...campaign,
			gameSystemName: campaign.gameSystemId
				? (await ctx.db.get(campaign.gameSystemId))?.name
				: null,
		}
	},
})

export const addCampaign = mutation({
	args: {
		name: v.string(),
		description: v.string(),
		imagePrompt: v.string(),
		gameSystemId: v.optional(v.id("gameSystems")),
		model: v.string(),
	},
	handler: async (ctx, args) => {
		const campaign = {
			name: args.name,
			description: args.description,
			imagePrompt: args.imagePrompt,
			gameSystemId: args.gameSystemId,
			model: args.model,
		}

		const id = await ctx.db.insert("campaigns", campaign)
		return id
	},
})

export const update = mutation({
	args: {
		id: v.id("campaigns"),
		name: v.string(),
		description: v.string(),
		imagePrompt: v.string(),
		gameSystemId: v.optional(v.id("gameSystems")),
		model: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, {
			name: args.name,
			description: args.description,
			imagePrompt: args.imagePrompt,
			gameSystemId: args.gameSystemId,
			model: args.model,
		})
	},
})
