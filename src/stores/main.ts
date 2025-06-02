import { Store, useStore } from "@tanstack/react-store"
import { nanoid } from "nanoid"
import type { Message } from "../types"

type Campaign = {
	id: string
	name: string
	description: string
	messages: Message[]
	createdAt: Date
	updatedAt: Date
}

export const mainStore = new Store({
	name: "User",
	campaigns: [
		{
			id: nanoid(),
			name: "Campaign 1",
			description: "Campaign 1",
			messages: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	] as Campaign[],
})

export const useName = () => {
	return useStore(mainStore, (state) => state.name)
}

export const updateName = (name: string) => {
	mainStore.setState((state) => ({ ...state, name }))
}

export const useCampaigns = () => {
	return useStore(mainStore, (state) => state.campaigns)
}

export const updateCampaign = (campaign: Campaign) => {
	mainStore.setState((state) => {
		const index = state.campaigns.findIndex((c) => c.id === campaign.id)
		const newCampaigns =
			index === -1
				? [...state.campaigns, campaign]
				: [
						...state.campaigns.slice(0, index),
						campaign,
						...state.campaigns.slice(index + 1),
					]

		return {
			...state,
			campaigns: newCampaigns,
		}
	})
}
