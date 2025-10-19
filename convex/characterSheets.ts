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
			.withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
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
			.withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
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
		const sheet = await ctx.db.get(args.characterSheetId)
		if (!sheet) throw new Error("Character sheet not found")

		await ctx.db.patch(args.characterSheetId, {
			name: args.name,
			description: args.description,
			data: args.data,
		})

		// Check if there's a matching character with this name
		const character = await ctx.db
			.query("characters")
			.withIndex("by_campaignId_and_name", (q) =>
				q.eq("campaignId", sheet.campaignId).eq("name", args.name),
			)
			.first()

		// If there's a matching character and the campaign doesn't have a primary character,
		// set this character as the primary
		if (character) {
			const campaign = await ctx.db.get(sheet.campaignId)
			if (campaign && !campaign.primaryCharacterId) {
				await ctx.db.patch(sheet.campaignId, {
					primaryCharacterId: character._id,
				})
			}
		}
	},
})
