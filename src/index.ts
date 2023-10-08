import { BiscuitREST, Router } from '@biscuitland/rest';
import { GatewayManager } from '@biscuitland/ws'
import { GatewayDispatchPayload, GatewayInteractionCreateDispatchData, } from '@biscuitland/common'
import { Cache, DefaultMemoryAdapter } from './cache';
import { BaseInteraction } from './structures/Interaction';

export * from './types'
export * from './cache'
export * from './structures/extra/functions'
export * from './commands'

export class PotoClient {
	gateway!: GatewayManager;
	rest!: BiscuitREST;
	cache!: Cache

	get proxy() {
		return new Router(this.rest).createProxy()
	}

	setServices({ gateway, rest, cache }: { rest?: BiscuitREST, gateway?: GatewayManager, cache?: Cache }) {
		if (gateway) {
			const onPacket = this.onPacket.bind(this);
			const oldFn = gateway.options.handlePayload;
			gateway.options.handlePayload = async (shardId, packet) => {
				await onPacket(shardId, packet);
				return oldFn(shardId, packet)
			}
			this.gateway = gateway
		}
		if (rest) {
			this.rest = rest
		}
		if (cache) {
			this.cache = cache
		}
	}

	async execute(token?: string, intents = 0) {
		this.rest ??= (!token && throwError('Token expected')) || new BiscuitREST({
			token: token!
		});

		this.gateway ??= (!token && throwError('Token expected')) || new GatewayManager({
			token: token!,
			info: await this.proxy.gateway.bot.get(),
			intents: intents,
			handlePayload: (shardId, packet) => {
				return this.onPacket(shardId, packet)
			},
		});

		this.cache ??= new Cache(this.gateway.options.intents, this.rest, new DefaultMemoryAdapter());

		await this.gateway.spawnShards();
	}

	protected async onPacket(shardId: number, packet: GatewayDispatchPayload) {
		if (packet.t === 'READY') console.log(`${shardId}`, packet.d.user.username);
		else console.log(`${shardId}`, packet.d, packet.t);
		await this.cache.onPacket(packet);
	}
}

export class PotoHttpClient {
	constructor(readonly rest: BiscuitREST, readonly cache: Cache) { }

	get proxy() {
		return new Router(this.rest).createProxy()
	}

	listen(port: number) {
		console.log(`Listening to port ${port}`)
	}

	async onPacket(packet: GatewayInteractionCreateDispatchData) {
		const interaction = BaseInteraction.from(this.rest, this.cache, packet);
		console.log(packet, interaction);
	}
}


function throwError(msg: string): never {
	throw new Error(msg)
}

// class TempFile implements Disposable {

// 	[Symbol.dispose]() { }

// }


// using resource = new TempFile();

// console.log(resource);
