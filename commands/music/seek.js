const { EmbedBuilder } = require("discord.js");
const { formatDuration } = require("../../utils/convert");
const { autoDeleteMessage } = require("../../utils/auto_delete");


module.exports = {
  name: "seek",
  aliases: ["jump", "goto"],
  category: "Music",
  description: "Seek to a specific position in the current track",
  execute(message, args, client) {
    const player = client.manager.players.get(message.guild.id);
    if (!player) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("There is no active music player in this server!"),
        ],
      });
    }

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

    if (!player.current) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("Nothing is playing!"),
        ],
      });
    }

    if (!player.current.isSeekable) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("This track cannot be seeked!"),
        ],
      });
    }

    if (!args.length) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("Please provide a position (e.g., 1:30 or 90)"),
        ],
      });
    }

    const position = args[0];
    let milliseconds = 0;

    if (position.includes(":")) {
      const [minutes, seconds] = position.split(":");
      milliseconds = (parseInt(minutes) * 60 + parseInt(seconds)) * 1000;
    } else {
      milliseconds = parseInt(position) * 1000;
    }

    if (isNaN(milliseconds)) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("Invalid time format!"),
        ],
      });
    }

    if (milliseconds > player.current.duration) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(
              `Track is only ${formatDuration(player.current.duration)} long!`
            ),
        ],
      });
    }

    player.seek(milliseconds);

    return autoDeleteMessage(message, {
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setDescription(`Seeked to: **${formatDuration(milliseconds)}**`)
          .setFooter({
            text: `Requested by ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          }),
      ],
    });
  },
};
