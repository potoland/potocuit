export class ConnectTimeout {
	readonly promises: ((x: boolean) => any)[] = [];
	protected interval?: NodeJS.Timeout = undefined;
	constructor(public intervalTime = 5000) { }

	wait() {
		let resolve = (_x: boolean) => {
			//
		};
		const promise = new Promise<boolean>(r => (resolve = r));
		if (!this.promises.length) {
			this.interval = setInterval(() => {
				this.shift();
			}, this.intervalTime);
			resolve(true);
		}
		this.promises.push(resolve);
		return promise;
	}

	shift() {
		this.promises.shift()?.(true);
		if (!this.promises.length) {
			clearInterval(this.interval);
			this.interval = undefined;
		}
	}
}

export class ConnectQueue {
	readonly queue: ((() => any) | undefined)[] = [];
	protected interval?: NodeJS.Timeout = undefined;

	constructor(
		public intervalTime = 5000,
		public concurrency = 1,
	) { }

	push(callback: () => any) {
		this.queue.push(callback);
		if (this.queue.length === this.concurrency) {
			for (let i = 0; i < this.concurrency; i++) {
				this.queue[i]?.();
				this.queue[i] = undefined;
			}
			this.interval = setInterval(() => {
				for (let i = 0; i < this.concurrency; i++) {
					this.shift();
				}
			}, this.intervalTime);
		}
	}

	shift(): any {
		const callback = this.queue.shift();
		if (!callback) {
			if (!this.queue.length) {
				clearInterval(this.interval);
				this.interval = undefined;
			}
			return this.shift();
		}
		callback();
		if (!this.queue.length) {
			clearInterval(this.interval);
			this.interval = undefined;
		}
	}
}
