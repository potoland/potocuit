export class ConnectTimeout {
	readonly promises: { promise: Promise<boolean>; resolve: (x: boolean) => any }[] = [];
	protected interval?: NodeJS.Timeout = undefined;
	constructor(readonly intervalTime = 5000) { }

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

	constructor(readonly intervalTime = 5000, readonly concurrency = 1) { }

	push(callback: () => any) {
		this.queue.push({ callback });
		if (this.queue.length === this.concurrency) {
			this.interval = setInterval(() => {
				for (let i = 0; i < this.concurrency; i++) {
					this.shift();
				}
			}, this.intervalTime);
			this.queue[0].callback?.()
			this.queue[0].callback = undefined
		}
		return;
	}

	shift(): any {
		const shift = this.queue.shift()
		if (!shift) return;
		if (!shift.callback) return this.shift();
		shift.callback()
		if (!this.queue.length) {
			clearInterval(this.interval);
			this.interval = undefined;
		}
	}
}
