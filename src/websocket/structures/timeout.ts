export class ConnectTimeout {
	readonly promises: { promise: Promise<boolean>; resolve: (x: boolean) => any }[] = [];
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
		this.promises.push({ resolve, promise });
		return promise;
	}

	shift() {
		this.promises.shift()?.resolve(true);
		if (!this.promises.length) {
			clearInterval(this.interval);
			this.interval = undefined;
		}
	}
}

export class ConnectQueue {
	readonly queue: { callback?: () => any }[] = [];
	protected interval?: NodeJS.Timeout = undefined;

	constructor(
		public intervalTime = 5000,
		public concurrency = 1,
	) { }

	push(callback: () => any) {
		this.queue.push({ callback });
		if (this.queue.length === this.concurrency) {
			for (let i = 0; i < this.concurrency; i++) {
				this.queue[i].callback?.();
				this.queue[i].callback = undefined;
			}
			this.interval = setInterval(() => {
				for (let i = 0; i < this.concurrency; i++) {
					this.shift();
				}
			}, this.intervalTime);
		}
		return;
	}

	shift(): any {
		const shift = this.queue.shift();
		if (!shift) {
			if (!this.queue.length) {
				clearInterval(this.interval);
				this.interval = undefined;
			}
			return;
		}
		if (!shift.callback) return this.shift();
		shift.callback();
		if (!this.queue.length) {
			clearInterval(this.interval);
			this.interval = undefined;
		}
	}
}
