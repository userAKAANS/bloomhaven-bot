require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
  partials: ['CHANNEL']
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const order = req.body;
    const discordTag = order.customer?.last_name;
    const robloxUser = order.customer?.first_name;
    const orderId = order.id;
    const item = order.line_items[0]?.title;
    const amount = order.line_items[0]?.price;

    if (discordTag) {
      const user = await client.users.fetch(discordTag).catch(() => null);
      if (user) {
        user.send(
          `🌿 **Bloom Haven Order Received!**\n\n**Order ID:** #${orderId}\n**Item:** ${item}\n**Amount:** $${amount}\n**Roblox Username:** ${robloxUser}\n\n💸 To complete your purchase, please follow the payment instructions sent by Bloom Haven.\n\nOnce paid, you’ll receive your private delivery server!`
        ).catch(console.error);
      }
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error');
  }
});

client.once('ready', () => {
  console.log(`Bot is online as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (command) {
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ There was an error executing this command.', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
app.listen(PORT, () => console.log(`Webhook server running on port ${PORT}`));
