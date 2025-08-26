const { EmbedBuilder } = require("discord.js");
const { autoDeleteMessage } = require("../../utils/auto_delete");

module.exports = {
  name: "filter",
  aliases: ["effect", "fx"],
  category: "Music",
  description: "Apply an audio filter",
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
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(
              "Available filters: `reset`, `bassboost`, `nightcore`, `vaporwave`, `8d`, `tremolo`, `vibrato`, `karaoke`"
            ),
        ],
      });
    }

    const filter = args[0].toLowerCase();
    let responseMessage = "";

    try {
      // Debug: Log available methods on player.filters
      console.log("[FILTER DEBUG] Available methods on player.filters:");
      console.log(
        Object.getOwnPropertyNames(Object.getPrototypeOf(player.filters))
      );
      console.log("[FILTER DEBUG] Direct properties on player.filters:");
      console.log(Object.keys(player.filters));

      switch (filter) {
        case "reset":
          // Try different approaches to reset filters
          try {
            // Method 1: Try to use the documented reset method
            if (typeof player.filters.reset === "function") {
              player.filters.resetFilters();
            }
            // Method 2: Try to clear each filter individually
            else {
              // Set equalizer to empty array (default)
              player.filters.setEqualizer([]);

              // Reset timescale to default values
              player.filters.setTimescale({
                speed: 1.0,
                pitch: 1.0,
                rate: 1.0,
              });

              // Reset other filters if they exist
              if (typeof player.filters.setRotation === "function") {
                player.filters.setRotation({ rotationHz: 0.0 });
              }

              if (typeof player.filters.setTremolo === "function") {
                player.filters.setTremolo({ frequency: 0, depth: 0 });
              }

              if (typeof player.filters.setVibrato === "function") {
                player.filters.setVibrato({ frequency: 0, depth: 0 });
              }

              if (typeof player.filters.setKaraoke === "function") {
                player.filters.setKaraoke({
                  level: 0,
                  monoLevel: 0,
                  filterBand: 0,
                  filterWidth: 0,
                });
              }
            }
            responseMessage = "All filters reset.";
          } catch (resetError) {
            console.error("[FILTER] Reset error:", resetError);
            throw new Error(`Failed to reset filters: ${resetError.message}`);
          }
          break;

        case "bassboost":
          // Apply bass boost equalizer
          player.filters.setEqualizer([
            { band: 0, gain: 0.6 }, // 25 Hz
            { band: 1, gain: 0.7 }, // 40 Hz
            { band: 2, gain: 0.8 }, // 63 Hz
            { band: 3, gain: 0.55 }, // 100 Hz
            { band: 4, gain: 0.25 }, // 160 Hz
          ]);
          responseMessage = "Bassboost filter applied.";
          break;

        case "nightcore":
          // Apply nightcore effect
          player.filters.setTimescale({
            speed: 1.2, // 20% faster
            pitch: 1.2, // 20% higher pitch
            rate: 1.0, // Normal rate
          });
          responseMessage = "Nightcore filter applied.";
          break;

        case "vaporwave":
          // Apply vaporwave effect
          player.filters.setTimescale({
            speed: 0.8, // 20% slower
            pitch: 0.8, // 20% lower pitch
            rate: 1.0, // Normal rate
          });
          responseMessage = "Vaporwave filter applied.";
          break;

        case "8d":
          // Apply 8D audio effect
          player.filters.setRotation({
            rotationHz: 0.2, // Rotation speed
          });
          responseMessage = "8D filter applied.";
          break;

        case "tremolo":
          // Apply tremolo effect
          player.filters.setTremolo({
            frequency: 4.0, // Variation speed
            depth: 0.75, // Effect intensity
          });
          responseMessage = "Tremolo filter applied.";
          break;

        case "vibrato":
          // Apply vibrato effect
          player.filters.setVibrato({
            frequency: 4.0, // Variation speed
            depth: 0.75, // Effect intensity
          });
          responseMessage = "Vibrato filter applied.";
          break;

        case "karaoke":
          // Apply karaoke effect
          player.filters.setKaraoke({
            level: 1.0, // Effect level
            monoLevel: 1.0, // Mono channel level
            filterBand: 220.0, // Frequency band
            filterWidth: 100.0, // Width of effect
          });
          responseMessage = "Karaoke filter applied.";
          break;

        default:
          return autoDeleteMessage(message, {
            embeds: [
              new EmbedBuilder()
                .setColor(client.config.embedColor)
                .setDescription(
                  "Invalid filter! Available filters: `reset`, `bassboost`, `nightcore`, `vaporwave`, `8d`, `tremolo`, `vibrato`, `karaoke`"
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
    } catch (error) {
      console.error("[FILTER] Error applying filter:", error);
      return autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(`Error applying filter: ${error.message}`)
            .setFooter({
              text: "Try updating Moonlink.js or check Lavalink server",
            }),
        ],
      });
    }
  },
};
