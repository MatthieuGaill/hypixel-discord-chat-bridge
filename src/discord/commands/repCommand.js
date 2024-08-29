const { EmbedBuilder } = require("discord.js");
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const config = require("../../../config.json");
const { updateDatabase } = require("../../contracts/reputation.js");


module.exports = {
  name: "rep",
  description: "Give a reputation to a member",
  options: [
    {
      name: "member",
      description: "member of the guild",
      type: 6,
      required: true,
    },
    {
      name: "choice",
      description: "reason you want to give the reputation",
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
          value: "Other :regional_indicator_o:*7",
        }
      ],
    },
    {
      name: "comment",
      description: "comment",
      type: 3,
      required: false,
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
        if (member.user.bot){
            throw `You cannot give reputation to a bot!`;
        }
        if (member_id === interaction.member.id){
            throw "You cannot give reputation to yourself!";
        }


        const [choice, choiceIndex] = interaction.options.getString("choice").split('*');
        const comment = interaction.options.getString("comment");
        const add_msg = comment !== null? 
        `Successfully added a reputation to <@${member_id}>, *${choice}* (${comment})` : `Successfully added a reputation to <@${member_id}>, *${choice}* `;
        const trusted = await updateDatabase(member_id, choiceIndex);


        const embed = new EmbedBuilder()
        .setColor(2067276)
        .setAuthor({ name: `Reputation added`})
        .setDescription(add_msg)
        .setFooter({
        text: 'Reputation tool',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });

        console.log(`trusted: ${trusted}`)

        const response = await interaction.followUp({embeds: [embed]});

        if (trusted){
          const guild = interaction.guild;
          const channel = interaction.channel;
          const message_reply = await channel.messages.fetch(response.id);
          console.log(`member_id : ${member_id}`)
          const role = guild.roles.cache.get("1168595595989094541");
          member.roles.add(role)
              .then(() => {
                message_reply.reply(`Congratulations <@${member_id}> you've reached 10 reputations, You earn the **Trusted** Role :tada:`);
              })
              .catch((error) => {
                console.error('Error adding role:', error);
              });
        }

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
