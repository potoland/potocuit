import { RESTPostAPIChannelWebhookJSONBody } from 'discord-api-types/v10';
import { MethodContext, Webhook } from '../../..';
import { DiscordBase } from '../../extra/DiscordBase';

export class WebhookGuildMethods extends DiscordBase {
	webhooks = WebhookGuildMethods.guild(this);

	static guild(ctx: MethodContext) {
		return {
			list: async (guildId = ctx.id) => {
				if (!guildId) throw new Error('Non guild specified');
				const webhooks = await ctx.api.guilds(guildId).webhooks.get();
				return webhooks.map((webhook) => new Webhook(ctx.client, webhook));
			},
		};
	}
}

export class WebhookChannelMethods extends DiscordBase {
	webhooks = WebhookChannelMethods.channel(this);

	static channel(ctx: MethodContext) {
		return {
			list: async (channelId = ctx.id) => {
				if (!channelId) throw new Error('Non channel specified');
				const webhooks = await ctx.api.channels(channelId).webhooks.get();
				return webhooks.map((webhook) => new Webhook(ctx.client, webhook));
			},
			create: async (body: RESTPostAPIChannelWebhookJSONBody, channelId = ctx.id) => {
				if (!channelId) throw new Error('Non channel specified');
				const webhook = await ctx.api.channels(channelId).webhooks.post({
					body,
				});
				return new Webhook(ctx.client, webhook);
			},
		};
	}
}
