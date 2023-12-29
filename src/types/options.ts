import type { Identify } from '@biscuitland/common';
import type { BiscuitREST, RawFile, Routes } from '@biscuitland/rest';
import type { BaseClient } from '../client/base';

export type ImageOptions = NonNullable<Parameters<BiscuitREST['api']['cdn']['icon']>[2]>;

export type MethodContext<T = {}> = Identify<{ client: BaseClient; api: Routes; id: string /* resourceId*/ } & T>;

export type MessagePayload<Body, Extra = {}> = Identify<{ body: Body; files?: RawFile[] } & Extra>;
