import { PrefixCommandTransformPipe } from "@discord-nestjs/common";
import { PrefixCommand } from "@discord-nestjs/core";
import { Injectable, Logger, UsePipes } from "@nestjs/common";
import { Message } from "discord.js";
import fetch from "node-fetch";

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
  async onMessage(message: Message) {
    const request = await fetch(
      `https://www.random.org/integers/?num=10&min=1&max=10&col=1&base=10&format=plain&rnd=new`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer 1d7d7744-cfd9-4746-bb45-52d118209528`,
        },
      }
    );
    console.log(request)
    let response = await request.text();
    console.log(response.split('\n').filter(Boolean).map(Number));
  }
}
