const { EmbedBuilder } = require("discord.js");
const { convertTime, formatDuration } = require("../../utils/convert.js");
const { autoDeleteMessage } = require("../../utils/auto_delete");


module.exports = {
  name: "nowplaying",
  aliases: ["now", "np"],
  category: "Music",
  description: "Show now playing song",
  async execute(message, args, client) {
    try {
      // Get player instance for this guild
      const player = client.manager.players.get(message.guild.id);

      // Check if player exists
      if (!player) {
        return autoDeleteMessage(message, {
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.embedColor)
              .setDescription(
                "There is no active music player in this server."
              ),
          ],
        });
      }

      // If no current track but queue has items, try to play the first track
      if (!player.current && player.queue && player.queue.size > 0) {
        try {
          await player.play();
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          return autoDeleteMessage(message, {
            embeds: [
              new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setDescription(`Error starting playback: ${error.message}`),
            ],
          });
        }
      }

      // Recheck player state after potential update
      if (!player.current) {
        return autoDeleteMessage(message, {
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.embedColor)
              .setDescription("There is no music playing currently."),
          ],
        });
      }

      // Get current song
      const song = player.current;

      // Create simple nowplaying embed
      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setAuthor({
          name: "Now Playing",
          iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(`[${song.title}](${song.uri || "https://discord.com"})`)
        .addFields([
          {
            name: "Duration",
            value: `\`${formatDuration(player.current.duration)}\``,
            inline: true,
          },
          {
            name: "Artist",
            value: `\`${song.author || "Unknown"}\``,
            inline: true,
          },
          {
            name: "Requested by",
            value: `\`${song.requester || "Garden Bot"}\``,
            inline: true,
          },
        ])
        .setFooter({
          text: `Garden Music • ${message.guild.name}`,
          iconURL: message.guild.iconURL({ dynamic: true }),
        })
        .setTimestamp();

      return autoDeleteMessage(message, { embeds: [embed] });
    } catch (error) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(
              `Error: ${error.message || "Unknown error occurred"}`
            ),
        ],
      });
    }
  },
};
