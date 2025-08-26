const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const { autoDeleteMessage } = require("../../utils/auto_delete");


module.exports = {
  name: "about",
  description: "See information about this bot",
  async execute(message, args, client) {
    // Create buttons using links from config
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Invite")
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.links.invite),
      new ButtonBuilder()
        .setLabel("GitHub")
        .setStyle(ButtonStyle.Link)
        .setURL("https://github.com/lohit-dev/MusicBot"),
      new ButtonBuilder()
        .setLabel("Support")
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.links.support)
    );

    // Create embed using config values
    const mainPage = new EmbedBuilder()
      .setAuthor({
        name: "Garden Music",
        iconURL: client.config.links.bg,
      })
      .setThumbnail(client.config.links.bg)
      .setColor(client.config.embedColor)
      .addFields(
        {
          name: "About",
          value:
            "**Garden Music** - Less time bridging, more time listening...",
          inline: false,
        },
        { name: "Organization", value: "Garden Community", inline: true },
        { name: "Purpose", value: "Community Music Bot", inline: true },
        {
          name: "Features",
          value: "Default Playlist, 24/7 Playback",
          inline: true,
        },
        {
          name: "\u200b",
          value:
            "The Garden Music bot is designed to enhance your community experience with seamless music playback. With features like default playlist and 24/7 playback, you can enjoy continuous music without interruptions. Perfect for community gatherings and events!",
        }
      );

    // Always return an embed rather than a simple message
    return autoDeleteMessage(message, { embeds: [mainPage], components: [row] });
  },
};
