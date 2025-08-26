const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  name: "clearall",
  category: "core",
  description: "Clear all messages in the current text channel",
  async execute(message, args, client) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
    ) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(
              "❌ You don't have permission to use this command!"
            ),
        ],
      });
    }

    // Check if the bot has permission to manage messages
    if (
      !message.guild.members.me.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    ) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("❌ I don't have permission to delete messages!"),
        ],
      });
    }

    try {
      const statusMsg = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("🧹 Clearing all messages in this channel..."),
        ],
      });

      // Fetch and delete messages in batches
      let messagesDeleted = 0;
      let fetched;

      do {
        // Discord API allows fetching up to 100 messages at once
        fetched = await message.channel.messages.fetch({ limit: 100 });

        if (fetched.size === 0) break;

        // Discord only allows bulk deletion of messages that are less than 14 days old
        const bulkMessages = fetched.filter(
          (msg) => Date.now() - msg.createdTimestamp < 1209600000
        ); // 14 days in milliseconds

        if (bulkMessages.size > 0) {
          await message.channel.bulkDelete(bulkMessages, true);
          messagesDeleted += bulkMessages.size;
        }

        // For messages older than 14 days, delete them one by one
        const oldMessages = fetched.filter(
          (msg) => Date.now() - msg.createdTimestamp >= 1209600000
        );
        for (const msg of oldMessages.values()) {
          try {
            await msg.delete();
            messagesDeleted++;
          } catch (err) {
            console.error(`Error deleting old message: ${err}`);
          }
        }
      } while (fetched.size >= 2); // Continue until no more messages are left (keeping at least 1 for status)

      // Update the status message with the result
      await statusMsg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription(
              `✅ Successfully deleted ${messagesDeleted} messages!`
            ),
        ],
      });

      // Delete the status message after 5 seconds
      setTimeout(() => {
        statusMsg
          .delete()
          .catch((e) => console.error("Could not delete status message:", e));
      }, 5000);
    } catch (error) {
      console.error("Error in clear all command:", error);
    }
  },
};
