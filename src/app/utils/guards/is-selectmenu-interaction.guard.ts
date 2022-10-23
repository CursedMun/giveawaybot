import { DiscordGuard, EventArgs } from '@discord-nestjs/core';
import { ClientEvents } from 'discord.js';

export class IsSelectMenuInteractionGuard implements DiscordGuard {
  canActive(
    event: keyof ClientEvents,
    [interaction]: EventArgs<'interactionCreate'>
  ): boolean | Promise<boolean> {
    return event === 'interactionCreate' && interaction.isSelectMenu();
  }
}
