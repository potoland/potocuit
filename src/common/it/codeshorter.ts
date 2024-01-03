import {
	BASE_URL,
	DMChannel,
	Guild,
	GuildWidgetStyle,
	MessageCreateBodyRequest,
	MethodContext,
	RESTPostAPIGuildsJSONBody,
	Routes,
	User,
} from '../..';
import { BaseChannel } from '../../structures/methods/channels';

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class CodeShorter {
	static users(ctx: MethodContext<{ userId: string }>) {
		return {
			createDM: async (force = false) => {
				if (!force) {
					const dm = await ctx.client.cache.channels?.get(ctx.userId);
					if (dm) return dm as DMChannel;
				}
				const data = await ctx.client.proxy.users('@me').channels.post({
					body: { recipient_id: ctx.userId },
				});
				await ctx.client.cache.channels?.set(ctx.userId, '@me', data);
				return new DMChannel(ctx.client, data);
			},
			deleteDM: async (reason?: string) => {
				const res = await ctx.client.proxy.channels(ctx.userId).delete({ reason });
				await ctx.client.cache.channels?.removeIfNI(BaseChannel.__intent__('@me'), res.id, '@me');
				return new DMChannel(ctx.client, res);
			},
			fetch: async (force = false) => {
				if (!force) {
					const user = await ctx.client.cache.users?.get(ctx.userId);
					if (user) return user;
				}

				const data = await ctx.client.proxy.users(ctx.userId).get();
				await ctx.client.cache.users?.patch(ctx.userId, data);
				return new User(ctx.client, data);
			},
			write: async (body: MessageCreateBodyRequest) => {
				return (await ctx.client.users(ctx.userId).createDM()).messages.write(body);
			},
		};
	}

	static guilds(ctx: MethodContext) {
		return {
			create: async (body: RESTPostAPIGuildsJSONBody) => {
				const guild = await ctx.client.proxy.guilds.post({ body });
				await ctx.client.cache.guilds?.setIfNI('Guilds', guild.id, guild);
				return new Guild<'api'>(ctx.client, guild);
			},

			fetch: async (id: string, force = false) => {
				if (!force) {
					const guild = await ctx.client.cache.guilds?.get(id);
					if (guild) return guild;
				}

				const data = await ctx.client.proxy.guilds(id).get();
				const patched = await ctx.client.cache.guilds?.set(id, data);
				return new Guild(ctx.client, patched ?? data);
			},
			widgetURL: (id: string, style?: GuildWidgetStyle) => {
				const params = new URLSearchParams();
				if (style) {
					params.append('style', style);
				}

				return `${BASE_URL}/${Routes.guildWidgetJSON(id)}${params ? `?${params}` : ''}`;
			},
			channels: (guildId: string) => BaseChannel.allMethods({ client: ctx.client, guildId }),
		};
	}
}
