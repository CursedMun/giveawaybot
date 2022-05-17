/* bot.middleware.ts */

import { DiscordMiddleware, Middleware } from '@discord-nestjs/core';
import { Logger } from '@nestjs/common';
import { ClientEvents } from 'discord.js';

@Middleware()
export class AppMiddleware implements DiscordMiddleware {
    private readonly logger = new Logger(AppMiddleware.name);

    use(event: keyof ClientEvents, context: any[]): void {
        if (event === 'message') {
            this.logger.log('On message event triggered');
        }
    }
}