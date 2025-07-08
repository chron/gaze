import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"

export const get = query({
	handler: async (ctx, args: { id: Id<"gameSystems"> }) => {
		return await ctx.db.get(args.id)
	},
})

export const list = query({
	handler: async (ctx) => {
		return await ctx.db.query("gameSystems").collect()
	},
})

export const add = mutation({
	args: {
		name: v.string(),
		prompt: v.string(),
	},
	handler: async (ctx, args: { name: string; prompt: string }) => {
		return await ctx.db.insert("gameSystems", {
			name: args.name,
			prompt: args.prompt,
			files: [],
		})
	},
})

export const update = mutation({
	handler: async (
		ctx,
		args: { id: Id<"gameSystems">; name: string; prompt: string },
	) => {
		return await ctx.db.patch(args.id, {
			name: args.name,
			prompt: args.prompt,
		})
	},
})

export const generateUploadUrl = mutation({
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl()
	},
})

export const addFile = mutation({
	args: { storageId: v.id("_storage"), gameSystemId: v.id("gameSystems") },
	handler: async (
		ctx,
		args: { storageId: Id<"_storage">; gameSystemId: Id<"gameSystems"> },
	) => {
		const gameSystem = await ctx.db.get(args.gameSystemId)

		if (!gameSystem) {
			throw new Error("Game system not found")
		}

		return await ctx.db.patch(args.gameSystemId, {
			files: [...gameSystem.files, args.storageId],
		})
	},
})
