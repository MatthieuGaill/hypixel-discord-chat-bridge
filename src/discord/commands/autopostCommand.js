const Database = require('better-sqlite3');
const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");



module.exports = {
  name: "autopost",
  description: "autopost command",
  options: [
    {
      name: "set",
      description: "create an announcement",
      type: 1,
      options: [
        {
          name: "announcement",
          description: "announcement in plain text",
          type: 3,
          required: true,
        },
        {
          name: "interval",
          description: "interval (m for minute, h for hour, d for day)",
          type: 3,
          required: true,
        },
        {
          name: "duration",
          description: "total duration (m for minute, h for hour, d for day)",
          type: 3,
          required: true,
        }
      ]
    },
    {
      name: "remove",
      description: "remove an announcement",
      type: 1,
      options : [
        {
          name : "id",
          description: "id to remove",
          type: 4,
          required: true
        },
      ]
    },
    {
      name: "edit",
      description: "edit an announcement",
      type: 1,
      options : [
        {
          name : "id",
          description: "id to edit",
          type: 4,
          required: true
        },
        {
          name: "announcement",
          description: "new announcement",
          type: 3,
          required: true,
        },
      ]
    },
    {
      name: "display",
      description: "display an announcement",
      type: 1,
      options : [
        {
          name : "id",
          description: "id of announcement",
          type: 4,
          required: true
        },
      ]
    },
    {
      name: "list",
      description: "list",
      type: 1,
    }
  ],
  
  execute: async (interaction) => {
    const user = interaction.member;
    if (
      config.discord.commands.checkPerms === true &&
      !(user.roles.cache.has(config.discord.commands.commandRole) || config.discord.commands.users.includes(user.id))
    ) {
      throw new HypixelDiscordChatBridgeError("You do not have permission to use this command.");
    }

    try {
      const db = new Database('data/autopost.sqlite');
      db.exec(`CREATE TABLE IF NOT EXISTS autopostdata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        announcement TEXT,
        interval INTEGER,
        duration INTEGER,
        current INTEGER
      )`);
  
      const action = interaction.options.getSubcommand();
      

      if (action === "set"){
        const interval0 = interaction.options.getString("interval")
        const interval = await convertToTimestamp(interval0);
        let duration = await convertToTimestamp(interaction.options.getString("duration"));
        duration = duration + Date.now();

        const date_duration = `<t:${Math.floor(duration/1000)}:d>`;
        const announcement = interaction.options.getString("announcement");
        const fields = [
          { name: "Announcement", value: announcement !== undefined ? announcement : "N/A" },
          { name: "Interval", value: interval0 !== undefined ? interval0 : "N/A", inline: true },
          { name: "Expiration date", value: date_duration !== undefined ? date_duration : "N/A" },
        ];
        
        const isEmpty = isTableEmpty(db);
        if (isEmpty){
          db.prepare('INSERT OR REPLACE INTO autopostdata (id, announcement, interval, duration, current) VALUES (?, ?, ?, ?, ?)').run(1, announcement, interval, duration, 0);
        } else{
          db.prepare('INSERT OR REPLACE INTO autopostdata (announcement, interval, duration, current) VALUES (?, ?, ?, ?)').run(announcement, interval, duration, 0);
        }
        
        const embed = new EmbedBuilder()
        .setColor(2067276)
        .setTitle(`Announcement created`)
        .addFields(fields)
        .setFooter({
          text: ' ',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
  
        await interaction.followUp({embeds: [embed],});
        
      } else if (action === "remove"){
        const id = interaction.options.getInteger("id");
        db.prepare('DELETE FROM autopostdata WHERE id = ?').run(id);
        const embed = new EmbedBuilder()
        .setColor(15105570)
        .setAuthor({ name: "Announcement removed" })
        .setDescription(`Successfully removed announcement of id **${id}**`)
        .setFooter({
          text: ' ',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
        await interaction.followUp({embeds: [embed],});
  
        
      } else if (action === "list"){
        const embed = getList(db);
      
        await interaction.followUp( {embeds: [embed]});

      } else if (action === "edit"){
        const announcement = interaction.options.getString("announcement");
        const id = interaction.options.getInteger("id");
        db.prepare("UPDATE autopostdata SET announcement = ? WHERE id = ?").run(announcement, id);
        const embed = new EmbedBuilder()
        .setColor(15105570)
        .setAuthor({ name: "Announcement edited" })
        .setDescription(`Successfully edited announcement of id **${id}**`)
        .setFooter({
          text: ' ',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
        await interaction.followUp({embeds: [embed],});

      } else if (action === "display"){
        const announcement = interaction.options.getString("announcement");
        const id = interaction.options.getInteger("id");
        const row = db.prepare("SELECT announcement FROM autopostdata WHERE id = ?").get(id);
        const embed = new EmbedBuilder()
        .setColor(16777215)
        .setAuthor({ name: `Announcement of id ${id}` })
        .setDescription(`${row.announcement}`)
        .setFooter({
          text: ' ',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        });
        await interaction.followUp({embeds: [embed],});
      } else {
        throw "Something is wrong";
      }

      
    } catch(e){
        throw new HypixelDiscordChatBridgeError(`${e}`);
    }

  },

};

async function convertToTimestamp(time0) {
  const regex = /^(\d+)([mhd])$/;
  const match = time0.match(regex);

  if (!match) {
    throw 'Invalid interval format. Use "1m", "1h", or "1d".';
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  let milliseconds;
  switch (unit) {
    case 'm':
      milliseconds = value * 60 * 1000; // minutes to milliseconds
      break;
    case 'h':
      milliseconds = value * 60 * 60 * 1000; // hours to milliseconds
      break;
    case 'd':
      milliseconds = value * 24 * 60 * 60 * 1000; // days to milliseconds
      break;
    default:
      throw 'Invalid unit in interval. Use "m", "h", or "d".';
  }

  return milliseconds;
}
  
function getList(db){
  const rows = db.prepare('SELECT * FROM autopostdata').all();
  const dataDictionary = {};
  rows.forEach((row) => {
    dataDictionary[row.id] = [row.announcement, row.interval, row.duration];
  });

  let verticalList = Object.entries(dataDictionary)
  .map(([id, datadic]) => `**${truncateString(datadic[0])}** / ${datadic[1] / 60000}m interval / Until <t:${Math.floor(datadic[2] / 1000)}:d>   (**${id}**)`)
  .join('\n\n');

  if (!verticalList) {
    verticalList = "No announcements yet!";
  }

  const embed = new EmbedBuilder()
    .setColor(16777215)
    .setAuthor({ name: "Current announcements" })
    .setDescription(verticalList)
    .setFooter({
      text: ' ',
      iconURL: "https://i.imgur.com/Fc2R9Z9.png",
  });

  return embed;
}

function truncateString(str) {
  if (str.length > 16) {
    return str.slice(0, 16) + "...";
  }
  return str;
}

function isTableEmpty(db) {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM autopostdata`).get();
  return row.count === 0;
}
