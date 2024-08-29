const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { getList, checkdonator, format_amount } = require("../../contracts/donator.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { resolveUsernameOrUUID} = require("../../contracts/API/mowojangAPI.js");
const { isUuid } =  require("../../../API/utils/uuid.js");



module.exports = {
  name: "donator",
  description: "Donations Tool",
  options: [
    {
      name: "info",
      description: "Check donation of a guild member",
      type: 1,
      options : [
        {
            name: "member",
            description: "member who donated (uuid/name)",
            type: 3,
            required: true,
        }
      ]
    },
    {
      name: "rank",
      description: "leaderboard of donators",
      type: 1,
    }
  ],
  
  execute: async (interaction) => {
    const user = interaction.member;
    const guild = interaction.guild;
    if (
      config.discord.commands.checkPerms === true &&
      !(user.roles.cache.has(config.discord.commands.commandRole) || config.discord.commands.users.includes(user.id))
    ) {
      throw new HypixelDiscordChatBridgeError("You do not have permission to use this command.");
    }

    try {
      const action = interaction.options.getSubcommand();
      
      if (action === "rank"){
        const dataDictionary = await getList();
        const emojis = [':first_place:', ':second_place:', ':third_place:'];
        const defaultEmoji = ':ballot_box_with_check:'
        let verticalList = Object.entries(dataDictionary)
        .sort(([, a], [, b]) => parseFloat(b) - parseFloat(a))
        .map(([username, amount], index) => {
          const emoji = index < 3 ? emojis[index] : defaultEmoji;
          const str_amount = format_amount(amount);
          return `${emoji} ${username} : **${str_amount}** :moneybag:`;
        })
        .join('\n');

        if (!verticalList) {
            verticalList = "Nobody donated to the guild yet :(";
        } 
        verticalList = verticalList + "\n";

        const embed = new EmbedBuilder()
            .setColor("Gold")
            .setAuthor({ name: "Leaderboard of Donations (Millions)" })
            .setDescription(verticalList)
            .setFooter({
            text: 'Golden Legion - Donations',
            iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
        await interaction.followUp( {embeds: [embed]});
      
      } else if (action==="info"){
        const donatorname = interaction.options.getString("member");
        let donatorUUID = " ";
        if (!isUuid(donatorname)){
          const dataUUIDdonator = await resolveUsernameOrUUID(donatorname);
          if (!dataUUIDdonator){
              throw `username/UUID does not exist`;
          }
          donatorUUID = dataUUIDdonator['uuid'];
        }

        const member_amount = await checkdonator(donatorUUID);
        desc = "";
        title = "";
        if (member_amount[1] <= 0){
          title = "Error"
          desc = "This guild member is not very generous!"
        } else{
          title = `Donations of ${member_amount[0]}`
          desc = `**${format_amount(member_amount[1])}** coins donated :partying_face:`
        }

        const embed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle(title)
        .setDescription(desc)
        .setFooter({
          text: 'Golden Legion - Donations',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
        
        await interaction.followUp({embeds: [embed],});
        

      } else {
        throw "Something went wrong";
      }

      
    } catch(e){
        console.error(e);
        throw new HypixelDiscordChatBridgeError(`${e}`);
    }

  },

};

