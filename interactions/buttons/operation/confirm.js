const { EmbedBuilder } = require("discord.js");
const db = require("../../../connectDb");
const discordTranscripts = require("discord-html-transcripts");

module.exports = {
    id: "confirm_close",
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const channel = interaction.channel;
        const footer = interaction.message.embeds[0].footer.text;

        if (interaction.user.id !== footer.split(" | ")[0]) {
            return interaction.followUp({ content: "You do not have permission to close this request.", ephemeral: true });
        }

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

        interaction.followUp({ content: `Close Request Confirmed!`})
        interaction.followUp({ content: `Closing this request in 5 seconds...`, ephemeral: false });

        setTimeout(async () => {
            await channel.delete();
            await db("tickets")
                .where("channel_id", channel.id)
                .update({ status: "closed", closed_by: footer.startsWith("Wait for") ? interaction.user.id : footer.split(" | ")[1] });
        }, 5000);
    }
}