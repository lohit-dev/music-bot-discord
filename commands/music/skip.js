const { EmbedBuilder } = require("discord.js");
const { autoDeleteMessage } = require("../../utils/auto_delete");


module.exports = {
  name: "skip",
  aliases: ["s", "next"],
  category: "Music",
  description: "Skip the current song",
  execute(message, args, client) {
    // Step 1: Get the player for this guild
    // Each guild has its own player instance
    const player = client.manager.players.get(message.guild.id);

    // Step 2: Check if there is a player
    // We can't skip if nothing is playing
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
    // This prevents users from controlling the bot from different channels
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

    // Step 4: Check if there is a current track
    // We can't skip if nothing is playing
    if (!player.current) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("There is nothing playing right now!"),
        ],
      });
    }

    // Step 5: Skip the current track
    // Store the current track before skipping for the message
    const currentTrack = player.current;
    player.skip();

    // Step 6: Inform the user
    return autoDeleteMessage(message, {
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setDescription(`⏭️ Skipped: **${currentTrack.title}**`)
          .setFooter({
            text: `Requested by ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          }),
      ],
    });
  },
};
