const Database = require('better-sqlite3');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder} = require('discord.js');
const fs = require('fs');
const {scheduleTimeout} = require("../other/Timeouts.js");

const db = new Database('data/timeouts.db');
db.prepare(`
  CREATE TABLE IF NOT EXISTS timeouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caseId TEXT,
    userId TEXT,
    roleId TEXT,
    expiresAt INTEGER,
    timedoutId INTEGER
  )
`).run();

module.exports = {
    name: "ready",
    once: true,
    async execute(){
        const pendingTimeouts = db.prepare('SELECT * FROM timeouts WHERE expiresAt > ?').all(Date.now());
        console.log("RESCHEDULE");
        console.log(pendingTimeouts);
        pendingTimeouts.forEach(timeout => {
        const durationLeft = (timeout.expiresAt - Date.now());
        console.log(durationLeft);
        scheduleTimeout(
            timeout.caseId,
            timeout.userId,
            timeout.roleId,
            durationLeft
        );
        });

        const channel = await client.channels.fetch("1276252284564537387");
    
        let messageId;
        if (fs.existsSync("data/appealMessageId.txt")) {
            messageId = fs.readFileSync("data/appealMessageId.txt", 'utf8');
        }
        
        if (messageId) {
            try {
                const message = await channel.messages.fetch(messageId);
                console.log("Ticket button message found and loaded.");
            } catch (error) {
                console.error("Message not found, sending a new one.");
                await sendTicketButton(channel);
            }
        } else {
            await sendTicketButton(channel);
        }

        


    }
}

async function sendTicketButton(channel) {
    const image = new AttachmentBuilder('Golden_Legion_WM.png');
    await channel.send({ files: [image] });
    const button = new ButtonBuilder()
        .setCustomId('appeal_form')
        .setLabel('Appeal')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    const sentMessage = await channel.send({
        content: '**Click the button below to appeal** (*you need a valid token*)',
        components: [row],
    });

    fs.writeFileSync("data/appealMessageId.txt", sentMessage.id);
    console.log("Appeal button message sent and ID stored.");
}