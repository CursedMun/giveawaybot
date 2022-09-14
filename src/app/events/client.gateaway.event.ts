import { DiscordClientProvider } from '@discord-nestjs/core';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientGateway {
  constructor(private readonly client: DiscordClientProvider) {
    this.client.getClient().setMaxListeners(30);
  }
}
