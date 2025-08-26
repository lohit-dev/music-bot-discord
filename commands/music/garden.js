const { EmbedBuilder } = require("discord.js");
const { autoDeleteMessage } = require("../../utils/auto_delete");


module.exports = {
  name: "garden",
  aliases: ["g", "relax"],
  category: "Music",
  description: "Play the default garden playlist",
  async execute(message, args, client) {
    console.log("[GARDEN] Garden command executed");

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
      // Get the default playlist URL from config
      const playlistUrl = client.config.defaultPlaylist;
      if (!playlistUrl) {
        return autoDeleteMessage(message, {
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.embedColor)
              .setDescription(
                "No default playlist is configured. Please set one in config.json."
              ),
          ],
        });
      }

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

      // Enable 24/7 mode for garden playlist
      player.set("247", true);

      // Set autoPlay and autoLeave properties
      player.setAutoPlay(true);
      player.setAutoLeave(false);

      console.log("[GARDEN] Enabled 24/7 mode for garden playlist");

      autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(
              "Loading the garden playlist... This may take a moment."
            ),
        ],
      });

      // Search for the playlist
      const searchResult = await client.manager.search({
        query: playlistUrl,
        requester: "GardenBot",
      });

      // Handle search results
      if (searchResult.loadType === "playlist") {
        // Add all tracks to the queue
        player.queue.add(searchResult.tracks);

        autoDeleteMessage(message, {
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.embedColor)
              .setDescription(
                `Started playing garden playlist **${searchResult.playlistInfo.name}** with ${searchResult.tracks.length} tracks.`
              )
              .setFooter({
                text: `Garden Music • 24/7 Mode Enabled • ${message.guild.name}`,
                iconURL: message.guild.iconURL({ dynamic: true }),
              }),
          ],
        });

        // Start playback if not already playing
        if (!player.playing) {
          player.play();
        }
      } else {
        autoDeleteMessage(message, {
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.embedColor)
              .setDescription(
                "Failed to load the garden playlist. Please check the URL in config.json."
              ),
          ],
        });
      }
    } catch (error) {
      console.error("[GARDEN] Error:", error);
      autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("There was an error playing the garden playlist."),
        ],
      });
    }
  },
};
