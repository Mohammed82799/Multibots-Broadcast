// Imports ----

require("dotenv").config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");
const fs = require("fs");
const chalk = require("chalk");
const Keyv = require("keyv");
const moment = require("moment");

const db = new Keyv("sqlite://db.sqlite");

// Logining to main client ----

let client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildPresences, GatewayIntentBits.MessageContent],
});

client
  .login(process.env.MAIN_CLIENT)
  .then(() => {
    console.log(chalk.green.bold(`[LOGIN] - Successfully connected to main client : ${client.user.tag}`));
  })
  .catch((err) => {
    console.log(chalk.red.bold(`[ERROR] - Failed to connect to main client`));
  });

// Settings ----

let prefix = "+";
let owners = ["925454966464860230"];

// Event Listeners ----

let clients = [client.token];

client.on("ready", async () => {
  for (let i = 0; i < 4; i++) {
    try {
      let bot = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildPresences, GatewayIntentBits.MessageContent],
      });

      await bot
        .login(process.env[`TOKEN${i + 1}`])
        .then(async (x) => {
          console.log(chalk.green.bold(`[LOGIN] - Successfully connected to client ${i + 1} : ${bot.user.tag}`));

          clients.push(bot.token);
        })
        .catch(() => {
          console.log(chalk.red.bold(`[ERROR] - Failed to connect to client ${i + 1}`));
        });
    } catch (err) {}
  }
  console.log(chalk.green.bold(`[CLIENTS] - Successfully connected to ${clients.length} bots`));
});

client.on("messageCreate", async (message) => {
  let command = message.content.split(" ")[0];
  if (command == prefix + "bc") {
    let args = message.content.split(" ").slice(1).join(" ");
    let success = 0;
    let failed = 0;
    let current = 0;

    let members = message.guild.members.cache.map((a) => a);
    members[0] = message.member;
    let chunk = parseInt(Math.round(members.length / clients.length)) > 800 ? 800 : parseInt(Math.round(members.length / clients.length));

    function embed() {
      return new EmbedBuilder()
        .setTitle("Broadcast Process")
        .setDescription(
          `\`\`\`\nBots Chunks\`\`\`\n${clients
            .map((v, i) => `- Client ${i + 1} : \`${members.slice(i + chunk, i + chunk + chunk).length}\` member`)
            .join("\n")}\n\`\`\`\nBroadcast Status\n\`\`\`\n- I will send to : \`${members.length}\`\n- I have sent to : \`${success}\`\n- I couldn't send to : \`${failed}\``
        )
        .setColor("Red")
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.avatarURL({ dynamic: true }),
        })
        .setThumbnail(message.author.avatarURL({ dynamic: true }))
        .setFooter({
          text: "All copyrights® goes to Broadcast Area",
        });
    }

    let msg = await message.reply({
      embeds: [embed()],
    });

    let interval = setInterval(async () => {
      await msg.edit({
        embeds: [embed()],
      });
    }, 5000);

    for (let i = 0; i < members.length; i += chunk) {
      const chunkofmembers = members.slice(i, i + chunk);
      const botToken = clients[current];
      if (!botToken) return;

      const bot = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildPresences, GatewayIntentBits.MessageContent],
      });

      function sendFunction() {
        for (let ii = 0; ii < chunkofmembers.length; ii++) {
          if (!bot.guilds.cache.get(message.guild.id)) return;
          let user = bot.users.cache.get(chunkofmembers[ii].user.id);
          if (!user) continue;

          user
            .send({ content: `${args}\n${user}` })
            .then(async (m) => {
              success++;
            })
            .catch((err) => {
              failed++;
            });
        }
        bot.off("ready", sendFunction);
      }
      bot.on("ready", sendFunction);
      bot.login(botToken).catch(() => {});

      current++;
    }
  }
});
