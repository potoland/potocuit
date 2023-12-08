<div align='center'>

  # **potocuit**

  <img src="https://github.com/potoland/potocuit/raw/main/assets/icon.png" alt="potocuit" width="100px" />

  **A brand new bleeding edge non bloated Discord framework**

  [![License](https://img.shields.io/npm/l/@potoland/core?style=flat-square&logo=apache&color=white)](https://github.com/potoland/potocuit/blob/main/LICENSE)
  [![Version](https://img.shields.io/npm/v/@potoland/core?color=%23ff0000&logo=npm&style=flat-square)](https://www.npmjs.com/package/@potoland/core)
  [![Discord](https://img.shields.io/discord/973427352560365658?color=%23406da2&label=support&logo=discord&style=flat-square)](https://discord.com/invite/XNw2RZFzaP)

</div>

> [!WARNING]
> This readme is work in progress!

# FAQ
## So, what is `Potocuit`?
Potocuit is a Biscuit framework, Biscuit is a library to interact with the Discord API in a memory-efficient way.

## Why I should use it?
Potocuit has a good scalability, strict types, smooth developing experience...

> more questions soon...

# User guide
## Installation
> [!NOTE]
> You **NEED** Node.js 18>= for this to work.
```sh
pnpm add @potoland/core
```

> You may use your preferred package manager, for this example I am using PNPM since is more efficient.

## Basic bot example

```ts
const client = new PotoClient();

(async () => {
    await client.start();
    await client.uploadCommands().catch(e => {
        console.error(JSON.stringify(e, null, 2))
        process.exit(1)
    })
})();
```

# Useful links

- [GitHub Repository](https://github.com/potoland/potocuit)
- [Discord server](https://discord.com/invite/XNw2RZFzaP)
- [npm - core](https://www.npmjs.com/package/@potoland/core)
