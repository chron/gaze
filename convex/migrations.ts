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

export const addImageModelToCampaigns2 = migrations.define({
	table: "campaigns",
	migrateOne: async (ctx, doc) => {
		// Set default image model for existing campaigns
		await ctx.db.patch(doc._id, {
			imageModel: "gpt-image-1",
		})
	},
})

export const runIt = migrations.runner(
	internal.migrations.migrateMessageContent,
)

export const runImageModelMigration2 = migrations.runner(
	internal.migrations.addImageModelToCampaigns2,
)
