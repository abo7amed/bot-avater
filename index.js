const { Client, GatewayIntentBits, Partials, ApplicationCommandOptionType } = require('discord.js');
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
    console.log(`🤖 دخلت السيرفر باسم ${client.user?.tag}!`);
    
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

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'add-avatar' || interaction.commandName === 'add-banner') {
        await interaction.deferReply({ flags: 64 });

        const isAvatarCommand = interaction.commandName === 'add-avatar';
        const targetChannelId = isAvatarCommand ? config.avatarChannelId : config.bannerChannelId;

        const hasAllowedRole = interaction.member.roles.cache.some(role => config.allowedRoles.includes(role.id));

        if (!hasAllowedRole) {
            return interaction.editReply({ content: '❌ مالك صلاحية تستخدم هذا الأمر.' });
        }

        const attachment = interaction.options.getAttachment('image');
        if (attachment && attachment.contentType?.startsWith('image')) {
            const targetChannel = await client.channels.fetch(targetChannelId);
            if (targetChannel) {
                await targetChannel.send({
                    content: `صورة/بنر جديد من ${interaction.user.tag}:`,
                    files: [attachment],
                });
                interaction.editReply({ content: `✅ تم إضافة الصورة لقائمة الانتظار!` });
            }
        } else {
            interaction.editReply({ content: '❌ ياخوي، لازم تحط صورة مع الأمر.' });
        }
    }
});

client.login(config.token);