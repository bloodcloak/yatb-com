const { EmbedBuilder } = require("discord.js");
const db = require("../../../connectDb");

module.exports = {
    id: "cancel_close",
    async execute(interaction) {
        const footer = interaction.message.embeds[0].footer.text;
        const footerSplit = footer.split(" | ")

        if (interaction.user.id !== footerSplit[0] && interaction.user.id !== footerSplit[1]) {
            return interaction.reply({ content: "You do not have permission to cancel this request.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setDescription(`Close request cancelled by ${interaction.user}.`)
            .setColor("#B57EDC")

        await db("tickets")
            .update({ close_requested_at: null })
            .where("channel_id", interaction.channel.id)

        await interaction.update({ embeds: [embed], components: [] });
    }
}