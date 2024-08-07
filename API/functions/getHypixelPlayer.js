/* eslint-disable no-throw-literal */
const { getUUID } = require("../../src/contracts/API/PlayerDBAPI.js");
const { isUuid } = require("../utils/uuid.js");
const config = require("../../config.json");
const axios = require("axios");

const cache2 = new Map();

async function getHypixelPlayer(uuid) {
  if (!isUuid(uuid)) {
    uuid = await getUUID(uuid).catch((error) => {
      throw error;
    });
  }

  if (cache2.has(uuid)) {
    const data = cache2.get(uuid);

    if (data.last_save + 300000 > Date.now()) {
      return data.player;
    }
  }

  const { data: playerRes } = await axios.get(`https://api.hypixel.net/v2/player?key=${config.minecraft.API.hypixelAPIkey}&uuid=${uuid}`)
    .catch((error) => {
      throw error?.response?.data?.cause ?? "Request to Hypixel API failed. Please try again!";
    });

  if (playerRes.success === false) {
    throw "Request to Hypixel API failed. Please try again!";
  }

  if (playerRes.player == null) {
    throw "Player not found. It looks like this player has never joined the Hypixel.";
  }

  const output = {
    last_save: Date.now(),
    player: playerRes.player,
    uuid: uuid,
  };

  cache2.set(uuid, output);

  return output.player;
}

module.exports = { getHypixelPlayer };