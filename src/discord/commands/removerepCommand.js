const { EmbedBuilder } = require("discord.js");
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const config = require("../../../config.json");
const { removeRep } = require("../../contracts/reputation.js");


module.exports = {
  name: "removerep",
  description: "Remove a number of reputation to a member",
  options: [
    {
      name: "member",
      description: "member of the guild",
      type: 6,
      required: true,
    },
    {
      name: "choice",
      description: "reason of the reputation to remove",
      type: 3,
      required: true,
      choices: [
        {
          name: "Explaining (Answer questions, help about a subject)",
          value: "Explaining :blue_book:*0",
        },
        {
          name: "Loaning (money or items)",
          value: "Loaning :bank:*1",

        },
        {
          name: "Crafting (help craft any item)",
          value: "Crafting :tools:*2",
        },
        {
          name: "Reforging (help apply reforge)",
          value: "Reforging :magic_wand:*3",
        },
        {
          name: "Slayer carries",
          value: "Slayer :spider:*4",
        },
        {
          name: "Dungeon carries",
          value: "Dungeon :crossed_swords:*5",
        },
        {
          name: "Gifting (items, rank, ...)",
          value: "Gifting :gift:*6",
        },
        {
          name: "Other (you can use the comment option)",
          value: "Other*7",
        }
      ],
    },
    {
      name: "number",
      description: "number",
      type: 4,
      required: true,
    },
  ],
  
  execute: async (interaction) => {
    const user = interaction.member;
    if (
      config.discord.commands.checkPerms === true &&
      !(user.roles.cache.has(config.discord.commands.commandRole) || config.discord.commands.users.includes(user.id))
    ) {
      throw new HypixelDiscordChatBridgeError("You do not have permission to use this command.");
    }

    try{
        member = interaction.options.getMember("member");
        if (!member){
            throw `Put a valid member! (select one in the menu)`;
        }
        const member_id = member.id;


        const [choice, choiceIndex] = interaction.options.getString("choice").split('*');
        const number = interaction.options.getInteger("number");
        if (number < 1){
          throw `The number of reputation to remove must be greater than or equal to 1!`
        }


        const embed = await removeRep(member_id, choice, choiceIndex, number);
        interaction.followUp({embeds: [embed]});

    } catch(e){
      const embed = new EmbedBuilder()
      .setColor("Red")
      .setAuthor({ name: "Error" })
      .setDescription(e)
      .setFooter({
        text: 'Reputation tool',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      });
      interaction.followUp({embeds: [embed], ephemeral: true});
    }

  },

};


  
