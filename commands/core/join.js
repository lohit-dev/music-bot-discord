const { EmbedBuilder } = require("discord.js");
const { autoDeleteMessage } = require("../../utils/auto_delete");


module.exports = {
  name: "join",
  aliases: ["connect", "j"],
  category: "Music",
  description: "Make the bot join your voice channel",
  async execute(message, args, client) {
    console.log("[JOIN] Join command executed");

    // Check if the user is in a voice channel
    const { channel } = message.member.voice;
    if (!channel) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("You need to join a voice channel first!"),
        ],
      });
    }

    try {
      // Check if there are any connected nodes
      const nodes = client.manager.nodes;
      if (!nodes || nodes.size === 0) {
        console.log("[JOIN] No Lavalink nodes connected");
        return autoDeleteMessage(message, {
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.embedColor)
              .setDescription(
                "No Lavalink nodes are connected. Please try again later."
              ),
          ],
        });
      }

      console.log(`[JOIN] Connected nodes: ${nodes}`);

      // Create a player or get an existing one
      const player =
        client.manager.players.get(message.guild.id) ||
        client.manager.createPlayer({
          guildId: message.guild.id,
          voiceChannelId: channel.id,
          textChannelId: message.channel.id,
          autoPlay: true,
        });

      // Connect to the voice channel
      player.connect();
      console.log(`[JOIN] Connected to voice channel: ${channel.name}`);

      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`✅ Joined voice channel: **${channel.name}**`)
            .setFooter({
              text: `Requested by ${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            }),
        ],
      });
    } catch (error) {
      console.error("[JOIN] Error joining voice channel:", error);
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("There was an error joining your voice channel."),
        ],
      });
    }
  },
};
