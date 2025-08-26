const { autoDeleteMessage } = require("../utils/auto_delete");
module.exports = {
  name: "interactionCreate",
  execute(interaction, client) {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: "There was an error executing this command!",
        ephemeral: true,
      });
    }
  },
};
