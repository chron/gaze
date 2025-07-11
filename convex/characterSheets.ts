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
		data: v.record(v.string(), v.any()),
	},
	handler: async (ctx, args) => {
		return ctx.db.insert("characterSheets", {
			campaignId: args.campaignId,
			name: "New Character",
			description: "",
			data: args.data,
		})
	},
})

export const update = mutation({
	args: {
		characterSheetId: v.id("characterSheets"),
		name: v.string(),
		description: v.string(),
		data: v.record(v.string(), v.any()),
	},
	handler: async (ctx, args) => {
		return ctx.db.patch(args.characterSheetId, {
			name: args.name,
			description: args.description,
			data: args.data,
		})
	},
})
