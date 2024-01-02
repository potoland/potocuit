import type { Identify } from '..';
import type { ImageURLOptions, RawFile } from '../../api';
import { BaseClient } from '../../client/base';

export type ImageOptions = ImageURLOptions;

export type MethodContext<T = {}> = Identify<{ client: BaseClient; id: string /* resourceId*/ } & T>;

export type MessageWebhookPayload<Body, Extra = {}> = Identify<{ body: Body; files?: RawFile[] } & Extra>;
