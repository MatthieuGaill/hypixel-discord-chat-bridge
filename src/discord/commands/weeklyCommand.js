const { EmbedBuilder, escapeMarkdown } = require("discord.js");
const { selectlink_discord } = require("../../contracts/verify");
const hypixelRebornAPI = require("../../contracts/API/HypixelRebornAPI.js");
const { getUsername } = require("../../contracts/API/PlayerDBAPI.js");

module.exports = {
    name: "weekly",
    description: "Weekly GEXP leaderboard of a guild",
    options:[
        {
            name: 'query',
            type: 3,
            required: false,
            description: "Guild name or player name"
        },
        {
            name: "count",
            type: 3,
            required: false,
            description: "The number of players to show"
        },
        {
            name: "type",
            type: 3,
            description: "Whether to search by player of by guild name",
            required:false,
            choices: [
                {name: "player", value: "player"}, {name: "guild", value: "guild"}
            ]
        },
        {
            name: "filter",
            type: 3,
            required: false,
            description: "The GEXP filter. Example: '>10000' for more than 10000 GEXP, '<1000' for less than 1000 GEXP"
        }
    ],
    execute: 

    async(interaction) => {

        try {
            let user = interaction.user;

            const query = interaction.options.getString("query", false);
            let memberCount = interaction.options.getString('count', false) ?? 15;
            const type = interaction.options.getString('type', false) ?? 'guild';
            const filter = interaction.options.getString('filter', false) ?? ">=0";

            const check = filter.match(/^([<=>]{1,2}) ?(\d+)$/);
            if (!check || ![">=", ">", "<", "<=", "=="].includes(check[1])) throw `Malformed filter: \`${filter}\``;

            const gexpReq = check[2];
            const gexpOperator = check[1];

            let guild;
            const row = await selectlink_discord(user.id);
            if (!query && !row) throw "To use this command without arguments, verify by doing `/verify [username]`!";
            else if (!query){
                guild = await hypixelRebornAPI.getGuild("player", `${row}`); 
            } 
            else if (type === "player") guild = await hypixelRebornAPI.getGuild("player", query);
            else if (type === "guild") guild = await hypixelRebornAPI.getGuild("name", query);

            if (guild.exists == false && !query) throw "You are not in a guild!";
            if (guild.exists == false && type === 'guild') throw `No guild was found with the name \`${query}\`!`;
            if (guild.exists == false && type === 'player') throw `The player \`${query}\` is not in a guild!`;
            if (guild.outage) throw `There is a Hypixel API Outage, please try again within a few minutes`;

            let gexp = {}

            const embed = {
                title: `Top ${memberCount} Weekly GEXP ${guild.name} ${guild.tag ? `[${guild.tag}]` : ""}`,
                url: `https://plancke.io/hypixel/guild/name/${encodeURI(guild.name)}`,
                icon: "https://i.imgur.com/Fc2R9Z9.png",
                color: guild.tagColor.toHex(),
                footer: true
            }

            let pages = []

            const guildMembers = guild.members.filter(member => eval(`${member.weeklyExperience} ${gexpOperator} ${gexpReq}`))
            if (memberCount == "all" || memberCount > guildMembers.length) memberCount = guildMembers.length
   
            //gexp['weekly'] = guild.expHistory.reduce((sum, item) => sum + item.totalExp, 0);
            gexp['weekly'] = guild.totalWeeklyGexp;
            gexp["weeklyScaled"] = guild.expHistory.reduce((sum, item) => sum + item.exp, 0);
            pages[0] = {}
            pages[0].fields = []
            let players = []

            pages[0].author = "Guild Weekly GEXP"
            pages[0].title = `Top ${memberCount} Weekly GEXP ${guild.name} ${guild.tag ? `[${guild.tag}]` : ""}`
            pages[0].description = `\`\`\`CSS\nShowing results for ${guild.name} ${guild.tag ? `[${guild.tag}]` : ""} Top ${memberCount} Weekly GEXP\`\`\`\n\`\`\`js\nTotal RAW Weekly GEXP: ${(gexp["weekly"] || 0).toLocaleString()}\nTotal SCALED Weekly GEXP: ${(gexp["weeklyScaled"] || 0).toLocaleString()} (Approximated)\`\`\``; 

            guildMembers.sort((a, b) => b.weeklyExperience - a.weeklyExperience)

            for (const member of guildMembers) {
                member.username = await getUsername(member.uuid);
            }

            guildMembers.forEach((member, index) => {
                if (index < memberCount) players.push(`\`#${index + 1}\` ${(row == member.uuid) ? "**" : ""}${(Date.now() - parseInt(member.joinedAtTimestamp)) < (7 * 24 * 60 * 60 * 1000) ? ' 🆕 ' : ''}${escapeMarkdown(member.username || "Error")}: ${(member.weeklyExperience || 0).toLocaleString()}${(row == member.uuid) ? "**" : ""}\n`)
            })

            let sliceSize = memberCount / 3;
            let list = Array.from({ length: 3 }, (_, i) => players.slice(i * sliceSize, (i + 1) * sliceSize))

            list.forEach((item, index) => {
                if (item.length === 0) return;
                pages[0].fields[index] = { value: item.join(""), options: { blankTitle: true, escapeFormatting: true } }
            })

            let secPage = false

            pages[0].fields.forEach(field => { if (field.value.length >= 1024) secPage = true })

            if (secPage) {
                let sliceSize = memberCount / 6;
                let list = Array.from({ length: 6 }, (_, i) => players.slice(i * sliceSize, (i + 1) * sliceSize));

                list.forEach((item, index) => {
                    if (item.length === 0) return;
                    if (index > guildMembers.length / 2) pages[1].fields[index - 3] = { value: item.join(""), options: { blankTitle: true, escapeFormatting: true } }
                    else pages[0].fields[index] = { value: item.join(""), options: { blankTitle: true, escapeFormatting: true } }
                })
            }

            const embeds = await pageEmbedMaker(embed, pages);
            //bot.sendPages(interaction, embeds)
            await interaction.followUp({embeds: embeds});

        } catch (error){
            console.error(error);
            const errEmbed = new EmbedBuilder()
            .setColor("Red")
            .setDescription(error)
            .setFooter({
                text: "Golden Legion",
                iconURL: "https://i.imgur.com/Fc2R9Z9.png"
            })
            interaction.followUp({embeds : [errEmbed]});
        }
        
    },
}


async function pageEmbedMaker(embed = {}, pages = []) {
    let embeds = []
    embed = {
        title: null,
        icon: undefined,
        color: 15844367,
        url: false,
        footer: true,
        description: null,
        image: false,
        thumbnail: false,
        files: false,
        ...embed
    }

    pages.forEach((page, pageIndex) => {
        let embeded = new EmbedBuilder();
        if (page.title) embeded.setTitle(page.title)
        else if (embed.title) embeded.setTitle(embed.title)

        if (embed.url) embeded.setURL(embed.url)
        else if (embed.url) embeded.setURL(embed.url)

        if (embed.files) embeded.attachFiles(embed.files)

        if (page.description) embeded.setDescription(page.description)
        else if (embed.description) embeded.setDescription(embed.description)

        if (page.thumbnail) embeded.setThumbnail(page.thumbnail)
        else if (embed.thumbnail) embeded.setThumbnail(embed.thumbnail)

        if (page.image) embeded.setImage(page.image)
        else if (embed.image) embeded.setImage(embed.image)

        if (page.author || embed.author || page.icon || embed.icon) embeded.setAuthor({name: page.author ? page.author : embed.author, iconURL: page.icon ? page.icon : embed.icon})
        else if (page.author) embeded.setAuthor({name: page.author})

        if (page.color) embeded.setColor(page.color)
        else if (embed.color) embeded.setColor(embed.color)

        if (embed.footer && pages.length > 1) embeded.setFooter({ text: `『 Page ${pageIndex + 1}/${pages.length}』 Golden Legion`, iconURL: "https://i.imgur.com/Fc2R9Z9.png" })
        else if (embed.footer) embeded.setFooter({ text: `Golden Legion`, iconURL: "https://i.imgur.com/Fc2R9Z9.png" })
        // console.log(page.fields)
        page.fields = page?.fields?.filter(p => p.value || p.name) || null;
        if (page.fields) {
            let blanks = 0
            let fields = []
            const firstPage = pages[0]
            page.fields.forEach((field, index) => {
                field.options = {
                    inline: true,
                    blank: false,
                    blankTitle: false,
                    escapeFormatting: false,
                    compare: false,
                    ...field.options
                }
                if (field.options.blank == true) {
                    if (firstPage.fields[index].options.blank !== true) blanks++
                    fields.push({
                        name: "\u200b",
                        value: "\u200b",
                        inline: field.options.inline
                    })
                } else {
                    if (field.options.changelog == true) {
                        var values = []
                        field.value.forEach((subValue, index) => {
                            values.push(`\`+\` ${subValue.name ? `**${subValue.name}**:` : ""} ${subValue.value}`)
                        })
                        fields.push({
                            name: field.name ? field.name : "\u200b",
                            value: values,
                            inline: false
                        })
                    } else if (Array.isArray(field.value)) {
                        var values = []
                        field.value.forEach((subValue, index) => {
                            values.push(`+ **${subValue.name}**: \`${(subValue.value || 0).toLocaleString()}\``)
                        })
                        fields.push({
                            name: field.name ? field.name : "\u200b",
                            value: values,
                            inline: field.options.inline
                        })
                    } else {
                        let firstField = firstPage.fields[index - blanks]
                        if (field.options.escapeFormatting == true) {
                            fields.push({
                                name: field.name ? field.name : "\u200b",
                                value: `${field.value ? Number.isInteger(field.value) ? field.value.toLocaleString() : field.value : 0}`,
                                inline: field.options.inline
                            })
                        } else if (field.options.blankTitle == true) {
                            fields.push({
                                name: "\u200b",
                                value: `\`${field.value ? Number.isInteger(field.value) ? field.value.toLocaleString() : field.value : 0}\``,
                                inline: field.options.inline
                            })
                        } else if (field.options.compare == true) {
                            fields.push({
                                name: field.name ? field.name : "\u200b",
                                value: `\`${field.value ? Number.isInteger(field.value) ? field.value.toLocaleString() : field.value : 0}\` **|** \`${field.value2 ? Number.isInteger(field.value2) ? field.value2.toLocaleString() : field.value2 : 0}\`\n ${!isNaN(field.value) || field.value == undefined && !isNaN(field.value2) || field.value == undefined ? `${emoji(field.value || 0, field.value2 || 0)} \`${Math.abs((field.value || 0) - (field.value2 || 0)).toLocaleString()}\`` : ` `}`,
                                inline: field.options.inline
                            })
                        } else {
                            fields.push({
                                name: field.name ? field.name : firstField ? firstField.name : "\u200b",
                                value: `\`${field.value ? Number.isInteger(field.value) ? field.value.toLocaleString() : field.value : 0}\``,
                                inline: field.options.inline
                            })
                        }
                    }
                }
            })
            embeded.addFields(fields)
        }
        embeds.push(embeded)
    })

    return embeds
}