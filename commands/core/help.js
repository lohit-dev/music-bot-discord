const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const { autoDeleteMessage } = require("../../utils/auto_delete");


module.exports = {
  name: "help",
  category: "Information",
  description: "Return all commands, or one specific command",
  async execute(message, args, client) {
    // Get command folders
    const commandFolders = fs
      .readdirSync(path.join(process.cwd(), "commands"), {
        withFileTypes: true,
      })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    // Main help embed
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${client.user.username} Help Menu`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setColor(client.config.embedColor)
      .setDescription(
        `Hello **<@${message.author.id}>**, here are my command categories:`
      )
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: `Use ${client.config.prefix}help <category> to see commands`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    // Add fields for each command folder
    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(path.join(process.cwd(), "commands", folder))
        .filter((file) => file.endsWith(".js"));

      embed.addFields({
        name: `${folder.charAt(0).toUpperCase() + folder.slice(1)} Commands [${commandFiles.length
          }]`,
        value: `Use \`${client.config.prefix}help ${folder}\` to see these commands`,
        inline: false,
      });
    }

    // If no arguments, show the main help menu
    if (!args.length) {
      return autoDeleteMessage(message, { embeds: [embed] });
    }

    // If category argument is provided
    const categoryName = args[0].toLowerCase();
    if (commandFolders.includes(categoryName)) {
      const categoryEmbed = new EmbedBuilder()
        .setAuthor({
          name: `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
            } Commands`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setColor(client.config.embedColor)
        .setDescription(
          `Here are the commands in the ${categoryName} category:`
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      // Get commands in this category
      const commandFiles = fs
        .readdirSync(path.join(process.cwd(), "commands", categoryName))
        .filter((file) => file.endsWith(".js"));

      // Add each command to the embed
      for (const file of commandFiles) {
        const command = require(`../${categoryName}/${file}`);
        categoryEmbed.addFields({
          name: `\`${client.config.prefix}${command.name}\``,
          value: command.description || "No description provided",
          inline: true,
        });
      }

      return autoDeleteMessage(message, { embeds: [categoryEmbed] });
    }

    // If specific command is provided
    const commandName = args[0].toLowerCase();
    const command =
      client.commands.get(commandName) ||
      client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );

    if (command) {
      const commandEmbed = new EmbedBuilder()
        .setAuthor({
          name: `Command: ${command.name}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setColor(client.config.embedColor)
        .setDescription(command.description || "No description provided")
        .addFields(
          {
            name: "Usage",
            value: `\`${client.config.prefix}${command.name} ${command.usage || ""
              }\``,
            inline: true,
          },
          {
            name: "Category",
            value: command.category || "No category",
            inline: true,
          }
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      if (command.aliases && command.aliases.length) {
        commandEmbed.addFields({
          name: "Aliases",
          value: command.aliases.join(", "),
          inline: true,
        });
      }

      return autoDeleteMessage(message, { embeds: [commandEmbed] });
    }

    // If category or command not found
    return autoDeleteMessage(message, {
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setDescription(`Could not find category or command: \`${args[0]}\``)
      ]
    });
  },
};
