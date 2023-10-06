<div align='center'>

  # **@potoland/framework**

  <img src="https://github.com/potoland/potocuit/raw/main/assets/icon.png" alt="potocuit" width="100px" />
  
  **A brand new bleeding edge non bloated Discord framework**

  [![License](https://img.shields.io/npm/l/@potoland/framework?style=flat-square&logo=apache&color=white)](https://github.com/potoland/potocuit/blob/main/LICENSE)
  [![Version](https://img.shields.io/npm/v/@potoland/framework?color=%23ff0000&logo=npm&style=flat-square)](https://www.npmjs.com/package/@potoland/framework)
  [![Discord](https://img.shields.io/discord/973427352560365658?color=%23406da2&label=support&logo=discord&style=flat-square)](https://discord.com/invite/XNw2RZFzaP)

</div>

# F.A.Q

### What is `@potoland/framework`?
- **A wrapper for interfacing with the Discord API.**

### Why you should use it?
- **Because of its scalability.**

# How to use

## Installation

**You need `Node.js 18` or newer to use this package.**

If you don't want to use NPM, replace **`npm install`** with your package manager of choice. If that is not the case, you can proceed with this command.

```sh
npm install @potoland/framework
```

## Basic bot example

```js
const Redis = require('ioredis');

const { DefaultRestAdapter } = require('@biscuitland/rest');
const { Intents } = require('@biscuitland/api-types');
const { Potocuit } = require('@potoland/framework');
const { RedisAdapter } = require('@potoland/cache');

const TOKEN = 'YOUR-BOT-TOKEN';

// This should be inside of an async function cuz marcrock sucks.
(async () => {
  const restAdapter = new DefaultRestAdapter({
    token: TOKEN
  });

  const gateway = await restAdapter.get('/gateway/bot');
  
  const bot = new Potocuit({
    token: TOKEN,
    intents: Intents.GuildMembers
      | Intents.Guilds
      | Intents.GuildMessages,
    shardManagerOptions: {
      gateway
    },
    restAdapter,
    cache: {
      adapter: new RedisAdapter({
        options: { namespace: 'bot' },
        client: new Redis()
      }),
      disabledEvents: [] // You can pass 'ALL' instead of [] if you want to disable all events.
    }
  });

  bot.events.ready = ([id, shards]) => {
    console.log(`[${id}] handling ${shards} shards`);
  };

  await bot.start();
})();
```

# Useful links

- [GitHub Repository](https://github.com/potoland/potocuit)
- [Discord server](https://discord.com/invite/XNw2RZFzaP)
- [npm - core](https://www.npmjs.com/package/@potoland/framework)
- [npm - cache](https://www.npmjs.com/package/@potoland/cache)
