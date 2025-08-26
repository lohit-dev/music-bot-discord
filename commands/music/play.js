const { EmbedBuilder } = require("discord.js");
const { autoDeleteMessage } = require("../../utils/auto_delete");


module.exports = {
  name: "play",
  aliases: ["pl", "p"],
  description: "Play a song",
  async execute(message, args, client) {
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

    if (!args.length) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("Please provide a song to play!"),
        ],
      });
    }

    // Step 3: Create a player or get an existing one
    // The player manages the connection to the voice channel and playback
    const player = client.manager.createPlayer({
      guildId: message.guild.id, // The ID of the Discord server
      voiceChannelId: channel.id, // The ID of the voice channel to join
      textChannelId: message.channel.id, // The ID of the text channel for messages
      autoPlay: true, // Automatically play the next song
    });

    // Step 4: Connect to the voice channel
    // This establishes the connection to the voice channel
    player.connect();

    // Step 5: Search for the track
    // This uses Lavalink to search for the requested song
    const query = args.join(" ");
    const searchResult = await client.manager.search({
      query: query,
      requester: message.author.id, // Store who requested the song
    });

    // Step 6: Handle search results
    // Check if any tracks were found
    if (!searchResult.tracks.length) {
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("No results found!"),
        ],
      });
    }

    // Step 7: Handle different result types
    // The loadType tells us what kind of result we got
    switch (searchResult.loadType) {
      case "playlist":
        // For playlists, add all tracks to the queue
        player.queue.add(searchResult.tracks);

        autoDeleteMessage(message, {
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.embedColor)
              .setDescription(
                `Added playlist **${searchResult.playlistInfo.name}** with ${searchResult.tracks.length} tracks to the queue.`
              )
              .setFooter({
                text: `Requested by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
              }),
          ],
        });

        // Start playback if not already playing
        if (!player.playing) {
          player.play();
        }
        break;

      case "search":
      case "track":
        // For single tracks, add just that track to the queue
        player.queue.add(searchResult.tracks[0]);

        autoDeleteMessage(message, {
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.embedColor)
              .setDescription(
                `Added **${searchResult.tracks[0].title}** to the queue.`
              )
              .setFooter({
                text: `Requested by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
              }),
          ],
        });

        // Start playback if not already playing
        if (!player.playing) {
          player.play();
        }
        break;

      case "empty":
        // No matches found
        autoDeleteMessage(message, {
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.embedColor)
              .setDescription("No matches found for your query!"),
          ],
        });
        break;

      case "error":
        // Error loading track
        autoDeleteMessage(message, {
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.embedColor)
              .setDescription(
                `Error loading track: ${searchResult.error || "Unknown error"}`
              ),
          ],
        });
        break;
    }
  },
};
