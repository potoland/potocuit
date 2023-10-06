import { mix } from 'ts-mixer';
import { BaseChannel } from './methods/channel/base';
import { MessagesMethod } from './methods/channel/messages';
import { APIDMChannel, APITextChannel, ObjectToLower } from '@biscuitland/common';
import { DiscordBase } from './extra/DiscordBase';

export interface TextBaseChannel extends ObjectToLower<APITextChannel>, BaseChannel, MessagesMethod { }
@mix(BaseChannel, MessagesMethod)
export class TextBaseChannel extends DiscordBase { }

export interface TextGuildChannel extends ObjectToLower<APITextChannel>, BaseChannel, TextBaseChannel { }
@mix(BaseChannel, TextBaseChannel)
export class TextGuildChannel extends DiscordBase { }

export interface DMChannel extends ObjectToLower<APIDMChannel>, BaseChannel, MessagesMethod { }
@mix(BaseChannel, TextBaseChannel)
export class DMChannel extends DiscordBase { }
