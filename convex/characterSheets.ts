import { v } from "convex/values"
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server"

export const get = query({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		return ctx.db
			.query("characterSheets")
			.filter((q) => q.eq(q.field("campaignId"), args.campaignId))
			.first()
	},
})

export const getInternal = internalQuery({
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
		name: v.string(),
		description: v.string(),
		data: v.record(v.string(), v.any()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		return ctx.db.insert("characterSheets", {
			campaignId: args.campaignId,
			name: args.name,
			description: args.description,
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
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		return ctx.db.patch(args.characterSheetId, {
			name: args.name,
			description: args.description,
			data: args.data,
		})
	},
})

// Internal mutations (no auth required - for use within httpActions/internalActions)
export const createInternal = internalMutation({
	args: {
		campaignId: v.id("campaigns"),
		name: v.string(),
		description: v.string(),
		data: v.record(v.string(), v.any()),
	},
	handler: async (ctx, args) => {
		return ctx.db.insert("characterSheets", {
			campaignId: args.campaignId,
			name: args.name,
			description: args.description,
			data: args.data,
		})
	},
})

export const updateInternal = internalMutation({
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
