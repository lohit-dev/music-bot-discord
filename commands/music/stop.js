const { EmbedBuilder } = require("discord.js");
const { autoDeleteMessage } = require("../../utils/auto_delete");


module.exports = {
  name: "stop",
  aliases: ["clear", "st"],
  category: "Music",
  description: "Stop playback and clear the queue",
  execute(message, args, client) {
    const player = client.manager.players.get(message.guild.id);

    if (!player) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("There is nothing playing in this server!")
        ]
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

    // Step 4: Stop playback and clear the queue
    player.stop(); // Stop the current track
    player.queue.clear(); // Clear the queue

    // Step 5: Inform the user
    return autoDeleteMessage(message, {
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setDescription("⏹️ Stopped playback and cleared the queue.")
          .setFooter({
            text: `Requested by ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          }),
      ],
    });
  },
};
