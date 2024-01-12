import { MergeOptions } from './common';

export class Collection<K, V> extends Map<K, V> {
	sweep(fn: (value: V, key: K, collection: this) => unknown, thisArg?: unknown): number {
		if (thisArg !== undefined) fn = fn.bind(thisArg);
		const previous = this.size;
		for (const [key, val] of this) {
			if (fn(val, key, this)) this.delete(key);
		}
		return previous - this.size;
	}

	map<T = any>(fn: (value: V, key: K, collection: this) => T) {
		const result: T[] = []

		for (const [key, value] of this.entries()) {
			result.push(fn(value, key, this))
		}

		return result
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
