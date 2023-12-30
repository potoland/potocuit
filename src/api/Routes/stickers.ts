import { RESTGetAPIStickerResult, RESTGetNitroStickerPacksResult } from '../../common';
import { RestArguments } from '../REST';
import { ProxyRequestMethod } from '../Router';

export interface StickerRoutes {
  stickers(id: string): {
    get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIStickerResult>;
  };
  'sticker-packs': {
    get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetNitroStickerPacksResult>;
  };
}
