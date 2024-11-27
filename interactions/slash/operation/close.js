const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder } = require("discord.js");
const db = require("../../../connectDb");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close a request.'),
    async execute(interaction) {
        const channel = interaction.channel;

        if (!channel.name.startsWith("request-")) {
            return interaction.reply({ content: "This is not a request channel.", ephemeral: true })
        }

        let embed = new EmbedBuilder()
            .setDescription(`${interaction.user} wants to close the request.`)
            .setColor("#F1C40F")

            const ticket = await db("tickets")
            .select("*")
            .where("channel_id", channel.id)
            .first();

        if (interaction.user.id === ticket.user_id) {
            embed.setDescription(`Please confirm you want to close the request.`)
            embed.setFooter({ text: "Select an option below." })
        }

        else {
            embed.setDescription(`${interaction.user} wants to close the request.`)
            embed.setFooter({ text: `${ticket.user_id} | ${interaction.user.id}` })
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("confirm_close")
                    .setLabel("Confirm")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji("✅")
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("cancel_close")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("✖️")
            )

        await db("tickets")
            .where("channel_id", channel.id)
            .update({ close_requested_at: new Date() })

        await interaction.reply({ embeds: [embed], components: [row] });
        if (interaction.user.id !== ticket.user_id) {
            await interaction.channel.send({ content: `<@${ticket.user_id}>, Please confirm the closing of this request.` })
        }
    }
}