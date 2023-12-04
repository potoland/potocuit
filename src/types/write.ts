import type { APIInteractionResponseChannelMessageWithSource, RESTPostAPIChannelMessageJSONBody } from '@biscuitland/common';
import type { ActionRow, Modal, PotoComponents, TextInput } from '../Components';
import type { OmitInsert } from './util';

export type PotoComponentProper = {
	components?: ActionRow<PotoComponents>[] | undefined;
};

export type PotoModalComponentProper = {
	components?: ActionRow<TextInput>[] | undefined;
};

export type MessageCreateBodyRequest = OmitInsert<RESTPostAPIChannelMessageJSONBody, 'components', PotoComponentProper>;

export type InteractionCreateBodyRequest = OmitInsert<APIInteractionResponseChannelMessageWithSource['data'], 'components', PotoComponentProper>;

export type ModalCreateBodyRequest = Modal;
