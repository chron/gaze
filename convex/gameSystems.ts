import { v } from "convex/values"
import { internalQuery, mutation, query } from "./_generated/server"

export const get = query({
	args: { id: v.id("gameSystems") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

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

export const getInternal = internalQuery({
	args: { id: v.id("gameSystems") },
	handler: async (ctx, args) => {
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
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		return ctx.db.query("gameSystems").collect()
	},
})

export const add = mutation({
	args: {
		name: v.string(),
		prompt: v.string(),
		defaultCharacterData: v.optional(v.record(v.string(), v.any())),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		return await ctx.db.insert("gameSystems", {
			name: args.name,
			prompt: args.prompt,
			files: [],
			defaultCharacterData: args.defaultCharacterData,
		})
	},
})

export const update = mutation({
	args: {
		id: v.id("gameSystems"),
		name: v.string(),
		prompt: v.string(),
		defaultCharacterData: v.optional(v.record(v.string(), v.any())),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		return await ctx.db.patch(args.id, {
			name: args.name,
			prompt: args.prompt,
			defaultCharacterData: args.defaultCharacterData,
		})
	},
})

export const generateUploadUrl = mutation({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		return await ctx.storage.generateUploadUrl()
	},
})

export const addFile = mutation({
	args: {
		storageId: v.id("_storage"),
		gameSystemId: v.id("gameSystems"),
		filename: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

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
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

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
