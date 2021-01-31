# Wumpcord
> :rowboat: **Flexible, type-safe, and lightweight Discord API library made in TypeScript**

## Features
- Command Handling: Tired of using a command handler to add extra dependencies? Wumpcord has that built-in, similar API to discord.js-commando.
- Clustering Support: Tired of build your own [clustering](https://nodejs.org/api/cluster.html) library to your bot? Wumpcord has clustering support built-in with a modular system to plug-in-play methods with IPC and Redis Pub/Sub support.
- Extra Utilities: Wumpcord bundles in with extra utilities like a Reaction Handler and a Message Collector.

## Installation
You can install **Wumpcord** under NPM, as follows:

```sh
$ npm i --no-optional wumpcord
```

### Features
Specific features require extra dependencies, this is a list that requires them

|Feature|Dependency|Install|Native?|
|---|---|---|---|
|Voice|`tweetnacl`, `node-opus`|`npm i tweetnacl node-opus`|Yes|
|Clustering|`ioredis` (Optional)|`npm i ioredis`|No|

## Need Support?
You can join the server below and join in #support under the **Wumpcord** category

[![discord embed owo](https://discord.com/api/v8/guilds/382725233695522816/widget.png?style=banner3)](https://discord.gg/JjHGR6vhcG)

## Example Bot
```js
const { Client } = require('wumpcord');
const client = new Client({
  token: '',
  ws: { intents: ['guilds', 'guildMessages'] }
});

client.on('message', event => {
  if (event.message.content === '!ping') return event.message.channel.send('henlo world');
});

client.on('ready', async () => {
  console.log(`Connected as ${client.user.tag}!`);
  client.setStatus('online', { // Sets it to "Competing in uwu"
    type: 5,
    name: 'uwu'
  });
});


client.connect();
```

## Maintainers
- [August](https://floofy.dev)
- [Ice](https://github.com/IceeMC)

## Testers
None at the moment.

## License
**Wumpcord** is released under the [MIT](/LICENSE) License. <3
