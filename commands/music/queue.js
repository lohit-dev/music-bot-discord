const { EmbedBuilder } = require("discord.js");
const { formatDuration } = require("../../utils/convert");
const { autoDeleteMessage } = require("../../utils/auto_delete");


module.exports = {
  name: "queue",
  category: "Music",
  description: "Show the current queue",
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

    // Step 3: Check if there are tracks in the queue
    if (!player.current && player.queue.size === 0) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("There are no tracks in the queue!"),
        ],
      });
    }

    // Step 5: Create an embed for the queue
    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Queue",
        iconURL: client.user.displayAvatarURL(),
      })
      .setColor(client.config.embedColor);

    // Step 6: Add the current track to the embed
    if (player.current) {
      embed.addFields({
        name: "Now Playing",
        value: `[${player.current.title}](${player.current.uri || "https://discord.com"
          }) - \`${formatDuration(player.current.duration)}\``,
        inline: false,
      });
    }

    // Step 7: Add the queue tracks to the embed
    if (player.queue.size > 0) {
      let queueString = "";

      // Get up to 10 tracks from the queue
      const tracks = player.queue.tracks.slice(0, 10);

      // Format each track
      tracks.forEach((track, index) => {
        queueString += `\`${index + 1}.\` [${track.title}](${track.uri || "https://discord.com"
          }) - \`${formatDuration(track.duration)}\`\n`;
      });

      // Add the queue to the embed
      embed.addFields({
        name: `Upcoming Songs (${player.queue.size})`,
        value: queueString || "No songs in queue",
        inline: false,
      });

      // If there are more than 10 tracks, add a note
      if (player.queue.size > 10) {
        embed.setFooter({
          text: `And ${player.queue.size - 10} more songs...`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        });
      } else {
        embed.setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        });
      }
    } else {
      // If there are no tracks in the queue
      embed.addFields({
        name: "Upcoming Songs",
        value: "No songs in queue",
        inline: false,
      });

      embed.setFooter({
        text: `Requested by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      });
    }

    embed.setTimestamp();

    // Step 8: Send the embed to the channel
    return autoDeleteMessage(message, { embeds: [embed] });
  },
};
