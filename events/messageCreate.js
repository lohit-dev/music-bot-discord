const { autoDeleteMessage } = require("../utils/auto_delete");

module.exports = {
  name: "messageCreate",
  execute(message, client) {
    // Get prefix from config
    const prefix = client.config?.prefix || "*";

    if (message.content == "<@1346373653830565909>") {
      const command = client.commands.get("about");
      if (!command) {
        console.log(`[ERROR] Command not found: ${commandName}`);
        return;
      }
      command.execute(message, null, client);
    }

    // Log all incoming messages for debugging
    console.log(`[MESSAGE] ${message.author.tag}: ${message.content}`);

    // Ignore messages from bots or messages without the prefix
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    // Extract the command name and arguments
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    console.log(
      `[COMMAND] Attempting to execute command: ${commandName} with args: ${args.join(
        ", "
      )}`
    );

    // Check if the command exists
    const command = client.commands.get(commandName);
    if (!command) {
      console.log(`[ERROR] Command not found: ${commandName}`);
      return;
    }

    // Execute the command
    try {
      console.log(`[INFO] Executing command: ${commandName}`);
      command.execute(message, args, client);
    } catch (error) {
      console.error(`[ERROR] Failed to execute command ${commandName}:`, error);
      autoDeleteMessage(message, {
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setDescription("There was an error executing that command."),
        ],
      });
    }
  },
};
