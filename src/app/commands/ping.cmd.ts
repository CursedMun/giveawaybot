import { PrefixCommand } from "@discord-nestjs/core";

export class PrefixCmd {
  @PrefixCommand("ping")
  async onMessage(): Promise<string> {
    return "Message processed successfully";
  }
}
