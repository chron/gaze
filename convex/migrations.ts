import { Migrations } from "@convex-dev/migrations"
import { components, internal } from "./_generated/api.js"
import type { DataModel } from "./_generated/dataModel.js"

export const migrations = new Migrations<DataModel>(components.migrations)
export const run = migrations.runner()

export const migrateMessageContent = migrations.define({
	table: "messages",
	migrateOne: async (ctx, doc) => {
		await ctx.db.patch(doc._id, {
			content: [
				{
					type: "text",
					text: doc.content as unknown as string,
				},
			],
		})
	},
})

export const setDefaultArchived = migrations.define({
	table: "campaigns",
	migrateOne: async (ctx, doc) => {
		await ctx.db.patch(doc._id, {
			archived: false,
		})
	},
})

export const runIt = migrations.runner(
	internal.migrations.migrateMessageContent,
)

export const runArchivedMigration = migrations.runner(
	internal.migrations.setDefaultArchived,
)

export const setDefaultActive = migrations.define({
	table: "characters",
	migrateOne: async (ctx, doc) => {
		await ctx.db.patch(doc._id, {
			active: true,
		})
	},
})

export const runActiveMigration = migrations.runner(
	internal.migrations.setDefaultActive,
)

export const setDefaultNotes = migrations.define({
	table: "characters",
	migrateOne: async (ctx, doc) => {
		await ctx.db.patch(doc._id, {
			notes: "",
		})
	},
})

export const runNotesMigration = migrations.runner(
	internal.migrations.setDefaultNotes,
)

export const setDefaultImageError = migrations.define({
	table: "characters",
	migrateOne: async (ctx, doc) => {
		await ctx.db.patch(doc._id, {
			imageError: false,
		})
	},
})

export const runImageErrorMigration = migrations.runner(
	internal.migrations.setDefaultImageError,
)
