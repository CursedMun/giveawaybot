import { On } from "@discord-nestjs/core";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class ClientGateway {
  constructor() {}
  private readonly logger = new Logger(ClientGateway.name);
  //on interaction create
  @On("")
  async onReady(): Promise<void> {
    this.logger.log("Started");
    this.logger.log("Bot was started!");
  }
  //on emoji add
  @On("")
  async onReady(): Promise<void> {
    this.logger.log("Started");
    this.logger.log("Bot was started!");
  }
  //on channel enter
  @On("")
  async onReady(): Promise<void> {
    this.logger.log("Started");
    this.logger.log("Bot was started!");
  }
  //on channel leave
  @On("")
  async onReady(): Promise<void> {
    this.logger.log("Started");
    this.logger.log("Bot was started!");
  }
}
