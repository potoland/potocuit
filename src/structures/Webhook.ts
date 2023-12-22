import type {
    APIWebhook,
    ObjectToLower,
    RESTGetAPIWebhookWithTokenMessageQuery,
    RESTPatchAPIWebhookJSONBody,
    RESTPatchAPIWebhookWithTokenJSONBody,
    RESTPatchAPIWebhookWithTokenMessageJSONBody,
    RESTPostAPIWebhookWithTokenJSONBody,
    RESTPostAPIWebhookWithTokenQuery,
} from "@biscuitland/common";
import type { ImageOptions, MessagePayload, MethodContext } from "..";
import { hasProp } from "..";
import type { BaseClient } from "../client/base";
import { AnonymousGuild } from "./AnonymousGuild";
import { Message } from "./Message";
import { User } from "./User";
import { DiscordBase } from "./extra/DiscordBase";

export interface Webhook extends DiscordBase, ObjectToLower<Omit<APIWebhook, "user" | "source_guild">> {}

export class Webhook extends DiscordBase {
    private readonly __methods__!: ReturnType<typeof Webhook.methods>;
    user?: User;
    sourceGuild?: Partial<AnonymousGuild>;
    messages!: ReturnType<typeof Webhook.messages>;
    constructor(client: BaseClient, data: APIWebhook) {
        super(client, data);

        if (data.user) {
            this.user = new User(this.client, data.user);
        }

        if (data.source_guild) {
            this.sourceGuild = new AnonymousGuild(this.client, data.source_guild);
        }

        Object.assign(this, {
            __methods__: Webhook.methods({ client, id: this.id, api: this.api, token: this.token }),
        });
        Object.assign(this, {
            messages: Webhook.messages({ client, id: this.id, api: this.api, token: this.token! }),
        });
    }

    avatarURL(options?: ImageOptions): string | null {
        if (!this.avatar) {
            return null;
        }

        return this.rest.api.cdn.avatar(this.id, this.avatar, options);
    }

    async fetch() {
        return this.__methods__.fetch().then(this._patchThis);
    }

    async edit(body: RESTPatchAPIWebhookJSONBody | RESTPatchAPIWebhookWithTokenJSONBody, reason?: string) {
        return this.__methods__.edit(body, reason).then(this._patchThis);
    }

    delete(reason?: string) {
        return this.__methods__.delete(reason);
    }

    static messages(ctx: MethodContext<{ token?: string }>) {
        return {
            write: async (
                payload: MessagePayload<
                    RESTPostAPIWebhookWithTokenJSONBody,
                    { query?: RESTPostAPIWebhookWithTokenQuery }
                >,
            ) => {
                Webhook._hasToken(ctx);
                return ctx.api
                    .webhooks(ctx.id)(ctx.token)
                    .post(payload)
                    .then((m) => (m ? new Message(ctx.client, m) : null));
            },
            edit: async ({
                messageId,
                ...json
            }: MessagePayload<
                RESTPatchAPIWebhookWithTokenMessageJSONBody,
                { messageId: string; query?: RESTGetAPIWebhookWithTokenMessageQuery }
            >) => {
                Webhook._hasToken(ctx);
                return ctx.api
                    .webhooks(ctx.id)(ctx.token)
                    .messages(messageId)
                    .patch(json)
                    .then((m) => new Message(ctx.client, m));
            },
            delete: async (messageId: string) => {
                Webhook._hasToken(ctx);
                return ctx.api.webhooks(ctx.id)(ctx.token).messages(messageId).delete();
            },
        };
    }

    static methods(ctx: MethodContext<{ token?: string }>) {
        return {
            delete: (reason?: string) => {
                if (ctx.token) {
                    return ctx.api.webhooks(ctx.id)(ctx.token).delete({ reason, auth: false });
                }
                return ctx.api.webhooks(ctx.id).delete({ reason });
            },
            edit: (body: RESTPatchAPIWebhookWithTokenJSONBody | RESTPatchAPIWebhookJSONBody, reason?: string) => {
                if (ctx.token) {
                    return ctx.api.webhooks(ctx.id)(ctx.token).patch({ body, reason, auth: false });
                }
                return ctx.api.webhooks(ctx.id).patch({ body, reason });
            },
            fetch: async () => {
                let webhook;
                if (ctx.token) {
                    webhook = await ctx.api.webhooks(ctx.id)(ctx.token).get({ auth: false });
                } else {
                    webhook = await ctx.api.webhooks(ctx.id).get();
                }
                return new Webhook(ctx.client, webhook);
            },
        };
    }

    protected static _hasToken(ctx: { token?: string }): asserts ctx is { token: string } {
        if (!hasProp(ctx, "token")) {
            throw new Error("Unavailable webhook token");
        }
    }
}
