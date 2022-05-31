import { PrefixCommandTransformPipe } from "@discord-nestjs/common";
import { ArgNum, Payload, PrefixCommand } from "@discord-nestjs/core";
import { Injectable, Logger, UsePipes } from "@nestjs/common";
import { InteractionReplyOptions, Message } from "discord.js";
import { GiveawayService } from "src/app/providers/giveaway.service";
@Injectable()
export class Test {
  private logger = new Logger(Test.name);
  constructor(private readonly giveawayService: GiveawayService) {}

  @PrefixCommand({
    name: "test",
    prefix: "!",
  })
  @UsePipes(PrefixCommandTransformPipe)
  async onMessage(
    message: Message
  ) {
    await this.giveawayService.giveawayService.setcache('2121', ['1'])
    console.log(await this.giveawayService.giveawayService.getCache('905552166348009503'))
  }
}
