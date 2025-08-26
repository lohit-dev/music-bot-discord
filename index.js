// index.js
const {
  Client,
  GatewayIntentBits,
  Collection,
  EmbedBuilder,
} = require("discord.js");
const { Manager } = require("moonlink.js");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");

// Create a new Discord client with the necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Needed for guild-related events
    GatewayIntentBits.GuildVoiceStates, // Required for voice functionality
    GatewayIntentBits.GuildMessages, // Needed to receive messages
    GatewayIntentBits.MessageContent, // Required to read message content
  ],
});

// Make config accessible throughout the application
client.config = config;
console.log(`[CONFIG] Loaded with prefix: ${config.prefix}`);

// Create a new Moonlink Manager instance
// This is the main interface for interacting with Lavalink
client.manager = new Manager({
  disableNativeSources: false,
  // Configure the Lavalink nodes to connect to
  nodes: [
    {
      host: config.lavalink.host, // The hostname of your Lavalink server
      port: config.lavalink.port, // The port your Lavalink server is running on
      password: config.lavalink.password, // The password for your Lavalink server
      secure: config.lavalink.secure, // Whether to use SSL/TLS for the connection
    },
  ],
  // This function sends voice state updates to Discord
  // It's required for the bot to join voice channels
  sendPayload: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(JSON.parse(payload));
  },
  autoPlay: true, // Automatically play the next song in the queue
  playerOptions: {
    leaveOnEmpty: !config.stayInChannel, // Don't leave when channel is empty if stayInChannel is true
    leaveOnEmptyCooldown: 0, // Disable cooldown
    leaveOnEnd: false, // Don't leave when queue ends
    leaveOnStop: false, // Don't leave when stopped
  },
});

// Set up a collection to store commands
client.commands = new Collection();

// Load command files from the commands directory and its subdirectories
function loadCommands(dir) {
  const commandFiles = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of commandFiles) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      // If it's a directory, recursively load commands from it
      loadCommands(filePath);
    } else if (file.name.endsWith(".js")) {
      // If it's a JS file, load it as a command
      try {
        const command = require(`./${filePath}`);
        console.log(
          `[COMMANDS] Registering command: ${command.name} from file ${filePath}`
        );
        client.commands.set(command.name, command);
      } catch (error) {
        console.error(
          `[ERROR] Failed to load command file ${filePath}:`,
          error
        );
      }
    }
  }
}

// Load all commands
loadCommands("./commands");

// Load event handler files from the events directory
const eventFiles = fs
  .readdirSync("./events")
  .filter((file) => file.endsWith(".js"));

// Register each event handler
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    // For events that should only trigger once
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    // For events that can trigger multiple times
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Handle raw events for voice state updates
// This is crucial for Moonlink.js to work properly
client.on("raw", (packet) => {
  client.manager.packetUpdate(packet);
});

// Add player events to handle 24/7 mode
client.manager.on("playerDisconnected", (player, voiceChannelId) => {
  // If the player has 24/7 mode enabled, reconnect
  if (player && player.get("247")) {
    setTimeout(() => {
      player.connect();
      console.log(
        `[24/7] Reconnected to voice channel in guild ${player.guildId}`
      );
    }, 1000);
  }
});

client.manager.on("playerDestroyed", (player) => {
  // If the player has 24/7 mode enabled, recreate it
  if (player && player.get("247")) {
    setTimeout(() => {
      const newPlayer = client.manager.createPlayer({
        guildId: player.guildId,
        voiceChannelId: player.voiceChannelId,
        textChannelId: player.textChannelId,
        autoPlay: true,
      });

      newPlayer.set("247", true);
      newPlayer.options.leaveOnEmpty = false;
      newPlayer.options.leaveOnEmptyCooldown = 0;
      newPlayer.options.leaveOnEnd = false;
      newPlayer.options.leaveOnStop = false;

      newPlayer.connect();
      console.log(`[24/7] Recreated player in guild ${player.guildId}`);
    }, 1000);
  }
});

// Node connection events
client.manager.on("nodeConnect", (node) => {
  console.log(`Node ${node.identifier || "unknown"} connected successfully`);
  console.log(
    `Node details: ${JSON.stringify({
      host: node.options.host,
      port: node.options.port,
      secure: node.options.secure,
      connected: node.connected,
    })}`
  );
});

// Handle node disconnection with automatic reconnect
client.manager.on("nodeDisconnect", (node) => {
  console.log(`Node ${node.identifier || "unknown"} disconnected`);

  // Attempt to reconnect after a short delay
  setTimeout(() => {
    try {
      console.log(
        `Attempting to reconnect to node ${node.options.host}:${node.options.port}...`
      );
      node.connect();
    } catch (err) {
      console.error(`Failed to reconnect to node: ${err.message}`);

      // Schedule another reconnection attempt
      setTimeout(() => {
        console.log("Scheduling another reconnection attempt...");
        client.manager.connectNode({
          host: node.options.host,
          port: node.options.port,
          password: node.options.password,
          secure: node.options.secure,
        });
      }, 10000); // Try again after 10 seconds
    }
  }, 5000); // Initial reconnect attempt after 5 seconds
});

// Handle node errors with automatic recovery
client.manager.on("nodeError", (node, error) => {
  console.error(
    `Node ${node.identifier || "unknown"} encountered an error:`,
    error
  );

  // Check if players need to be moved to another node
  if (client.manager.nodes.size > 1) {
    // Find another available node
    const availableNode = [...client.manager.nodes.values()].find(
      (n) => n.connected && n.identifier !== node.identifier
    );

    if (availableNode) {
      console.log(
        `Moving players from failed node to ${availableNode.identifier}`
      );

      // Get all players on the failed node
      const playersToMove = [...client.manager.players.values()].filter(
        (player) => player.node === node
      );

      // Move each player to the available node
      for (const player of playersToMove) {
        try {
          player.transferNode(availableNode.identifier);
          console.log(
            `Moved player in guild ${player.guildId} to node ${availableNode.identifier}`
          );
        } catch (err) {
          console.error(
            `Failed to move player in guild ${player.guildId}: ${err.message}`
          );
        }
      }
    } else {
      console.log("No other nodes available for failover");
    }
  }

  // Attempt to reconnect the failed node
  setTimeout(() => {
    try {
      console.log(
        `Attempting to reconnect to node ${node.host || "unknown"}:${
          node.port || "unknown"
        } after error...`
      );
      node.connect();
    } catch (err) {
      console.error(`Failed to reconnect to node after error: ${err.message}`);
    }
  }, 5000);
});

// Playback events
client.manager.on("trackStart", (player, track) => {
  const channel = client.channels.cache.get(player.textChannelId);
  if (channel) {
    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setDescription(`Now playing: **${track.title}**`)
      .setFooter({
        text: track.requester
          ? `Requested by ${track.requester}`
          : "Auto-played from queue",
        iconURL: track.requester
          ? client.users.cache
              .get(track.requester)
              ?.displayAvatarURL({ dynamic: true })
          : client.user.displayAvatarURL({ dynamic: true }),
      });

    channel.send({ embeds: [embed] }).then((msg) => {
      setTimeout(() => {
        msg.delete().catch((error) => {
          if (error.code !== 10008) {
            console.error("Failed to delete now playing message:", error);
          }
        });
      }, 15 * 1000);
    });
  }
});

client.manager.on("trackEnd", (player, track) => {
  console.log(`Track ended: ${track.title}`);

  // If there are no more tracks in the queue, restart the garden playlist after a delay
  if (player.queue.size === 0 && !player.playing) {
    console.log("Queue empty, will restart garden playlist in 2 seconds");

    setTimeout(async () => {
      try {
        // Only restart if still no tracks and not playing
        if (!player.playing && player.queue.size === 0) {
          console.log("Restarting garden playlist");

          // Get the default playlist URL from config
          const playlistUrl = client.config.defaultPlaylist;
          if (!playlistUrl) {
            console.log("No default playlist configured");
            return;
          }

          // Search for the playlist
          const searchResult = await client.manager.search({
            query: playlistUrl,
            requester: "GardenBot",
          });

          // Add all tracks to the queue
          if (
            searchResult.loadType === "playlist" &&
            searchResult.tracks.length > 0
          ) {
            player.queue.add(searchResult.tracks);

            // Start playback
            player.play();

            console.log(
              `Restarted garden playlist with ${searchResult.tracks.length} tracks`
            );
          }
        }
      } catch (error) {
        console.error("Error restarting garden playlist:", error);
      }
    }, 2000); // 2 second delay before restarting garden playlist
  }
});

client.manager.on("queueEnd", (player) => {
  // Send a message when the queue ends
  const channel = client.channels.cache.get(player.textChannelId);
  if (channel) {
    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setDescription("Queue ended. Starting garden playlist.")
      .setFooter({
        text: "Auto-playing garden playlist",
        iconURL: client.user.displayAvatarURL({ dynamic: true }),
      });

    channel.send({ embeds: [embed] });
  }

  // Restart the garden playlist after a short delay
  setTimeout(async () => {
    try {
      // Only restart if still no tracks and not playing
      if (!player.playing && player.queue.size === 0) {
        console.log("Restarting garden playlist after queue end");

        // Get the default playlist URL from config
        const playlistUrl = client.config.defaultPlaylist;
        if (!playlistUrl) {
          console.log("No default playlist configured");
          return;
        }

        // Search for the playlist
        const searchResult = await client.manager.search({
          query: playlistUrl,
          requester: "GardenBot",
        });

        // Add all tracks to the queue
        if (
          searchResult.loadType === "playlist" &&
          searchResult.tracks.length > 0
        ) {
          player.queue.add(searchResult.tracks);

          // Start playback
          player.play();

          console.log(
            `Restarted garden playlist with ${searchResult.tracks.length} tracks`
          );
        }
      }
    } catch (error) {
      console.error("Error restarting garden playlist:", error);
    }
  }, 2000); // 2 second delay before restarting garden playlist
});

// Login to Discord with your bot token
client.login(config.token);

process.on("SIGINT", () => {
  console.log("Cleaning up before exit...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Cleaning up before termination...");
  process.exit(0);
});

// Handle bot disconnection with automatic reconnection and playback
client.on("disconnect", async () => {
  console.log("[RECONNECT] Bot disconnected, attempting to reconnect...");

  // Try to reconnect to Discord
  try {
    await client.login(config.token);
    console.log("[RECONNECT] Successfully reconnected to Discord");

    // Wait for client to be fully ready
    setTimeout(async () => {
      console.log("[RECONNECT] Checking for voice connections to restore...");

      // Get saved voice connections from before disconnect
      const savedConnections = [];

      // For each guild the bot is in
      for (const [guildId, guild] of client.guilds.cache) {
        // Check if the bot was in a voice channel in this guild
        const me = guild.members.cache.get(client.user.id);
        if (me && me.voice.channelId) {
          const voiceChannelId = me.voice.channelId;
          console.log(
            `[RECONNECT] Bot is in voice channel ${voiceChannelId} in guild ${guildId}`
          );

          savedConnections.push({
            guildId,
            voiceChannelId,
            guild,
          });
        }
      }

      // Restore each connection
      for (const connection of savedConnections) {
        const { guildId, voiceChannelId, guild } = connection;

        // Find a suitable text channel
        let textChannelId;

        // First try to find a channel with "music" or "bot" in the name
        const musicChannel = guild.channels.cache.find(
          (channel) =>
            channel.type === 0 && // Text channel
            (channel.name.includes("music") || channel.name.includes("bot"))
        );

        if (musicChannel) {
          textChannelId = musicChannel.id;
        } else {
          // Otherwise use the first text channel the bot can send messages in
          const textChannel = guild.channels.cache.find(
            (channel) =>
              channel.type === 0 && // Text channel
              channel.permissionsFor(client.user.id).has("SendMessages")
          );

          if (textChannel) {
            textChannelId = textChannel.id;
          }
        }

        if (textChannelId) {
          // Wait for a moment to ensure voice connection is ready
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Create a new player with retry mechanism
          let retryCount = 0;
          const maxRetries = 5;

          const createPlayerWithRetry = async () => {
            try {
              console.log(
                `[RECONNECT] Attempt ${
                  retryCount + 1
                } to create player for guild ${guildId}`
              );

              // Check if a player already exists
              let player = client.manager.players.get(guildId);

              if (!player) {
                // Create a new player
                player = client.manager.createPlayer({
                  guildId: guildId,
                  voiceChannelId: voiceChannelId,
                  textChannelId: textChannelId,
                  autoPlay: true,
                });

                // Enable 24/7 mode
                player.set("247", true);
                player.options.leaveOnEmpty = false;
                player.options.leaveOnEmptyCooldown = 0;
                player.options.leaveOnEnd = false;
                player.options.leaveOnStop = false;

                // Set autoPlay and autoLeave properties
                if (typeof player.setAutoPlay === "function") {
                  player.setAutoPlay(true);
                }
                if (typeof player.setAutoLeave === "function") {
                  player.setAutoLeave(false);
                }

                // Connect to the voice channel
                player.connect();

                console.log(`[RECONNECT] Created player for guild ${guildId}`);

                // Wait for connection to establish
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Send a message to the text channel
                const channel = client.channels.cache.get(textChannelId);
                // if (channel) {
                // const embed = new EmbedBuilder()
                //   .setColor(client.config.embedColor)
                //   .setDescription(
                //     "Bot has reconnected! Starting garden playlist..."
                //   )
                //   .setFooter({
                //     text: `Garden Music • 24/7 Mode Enabled • ${guild.name}`,
                //     iconURL: guild.iconURL({ dynamic: true }),
                //   });

                // await channel.send({ embeds: [embed] });
                // }

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

                    if (searchResult.loadType === "playlist") {
                      // Add all tracks to the queue
                      player.queue.add(searchResult.tracks);

                      // Start playback
                      if (!player.playing) {
                        player.play();
                      }

                      console.log(
                        `[RECONNECT] Started garden playlist with ${searchResult.tracks.length} tracks in guild ${guildId}`
                      );

                      // Send a message to the text channel
                      const channel = client.channels.cache.get(textChannelId);
                      if (channel) {
                        const embed = new EmbedBuilder()
                          .setColor(client.config.embedColor)
                          .setDescription(
                            `Started playing garden playlist with ${searchResult.tracks.length} tracks.`
                          )
                          .setFooter({
                            text: `Garden Music • 24/7 Mode Enabled • ${guild.name}`,
                            iconURL: guild.iconURL({ dynamic: true }),
                          });

                        await channel.send({ embeds: [embed] });
                      }
                    }
                  }
                } catch (error) {
                  console.error(
                    `[RECONNECT] Error starting garden playlist in guild ${guildId}:`,
                    error
                  );

                  // If there was an error, retry
                  if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(
                      `[RECONNECT] Retrying player creation (${retryCount}/${maxRetries})...`
                    );
                    setTimeout(createPlayerWithRetry, 5000 * retryCount); // Exponential backoff
                  }
                }
              } else {
                console.log(
                  `[RECONNECT] Player already exists for guild ${guildId}`
                );

                // If player exists but isn't playing, start the garden playlist
                if (!player.playing && player.queue.size === 0) {
                  // Send a message to the text channel
                  const channel = client.channels.cache.get(textChannelId);
                  // if (channel) {
                  //   const embed = new EmbedBuilder()
                  //     .setColor(client.config.embedColor)
                  //     .setDescription(
                  //       "Bot has reconnected! Restarting garden playlist..."
                  //     )
                  //     .setFooter({
                  //       text: `Garden Music • 24/7 Mode Enabled • ${guild.name}`,
                  //       iconURL: guild.iconURL({ dynamic: true }),
                  //     });

                  //   await channel.send({ embeds: [embed] });
                  // }

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

                      if (searchResult.loadType === "playlist") {
                        // Add all tracks to the queue
                        player.queue.add(searchResult.tracks);

                        // Start playback
                        if (!player.playing) {
                          player.play();
                        }

                        console.log(
                          `[RECONNECT] Restarted garden playlist with ${searchResult.tracks.length} tracks in guild ${guildId}`
                        );

                        // Send a message to the text channel
                        const channel =
                          client.channels.cache.get(textChannelId);
                        // if (channel) {
                        //   const embed = new EmbedBuilder()
                        //     .setColor(client.config.embedColor)
                        //     .setDescription(
                        //       `Restarted playing garden playlist with ${searchResult.tracks.length} tracks.`
                        //     )
                        //     .setFooter({
                        //       text: `Garden Music Bot • 24/7 Mode Enabled • ${guild.name}`,
                        //       iconURL: guild.iconURL({ dynamic: true }),
                        //     });

                        //   await channel.send({ embeds: [embed] });
                        // }
                      }
                    }
                  } catch (error) {
                    console.error(
                      `[RECONNECT] Error restarting garden playlist in guild ${guildId}:`,
                      error
                    );
                  }
                }
              }
            } catch (error) {
              console.error(
                `[RECONNECT] Error creating player: ${error.message}`
              );

              // If there was an error, retry
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(
                  `[RECONNECT] Retrying player creation (${retryCount}/${maxRetries})...`
                );
                setTimeout(createPlayerWithRetry, 5000 * retryCount); // Exponential backoff
              }
            }
          };

          // Start the retry process
          createPlayerWithRetry();
        } else {
          console.log(
            `[RECONNECT] Could not find a suitable text channel in guild ${guildId}`
          );
        }
      }
    }, 5000); // Wait 5 seconds after reconnection to ensure all guilds are cached
  } catch (error) {
    console.error("[RECONNECT] Failed to reconnect:", error);

    // Try to reconnect again after a delay
    setTimeout(() => {
      console.log("[RECONNECT] Attempting to reconnect again...");
      client.login(config.token).catch((err) => {
        console.error("[RECONNECT] Failed to reconnect again:", err);
      });
    }, 10000); // Wait 10 seconds before trying again
  }
});

// Also clean up on disconnect
client.on("disconnect", () => {
  console.log("Bot disconnected, cleaning up resources...");
});
