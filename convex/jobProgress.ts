import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const create = mutation({
	args: {
		campaignId: v.id("campaigns"),
		type: v.string(),
		steps: v.array(
			v.object({
				title: v.string(),
				description: v.optional(v.string()),
			}),
		),
	},
	handler: async (ctx, args) => {
		const jobId = await ctx.db.insert("jobProgress", {
			campaignId: args.campaignId,
			type: args.type,
			status: "running",
			steps: args.steps.map((step) => ({
				...step,
				status: "pending" as const,
			})),
			startedAt: Date.now(),
		})

		return jobId
	},
})

export const addStep = mutation({
	args: {
		jobId: v.id("jobProgress"),
		title: v.string(),
		description: v.optional(v.string()),
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("running"),
				v.literal("completed"),
				v.literal("failed"),
			),
		),
	},
	handler: async (ctx, args) => {
		const job = await ctx.db.get(args.jobId)
		if (!job) throw new Error("Job not found")

		const newStep = {
			title: args.title,
			description: args.description,
			status: args.status || ("pending" as const),
		}

		await ctx.db.patch(args.jobId, {
			steps: [...job.steps, newStep],
		})

		return job.steps.length // Return the index of the newly added step
	},
})

export const updateStep = mutation({
	args: {
		jobId: v.id("jobProgress"),
		stepIndex: v.number(),
		status: v.union(
			v.literal("pending"),
			v.literal("running"),
			v.literal("completed"),
			v.literal("failed"),
		),
		data: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const job = await ctx.db.get(args.jobId)
		if (!job) throw new Error("Job not found")

		const updatedSteps = [...job.steps]
		updatedSteps[args.stepIndex] = {
			...updatedSteps[args.stepIndex],
			status: args.status,
			data: args.data,
		}

		await ctx.db.patch(args.jobId, {
			steps: updatedSteps,
			currentStep: updatedSteps[args.stepIndex].title,
		})
	},
})

export const complete = mutation({
	args: {
		jobId: v.id("jobProgress"),
		success: v.boolean(),
		error: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.jobId, {
			status: args.success ? "completed" : "failed",
			completedAt: Date.now(),
			error: args.error,
		})
	},
})

export const get = query({
	args: {
		jobId: v.id("jobProgress"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.jobId)
	},
})

export const getLatestByType = query({
	args: {
		campaignId: v.id("campaigns"),
		type: v.string(),
	},
	handler: async (ctx, args) => {
		const jobs = await ctx.db
			.query("jobProgress")
			.withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
			.filter((q) => q.eq(q.field("type"), args.type))
			.order("desc")
			.take(1)

		return jobs[0] || null
	},
})

export const deleteJob = mutation({
	args: {
		jobId: v.id("jobProgress"),
	},
	handler: async (ctx, args) => {
		await ctx.db.delete(args.jobId)
	},
})
