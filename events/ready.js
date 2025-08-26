const { autoDeleteMessage } = require("../utils/auto_delete");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);

    // Set the bot's presence
    client.user.setPresence({
      activities: [{ name: "🎵 Garden Music", type: 2 }], // Type 2 is "Listening to"
      status: "online",
    });

    // Initialize the Moonlink Manager with the bot's user ID
    // This is required for the manager to function correctly
    client.manager.init(client.user.id);
    console.log("Moonlink Manager initialized");

    // Wait for node connection
    try {
      // Check if nodes are already connected
      if (client.manager.nodes.size === 0) {
        console.log("Waiting for Lavalink node to connect...");

        // Set up a promise to wait for node connection
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            client.manager.removeListener("nodeConnect", handleConnect);
            reject(new Error("Timed out waiting for Lavalink node to connect"));
          }, 10000); // 10 second timeout

          const handleConnect = (node) => {
            clearTimeout(timeout);
            console.log(`Node ${node.identifier} connected successfully`);
            resolve();
          };

          client.manager.on("nodeConnect", handleConnect);
        })
          .then(() => {
            console.log("Lavalink node connected");
          })
          .catch((err) => {
            console.warn("Warning:", err.message);
            console.log(
              "Bot will continue, but music commands may not work until a Lavalink node connects"
            );
          });
      }

      console.log(`Connected Lavalink nodes: ${client.manager.nodes}`);

      // Hardcoded IDs for auto-joining and auto-playing
      const GUILD_ID = "1332295612997304371";
      const VOICE_CHANNEL_ID = "1346063105389625514";
      // Use the voice channel ID for text messages since it's a Discord voice channel with text chat
      const TEXT_CHANNEL_ID = VOICE_CHANNEL_ID;

      console.log(
        `[AUTO-JOIN] Attempting to auto-join voice channel ${VOICE_CHANNEL_ID} in guild ${GUILD_ID}`
      );

      // Wait a moment to ensure everything is initialized
      setTimeout(async () => {
        try {
          // Check if guild exists
          const guild = client.guilds.cache.get(GUILD_ID);
          if (!guild) {
            console.log(
              `[AUTO-JOIN] Guild ${GUILD_ID} not found, cannot auto-join`
            );
            return;
          }

          // Check if voice channel exists
          const voiceChannel = guild.channels.cache.get(VOICE_CHANNEL_ID);
          if (!voiceChannel) {
            console.log(
              `[AUTO-JOIN] Voice channel ${VOICE_CHANNEL_ID} not found in guild ${GUILD_ID}`
            );
            return;
          }

          // Check if text channel exists
          const textChannel = guild.channels.cache.get(TEXT_CHANNEL_ID);
          if (!textChannel) {
            console.log(
              `[AUTO-JOIN] Text channel ${TEXT_CHANNEL_ID} not found in guild ${GUILD_ID}`
            );
            return;
          }

          console.log(`[AUTO-JOIN] Creating player for guild ${GUILD_ID}`);

          // Create player with retry mechanism
          const createPlayerWithRetry = async (
            retryCount = 0,
            maxRetries = 10
          ) => {
            try {
              console.log(
                `[AUTO-JOIN] Attempt ${retryCount + 1
                } to create player for guild ${GUILD_ID}`
              );

              // Check if a player already exists
              let player = client.manager.players.get(GUILD_ID);

              if (!player) {
                // Create a new player
                player = client.manager.createPlayer({
                  guildId: GUILD_ID,
                  voiceChannelId: VOICE_CHANNEL_ID,
                  textChannelId: TEXT_CHANNEL_ID,
                  autoPlay: true,
                });

                // Enable 24/7 mode
                player.set("247", true);
                player.options.leaveOnEmpty = false;
                player.options.leaveOnEmptyCooldown = 0;
                player.options.leaveOnEnd = false;
                player.options.leaveOnStop = false;

                // Set autoPlay and autoLeave properties if the methods exist
                if (typeof player.setAutoPlay === "function") {
                  player.setAutoPlay(true);
                }
                if (typeof player.setAutoLeave === "function") {
                  player.setAutoLeave(false);
                }

                // Connect to the voice channel
                player.connect();

                console.log(`[AUTO-JOIN] Created player for guild ${GUILD_ID}`);

                // Wait for connection to establish
                await new Promise((resolve) => setTimeout(resolve, 5000));

                // Send a message to the text channel
                const embed = new EmbedBuilder()
                  .setColor(client.config.embedColor)
                  .setDescription(
                    "Bot has automatically joined the voice channel! Starting garden playlist..."
                  )
                  .setFooter({
                    text: `Garden Music • 24/7 Mode Enabled • ${guild.name}`,
                    iconURL: guild.iconURL({ dynamic: true }),
                  });

                await textChannel.send({ embeds: [embed] });

                // Start playing the garden playlist
                try {
                  // Get the default playlist URL from config
                  const playlistUrl = client.config.defaultPlaylist;
                  if (playlistUrl) {
                    console.log(
                      `[AUTO-JOIN] Searching for playlist: ${playlistUrl}`
                    );

                    // Search for the playlist
                    const searchResult = await client.manager.search({
                      query: playlistUrl,
                      requester: "GardenBot",
                    });

                    console.log(
                      `[AUTO-JOIN] Search result load type: ${searchResult.loadType}`
                    );

                    if (
                      searchResult.loadType === "playlist" ||
                      searchResult.loadType === "search" ||
                      searchResult.loadType === "track"
                    ) {
                      // Add all tracks to the queue
                      if (
                        searchResult.tracks &&
                        searchResult.tracks.length > 0
                      ) {
                        player.queue.add(searchResult.tracks);

                        // Start playback
                        if (!player.playing) {
                          player.play();
                        }

                        console.log(
                          `[AUTO-JOIN] Started garden playlist with ${searchResult.tracks.length} tracks in guild ${GUILD_ID}`
                        );

                        // Send a message to the text channel
                        const playEmbed = new EmbedBuilder()
                          .setColor(client.config.embedColor)
                          .setDescription(
                            `Started playing garden playlist with ${searchResult.tracks.length} tracks.`
                          )
                          .setFooter({
                            text: `Garden Music • 24/7 Mode Enabled • ${guild.name}`,
                            iconURL: guild.iconURL({ dynamic: true }),
                          });

                        await textChannel.send({ embeds: [playEmbed] });
                      } else {
                        console.log(
                          `[AUTO-JOIN] No tracks found in the search result`
                        );
                        throw new Error("No tracks found in the search result");
                      }
                    } else {
                      console.log(
                        `[AUTO-JOIN] Invalid load type: ${searchResult.loadType}`
                      );
                      throw new Error(
                        `Invalid load type: ${searchResult.loadType}`
                      );
                    }
                  } else {
                    console.log(
                      `[AUTO-JOIN] No default playlist URL configured`
                    );
                    throw new Error("No default playlist URL configured");
                  }
                } catch (error) {
                  console.error(
                    `[AUTO-JOIN] Error starting garden playlist in guild ${GUILD_ID}:`,
                    error
                  );

                  // If there was an error, retry
                  if (retryCount < maxRetries) {
                    console.log(
                      `[AUTO-JOIN] Retrying player creation (${retryCount + 1
                      }/${maxRetries})...`
                    );
                    setTimeout(
                      () => createPlayerWithRetry(retryCount + 1, maxRetries),
                      10000
                    ); // 10 second delay between retries
                  }
                }
              } else {
                console.log(
                  `[AUTO-JOIN] Player already exists for guild ${GUILD_ID}`
                );

                // If player exists but isn't playing, start the garden playlist
                if (!player.playing && player.queue.size === 0) {
                  // Send a message to the text channel
                  // const { EmbedBuilder } = require("discord.js");
                  // const embed = new EmbedBuilder()
                  //   .setColor(client.config.embedColor)
                  //   .setDescription(
                  //     "Bot has reconnected! Restarting garden playlist..."
                  //   )
                  //   .setFooter({
                  //     text: `Garden Music • 24/7 Mode Enabled • ${guild.name}`,
                  //     iconURL: guild.iconURL({ dynamic: true }),
                  //   });

                  // await textChannel.send({ embeds: [embed] });

                  // Start playing the garden playlist
                  try {
                    // Get the default playlist URL from config
                    const playlistUrl = client.config.defaultPlaylist;
                    if (playlistUrl) {
                      // Search for the playlist
                      const searchResult = await client.manager.search({
                        query: playlistUrl,
                        requester: "GardenBot",
                      });

                      if (
                        searchResult.loadType === "playlist" ||
                        searchResult.loadType === "search" ||
                        searchResult.loadType === "track"
                      ) {
                        // Add all tracks to the queue
                        if (
                          searchResult.tracks &&
                          searchResult.tracks.length > 0
                        ) {
                          player.queue.add(searchResult.tracks);

                          // Start playback
                          if (!player.playing) {
                            player.play();
                          }

                          console.log(
                            `[AUTO-JOIN] Restarted garden playlist with ${searchResult.tracks.length} tracks in guild ${GUILD_ID}`
                          );

                          // Send a message to the text channel
                          // const playEmbed = new EmbedBuilder()
                          //   .setColor(client.config.embedColor)
                          //   .setDescription(
                          //     `Restarted playing garden playlist with ${searchResult.tracks.length} tracks.`
                          //   )
                          //   .setFooter({
                          //     text: `Garden Music • 24/7 Mode Enabled • ${guild.name}`,
                          //     iconURL: guild.iconURL({ dynamic: true }),
                          //   });

                          // await textChannel.send({ embeds: [playEmbed] });
                        }
                      }
                    }
                  } catch (error) {
                    console.error(
                      `[AUTO-JOIN] Error restarting garden playlist in guild ${GUILD_ID}:`,
                      error
                    );
                  }
                }
              }
            } catch (error) {
              console.error(
                `[AUTO-JOIN] Error creating player: ${error.message}`
              );

              // If there was an error, retry
              if (retryCount < maxRetries) {
                console.log(
                  `[AUTO-JOIN] Retrying player creation (${retryCount + 1
                  }/${maxRetries})...`
                );
                setTimeout(
                  () => createPlayerWithRetry(retryCount + 1, maxRetries),
                  10000
                ); // 10 second delay between retries
              }
            }
          };

          // Start the player creation process
          createPlayerWithRetry();
        } catch (error) {
          console.error(`[AUTO-JOIN] Error during auto-join:`, error);
        }
      }, 5000); // Wait 5 seconds after bot is ready before attempting to auto-join
    } catch (error) {
      console.error("Error during Lavalink connection setup:", error);
    }
  },
};
