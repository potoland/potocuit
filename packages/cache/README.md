# @potoland/cache

## Most importantly, potoland's cache is:

A resource control cache layer, based on carriers and resource-intensive
policies

[<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white">](https://github.com/potoland/potocuit)
[<img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white">](https://discord.gg/XNw2RZFzaP)

<img align="right" src="../../assets/icon.png" alt="potocuit" width="200px"/>

## Install (for [node18](https://nodejs.org/en/download/))

```sh-session
npm install @potoland/cache
```

## Example (Basic)

```ts
import { Cache, RedisAdapter } from '@potoland/cache';
import Redis from 'ioredis';

const bootstrap = async () => {
	const cache = new Cache(new RedisAdapter({ client: new Redis() }));

    // You can listen to the raw potocuit event

	await cache.onPacket(<Shard>, <payloads>);
};

bootstrap();
```

<!-- ## Links

- [Documentation](https://docs.biscuitjs.com/)
- [Website](https://biscuitjs.com/) -->
