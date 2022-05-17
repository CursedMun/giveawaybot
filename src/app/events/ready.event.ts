import { Once } from "@discord-nestjs/core";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class ClientGateway {
  constructor() {}
  private readonly logger = new Logger(ClientGateway.name);
  @Once("ready")
  async onReady(): Promise<void> {
    this.logger.log("Started");
    this.logger.log("Bot was started!");
  }
}
