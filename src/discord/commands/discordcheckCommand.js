const { EmbedBuilder, escapeItalic } = require("discord.js");
const hypixelRebornAPI = require("../../contracts/API/HypixelRebornAPI.js");
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler");
const { getUsername } = require("../../contracts/API/PlayerDBAPI.js");
const { selectlink_uuid } = require("../../contracts/verify.js");

module.exports = {
    name: "discordcheck",
    moderatorOnly: true,
    description: "View members verified on guild discord.",

    execute: async (interaction) => {
        try{
            //await interaction.deferReply();
            let data = await hypixelRebornAPI.getGuild("name", "Golden Legion");
            
            if (!data){
                throw "Could not find guild";
            }

            let members = data.members;
            let unverifiedMembers = [];
            let verifiedMembers = [];


            let editable = await interaction.followUp({ content: `Fetching ${data.members.length} members...` });
            //await interaction.channel.send({ content: `Fetching ${members.length} members...` });
            
            
            for (guildmember of members) {
                let username = await getUsername(guildmember.uuid);
                let verified = await selectlink_uuid(guildmember.uuid);
                
                if (verified) {
                    let member = await interaction.guild.members.fetch(verified);
                    verifiedMembers.push(`✅ \`${username}\` → ${member ? `<@${member.id}> (${escapeItalic(member.user.tag)})` : "Not in server."}`)
                } else {
                    unverifiedMembers.push(`\`${username}\``)
                }
            }

            let verifiedFields = verifiedMembers.length && splitMessage(verifiedMembers.join('\n'), { maxLength: 1024, char: '\n' }).map((e, i) => ({ name: i == 0 ? `Verified Members (${verifiedMembers.length}/${members.length})` : '\u200b', value: e }))
            let unverifiedFields = unverifiedMembers.length && splitMessage(unverifiedMembers.join(', '), { maxLength: 1024, char: ',' }).map((e, i) => ({ name: i == 0 ? `Unverified Members (${unverifiedMembers.length}/${members.length})` : '\u200b', value: e }));

            let allFields = [...(verifiedFields ? verifiedFields : [{ name: 'Verified Members', value: "**No members verified!**" }]), ...(unverifiedFields ? unverifiedFields : [{ name: 'Unverified Members', value: '**All members verified!**' }])];

            let embeds = [];
            let currentFields = [];
            for (let i = 0; i < allFields.length; i++) {
                const field = allFields[i];

                let currentFieldSize = currentFields.reduce((prev, curr) => prev + curr.value.length, 0);
                if ((currentFieldSize + field.value.length) > 5500) {
                    embeds.push(bot.createEmbed().addFields(currentFields))
                    console.log(currentFields)
                    currentFields = [];
                }
                currentFields.push(field)
            }
            const tmp_embed = new EmbedBuilder()
                .setColor("Green")
                .setTitle(" ")
                .addFields(currentFields);
                // .setThumbnail(interaction.user.avatarURL())
                // .setTimestamp(interaction.createdAt)
                // .setFooter({
                // iconURL: interaction.user.avatarURL(),
                // text: "Requested at",
                // });
            embeds.push(tmp_embed);

            embeds[0].setAuthor({name: `${data.name} → Discord Check`});

            for (embed of embeds) {
                await interaction.followUp({ embeds: [embed] });
            }

        } catch (e){
            console.error(e);
            throw new HypixelDiscordChatBridgeError(e);
        }

    }
}

function splitMessage(text, { maxLength = 2000, char = '\n' } = {}) {
    if (text.length <= maxLength) return [text];

    const splitText = text.split(char);
    if (splitText.some(part => part.length > maxLength)) {
        throw new RangeError('A split chunk is too large');
    }

    const messages = [];
    let msg = '';
    for (const part of splitText) {
        if (msg && (msg + char + part).length > maxLength) {
            messages.push(msg);
            msg = '';
        }
        msg += (msg && msg !== '' ? char : '') + part;
    }
    messages.push(msg);

    return messages.filter(m => m);
}