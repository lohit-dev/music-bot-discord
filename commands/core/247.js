const { EmbedBuilder } = require("discord.js");
const { autoDeleteMessage } = require("../../utils/auto_delete");


module.exports = {
  name: "247",
  aliases: ["24/7", "stay", "forever"],
  category: "Music",
  description: "Toggle 24/7 mode (bot stays in voice channel forever)",
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

    // Toggle 24/7 mode for this player
    const stayInChannel = !player.get("247");
    player.set("247", stayInChannel);

    // Update player options
    player.options.leaveOnEmpty = !stayInChannel;
    player.options.leaveOnEmptyCooldown = 0;
    player.options.leaveOnEnd = !stayInChannel;
    player.options.leaveOnStop = !stayInChannel;

    return autoDeleteMessage(message, {
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setDescription(
            `24/7 mode is now ${stayInChannel ? "**enabled**" : "**disabled**"}`
          )
          .setFooter({
            text: stayInChannel
              ? "I'll stay in the voice channel even when empty"
              : "I'll leave the voice channel when it's empty",
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          }),
      ],
    });
  },
};
