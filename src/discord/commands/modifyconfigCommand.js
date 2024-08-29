const fs = require('fs');
const config = require('../../../config.json');
const { EmbedBuilder } = require('discord.js');
const { resolveUsernameOrUUID, getUsername} = require("../../contracts/API/mowojangAPI.js");
// const { isUuid } =  require("../../../API/utils/uuid.js");
const HypixelDiscordChatBridgeError = require('../../contracts/errorHandler.js');

module.exports = {
  name: "staff_config",
  description: "Manage helper, mod, and admin lists.",
  options: [
    {
      name: "list",
      description: "View the contents of all lists.",
      type: 1, // SUB_COMMAND type
    },
    {
      name: "add",
      description: "Add an uuid to a specific list.",
      type: 1, // SUB_COMMAND type
      options: [
        {
          name: "list",
          description: "The list to add the uuid to.",
          type: 3, // STRING type
          required: true,
          choices: [
            { name: "helper_list", value: "helper_list" },
            { name: "mod_list", value: "mod_list" },
            { name: "admin_list", value: "admin_list" },
          ],
        },
        {
          name: "name",
          description: "Mc username or UUID",
          type: 3, // STRING type
          required: true,
        },
      ],
    },
    {
      name: "remove",
      description: "Remove an uuid from a specific list.",
      type: 1, // SUB_COMMAND type
      options: [
        {
          name: "list",
          description: "The list to remove the uuid from.",
          type: 3, // STRING type
          required: true,
          choices: [
            { name: "helper_list", value: "helper_list" },
            { name: "mod_list", value: "mod_list" },
            { name: "admin_list", value: "admin_list" },
          ],
        },
        {
          name: "name",
          description: "Mc username or UUID",
          type: 3, // STRING type
          required: true,
        },
      ],
    },
  ],

  execute: async (interaction) => {
    const subcommand = interaction.options.getSubcommand();

    // Reference to the specific lists in config
    const lists = {
      helper_list: config.minecraft.commands.helper_list,
      mod_list: config.minecraft.commands.mod_list,
      admin_list: config.minecraft.commands.admin_list,
    };
    try{

      if (subcommand === "list") {
        const embed = new EmbedBuilder()
          .setTitle("Staff lists (mc commands)")
          .setColor(15844367);

        // Add all lists to the embed
        // const fields = [];
        // Object.entries(lists).forEach(([listName, listValues]) => {
        //   fields.push({name: listName.replace('_', ' ').toUpperCase(), value: listValues.length > 0 ? listValues.map((id, index) => `${index + 1}. \`${async() => await getUsername(id)}\``).join('\n') : 'No values in this list.'});
        // });
        const fields = await Promise.all(Object.entries(lists).map(async ([listName, listValues]) => {
          const usernames = await Promise.all(listValues.map(id => getUsername(id)));
          return {
            name: listName.replace('_', ' ').toUpperCase(),
            value: usernames.length > 0 ? usernames.map((username, index) => `${index + 1}. \`${username}\``).join('\n') : 'No values in this list.'
          };
        }));

        embed.addFields(fields);

        return interaction.followUp({ embeds: [embed], ephemeral: true });
      }

      const listName = interaction.options.getString("list");
      let mcname = interaction.options.getString("name");
      const dataUUID = await resolveUsernameOrUUID(mcname).catch(e => null);
      if (!dataUUID){
        throw "Invalid username or UUID!";
      }
      const uuid = dataUUID['uuid'];
      mcname = dataUUID['username'];

      // if (isUuid(mcname)){
      //   uuid = mcname;
      //   mcname = await getUsername(uuid);
      // } else{
      //   const dataUUID = await resolveUsernameOrUUID(mcname).catch(e => null);
      //   if (dataUUID){
      //     uuid = dataUUID['uuid'];
      //     mcname = dataUUID['username'];
      //   }
      // }

      if (subcommand === "add") {
        const list = lists[listName];

        if (list.includes(uuid)) {
          return interaction.followUp({ content: `This uuid is already in the ${listName}.`, ephemeral: true });
        }

        list.push(uuid);
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');

        return interaction.followUp({ content: `Added \`${uuid}\` to the ${listName}.`, ephemeral: true });
      }

      if (subcommand === "remove") {
        const list = lists[listName];

        const index = list.indexOf(uuid);
        if (index === -1) {
          return interaction.followUp({ content: `This uuid is not in the ${listName}.`, ephemeral: true });
        }

        list.splice(index, 1);
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');

        return interaction.followUp({ content: `Removed \`${uuid}\` from the ${listName}.`, ephemeral: true });
      }
    } catch (error){
      console.error(error);
      throw new HypixelDiscordChatBridgeError(error);
    }
  },
};
