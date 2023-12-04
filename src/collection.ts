import { Options } from '@biscuitland/common';

type CollectionData<V> = { expire: number; expireOn: number; value: V };

export interface CollectionOptions {
	limit: number;
	expire: number;
	cacheOnDemand: boolean;
}

export class Collection<K, V> {
	static default: CollectionOptions = {
		cacheOnDemand: false,
		limit: Infinity,
		expire: 0,
	};

	private readonly data = new Map<
		K,
		CollectionData<V>
	>();

	private timeout: NodeJS.Timeout | null = null;
	private readonly options: CollectionOptions;

	constructor(options: Partial<CollectionOptions>) {
		this.options = Options(Collection.default, options);
	}

	set(key: K, value: V) {
		if (this.options.limit <= 0) {
			return;
		}

		const expireOn = Date.now() + this.options.expire;
		this.data.set(key, this.options.expire > 0 ? { value, expire: this.options.expire, expireOn } : { value, expire: -1, expireOn: -1 });

		if (this.size > this.options.limit) {
			const iter = this.data.keys();
			while (this.size > this.options.limit) {
				this.delete(iter.next().value);
			}
		}

		this.resetTimeout();
	}

	get(key: K) {
		const data = this.data.get(key);
		if (this.options.cacheOnDemand && data && data.expire !== -1) {
			data.expireOn = Date.now() + data.expire;
			if (this.closer?.expireOn === data.expireOn) {
				this.resetTimeout();
			}
		}
		return data?.value;
	}

	has(key: K) {
		return this.data.has(key);
	}

	delete(key: K) {
		return this.data.delete(key);
	}

	resetTimeout() {
		this.stopTimeout();
		this.startTimeout();
	}

	stopTimeout() {
		if (this.timeout) { clearTimeout(this.timeout); }
		this.timeout = null;
	}

	startTimeout() {
		const { expireOn, expire } = this.closer || { expire: -1, expireOn: -1 };
		if (expire === -1) {
			return;
		}
		if (this.timeout) {
			throw new Error('Timeout not cleared');
		}
		this.timeout = setTimeout(() => {
			this.clearExpired();
			this.resetTimeout();
		}, expireOn - Date.now());
	}

	clearExpired() {
		for (const [key, value] of this.data) {
			if (value.expireOn === -1) {
				continue;
			}
			if (Date.now() >= value.expireOn) {
				this.data.delete(key);
			}
		}
	}

	get closer() {
		let d: CollectionData<V> | undefined;
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
}
