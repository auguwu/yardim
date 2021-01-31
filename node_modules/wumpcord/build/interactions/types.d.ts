// Credit: https://github.com/FurryBotCo/FurryBot/blob/master/src/util/DiscordCommands/types.d.ts
/* eslint-disable camelcase */

export interface ApplicationCommand extends IApplicationCommand {
  application_id: string;
  id: string;
}

export interface IApplicationCommand {
  description: string;
  options?: ApplicationCommandOption[];
  name: string;
}

export type ApplicationCommandOptionChoiceArray = [
  ApplicationCommandOptionChoice?,
  ApplicationCommandOptionChoice?,
  ApplicationCommandOptionChoice?,
  ApplicationCommandOptionChoice?,
  ApplicationCommandOptionChoice?,
  ApplicationCommandOptionChoice?,
  ApplicationCommandOptionChoice?,
  ApplicationCommandOptionChoice?,
  ApplicationCommandOptionChoice?,
  ApplicationCommandOptionChoice?
];

export interface ApplicationCommandOption {
  description: string;
  required?: boolean;
  default?: boolean;
  options?: ApplicationCommandOption[];
  choices?: ApplicationCommandOptionChoiceArray;
  type: typeof ApplicationCommandOptionType[keyof typeof ApplicationCommandOptionType];
  name: string;
}

export interface ApplicationCommandOptionChoice {
  value: string;
  name: string;
}

export interface Interaction {
  channel_id: string;
  guild_id: string;
  version: number;
  member: any;
  token: string;
  data: ApplicationCommandInteractionData;
  type: typeof InteractionType[keyof typeof InteractionType];
}

export interface ApplicationCommandInteractionData {
  options?: ApplicationCommandInteractionDataOption[];
  name: string;
  id: string;
}

export interface ApplicationCommandInteractionDataOption {
  options?: ApplicationCommandInteractionDataOption[];
  value?: unknown;
  name: string;
}

export interface InteractionResponse {
  data?: InteractionApplicationCommandCallbackData;
  type: typeof InteractionResponseType[keyof typeof InteractionResponseType];
}

export interface InteractionApplicationCommandCallbackData {
  allowed_mentions?: any;
  embeds?: any;
  content: string;
  tts?: boolean;
}

export enum ApplicationCommandOptionType {
	SUB_COMMAND = 1,
	SUB_COMMAND_GROUP = 2,
	STRING = 3,
	INTEGER = 4,
	BOOLEAN = 5,
	USER = 6,
	CHANNEL = 7,
	ROLE = 8
}

export enum InteractionType {
	PING = 1,
	APPLICATION_COMMAND = 2
}

export enum InteractionResponseType {
	PONG = 1,
	ACKNOWLEDGE = 2,
	CHANNEL_MESSAGE = 3,
	CHANNEL_MESSAGE_WITH_SOURCE = 4,
	ACK_WITH_SOURCE = 5
}
