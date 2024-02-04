import type {
	APIEmbed,
	APIInteractionResponseCallbackData,
	APIInteractionResponseChannelMessageWithSource,
	APIModalInteractionResponse,
	RESTPatchAPIChannelMessageJSONBody,
	RESTPatchAPIWebhookWithTokenMessageJSONBody,
	RESTPostAPIChannelMessageJSONBody,
	RESTPostAPIWebhookWithTokenJSONBody,
} from '..';
import { RawFile } from '../../api';
import type { ActionRow, Attachment, BuilderComponents, Embed, Modal, TextInput } from '../../builders';
import type { ComponentsListener } from '../../components/listener';

import type { OmitInsert } from './util';

export type BodyModalComponentProper = {
	components?: ActionRow<TextInput>[] | undefined;
};

export interface ResolverProps {
	embeds?: Embed[] | APIEmbed[] | undefined;
	components?: ComponentsListener<BuilderComponents> | ActionRow<BuilderComponents>[] | undefined;
	files?: Attachment[] | RawFile[] | undefined;
}

export type MessageCreateBodyRequest = OmitInsert<
	RESTPostAPIChannelMessageJSONBody,
	'components' | 'embeds',
	ResolverProps
>;

export type MessageUpdateBodyRequest = OmitInsert<
	RESTPatchAPIChannelMessageJSONBody,
	'components' | 'embeds',
	ResolverProps
>;

export type MessageWebhookCreateBodyRequest = OmitInsert<
	RESTPostAPIWebhookWithTokenJSONBody,
	'components' | 'embeds',
	ResolverProps
>;

export type MessageWebhookUpdateBodyRequest = OmitInsert<
	RESTPatchAPIWebhookWithTokenMessageJSONBody,
	'components' | 'embeds',
	ResolverProps
>;

export type InteractionMessageUpdateBodyRequest = OmitInsert<
	RESTPatchAPIWebhookWithTokenMessageJSONBody,
	'components' | 'embeds',
	ResolverProps
>;

export type ComponentInteractionMessageUpdate = OmitInsert<
	APIInteractionResponseCallbackData,
	'components' | 'embeds',
	ResolverProps
>;

export type InteractionCreateBodyRequest = OmitInsert<
	APIInteractionResponseChannelMessageWithSource['data'],
	'components' | 'embeds',
	ResolverProps
>;

export type ModalCreateBodyRequest = APIModalInteractionResponse['data'] | Modal;
