import { v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"

export const create = mutation({
	args: {
		campaignId: v.id("campaigns"),
		type: v.string(),
		jobProgressId: v.optional(v.id("jobProgress")),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		return await ctx.db.insert("timelineEvents", {
			campaignId: args.campaignId,
			type: args.type,
			jobProgressId: args.jobProgressId,
			status: "running",
			metadata: undefined,
			error: undefined,
		})
	},
})

export const update = mutation({
	args: {
		eventId: v.id("timelineEvents"),
		status: v.optional(
			v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
		),
		metadata: v.optional(v.any()),
		error: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		const updates: {
			status?: "running" | "completed" | "failed"
			metadata?: any
			error?: string
		} = {}

		if (args.status !== undefined) {
			updates.status = args.status
		}
		if (args.metadata !== undefined) {
			updates.metadata = args.metadata
		}
		if (args.error !== undefined) {
			updates.error = args.error
		}

		await ctx.db.patch(args.eventId, updates)
	},
})

export const internalUpdate = internalMutation({
	args: {
		eventId: v.id("timelineEvents"),
		status: v.optional(
			v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
		),
		metadata: v.optional(v.any()),
		error: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const updates: {
			status?: "running" | "completed" | "failed"
			metadata?: any
			error?: string
		} = {}

		if (args.status !== undefined) {
			updates.status = args.status
		}
		if (args.metadata !== undefined) {
			updates.metadata = args.metadata
		}
		if (args.error !== undefined) {
			updates.error = args.error
		}

		await ctx.db.patch(args.eventId, updates)
	},
})

export const list = query({
	args: {
		campaignId: v.id("campaigns"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("timelineEvents")
			.withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
			.collect()
	},
})

export const get = query({
	args: {
		eventId: v.id("timelineEvents"),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db.get(args.eventId)
		if (!event) {
			return null
		}

		// Also fetch the related job progress if it exists
		let jobProgress = null
		if (event.jobProgressId) {
			jobProgress = await ctx.db.get(event.jobProgressId)
		}

		return {
			...event,
			jobProgress,
		}
	},
})

export const deleteEvent = mutation({
	args: {
		eventId: v.id("timelineEvents"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		await ctx.db.delete(args.eventId)
	},
})
