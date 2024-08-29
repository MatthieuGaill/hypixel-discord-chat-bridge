const config = require("../../config.json");
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');


class WebsiteManager{
  constructor(app) {
    this.app = app;
  }
  connect (){
    if (config.web.enabled === false){
      return;
    }
    const webapp = express();
    const PORT = process.env.PORT || 3000;
    
    
    // Serve static files from the "public" directory
    webapp.use(express.static(path.join(__dirname, 'public')));
    
    webapp.use(bodyParser.json());
    
    // In-memory storage for simplicity; for production, use a proper database
    const submissions = {};
    
    // Route to handle form submission
    webapp.post('/submit', async (req, res) => {
        const { caseId, justified, explanation, reason, additional } = req.body;
        // const userIp = req.ip;
        // const currentTime = Date.now();
    
        // // Check if the IP has submitted in the last 24 hours
        // if (submissions[userIp] && currentTime - submissions[userIp].lastSubmissionTime < 86400000) {
        //     return res.status(429).json({ message: 'You can only submit the form once every 24 hours.' });
        // }
    
        // // Store submission data
        // submissions[userIp] = { lastSubmissionTime: currentTime };
    
        // Prepare the data to send to Discord webhook
        const embed = {
            title: "New Ban Appeal Submission",
            fields: [
                { name: "Case ID", value: caseId, inline: true },
                { name: "Was the Punishment Justified?", value: justified, inline: true },
                { name: "Explanation (if No)", value: explanation || 'N/A' },
                { name: "Reason for Appeal", value: reason },
                { name: "Additional Information", value: additional || 'N/A' }
            ],
            color: 0x00FF00
        };
    
        try {
            // Send the data to Discord webhook and get the response 
            // Add reactions using the bot
            const channel = await this.app.discord.client.channels.fetch("1041089544755351752");
            const messageId = await channel.send({embeds: [embed]});
            const message = await channel.messages.fetch(messageId);
            await message.react('✅');
            await message.react('❌');
    
            return res.status(200).json({ message: 'Appeal submitted and reactions added successfully!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to submit appeal.' });
        }
    });
    
    // Start the server
    webapp.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
    


  }
  
}

module.exports = WebsiteManager;


