const { EmbedBuilder } = require("discord.js");
const { autoDeleteMessage } = require("../../utils/auto_delete");


module.exports = {
  name: "leave",
  aliases: ["disconnect", "dc"],
  category: "Music",
  description: "Disconnect the bot from the voice channel",
  execute(message, args, client) {
    // Get the player for this guild
    const player = client.manager.players.get(message.guild.id);

    // Check if there is a player
    if (!player) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("I'm not connected to any voice channel!"),
        ],
      });
    }

    // Check if user is in the same voice channel
    if (message.member.voice.channel?.id !== player.voiceChannelId) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(
              "You must be in the same voice channel as me to use this command!"
            ),
        ],
      });
    }

    // Destroy the player (disconnect)
    player.destroy();

    // Send success message
    return autoDeleteMessage(message, {
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setDescription(
            `Successfully disconnected from <#${message.member.voice.channel.id}>`
          )
          .setFooter({
            text: `Requested by ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          }),
      ],
    });
  },
};
