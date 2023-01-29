# @potoland/framework

## A brand new bleeding edge non bloated Discord library

<img align="right" src="./assets/icon.svg" alt="biscuit" width="200px"/>

## Install (for [node18](https://nodejs.org/en/download/))

```sh-session
npm install @potoland/framework
yarn add @potoland/framework
```

for further reading join our [Discord](https://discord.com/invite/XNw2RZFzaP)

## Most importantly, @potoland/framework is:

- A wrapper to interface the Discord API

@potoland/* is primarily inspired by biscuit

## Why @potoland/*?:

- Scalable

## Example bot (TS/JS)

```ts
import Redis from "ioredis";

import { Potocuit /*, Command */ } from "@potoland/framework";
import { RedisAdapter } from "@potoland/cache";
import { type DiscordGetGatewayBot, Intents } from "@biscuitland/api-types";
import { DefaultRestAdapter } from "@biscuitland/rest";
import { ShardManager } from "@biscuitland/ws";

const TOKEN = "pxx.xotx.xxo";

const restAdapter = new DefaultRestAdapter({
  token: TOKEN,
});

const gwy = await restAdapter.get<DiscordGetGatewayBot>("/gateway/bot");

const shardManager = new ShardManager({
  gateway: gwy,
  config: {
    token: TOKEN,
    intents: Intents.GuildMembers |
      Intents.GuildEmojis |
      Intents.Guilds |
      Intents.GuildMessages |
      Intents.GuildPresences |
      Intents.GuildVoiceStates,
  },
  handleDiscordPayload(_shard, _payload) {
  },
});

const bot = new Potocuit({
  token: TOKEN,
  shardManager,
  restAdapter,
  cache: {
    adapter: new RedisAdapter({
      client: new Redis(),
      options: { namespace: "bot" },
    }),
    disabledEvents: [],
  },
});

bot.events.ready = ([id, num]) => {
  console.log(`[${id}] handling ${num} shards`);
};

// await bot.publishApplicationCommands(Command[])

await bot.start();
```

## Links

<!-- - [Website](https://biscuitjs.com/) -->
<!-- - [Documentation](https://docs.biscuitjs.com/) -->

- [Discord](https://discord.gg/XNw2RZFzaP)
- [core](https://www.npmjs.com/package/@potoland/framework) |
  <!-- [api-types](https://www.npmjs.com/package/@potoland/api-types) | -->
  [cache](https://www.npmjs.com/package/@potoland/cache)
  <!-- [rest](https://www.npmjs.com/package/@potoland/rest) | -->
  <!-- [ws](https://www.npmjs.com/package/@potoland/ws) | -->
  <!-- [helpers](https://www.npmjs.com/package/@potoland/helpers) -->
