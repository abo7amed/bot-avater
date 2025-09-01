const { Client, GatewayIntentBits, TextChannel, Partials, ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
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

client.on('ready', async () => {
    console.log(`دخلت السيرفر باسم ${client.user?.tag}!`);
    setInterval(updateProfile, 3600000);

    // تسجيل أوامر السلاش
    const commands = [
        {
            name: 'add-avatar',
            description: 'لإضافة صورة شخصية جديدة لقائمة البوت.',
            options: [
                {
                    name: 'image',
                    description: 'الصورة اللي تبي تضيفها.',
                    type: ApplicationCommandOptionType.Attachment,
                    required: true,
                },
            ],
        },
        {
            name: 'add-banner',
            description: 'لإضافة بنر جديد لقائمة البوت.',
            options: [
                {
                    name: 'image',
                    description: 'الصورة اللي تبي تضيفها.',
                    type: ApplicationCommandOptionType.Attachment,
                    required: true,
                },
            ],
        },
    ];

    await client.application?.commands.set(commands);
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

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'add-avatar' || interaction.commandName === 'add-banner') {
        const isAvatarCommand = interaction.commandName === 'add-avatar';
        const targetChannelId = isAvatarCommand ? config.avatarChannelId : config.bannerChannelId;

        const hasAllowedRole = interaction.member.roles.cache.some(role => config.allowedRoles.includes(role.id));

        if (!hasAllowedRole) {
            return interaction.reply({ content: 'مالك صلاحية تستخدم هذا الأمر.', ephemeral: true });
        }

        const attachment = interaction.options.getAttachment('image');
        if (attachment && attachment.contentType?.startsWith('image')) {
            const targetChannel = await client.channels.fetch(targetChannelId);
            if (targetChannel) {
                await targetChannel.send({
                    content: `صورة/بنر جديد من ${interaction.user.tag}:`,
                    files: [attachment],
                });
                interaction.reply({ content: `تم إضافة الصورة لقائمة الانتظار!`, ephemeral: true });
            }
        } else {
            interaction.reply({ content: 'ياخوي، لازم تحط صورة مع الأمر.', ephemeral: true });
        }
    }
});

client.login(config.token);
