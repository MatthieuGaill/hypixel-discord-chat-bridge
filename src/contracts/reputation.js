const Database = require('better-sqlite3');
const hypixel = require("./API/HypixelRebornAPI.js");
const config = require("../../config.json");
const HypixelDiscordChatBridgeError = require('./errorHandler.js');

const db = new Database('data/replist.sqlite');
db.exec('CREATE TABLE IF NOT EXISTS repdata (key TEXT PRIMARY KEY, reputation INTEGER, typerep TEXT)');


async function updateDatabase(member_id, choiceIndex) {
    try {
      const row = db.prepare('SELECT * FROM repdata WHERE key = ?').get(member_id);
  
      if (!row) {
        let newType = [0, 0, 0, 0, 0, 0, 0, 0];
        newType[choiceIndex] = 1;
        db.prepare('INSERT INTO repdata (key, reputation, typerep) VALUES (?, 1, ?)').run(member_id, JSON.stringify(newType));
        return false;
      } else {
        let updatedType = JSON.parse(row.typerep);
        updatedType[choiceIndex] = updatedType[choiceIndex] + 1;
        db.prepare('UPDATE repdata SET reputation = reputation + 1, typerep = ? WHERE key = ?').run(JSON.stringify(updatedType), member_id);
  
        return row.reputation === 9;
      }
    } catch (err) {
      console.error(err.message);
      throw err;
    }
  }

async function getList(guild){
    const rows = db.prepare('SELECT * FROM repdata').all();
    const dataDictionary = {};

    for (const row of rows) {
      const d_id = row.key;
      const reputation = row.reputation;
      let d_member;
      try{
        d_member = await guild.members.fetch(d_id)
      } catch (error){
        if (error.code === 10007) { // DiscordAPIError: Unknown Member
          db.prepare('DELETE FROM repdata WHERE key = ?').run(row.key);
          continue;
        } else {
          console.error(error);
          throw error;
        }
      }
      if (reputation === 0){
        db.prepare('DELETE FROM repdata WHERE key = ?').run(row.key);
      } else{
        dataDictionary[`<@${d_id}>`] = reputation;
      }
    }
    return dataDictionary;
}

  
function removeRep(member_id, choice, choiceIndex, number) {
    try {
      const row = db.prepare('SELECT * FROM repdata WHERE key = ?').get(member_id);
  
      if (!row) {
        throw `No reputation found for this user!`;
      }
  
      let updatedType = JSON.parse(row.typerep);
  
      if (updatedType[choiceIndex] < number) {
        throw `There were not ${number} reputation(s) for this choice & member!`;
      }
  
      updatedType[choiceIndex] -= number;
      updatedType = JSON.stringify(updatedType);
  
      db.prepare('UPDATE repdata SET reputation = reputation - ?, typerep = ? WHERE key = ?')
        .run(number, updatedType, member_id);
  
      const embed = {
        color: "Grey",
        author: {
          name: `Reputation removed`
        },
        description: `Removed ${number} reputation(s) for <@${member_id}> (${choice})`,
        footer: {
          text: 'Reputation tool',
          iconURL: "https://i.imgur.com/Fc2R9Z9.png",
        }
      };
  
      return embed;
  
    } catch (err) {
      throw err;
    } finally {
      db.close();
    }
}

async function getPlayer(member) {
  try {
    const row = db.prepare('SELECT * FROM repdata WHERE key = ?').get(member.id);

    if (!row) {
      throw new Error("No reputation data found for this member!");
    }

    const typerep = JSON.parse(row.typerep);
    const Label = [
      ":blue_book: *Explaining*\u200B\u200B \u200B \u200B",
      ":bank: *Loaning*\u200B \u200B \u200B \u200B \u200B \u200B \u200B",
      ":tools: *Crafting*\u200B \u200B \u200B \u200B \u200B \u200B \u200B",
      ":magic_wand: *Reforging*\u200B \u200B \u200B \u200B \u200B",
      ":spider: *Slayer*\u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B ",
      ":crossed_swords: *Dungeon*\u200B \u200B \u200B \u200B \u200B \u200B",
      ":gift: *Gifting*\u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B",
      ":regional_indicator_o: *Other*\u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B\u200B \u200B \u200B \u200B"
    ];

    let detailList = "";
    for (let i = 0; i < 8; i++) {
      detailList += `${Label[i]} ${typerep[i]} \n`;
    }

    const fields = [
      { name: "Name", value: `<@${member.id}>` },
      { name: "Total Reputation", value: `${row.reputation}` },
      { name: "Details", value: detailList },
    ];

    const embed = {
      color: 16777215,
      title: `User's reputation`,
      thumbnail: {
        url: member.user.avatarURL(),
      },
      fields: fields,
      footer: {
        text: 'Reputation tool',
        iconURL: "https://i.imgur.com/Fc2R9Z9.png",
      }
    };

    return embed;

  } catch (err) {
    console.error(err.message);
    throw new Error("ERROR whilst reading data!");
  } finally {
    db.close();
  }
}
  
  
module.exports = { getList, updateDatabase, removeRep, getPlayer};
