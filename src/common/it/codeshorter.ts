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

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class CodeShorter {
	static users(ctx: Omit<MethodContext, 'id'>) {
		return {
			createDM: async (id: string, force = false) => {
				if (!force) {
					const dm = await ctx.client.cache.channels?.get(id);
					if (dm) return dm as DMChannel;
				}
				const data = await ctx.api.users('@me').channels.post({
					body: { recipient_id: id },
				});
				await ctx.client.cache.channels?.set(id, '@me', data);
				return new DMChannel(ctx.client, data);
			},
			deleteDM: async (id: string, reason?: string) => {
				const res = await ctx.api.channels(id).delete({ reason });
				return new DMChannel(ctx.client, res);
			},
			fetch: async (id: string, force = false) => {
				if (!force) {
					const user = await ctx.client.cache.users?.get(id);
					if (user) return user;
				}

				return new User(ctx.client, await ctx.api.users(id).get());
			},
			write: async (id: string, body: MessageCreateBodyRequest, files?: RawFile[]) => {
				return (await ctx.client.users.createDM(id)).messages.write(body, files);
			},
		};
	}

	static guilds(ctx: Omit<MethodContext, 'id'>) {
		return {
			create: async (body: RESTPostAPIGuildsJSONBody) => {
				const guild = await ctx.api.guilds.post({ body });
				return new Guild<'api'>(ctx.client, guild);
			},

			fetch: async (id: string, force = false) => {
				if (!force) {
					const guild = await ctx.client.cache.guilds?.get(id);
					if (guild) return guild;
				}

				const data = await ctx.api.guilds(id).get();
				const patched = await ctx.client.cache.guilds?.patch(id, data);
				return new Guild(ctx.client, patched ?? data);
			},
			widgetURL: async (id: string, style?: GuildWidgetStyle) => {
				let params = new URLSearchParams();
				if (style) {
					params.append('style', style);
					// @ts-expect-error
					params = String(params);
				}

				return `${BASE_URL}/${Routes.guildWidgetJSON(id)}${params ? `?${params}` : ''}`;
			},
		};
	}
}