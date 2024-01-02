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
import { RawFile } from '../../api';
import { BaseChannel } from '../../structures/methods/channels';

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class CodeShorter {
	static users(ctx: Omit<MethodContext, 'id'>) {
		return {
			createDM: async (id: string, force = false) => {
				if (!force) {
					const dm = await ctx.client.cache.channels?.get(id);
					if (dm) return dm as DMChannel;
				}
				const data = await ctx.client.proxy.users('@me').channels.post({
					body: { recipient_id: id },
				});
				await ctx.client.cache.channels?.set(id, '@me', data);
				return new DMChannel(ctx.client, data);
			},
			deleteDM: async (id: string, reason?: string) => {
				const res = await ctx.client.proxy.channels(id).delete({ reason });
				await ctx.client.cache.channels?.removeIfNI(BaseChannel.__intent__('@me'), res.id, '@me');
				return new DMChannel(ctx.client, res);
			},
			fetch: async (id: string, force = false) => {
				if (!force) {
					const user = await ctx.client.cache.users?.get(id);
					if (user) return user;
				}

				const data = await ctx.client.proxy.users(id).get();
				await ctx.client.cache.users?.patch(id, data);
				return new User(ctx.client, data);
			},
			write: async (id: string, body: MessageCreateBodyRequest, files?: RawFile[]) => {
				return (await ctx.client.users.createDM(id)).messages.write(body, files);
			},
		};
	}

	static guilds(ctx: Omit<MethodContext, 'id'>) {
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
				const patched = await ctx.client.cache.guilds?.patch(id, data);
				return new Guild(ctx.client, patched ?? data);
			},
			widgetURL: (id: string, style?: GuildWidgetStyle) => {
				const params = new URLSearchParams();
				if (style) {
					params.append('style', style);
				}

				return `${BASE_URL}/${Routes.guildWidgetJSON(id)}${params ? `?${params}` : ''}`;
			},
		};
	}
}
