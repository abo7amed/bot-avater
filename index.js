const { Client, GatewayIntentBits, TextChannel, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

client.on('ready', () => {
    console.log(`دخلت السيرفر باسم ${client.user?.tag}!`);
    setInterval(updateProfile, 3600000);
});

async function updateProfile() {
    const avatarChannel = await client.channels.fetch(config.avatarChannelId);
    const bannerChannel = await client.channels.fetch(config.bannerChannelId);

    if (avatarChannel && bannerChannel) {
        const avatarMessages = await avatarChannel.messages.fetch({ limit: 100 });
        const bannerMessages = await bannerChannel.messages.fetch({ limit: 100 });

        const avatarURLs = avatarMessages.map(msg => msg.attachments.first()?.url).filter(Boolean);
        const bannerURLs = bannerMessages.map(msg => msg.attachments.first()?.url).filter(Boolean);

        if (avatarURLs.length > 0) {
            const randomAvatar = avatarURLs[Math.floor(Math.random() * avatarURLs.length)];
            await client.user?.setAvatar(randomAvatar);
            console.log('تم تحديث الصورة الشخصية!');
        } else {
            console.log('ما فيه صور شخصية في القناة، ما يمديني أغيّر الصورة.');
        }

        if (bannerURLs.length > 0) {
            const randomBanner = bannerURLs[Math.floor(Math.random() * bannerURLs.length)];
            await client.user?.setBanner(randomBanner);
            console.log('تم تحديث البنر!');
        } else {
            console.log('ما فيه بنرات في القناة، ما يمديني أغيّر البنر.');
        }
    }
}

client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;

    if (message.content.startsWith('!addavatar') || message.content.startsWith('!addbanner')) {
        const isAvatarCommand = message.content.startsWith('!addavatar');
        const targetChannelId = isAvatarCommand ? config.avatarChannelId : config.bannerChannelId;

        const hasAllowedRole = message.member?.roles.cache.some(role => config.allowedRoles.includes(role.id));

        if (!hasAllowedRole) {
            return message.reply('مالك صلاحية تستخدم هذا الأمر.');
        }

        const attachment = message.attachments.first();
        if (attachment && attachment.contentType?.startsWith('image')) {
            const targetChannel = await client.channels.fetch(targetChannelId);
            if (targetChannel) {
                await targetChannel.send({
                    content: `صورة/بنر جديد من ${message.author.tag}:`,
                    files: [attachment],
                });
                message.reply(`تم إضافة الصورة لقائمة الانتظار!`);
            }
        } else {
            message.reply('ياخوي، لازم تحط صورة مع الأمر.');
        }
    }
});

client.login(config.token);