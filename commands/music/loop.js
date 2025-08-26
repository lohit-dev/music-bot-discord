const { EmbedBuilder } = require("discord.js");
const { autoDeleteMessage } = require("../../utils/auto_delete");


module.exports = {
  name: "loop",
  aliases: ["repeat", "l"],
  category: "Music",
  description: "Set the loop mode",
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

    if (!args.length) {
      if (player.loop === "none") {
        player.setLoop("track");
        return autoDeleteMessage(message, {
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.embedColor)
              .setDescription("🔂 Track loop enabled.")
              .setFooter({
                text: `Requested by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
              }),
          ],
        });
      } else {
        player.setLoop("none");
        return autoDeleteMessage(message, {
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.embedColor)
              .setDescription("➡️ Loop disabled.")
              .setFooter({
                text: `Requested by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
              }),
          ],
        });
      }
    }

    const mode = args[0].toLowerCase();
    let responseMessage = "";

    switch (mode) {
      case "none":
      case "off":
      case "disable":
        player.setLoop("none");
        responseMessage = "➡️ Loop disabled.";
        break;

      case "track":
      case "song":
      case "current":
        player.setLoop("track");
        responseMessage = "🔂 Track loop enabled.";
        break;

      case "queue":
      case "all":
        player.setLoop("queue");
        responseMessage = "🔁 Queue loop enabled.";
        break;

      default:
        return autoDeleteMessage(message, {
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.embedColor)
              .setDescription(
                "Invalid mode! Use: `none`, `track`, or `queue`."
              ),
          ],
        });
    }

    return autoDeleteMessage(message, {
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setDescription(responseMessage)
          .setFooter({
            text: `Requested by ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          }),
      ],
    });
  },
};
