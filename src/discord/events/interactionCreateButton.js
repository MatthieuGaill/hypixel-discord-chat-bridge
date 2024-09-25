const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { ErrorEmbed } = require("../../contracts/embedHandler.js");
// eslint-disable-next-line no-unused-vars
const { ButtonInteraction, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require("../../../config.json");
const Logger = require("../.././Logger.js");
const { checkAppeal, disableAppeal, selectAppealForm, disableAppealForm } = require("../../contracts/moderation.js");
const { addAfk } = require("../../contracts/afk.js");
const { addDonation } = require("../../contracts/donator.js");
const { selectlink_uuid } = require("../../contracts/verify.js");
const { addCollected } = require("../../contracts/collecteddonations.js");


module.exports = {
  name: "interactionCreate",
  /**
   * @param {ButtonInteraction} interaction
   */
  async execute(interaction) {
    try {
        if (interaction.isButton()) {
            if (!interaction.guild){
                return;
            }

            const memberRoles = interaction.member.roles.cache.map((role) => role.id);
            //await interaction.deferReply({ ephemeral: false }).catch(() => {});
            if (memberRoles.some((role) => config.discord.commands.blacklistRoles.includes(role))) {
                throw new HypixelDiscordChatBridgeError("You are blacklisted from the bot.");
            }
            console.log(interaction.customId)
            Logger.discordMessage(`${interaction.user.username} - [${interaction.customId}]`);
            if (interaction.customId.startsWith('afk')){
                //VALIDATE AFK REQUESTS
                if (isManager(interaction) === false){
                    throw "No permission";
                }
                const regex = /^afk(.+)(yes|no)$/;
                const match = interaction.customId.match(regex);
                if (!match) {
                    throw "weird";
                }
                const msg_id = match[1]; 
                const status = match[2];
                const afk_channel = interaction.guild.channels.cache.get(config.discord.channels.afkChannel);
                const afk_message = await afk_channel.messages.fetch(msg_id);
                const oldEmbed = await afk_message.embeds[0];
                const fields = oldEmbed.fields;
                let discordId, reason, date;
                fields.forEach(field => {
                    if (field.name === "Username") {

                        const match2 = field.value.match(/\((\d+)\)$/);
                        if (match2) {
                        discordId = match2[1]; 
                        }
                    } else if (field.name === "Reason") {
                        reason = field.value;
                    } else if (field.name === "Date") {
                        const date_format = field.value;
                        const match3 = date_format.match(/<t:(\d+):d>/);
                        date = parseInt(match3[1])*1000;
                    }
                });
                // console.log(`discordId: ${discordId}`);
                // console.log(`oldembed: ${oldEmbed}`);
                
                if (!discordId || !date || !reason){
                    // oldEmbed['data']['title'] = "**ERROR**";
                    // oldEmbed['data']['color'] = 5763719;
                    // oldEmbed['data']['footer'] = {text: `ERROR`}
                    const errorEmbed = new EmbedBuilder(oldEmbed)
                    .setTitle("**ERROR**")
                    .setColor(15548997)
                    .setFooter({
                        text: "ERROR",
                    })
                    .setTimestamp(); // Automatically sets the current date/time
                    await afk_message.edit({embeds: [errorEmbed],components: []});
                    await afk_message.reply(`Uncorrect formatting`);
                    await afk_message.delete();
                    return;
                }
                
                if (status === "yes"){
                    await addAfk(msg_id, discordId, date, reason);
                    // oldEmbed['data']['color'] = 5763719;
                    // oldEmbed['data']['footer'] = {text: `Approved at`, iconURL: interaction.user.avatarURL()};
                    // oldEmbed['data']['timestamp'] = new Date().toISOString();
                    const approvedEmbed = new EmbedBuilder(oldEmbed)
                    .setColor(5763719)
                    .setFooter({
                        text: "Approved at",
                        iconURL: interaction.user.avatarURL(),
                    })
                    .setTimestamp(); 
                    await afk_message.edit({embeds: [approvedEmbed], components: []});
                } else{
                    // oldEmbed['data']['color'] = 15548997;
                    // oldEmbed['data']['footer'] = {text: `Denied at`, iconURL: interaction.user.avatarURL()};
                    // oldEmbed['data']['timestamp'] = new Date().toISOString();
                    const approvedEmbed = new EmbedBuilder(oldEmbed)
                    .setColor(15548997)
                    .setFooter({
                        text: "Rejected at",
                        iconURL: interaction.user.avatarURL(),
                    })
                    .setTimestamp(); 
                    await afk_message.edit({embeds: [approvedEmbed],components: []});

                    afk_message.reply(`<@${discordId}> your request was denied! Please read the **pinned** message **carefully** before making a new request.`);
                }
            } else if (interaction.customId.startsWith('don')){
                //VALIDATE DONATION REQUESTS
                if (isManager(interaction) === false){
                    throw "No permission";
                }
                const regex = /^don(.+)(yes|no)$/;
                const match = interaction.customId.match(regex);
                if (!match) {
                    throw "weird";
                }
                const msg_id = match[1]; 
                const status = match[2];
                const don_channel = interaction.guild.channels.cache.get(config.discord.channels.donationsChannel);
                const don_message = await don_channel.messages.fetch(msg_id);
                const oldEmbed = await don_message.embeds[0];
                const fields = oldEmbed.fields;
                let uuid, amount;
                fields.forEach(field => {
                    if (field.name === "Username") {
                        const match2 = field.value.match(/\(([^)]+)\)/);
                        if (match2) {
                            uuid = match2[1]; 
                        }
                    } else if (field.name === "Amount :dollar:") {
                        const match3 = field.value.match(/\d+/);
                        amount = parseInt(match3[0], 10);
                    }
                });

                if (!uuid || !amount){
                    const errorEmbed = new EmbedBuilder(oldEmbed)
                    .setTitle("**ERROR**")
                    .setColor(5763719)
                    .setFooter({
                        text: "ERROR",
                    })
                    .setTimestamp(); // Automatically sets the current date/time
                    await don_message.edit({embeds: [errorEmbed],components: []});
                    await don_message.reply(`Uncorrect formatting`);
                    await don_message.delete();
                    return;
                }
                
                if (status === "yes"){
                    await addDonation(uuid, amount);
                    const approvedEmbed = new EmbedBuilder(oldEmbed)
                    .setColor(5763719)
                    .setFooter({
                        text: "Approved at",
                        iconURL: interaction.user.avatarURL(),
                    })
                    .setTimestamp(); 
                    await don_message.edit({embeds: [approvedEmbed], components: []});
                    await addCollected(interaction.user.id, amount);
                } else{
                    const deniedEmbed = new EmbedBuilder(oldEmbed)
                    .setColor(15548997)
                    .setFooter({
                        text: "Rejected at",
                        iconURL: interaction.user.avatarURL(),
                    })
                    .setTimestamp(); 
                    await don_message.edit({embeds: [deniedEmbed],components: []});

                    const d_id = await selectlink_uuid(uuid);
                    if (d_id){
                        don_message.reply(`<@${d_id}> your donation request was denied!`);
                    } else{
                        don_message.reply(`This donation request was denied!`);
                    }
                    
                }
            
            } else if (interaction.customId.startsWith('appform') ){
                // VALIDATE APPEAL FORMS
                if (isManager(interaction) === false){
                    throw "No permission";
                }
                const regex = /^appform(.+)(yes|no)$/;
                const match = interaction.customId.match(regex);
                if (!match) {
                    throw "Appeal already confirmed/denied";
                }
                const form_id = match[1]; 
                const status = match[2]; 
                const AppealForm = await selectAppealForm(form_id);
                if (!AppealForm){
                    throw "Appeal already confirmed/denied";
                }
                const appealform_channel = interaction.guild.channels.cache.get(config.discord.channels.appealChannel);
                const appealform_message = await appealform_channel.messages.fetch(form_id);
                const oldEmbed = appealform_message.embeds[0];  
                await disableAppealForm(AppealForm.id);
                if (status === "yes"){
                    if (AppealForm.type === 1){
                        // UNMUTE
                        const command = interaction.client.commands.get("unmute");
                        interaction.options = {
                            getString: (name) => {
                                if (name === "reason") return "Appeal approved";
                                if (name === "mc_name") return AppealForm.uuid;
                                return undefined;
                            },
                            getMember: (name) => {
                                if (name === "member") return AppealForm.discordId; // Return a valid guild member if needed
                                return undefined;
                            }
                        };
                        interaction.doNotRespond = true;
                        await command.execute(interaction);

                        const embed = new EmbedBuilder()
                        .setColor("Gold")
                        .setDescription("Appeal accepted");
                        const approvedEmbed = new EmbedBuilder(oldEmbed)
                            .setColor(5763719)
                            .addFields({name:"Approved by", value: `<@${interaction.user.id}>`})
                        await appealform_message.edit({ embeds: [approvedEmbed], components: [] });
                        await interaction.reply({embeds: [embed], ephemeral: true});
                    } else if (AppealForm.type === 2){
                        // UNBAN
                        const command = interaction.client.commands.get("unban");
                        interaction.options = {
                            getString: (name) => {
                                if (name === "reason") return "Appeal approved";
                                if (name === "user_id") return AppealForm.discordId;
                                return undefined;
                            },
                        };
                        interaction.doNotRespond = true;
                        await command.execute(interaction);

                        const embed = new EmbedBuilder()
                            .setColor("Gold")
                            .setDescription("Appeal accepted");
                        const approvedEmbed = new EmbedBuilder(oldEmbed)
                            .setColor(5763719)
                            .addFields({name:"Approved by", value: `<@${interaction.user.id}>`})
                        await appealform_message.edit({ embeds: [approvedEmbed], components: [] });
                        await interaction.reply({embeds: [embed], ephemeral: true});

                    } else{
                        const embed = new EmbedBuilder()
                        .setColor(15548997)
                        .setDescription("**Error:** the appeal does not correspond to a mute or a ban ???")
                        await interaction.reply({embeds: [embed], ephemeral: true});
                    }
                } else{
                    const embed = new EmbedBuilder()
                    .setColor(15548997)
                    .setDescription("Appeal denied")
                    const deniedEmbed = new EmbedBuilder(oldEmbed)
                        .setColor(15548997)
                        .addFields({name:"Rejected by", value: `<@${interaction.user.id}>`});
                    await appealform_message.edit({ embeds: [deniedEmbed], components: [] });
                    await interaction.reply({embeds: [embed], ephemeral: true});
                }
                

            } else if (interaction.customId === 'appeal_form') {
                const modal = new ModalBuilder()
                    .setCustomId('appeal_submit')
                    .setTitle('Ticket Form');

                const tokenInput = new TextInputBuilder()
                    .setCustomId('token')
                    .setLabel("Appeal Token")
                    .setStyle(TextInputStyle.Short);
                    
                const whyInput = new TextInputBuilder()
                    .setCustomId('why')
                    .setLabel("1. Why did you get muted/banned?")
                    .setStyle(TextInputStyle.Paragraph);
                const justifiedInput = new TextInputBuilder()
                    .setCustomId('justified')
                    .setLabel('2. Was the punishment justified? (Yes/No)')
                    .setStyle(TextInputStyle.Short);
                const explanationInput = new TextInputBuilder()
                    .setCustomId('explanation')
                    .setLabel('3. If "No", please explain why.')
                    .setStyle(TextInputStyle.Paragraph);
                const reasonInput = new TextInputBuilder()
                    .setCustomId('reason')
                    .setLabel("4. Why should your appeal be accepted?")
                    .setStyle(TextInputStyle.Paragraph);
                // const additionalInput = new TextInputBuilder()
                //   .setCustomId('additional')
                //   .setLabel("5. Any additional thoughts?")
                //   .setStyle(TextInputStyle.Paragraph);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(tokenInput),
                    new ActionRowBuilder().addComponents(whyInput),
                    new ActionRowBuilder().addComponents(justifiedInput),
                    new ActionRowBuilder().addComponents(explanationInput),
                    new ActionRowBuilder().addComponents(reasonInput),
                    //new ActionRowBuilder().addComponents(additionalInput)
                );

                await interaction.showModal(modal);
            }           

        } else if (interaction.isModalSubmit()) {
            Logger.discordMessage(`${interaction.user.username} - [${interaction.customId}]`);
            if (interaction.customId === 'appeal_submit') {
                const appealToken = interaction.fields.getTextInputValue('token');
                
    
                if (!appealToken){
                    await interaction.reply({ content: 'Invalid or expired token', ephemeral: true });
                    return;
                }
                if (appealToken.length < 15){
                    await interaction.reply({ content: 'Invalid or expired token', ephemeral: true });
                    return;
                }

                const appealRecord = await checkAppeal(appealToken);
                if (!appealRecord) {
                    await interaction.reply({ content: 'Invalid or expired token', ephemeral: true });
                    return;
                }
                const appeal_channel = await client.channels.fetch(config.discord.channels.appealChannel);

                const user = interaction.user;
                if (appealRecord.discordId !== user.id){
                    const embed = {
                    title: "**Error**",
                    description: `${interaction.user.tag} (${interaction.user.id}) tried to appeal for case ${appealRecord.id} in place of <${appealRecord.discordId}>`,
                    color: 0xFFD700, 
                    };
                    await appeal_channel.send({embeds: [embed]});
                    await interaction.reply({ content: 'This appeal token does not belong to you! Sending a warning to administrators', ephemeral: true });
                    return;            
                }
                

                const why = interaction.fields.getTextInputValue('why');
                //const justified = interaction.fields.getSelectMenuValue('justified');
                const justified = interaction.fields.getTextInputValue("justified");
                const explanation = interaction.fields.getTextInputValue("explanation");
                const reason = interaction.fields.getTextInputValue("reason");
                //const additional = interaction.fields.getTextInputValue("additional");
                
                const embed = {
                    author: {
                        name: `${user.tag}`,
                        icon_url: user.displayAvatarURL(),
                    },
                    title: "**Punishment Appeal Form**",
                    fields: [
                        { name: "1. Why did you get muted/banned?", value: why || 'N/A'},
                        { name: "2. In your opinion, do you think the punishment was justified?", value: justified || 'N/A'},
                        { name: "3. Explanations (if No)", value: explanation || 'N/A' },
                        { name: "4. Why do you believe your appeal should be accepted?", value: reason }
                        //{ name: "5. Additional Information", value: additional || 'N/A' }
                    ],
                    color: 0xFFD700, 
                    footer: {text: `User ID: ${appealRecord.discordId} | Case ID: ${appealRecord.id}`},
                    timestamp: new Date().toISOString(),
                };
                //const token = randomBytes(6).toString('hex').slice(0, 6);
                const appeal_message = await appeal_channel.send({content: "@everyone", embeds: [embed] });
                const token = appeal_message.id;
                const approve = new ButtonBuilder()
                    .setCustomId(`appform${token}yes`)
                    .setLabel("Approve")
                    .setEmoji("✅")
                    .setStyle(ButtonStyle.Success);
                const deny = new ButtonBuilder()
                    .setCustomId(`appform${token}no`)
                    .setLabel("Deny")
                    .setEmoji("✖")
                    .setStyle(ButtonStyle.Danger);
                const row = new ActionRowBuilder().addComponents(approve, deny);
                await appeal_message.edit({ components: [row] });
                
                await appeal_message.react('✅');
                await appeal_message.react('❌');
                await disableAppeal(appealRecord.id, token);
                await interaction.reply({ content: 'Your appeal has been submitted to staff members!', ephemeral: true });
            }
        }
    
    } catch (error) {
      console.log(error);
      const errorEmbed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(`\`\`\`${error}\`\`\``);

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};


function isManager(interaction) {
  const user = interaction.member;
  const userRoles = user.roles.cache.map((role) => role.id);

  if (
    config.discord.buttons.checkPerms === true &&
    !(userRoles.includes(config.discord.buttons.managerRole) || userRoles.includes(config.discord.buttons.adminRole) )
  ) {
    return false;
  }

  return true;
}