const { Client, Collection, AttachmentBuilder, GatewayIntentBits } = require("discord.js");
const CommunicationBridge = require("../contracts/CommunicationBridge.js");
const { replaceVariables } = require("../contracts/helperFunctions.js");
const messageToImage = require("../contracts/messageToImage.js");
const MessageHandler = require("./handlers/MessageHandler.js");
const StateHandler = require("./handlers/StateHandler.js");
const CommandHandler = require("./CommandHandler.js");
const config = require("../../config.json");
const Logger = require(".././Logger.js");
const path = require("node:path");
const fs = require("fs");
//const cron = require('node-cron');
const { CronJob } = require('cron');

class DiscordManager extends CommunicationBridge {
  constructor(app) {
    super();

    this.app = app;

    this.stateHandler = new StateHandler(this);
    this.messageHandler = new MessageHandler(this);
    this.commandHandler = new CommandHandler(this);
  }

  connect() {
    global.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    });

    this.client = client;

    this.client.on("ready", () => this.stateHandler.onReady());
    this.client.on("messageCreate", (message) => this.messageHandler.onMessage(message));

    this.client.login(config.discord.bot.token).catch((error) => {
      Logger.errorMessage(error);
    });

    client.commands = new Collection();
    const commandFiles = fs.readdirSync("src/discord/commands").filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const command = require(`./commands/${file}`);
      client.commands.set(command.name, command);
    }

    const eventsPath = path.join(__dirname, "events");
    const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      const event = require(filePath);
      event.once
        ? client.once(event.name, (...args) => event.execute(...args))
        : client.on(event.name, (...args) => event.execute(...args));
    }

    this.setupScheduler();

    process.on("SIGINT", async () => {
      await this.stateHandler.onClose();

      process.kill(process.pid, "SIGTERM");
    });
  }

  setupScheduler() {
    // Schedule the 'afk' command to run every day at midnight in Paris timezone
    //const timezone = 'Europe/Paris'; // Use Paris timezone
     // Replace with the ID of the channel where you want to send the afk command
    const channelId = '821482920509833246';
  
    //const scheduledJob = new CronJob('12 18 * * *', async () => {
    setInterval(async () => { 
      
      console.log('Running scheduled afk command');
  
      const afkCommand = client.commands.get('updateafk');
      if (!afkCommand) {
        console.error('AFK command not found!');
        return;
      }
      const channel1 = await client.channels.fetch("1100048976599863357");
      const channel2 = await client.channels.fetch(channelId);
      if (!channel1 || !channel2) {
        console.error('Channel not found!');
        return;
      }
  
      // Create a mock interaction object
      const interaction = {
        client: client,
        channel1: channel1,
        channel2: channel2,
        options: {
          getString: (name) => null,
        },
        followUp: async (response) => {
          //console.log(response); // For debugging, replace this with actual logic if needed
          await channel2.send(response); // Send the response to the channel
        },
      };
  
      try {
        await afkCommand.execute(interaction);
      } catch (error) {
        console.error('Error executing afk command:', error);
      }
    }, 86400000);
  }
    // }, null, true, timezone);
  
    // scheduledJob.start();
  //}
  

  async getWebhook(discord, type) {
    const channel = await this.stateHandler.getChannel(type);
    const webhooks = await channel.fetchWebhooks();

    if (webhooks.size === 0) {
      channel.createWebhook({
        name: "Hypixel Chat Bridge",
        avatar: "https://imgur.com/tgwQJTX.png",
      });

      await this.getWebhook(discord, type);
    }

    return webhooks.first();
  }

  async onBroadcast({ fullMessage, chat, chatType, username, rank, guildRank, message, color = 1752220 }) {
    if (
      (chat === undefined && chatType !== "debugChannel") ||
      ((username === undefined || message === undefined) && chat !== "debugChannel")
    ) {
      return;
    }

    const mode = chat === "debugChannel" ? "minecraft" : config.discord.other.messageMode.toLowerCase();
    message = chat === "debugChannel" ? fullMessage : message;
    if (message !== undefined && chat !== "debugChannel") {
      Logger.broadcastMessage(
        `${username} [${guildRank.replace(/§[0-9a-fk-or]/g, "").replace(/^\[|\]$/g, "")}]: ${message}`,
        `Discord`
      );
    }

    // ? custom message format (config.discord.other.messageFormat)
    if (config.discord.other.messageMode === "minecraft" && chat !== "debugChannel") {
      message = replaceVariables(config.discord.other.messageFormat, { chatType, username, rank, guildRank, message });
    }

    const channel = await this.stateHandler.getChannel(chat || "Guild");
    if (channel === undefined) {
      Logger.errorMessage(`Channel ${chat} not found!`);
      return;
    }

    switch (mode) {
      case "bot":
        await channel.send({
          embeds: [
            {
              description: message,
              color: this.hexToDec(color),
              timestamp: new Date(),
              footer: {
                text: guildRank,
              },
              author: {
                name: username,
                icon_url: `https://www.mc-heads.net/avatar/${username}`,
              },
            },
          ],
        });

        if (message.includes("https://")) {
          const links = message.match(/https?:\/\/[^\s]+/g).join("\n");

          channel.send(links);
        }

        break;

      case "webhook":
        message = this.cleanMessage(message);
        if (message.length === 0) {
          return;
        }

        this.app.discord.webhook = await this.getWebhook(this.app.discord, chatType);
        this.app.discord.webhook.send({
          content: message,
          username: username,
          avatarURL: `https://www.mc-heads.net/avatar/${username}`,
        });
        break;

      case "minecraft":
        if (fullMessage.length === 0) {
          return;
        }

        await channel.send({
          files: [
            new AttachmentBuilder(await messageToImage(message, username), {
              name: `${username}.png`,
            }),
          ],
        });

        if (message.includes("https://")) {
          const links = message.match(/https?:\/\/[^\s]+/g).join("\n");

          channel.send(links);
        }
        break;

      default:
        throw new Error("Invalid message mode: must be bot, webhook or minecraft");
    }
  }

  async onBroadcastCleanEmbed({ message, color, channel }) {
    Logger.broadcastMessage(message, "Event");

    channel = await this.stateHandler.getChannel(channel);
    channel.send({
      embeds: [
        {
          color: color,
          description: message,
        },
      ],
    });
  }

  async onBroadcastHeadedEmbed({ message, title, icon, color, channel }) {
    Logger.broadcastMessage(message, "Event");

    channel = await this.stateHandler.getChannel(channel);
    channel.send({
      embeds: [
        {
          color: color,
          author: {
            name: title,
            icon_url: icon,
          },
          description: message,
        },
      ],
    });
  }

  async onPlayerToggle({ fullMessage, username, message, color, channel }) {
    Logger.broadcastMessage(message, "Event");
    channel = await this.stateHandler.getChannel(channel);
    switch (config.discord.other.messageMode.toLowerCase()) {
      case "bot":
        channel.send({
          embeds: [
            {
              color: color,
              timestamp: new Date(),
              author: {
                name: `${message}`,
                icon_url: `https://www.mc-heads.net/avatar/${username}`,
              },
            },
          ],
        });
        break;
      case "webhook":
        message = this.cleanMessage(message);
        if (message.length === 0) {
          return;
        }

        this.app.discord.webhook = await this.getWebhook(this.app.discord, channel);
        this.app.discord.webhook.send({
          username: username,
          avatarURL: `https://www.mc-heads.net/avatar/${username}`,
          embeds: [
            {
              color: color,
              description: `${message}`,
            },
          ],
        });

        break;
      case "minecraft":
        await channel.send({
          files: [
            new AttachmentBuilder(await messageToImage(fullMessage), {
              name: `${username}.png`,
            }),
          ],
        });
        break;
      default:
        throw new Error("Invalid message mode: must be bot or webhook");
    }
  }

  hexToDec(hex) {
    if (hex === undefined) {
      return 1752220;
    }

    if (typeof hex === "number") {
      return hex;
    }

    return parseInt(hex.replace("#", ""), 16);
  }

  cleanMessage(message) {
    if (message === undefined) {
      return "";
    }

    return message
      .split("\n")
      .map((part) => {
        part = part.trim();
        return part.length === 0 ? "" : part.replace(/@(everyone|here)/gi, "").trim() + " ";
      })
      .join("");
  }

  formatMessage(message, data) {
    return replaceVariables(message, data);
  }
}

module.exports = DiscordManager;
