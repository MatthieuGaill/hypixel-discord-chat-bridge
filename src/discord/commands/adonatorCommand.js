const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { addDonation, removeDonation} = require("../../contracts/donator.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const { getUsername, resolveUsernameOrUUID } = require("../../contracts/API/PlayerDBAPI.js");
const { isUuid } =  require("../../../API/utils/uuid.js");



module.exports = {
  name: "admin_donator",
  description: "For managers",
  options: [
    {
      name: "add",
      description: "manually assign a donation to a member",
      type: 1,
      options: [
        {
          name: "member",
          description: "member who donated (uuid/name)",
          type: 3,
          required: true,
        },
        {
          name: "amount",
          description: "amount of donation, in M coins",
          type: 3,
          required: true,
        }
      ]
    },
    {
      name: "remove",
      description: "remove a donation for a member",
      type: 1,
      options : [
        {
            name: "member",
            description: "member (uuid/name)",
            type: 3,
            required: true,
        },
        {
            name: "amount",
            description: "amount to remove, in M coins",
            type: 3,
            required: true,
        }
      ]
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

        const [donatorname, amount] = [interaction.options.getString("member"), parseFloat(interaction.options.getString("amount"))];

        if (amount <= 0){
          throw `Enter a strictly positive amount...`
        }
        let donatorUUID= " ";
        let donatorusername= " ";
        if (isUuid(donatorname)){
            donatorusername = await getUsername(donatorname);
        } else{
            const dataUUIDdonator = await resolveUsernameOrUUID(donatorname);
            if (!dataUUIDdonator){
                throw `donator username/UUID does not exist`;
            }
            donatorUUID = dataUUIDdonator['uuid'];
            donatorusername = dataUUIDdonator['username'];
        }

        if ( action === "add"){
            await addDonation(guild, donatorUUID, amount);

            const embed = new EmbedBuilder()
            .setColor(2067276)
            .setAuthor({name :`Donation manually added`})
            .setDescription(`Added ${donatorusername} donation of **${amount} M**`)
            .setFooter({
                text: 'Donations Tool',
                iconURL: "https://i.imgur.com/Fc2R9Z9.png",
            });
            await interaction.followUp({embeds: [embed],});

        } else {
            const removeinv = await removeDonation(guild, donatorUUID, amount);
            if (removeinv){
                const embed = new EmbedBuilder()
                .setColor(15105570)
                .setAuthor({ name: "Donation manually removed" })
                .setDescription(`Removed ${amount} M from ${donatorusername}`)
                .setFooter({
                    text: 'Donations Tool',
                    iconURL: "https://i.imgur.com/Fc2R9Z9.png",
                });
                await interaction.followUp({embeds: [embed],});
            } else{
                const embed = new EmbedBuilder()
                .setColor(15105570)
                .setAuthor({ name: "Error" })
                .setDescription(`No donation Registered for ${donatorname}`)
                .setFooter({
                    text: 'Donations Tool',
                    iconURL: "https://i.imgur.com/Fc2R9Z9.png",
                });
                await interaction.followUp({embeds: [embed],});
            }
        }
      
    } catch(e){
        console.error(e);
        throw new HypixelDiscordChatBridgeError(`${e}`);
    }

  },

};

