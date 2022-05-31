import { Command, DiscordCommand } from "@discord-nestjs/core";
import { Injectable } from "@nestjs/common";
import { CommandInteraction, InteractionReplyOptions } from "discord.js";
import { MongoUserService } from "src/schemas/mongo/user/user.service";
@Injectable()
@Command({
  name: "notify",
  description: "Включить/Выключить уведомления о розыгрышах",
})
export class NotificationsCmd implements DiscordCommand {
  constructor(private readonly usersService: MongoUserService) {}
  async handler(
    interaction: CommandInteraction
  ): Promise<InteractionReplyOptions> {
    const user = await this.usersService.get(interaction.user.id, 0);
    const toggle = user.notify ? "выключили" : "включили";
    const reply = `Вы **${toggle}** уведомления о розыгрышах в личных сообщениях`;
    await this.usersService.UserModel.updateOne(
      { ID: interaction.user.id },
      { notify: !user.notify }
    );
    return {
      embeds: [
        {
          description: reply,
        },
      ],
    };
  }
}
