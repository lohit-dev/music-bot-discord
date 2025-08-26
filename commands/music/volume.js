const { EmbedBuilder } = require("discord.js");
const { autoDeleteMessage } = require("../../utils/auto_delete");


module.exports = {
  name: "volume",
  aliases: ["vol", "v"],
  category: "Music",
  description: "Adjust the player volume",
  async execute(message, args, client) {
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

    if (!args.length) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`Current volume is: **${player.volume}%**`)
            .setFooter({
              text: `Requested by ${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            }),
        ],
      });
    }

    const volume = parseInt(args[0]);
    if (isNaN(volume)) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("Please provide a valid number!"),
        ],
      });
    }

    if (volume < 0 || volume > 1000) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("Volume must be between 0 and 1000!"),
        ],
      });
    }

    player.setVolume(volume);

    return autoDeleteMessage(message, {
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setDescription(`Volume set to: **${volume}%**`)
          .setFooter({
            text: `Requested by ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          }),
      ],
    });
  },
};
