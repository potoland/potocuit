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
import { RawFile } from '../..';
import { ActionRow, Attachment, MessageEmbed, Modal, PotoComponents, TextInput } from '../../builders';

import type { OmitInsert } from './util';

export type PotoModalComponentProper = {
	components?: ActionRow<TextInput>[] | undefined;
};

export interface ResolverProps {
	embeds?: MessageEmbed[] | APIEmbed[] | undefined;
	components?: ActionRow<PotoComponents>[] | undefined;
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
