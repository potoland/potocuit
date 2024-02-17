import { MergeOptions } from './common';

export class Collection<K, V> extends Map<K, V> {
	sweep(fn: (value: V, key: K, collection: this) => unknown): number {
		const previous = this.size;
		for (const [key, val] of this) {
			if (fn(val, key, this)) this.delete(key);
		}
		return previous - this.size;
	}

	map<T = any>(fn: (value: V, key: K, collection: this) => T): T[] {
		const result: T[] = [];

		for (const [key, value] of this.entries()) {
			result.push(fn(value, key, this));
		}

		return result;
	}

	filter(fn: (value: V, key: K, collection: this) => boolean): V[] {
		const result: V[] = [];

		for (const [key, value] of this.entries()) {
			if (fn(value, key, this)) result.push(value);
		}

		return result;
	}

	reduce<T = any>(fn: (accumulator: T, value: V, key: K, collection: this) => T, initialValue?: T): T {
		const entries = this.entries();
		const first = entries.next().value as [K, V];
		let result = initialValue;

		if (result !== undefined) {
			result = fn(result, first[1], first[0], this);
		} else {
			result = first[1] as unknown as T;
		}

		for (const [key, value] of entries) {
			result = fn(result, value, key, this);
		}

		return result as T;
	}

	every(fn: (value: V, key: K, collection: this) => boolean): boolean {
		for (const [key, value] of this.entries()) {
			if (!fn(value, key, this)) {
				return false;
			}
		}

		return true;
	}

	some(fn: (value: V, key: K, collection: this) => boolean): boolean {
		for (const [key, value] of this.entries()) {
			if (fn(value, key, this)) {
				return true;
			}
		}

		return false;
	}

	find(fn: (value: V, key: K, collection: this) => boolean): V | undefined {
		for (const [key, value] of this.entries()) {
			if (fn(value, key, this)) {
				return value;
			}
		}
		return undefined;
	}

	findKey(fn: (value: V, key: K, collection: this) => boolean): K | undefined {
		for (const [key, value] of this.entries()) {
			if (fn(value, key, this)) {
				return key;
			}
		}
		return undefined;
	}
}

type LimitedCollectionData<V> = { expire: number; expireOn: number; value: V };

export interface LimitedCollectionOptions {
	limit: number;
	expire: number;
	resetOnDemand: boolean;
}

export class LimitedCollection<K, V> {
	static readonly default: LimitedCollectionOptions = {
		resetOnDemand: false,
		limit: Infinity,
		expire: 0,
	};

	private readonly data = new Map<K, LimitedCollectionData<V>>();

	private readonly options: LimitedCollectionOptions;
	private timeout: NodeJS.Timeout | undefined = undefined;

	constructor(options: Partial<LimitedCollectionOptions>) {
		this.options = MergeOptions(LimitedCollection.default, options);
	}

	set(key: K, value: V, customExpire = this.options.expire) {
		if (this.options.limit <= 0) {
			return;
		}

		const expireOn = Date.now() + customExpire;
		this.data.set(
			key,
			customExpire > 0 ? { value, expire: customExpire, expireOn } : { value, expire: -1, expireOn: -1 },
		);

		if (this.size > this.options.limit) {
			const iter = this.data.keys();
			while (this.size > this.options.limit) {
				this.delete(iter.next().value);
			}
		}

		if (this.closer!.expireOn >= expireOn) {
			this.resetTimeout();
		}
	}

	raw(key: K) {
		return this.data.get(key);
	}

	get(key: K) {
		const data = this.data.get(key);
		if (this.options.resetOnDemand && data && data.expire !== -1) {
			if (this.closer?.expireOn === data.expireOn) {
				setImmediate(() => this.resetTimeout());
			}
			data.expireOn = Date.now() + data.expire;
		}
		return data?.value;
	}

	has(key: K) {
		return this.data.has(key);
	}

	delete(key: K) {
		setImmediate(() => this.resetTimeout());
		return this.data.delete(key);
	}

	get closer() {
		let d: LimitedCollectionData<V> | undefined;
		for (const value of this.data.values()) {
			if (value.expire === -1) {
				continue;
			}
			if (!d) {
				d = value;
				continue;
			}
			if (d.expireOn > value.expireOn) {
				d = value;
			}
		}
		return d;
	}

	get size() {
		return this.data.size;
	}

	private resetTimeout() {
		this.stopTimeout();
		this.startTimeout();
	}

	private stopTimeout() {
		clearTimeout(this.timeout);
		this.timeout = undefined;
	}

	private startTimeout() {
		const { expireOn, expire } = this.closer || { expire: -1, expireOn: -1 };
		if (expire === -1) {
			return;
		}
		if (this.timeout) {
			this.stopTimeout();
		}
		this.timeout = setTimeout(() => {
			this.clearExpired();
			this.resetTimeout();
		}, expireOn - Date.now());
	}

	private clearExpired() {
		for (const [key, value] of this.data) {
			if (value.expireOn === -1) {
				continue;
			}
			if (Date.now() >= value.expireOn) {
				this.data.delete(key);
			}
		}
	}
}
