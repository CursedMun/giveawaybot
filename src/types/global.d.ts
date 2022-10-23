import {
  ActionRow,
  ActionRowData,
  APIActionRowComponent,
  APIMessageActionRowComponent,
  JSONEncodable,
  MessageActionRowComponent,
  MessageActionRowComponentBuilder,
  MessageActionRowComponentData
} from 'discord.js';

export type JsonComponents = (
  | JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>
  | ActionRow<MessageActionRowComponent>
  | ActionRowData<
      MessageActionRowComponentData | MessageActionRowComponentBuilder
    >
  | APIActionRowComponent<APIMessageActionRowComponent>
)[];
export type ModalComponents = (
  | JSONEncodable<APIActionRowComponent<APIModalActionRowComponent>>
  | ActionRowData<ModalActionRowComponentData>
)[];
export type GiveawayAdditionalCondition = 'category' | 'type' | 'guess';
export type GiveawayAccessСondition = 'reaction' | 'button';
export type GiveawayVoiceCondition = 'novoice' | 'voice';
