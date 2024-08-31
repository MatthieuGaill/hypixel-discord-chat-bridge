const {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
  } = require ("discord.js");
const { resolveUsernameOrUUID } = require("../../contracts/API/mowojangAPI.js");
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");


  
module.exports = {
    name: "donate",
    description: "Request a donation (in Million coins)",
    disabled: false,
    debug: false,
    options: [
        {
        name: "username",
        description: "In-Game Username",
        required: true,
        type: 3,
        },
        {
        name: "amount",
        description: "Amount of donations in Million coins (Skyblock)",
        required: true,
        type: 3,
        },
        {
        name: "comment",
        description: "comment (optionnal)",
        required: false,
        type: 3,
        },
    ],


    execute: async (interaction) => {
        
        const discord_user = interaction.member;
        const user = interaction.options.getString("username");
        const amount = parseFloat(interaction.options.getString("amount"))
        let comment = interaction.options.getString("comment");
        

        

        try{

            if (amount <= 1){
                throw `Donate at least 1M coins!`
            }

 
            const dataUUIDdonator = await resolveUsernameOrUUID(user);
            if (!dataUUIDdonator){
                throw `donator username/UUID does not exist`;
            }
            const donatorUUID = dataUUIDdonator['uuid'];
            const donatorusername = dataUUIDdonator['username'];
            

            const amount_str = `**${amount} M** SB coins`
            if (!comment){
                comment = "N/A";
            }

            const fields = [
                { name: "Username", value: `${donatorusername} (${donatorUUID})` },
                { name: "Amount :dollar:", value: amount_str !== undefined ? amount_str : "N/A", inline: true },
                { name: "Comment :book:", value: comment !== undefined ? comment : "N/A" },
            ];

            const embed = new EmbedBuilder()
                .setColor("Gold")
                .setTitle(":bank: Donation Request")
                .addFields(fields)
                .setThumbnail(interaction.user.avatarURL())
                .setTimestamp(interaction.createdAt)
                .setFooter({
                iconURL: interaction.user.avatarURL(),
                text: "Requested at",
                });

            const don_msg = await interaction.followUp({embeds: [embed]});
            const msg_id = don_msg.id;

            const approve = new ButtonBuilder()
                .setCustomId(`don${msg_id}yes`)
                .setLabel("Confirm")
                .setEmoji("✅")
                .setStyle(ButtonStyle.Success);
            const deny = new ButtonBuilder()
                .setCustomId(`don${msg_id}no`)
                .setLabel("Deny")
                .setEmoji("✖")
                .setStyle(ButtonStyle.Danger);

            // const response = await interaction.editReply({
            //     embeds: [embed],
            //     components: [{ type: 1, components: [approve, deny] }],
            // });

            const row = new ActionRowBuilder().addComponents(approve, deny);
            await don_msg.edit({ components: [row] });

            // const allowedRoleIds = ["1114539766407503873", "1057805939115298888"];
            // const roleFilter = (i) => {
            // return allowedRoleIds.some(roleId => i.member.roles.cache.has(roleId));
            // };

            // const action = await response.awaitMessageComponent({filter: roleFilter});

            // if (action.customId === "approved") {
            //     await addDonation(guild, donatorUUID, amount);
            //     await action.update({
            //         embeds: [
            //         embed
            //             .setColor("Green")
            //             .setFooter({
            //             text: `${action.user.username} confirmed at`,
            //             iconURL: action.user.avatarURL(),
            //             })
            //             .setTimestamp(Date.now()),
            //         ],
            //         components: [],
            //     });
            
            // } else if (action.customId === "denied") {
            //     await action.update({
            //         embeds: [
            //         embed
            //             .setColor("Red")
            //             .setFooter({
            //             text: `${action.user.username} denied at`,
            //             iconURL: action.user.avatarURL(),
            //             })
            //             .setTimestamp(Date.now()),
            //         ],
            //         components: [],
            //     });

            //     const message_reply = await channel.messages.fetch(response.id);
            //     message_reply.reply(`<@${discord_user.id}> your donation request was denied!`);
            // }


        } catch (e) {
            await interaction.editReply({
                content: `**ERROR** <@${discord_user.id}> ${e}`,
                components: [],
            });
            console.error(e);
        //throw new HypixelDiscordChatBridgeError(`${e}`);
        }
        
    },
}


