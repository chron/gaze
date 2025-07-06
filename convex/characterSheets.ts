import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const get = query({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		return ctx.db
			.query("characterSheets")
			.filter((q) => q.eq(q.field("campaignId"), args.campaignId))
			.first()
	},
})

export const create = mutation({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		return ctx.db.insert("characterSheets", {
			campaignId: args.campaignId,
			name: "New Character",
			description: "",
			xp: 0,
			inventory: [],
		})
	},
})

export const update = mutation({
	args: {
		characterSheetId: v.id("characterSheets"),
		name: v.string(),
		description: v.string(),
		xp: v.number(),
		inventory: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		return ctx.db.patch(args.characterSheetId, {
			name: args.name,
			description: args.description,
			xp: args.xp,
			inventory: args.inventory,
		})
	},
})
