const {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    GuildDefaultMessageNotifications
  } = require ("discord.js");
const { resolveUsernameOrUUID } = require("../../contracts/API/mowojangAPI.js");
const config = require("../../../config.json");
const { selectlink_uuid } = require("../../contracts/verify.js");


  
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
        
        let discord_user_id;
        if (!interaction.member){
            discord_user_id = `<@&1057805939115298888> <@&1114539766407503873>`
        } else{
            discord_user_id = `<@${interaction.member.id}>`;
        }
        const user = interaction.options.getString("username");
        const amount = parseFloat(interaction.options.getString("amount"))
        let comment = interaction.options.getString("comment");
        const uuid = interaction.options.getString("uuid");
        //console.log(`fromMC: ${interaction.fromMc}`);
        if (interaction.fromMc){
            interaction.client = client;
            interaction.guild = guild;
            const d_id = await selectlink_uuid(uuid);
            if (d_id){
                console.log('test1');
                console.log(d_id);
                interaction.user = await client.users.fetch(d_id);
                if (!interaction.user){
                    console.log("test3");
                    interaction.user = {avatarURL: `https://mc-heads.net/avatar/${user}`}
                }
            } else{
                console.log('test2');
                interaction.user = {avatarURL: `https://mc-heads.net/avatar/${user}`}
            }
            console.log(`interaction.user: ${interaction.user}`);
        }

        try{

            if (amount < 1){
                throw `Donate at least 1M coins!`
            }

            let donatorUUID, donatorusername;
            if (interaction.fromMc){
                donatorUUID = uuid;
                donatorusername = user;
            }else{
                const dataUUIDdonator = await resolveUsernameOrUUID(user);
                if (!dataUUIDdonator){
                    throw `donator username/UUID does not exist`;
                }
                donatorUUID = dataUUIDdonator['uuid'];
                donatorusername = dataUUIDdonator['username'];
            }

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
            let don_msg;
            if (interaction.fromMc){
                const donateChannel = await guild.channels.fetch(config.discord.channels.donationsChannel);
                don_msg = await donateChannel.send({embeds: [embed]})
                // console.log(embed);
                // console.log("SEND EMBED");
            }else{
                don_msg = await interaction.followUp({embeds: [embed]}); 
            }

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


            const row = new ActionRowBuilder().addComponents(approve, deny);
            await don_msg.edit({ embeds: [embed], components: [row] }).catch(e => console.error(e));
            if (interaction.fromMc){
                bot.chat('/oc Donation request successfully submitted on discord!');
            }

        } catch (e) {
            console.error(e);
            if (interaction.fromMc){
                if (don_msg){
                    await don_msg.delete();
                }
                bot.chat(`/oc [ERROR] ${e}`);
            } else{
                await interaction.editReply({
                    content: `**ERROR** ${discord_user_id} ${e}`,
                    components: [],
                });
            }


        //throw new HypixelDiscordChatBridgeError(`${e}`);
        }
        
    },
}


