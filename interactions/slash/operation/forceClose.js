const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../../connectDb");
const discordTranscripts = require("discord-html-transcripts");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('force_close')
        .setDescription('Force close a request.'),
    async execute(interaction) {
        const channel = interaction.channel;
        const settings = await db("settings")
            .select("*")
            .first();

        if (!channel.name.startsWith("request-")) {
            return interaction.reply({ content: "This is not a request channel.", ephemeral: true })
        }

        const member = interaction.guild.members.cache.get(interaction.user.id);

        const hasRole = member.roles.cache.some((role) => settings.roles.includes(role.id));

        if (!hasRole) {
            return interaction.reply({ content: "You don't have permission to force close this request.", ephemeral: true });
        }

        await interaction.deferReply();

        const transcript = await discordTranscripts.createTranscript(channel, {
            limit: -1,
            filename: `transcript-${channel.name}.html`,
            saveImages: false,
            poweredBy: false,
            ssr: false
        });

        const ticket = await db("tickets")
            .select("*")
            .where("channel_id", channel.id)
            .first();

        const category = await db("buttons")
            .select("label")
            .where("id", ticket.ticket_id)
            .first();

        const logChannel = interaction.guild.channels.cache.get(ticket.log_channel_id);

        const embed = new EmbedBuilder()
            .setTitle(`Request #${ticket.id} closed`)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(`Request closed by ${interaction.user}.`)
            .addFields(
                { name: "Request type", value: `${category.label}` },
                { name: "Request owner", value: `ID: ${ticket.user_id}` }
            )
            .setColor("Red")
            .setFooter({ text: `Transcript is attached below this message` })

        logChannel.send({ embeds: [embed] });
        logChannel.send({ files: [transcript] });

        interaction.followUp({ content: `Closing this request in 5 seconds...` });

        setTimeout(async () => {
            await channel.delete();
            await db("tickets")
                .where("channel_id", channel.id)
                .update({ status: "closed", closed_by: interaction.user.id });
        }, 5000);

    }
}