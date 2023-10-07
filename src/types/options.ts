import { BiscuitREST, RawFile, Routes } from "@biscuitland/rest";
import { Cache } from "../cache";
import { Identify } from "@biscuitland/common";

export type ImageOptions = NonNullable<
	Parameters<BiscuitREST['api']['cdn']['icon']>[2]
>;

export type MethodContext<T = {}> = Identify<{ rest: BiscuitREST, api: Routes, id: string/*resourceId*/, cache: Cache } & T>;

// temporal porque arto de escribir varios params
export type MessagePayload<Body, Extra = {}> = Identify<{ body: Body, files?: RawFile[] } & Extra>
