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
import type { ActionRow, Modal, PotoComponents, TextInput } from '../../components';
import { MessageEmbed } from '../../components/builders/MessageEmbed';
import type { OmitInsert } from './util';

export type PotoComponentProper = {
	components?: ActionRow<PotoComponents>[] | undefined;
};

export type PotoEmbedsProper = {
	embeds?: MessageEmbed[] | APIEmbed[] | undefined;
};

export type PotoModalComponentProper = {
	components?: ActionRow<TextInput>[] | undefined;
};

export interface ResolverProps extends PotoComponentProper, PotoEmbedsProper {}

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
