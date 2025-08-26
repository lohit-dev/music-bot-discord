const { autoDeleteMessage } = require("../../utils/auto_delete");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "resume",
  aliases: ["unpause", "r"],
  category: "Music",
  description: "Resume playback if paused",
  execute(message, args, client) {
    // Step 1: Get the player for this guild
    const player = client.manager.players.get(message.guild.id);

    // Step 2: Check if there is a player
    if (!player) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("There is nothing playing in this server!"),
        ],
      });
    }

    // Step 3: Check if the user is in the same voice channel
    if (message.member.voice.channel?.id !== player.voiceChannelId) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(
              "You need to be in the same voice channel as the bot to use this command!"
            ),
        ],
      });
    }

    // Step 4: Check if the player is paused
    if (!player.paused) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("The player is not paused!"),
        ],
      });
    }

    // Step 5: Resume the player
    player.resume();

    // Step 6: Inform the user
    return autoDeleteMessage(message, {
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setDescription("▶️ Resumed playback.")
          .setFooter({
            text: `Requested by ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          }),
      ],
    });
  },
};
