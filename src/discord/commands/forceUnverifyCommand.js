const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");

module.exports = {
  name: "force-unverify",
  description: "Connect Discord account to a Minecraft",
  moderatorOnly: true,
  verificationCommand: true,
  options: [
    {
      name: "user",
      description: "Discord User",
      type: 6,
      required: true,
    },
  ],

  execute: async (interaction) => {
    const user = interaction.options.getUser("user");
    const unverifyCommand = require("./unverifyCommand.js");
    if (unverifyCommand === undefined) {
      throw new HypixelDiscordChatBridgeError("The verify command does not exist. Please contact an administrator.");
    }
    interaction.user = undefined;
    await unverifyCommand.execute(interaction, user);
  },
};