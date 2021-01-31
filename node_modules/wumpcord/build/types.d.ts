/**
 * Copyright (c) 2020-2021 August, Ice
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/* eslint-disable camelcase */

import type { TextChannel, VoiceChannel, StoreChannel, NewsChannel, GroupChannel, DMChannel, CategoryChannel } from './models';
import type { ClientOptions as WebSocketClientOptions } from 'ws';
import type { GatewayEvent, GatewayIntent } from './Constants';
import type { RatelimitInfo } from './rest/RatelimitBucket';
import type { HttpMethod } from '@augu/orchid';
import type * as discord from 'discord-api-types/v8';

/** Represents a guild textable channel */
export type GuildTextableChannel = TextChannel | NewsChannel | StoreChannel;

/** Represents a textable channel that is or not attached to a guild */
export type TextableChannel = TextChannel | GroupChannel | DMChannel | NewsChannel;

/** Represents all guild channels */
export type AnyGuildChannel = TextChannel | VoiceChannel | NewsChannel | StoreChannel | CategoryChannel;

/** Represents all guild textable channels */
export type AnyGuildTextableChannel = TextChannel | NewsChannel;

/** Represents all channel types */
export type AnyChannel = TextChannel | VoiceChannel | CategoryChannel | DMChannel | GroupChannel | NewsChannel | StoreChannel;

/** Represents a nullable object of [ClientOptions] */
export type NullableClientOptions = Partial<ClientOptions> & { token: string };

/** Represents of how a Discord message is constructed */
export type MessageContent = string | MessageContentOptions;

/** Represents a serialization strategy to use */
export type Serializable = (...args: any[]) => string | Buffer;

/** Represents a deserialization strategy to use */
export type Deserializable<T = unknown> = (...args: any[]) => T;

/** Represents all of the online statuses to set */
export type OnlineStatus = 'online' | 'offline' | 'idle' | 'dnd';

/** Represents a Promise-value or not */
export type MaybePromise<T> = Promise<T> | T;

/** Represents a partial entity */
export type PartialEntity<T> = Partial<T> & { id: string };

/** Represents a file to send to Discord */
export interface MessageFile {
  /** The name of the file, it'll default to `file.png` if not found. */
  name?: string;

  /** The file buffer to send to Discord */
  file: Buffer;
}

/** Represents all the client options available */
export interface ClientOptions {
  /** If we should populate presences when requesting for all guild members */
  populatePresences: boolean;

  /** The reconnection timeout */
  reconnectTimeout: number;

  /** Object of allowed mentions, this will be overrided if [MessageContent.mentions] is `null` or `undefined`. */
  allowedMentions: AllowedMentions;

  /** List of disabled gateway events to not emit */
  disabledEvents: GatewayEvent[];

  /** If we should enable the Interactions helper, to help with creating interactions */
  interactions: boolean;

  /** If we should call `WebSocketClient#requestGuildMembers` on all guilds once we are ready */
  getAllUsers: boolean;

  /** The shard count to start off with */
  shardCount: number | 'auto';

  /** The serialization/deserialization strategy when encoding/decoding packets from Discord */
  strategy: 'etf' | 'json';

  /** The token to use */
  token: string;

  /** The WebSocket options for Discord */
  ws: Partial<WebSocketOptions>;
}

/** The WebSocket options for Discord */
export interface WebSocketOptions {
  /** Enables dispatching of guild subscription events (presence and typing events) */
  guildSubscriptions: boolean;

  /** Value between 50 and 250, total number of members where the gateway will stop sending offline members in the guild member list */
  largeThreshold: number;

  /** The connection timeout before closing the shard's connection */
  connectTimeout: number;

  /** The client options for [ws](https://npm.im/ws) (Do not mess with this unless you know what you're doing.) */
  clientOptions: WebSocketClientOptions;

  /** Whether this connection supports compression of packets */
  compress: boolean;

  /** The intents to connect with */
  intents: number | number[] | GatewayIntent[];

  /** Number of tries before closing the shard's connection, leave it as `undefined` to indefintely keep re-connecting */
  tries: number | undefined;
}

export interface AllowedMentions {
  /** If we should allow the bot to ping @everyone/@here */
  everyone?: boolean;

  /** If we should ping the user we replied with the message reference */
  replied?: boolean;

  /** Boolean value of `true` if we should parse every role as a mentionable ping or an Array of role ids */
  roles?: boolean | string[];

  /** Boolean value of `true` if we should parse every role as a mentionable ping or an Array of user ids */
  users?: boolean | string[];
}

export interface ShardInfo {
  /** The session information, this is `undefined` if [ClientOptions.shardCount] is not `auto`. */
  session?: discord.APIGatewaySessionStartLimit;

  /** The number of shards to spawn with */
  shards: number;

  /** The gateway URL to connect to Discord */
  url: string;
}

export interface MessageContentOptions {
  /** List of attachments to send to Discord */
  attachments?: MessageFile | MessageFile[];

  /** List of allowed mentions to use, if this is `undefined`, it'll default to the client options' allowed mentions */
  mentions?: AllowedMentions;

  /** The content to send to Discord */
  content?: string;

  /** The embed structure to send */
  embed?: discord.APIEmbed;

  /** The snowflake to reply to using the Inline Replies feature */
  reply?: string;

  /** If we should use Text to Speech on this message */
  tts?: boolean;
}

export interface RestCallProperties {
  /** The ratelimit information details */
  ratelimitInfo: RatelimitInfo;

  /** If the request was successful or not */
  successful: boolean;

  /** The endpoint we made a request to */
  endpoint: string;

  /** The http method verb we used */
  method: HttpMethod;

  /** The body payload from Discord */
  body: string;

  /** The ping of when the request was dispatched / called */
  ping: number;
}

export interface SendActivityOptions {
  name: string;
  type: number;
  url?: string;
  afk?: boolean;
}
