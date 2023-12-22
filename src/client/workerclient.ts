import { LogLevels, Logger } from "@biscuitland/common";
import type { GatewayDispatchPayload } from "@biscuitland/common";
import { parentPort as manager, workerData as __workerData__ } from "worker_threads";
import type { Cache } from "../cache";
import { WorkerAdapter } from "../cache";
import { PotoEventHandler } from "../events";
import type { DeepPartial } from "../structures/extra/types";
import type { Shard } from "../websocket";
import type { WorkerData } from "../websocket";
import { handleManagerMessages } from "../websocket/discord/handlemessage";
import type { ManagerMessages } from "../websocket/discord/workermanager";
import type { BaseClientOptions, StartOptions } from "./base";
import { BaseClient } from "./base";
import { onInteraction } from "./oninteraction";

const workerData = __workerData__ as WorkerData;

export class WorkerClient extends BaseClient {
    logger = new Logger({
        active: workerData.debug,
        name: `[Worker #${workerData.workerId}]`,
        logLevel: LogLevels.Debug,
    });

    events = new PotoEventHandler(this.logger);

    shards = new Map<number, Shard>();
    declare options: WorkerClientOptions | undefined;

    constructor(options?: WorkerClientOptions) {
        super(options);

        if (!manager) {
            throw new Error("WorkerClient cannot spawn without manager");
        }
        const onPacket = this.onPacket.bind(this);
        manager!.on("message", (data) =>
            handleManagerMessages(data, manager!, this.shards, this.cache, this.logger, onPacket),
        );
        this.setServices({
            cache: {
                adapter: new WorkerAdapter(manager),
                disabledCache: options?.disabledCache,
            },
        });
    }

    get workerId() {
        return workerData.workerId;
    }

    handleManagerMessages(data: ManagerMessages) {
        return handleManagerMessages(data, manager!, this.shards, this.cache, this.logger, this.onPacket.bind(this));
    }

    async start(options: Omit<DeepPartial<StartOptions>, "httpConnection" | "token" | "connection"> = {}) {
        await super.start(options);
        await this.loadEvents(options.eventsDir);
        this.cache.intents = workerData.intents;
    }

    async loadEvents(dir?: string) {
        dir ??= await this.getRC().then((x) => x.events);
        if (dir) {
            await this.events.load(dir);
            this.logger.info("PotoEventHandler loaded");
        }
    }

    protected async onPacket(packet: GatewayDispatchPayload, shardId: number) {
        await this.events.execute(packet.t, packet, this, shardId);
        switch (packet.t) {
            case "READY":
                this.botId = packet.d.user.id;
                this.applicationId = packet.d.application.id;
                this.debugger.debug(`#${shardId} [${packet.d.user.username}](${this.botId}) is online...`);
                break;
            case "INTERACTION_CREATE": {
                await onInteraction(shardId, packet.d, this);
                break;
            }
        }
    }
}

interface WorkerClientOptions extends BaseClientOptions {
    disabledCache: Cache["disabledCache"];
}
