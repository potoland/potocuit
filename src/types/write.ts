import type { APIInteractionResponseChannelMessageWithSource, RESTPatchAPIChannelMessageJSONBody, RESTPatchAPIWebhookWithTokenMessageJSONBody, RESTPostAPIChannelMessageJSONBody, RESTPostAPIWebhookWithTokenJSONBody, APIInteractionResponseCallbackData } from '@biscuitland/common';
import type { ActionRow, Modal, PotoComponents, TextInput } from '../components';
import type { OmitInsert } from './util';

export type PotoComponentProper = {
	components?: ActionRow<PotoComponents>[] | undefined;
};

export type PotoModalComponentProper = {
	components?: ActionRow<TextInput>[] | undefined;
};

export type MessageCreateBodyRequest = OmitInsert<RESTPostAPIChannelMessageJSONBody, 'components', PotoComponentProper>;

export type MessageWebhookCreateBodyRequest = OmitInsert<RESTPostAPIWebhookWithTokenJSONBody, 'components', PotoComponentProper>;

export type MessageUpdateBodyRequest = OmitInsert<RESTPatchAPIChannelMessageJSONBody, 'components', PotoComponentProper>;

export type InteractionMessageUpdateBodyRequest = OmitInsert<RESTPatchAPIWebhookWithTokenMessageJSONBody, 'components', PotoComponentProper>;

export type ComponentInteractionMessageUpdate = OmitInsert<APIInteractionResponseCallbackData, 'components', PotoComponentProper>;

export type InteractionCreateBodyRequest = OmitInsert<APIInteractionResponseChannelMessageWithSource['data'], 'components', PotoComponentProper>;

export type ModalCreateBodyRequest = Modal;
