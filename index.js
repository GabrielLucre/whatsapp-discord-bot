const { Client: WhatsAppClient, LocalAuth } = require('whatsapp-web.js');
const { Client: DiscordClient, GatewayIntentBits } = require('discord.js');
const qrcode = require('qrcode-terminal');

// === CONFIGURAÇÕES ===
const DISCORD_BOT_TOKEN = '***'; // CRIE UM BOT NO DISCORD E PEGUE O TOKEN DELE
const DISCORD_CHANNEL_ID = '***'; // ID DO CANAL PARA RECEBER AS MENSSAGENS

// === BOT DO WHATSAPP ===
const whatsappClient = new WhatsAppClient({
    authStrategy: new LocalAuth(),
    // puppeteer: { headless: true }
});

whatsappClient.on('qr', qr => {
    console.log('Escaneie o QR Code com o WhatsApp:');
    qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
    console.log('✅ Bot do WhatsApp está pronto!');
});


// === BOT DO DISCORD ===
const discordClient = new DiscordClient({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

discordClient.on('ready', () => {
    console.log(`✅ Bot do Discord está online como ${discordClient.user.tag}`);
});

let whatsappGroupId = null; // será preenchido quando encontrar o grupo

discordClient.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Comando !ping
    if (message.content === '!ping') {
        return message.reply('🏓 Pong!');
    }

    // Enviar qualquer outra mensagem para o grupo do WhatsApp
    if (message.channel.id === DISCORD_CHANNEL_ID && whatsappGroupId) {
        try {
            console.log(message);
            await whatsappClient.sendMessage(
                whatsappGroupId,
                `💬 ${message.author.username}: ${message.content}`
            );
        } catch (err) {
            console.error("Erro ao enviar mensagem para o WhatsApp:", err);
        }
    }
});

// === INTEGRANDO OS DOIS ===
whatsappClient.on('message', async msg => {
    const chat = await msg.getChat();

    // Verifica se é um grupo E se o nome do grupo é o desejado
    if (chat.isGroup && chat.name.toLowerCase().includes("***")) { // Nome do grupo desejado para pegar as menssagens
        if (!whatsappGroupId) {
            whatsappGroupId = chat.id._serialized;
            console.log("ID do grupo WhatsApp salvo:", whatsappGroupId);
        }

        const contact = await msg.getContact();
        const senderName = contact.pushname || contact.number || "Desconhecido";

        const content = `👥 Mensagem no grupo *${chat.name}* de **${senderName}**:\n${msg.body}`;
        try {
            const channel = await discordClient.channels.fetch(DISCORD_CHANNEL_ID);
            if (channel && channel.isTextBased()) {
                await channel.send(content);
            }
        } catch (err) {
            console.error("Erro ao enviar para o Discord:", err);
        }
    }
});

// Inicializa os bots
whatsappClient.initialize();
discordClient.login(DISCORD_BOT_TOKEN);

