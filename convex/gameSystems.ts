import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"

export const get = query({
	handler: async (ctx, args: { id: Id<"gameSystems"> }) => {
		const gameSystem = await ctx.db.get(args.id)

		if (!gameSystem) {
			return null
		}

		return {
			...gameSystem,
			files: await Promise.all(
				gameSystem.files.map(async (file) => ({
					...file,
					url: await ctx.storage.getUrl(file.storageId),
				})),
			),
		}
	},
})

export const list = query({
	handler: async (ctx) => {
		return ctx.db.query("gameSystems").collect()
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
	args: {
		storageId: v.id("_storage"),
		gameSystemId: v.id("gameSystems"),
		filename: v.string(),
	},
	handler: async (
		ctx,
		args: {
			storageId: Id<"_storage">
			gameSystemId: Id<"gameSystems">
			filename: string
		},
	) => {
		const gameSystem = await ctx.db.get(args.gameSystemId)

		if (!gameSystem) {
			throw new Error("Game system not found")
		}

		return await ctx.db.patch(args.gameSystemId, {
			files: [
				...gameSystem.files,
				{ storageId: args.storageId, filename: args.filename },
			],
		})
	},
})

export const getWithFiles = query({
	args: { id: v.id("gameSystems") },
	handler: async (ctx, args) => {
		const gameSystem = await ctx.db.get(args.id)
		if (!gameSystem) {
			return null
		}

		const filesWithMetadata = await Promise.all(
			gameSystem.files.map(async (file) => {
				const fileMetadata = await ctx.db.system.get(file.storageId)
				return {
					id: file.storageId,
					name: file.filename,
					size: fileMetadata?.size || 0,
					contentType: fileMetadata?.contentType || "application/octet-stream",
					url: await ctx.storage.getUrl(file.storageId),
				}
			}),
		)

		return {
			...gameSystem,
			filesWithMetadata,
		}
	},
})
