import type { APIBaseComponent, ComponentType, ObjectToLower } from '@biscuitland/common';

export interface BaseComponent<T extends ComponentType>
  extends ObjectToLower<APIBaseComponent<T>> {
}

export class BaseComponent<T extends ComponentType> {
  constructor(data: APIBaseComponent<T>) {
    Object.assign(this, data);
  }

  toJSON() {
    return { type: this.type };
  }
}
