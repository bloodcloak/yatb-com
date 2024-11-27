const db = require("../connectDb");
const discordTranscripts = require("discord-html-transcripts");

module.exports = {
	name: "ready",
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		setInterval(() => {
			const tickets = db("tickets")
				.select("*")
				.where("status", "open")
				.andWhere("close_requested_at", "!=", null);

			console.log(`Pending Close Check\n===\n${tickets}\n===`)

			Object.keys(tickets).forEach(async ticket => {
				const closeRequestedAt = new Date(ticket.close_requested_at);
				const timeout = ticket.timeout * 24 * 60 * 60 * 1000;

				if (Date.now() - closeRequestedAt > timeout) {
					const channel = client.channels.cache.get(ticket.channel_id);
					const transcript = await discordTranscripts.createTranscript(channel, {
						limit: -1,
						filename: `transcript-${channel.name}.html`,
						saveImages: false,
						poweredBy: false,
						ssr: false
					});

					const category = await db("buttons")
						.select("label")
						.where("id", ticket.ticket_id)
						.first();

					const logChannel = interaction.guild.channels.cache.get(ticket.log_channel_id);

					const embed = new EmbedBuilder()
						.setTitle(`Request #${ticket.id} closed`)
						.setDescription(`Request closed by \`Autobot due to inactivity\`.`)
						.addFields(
							{ name: "Request type", value: `${category.label}` },
							{ name: "Request owner", value: `ID: ${ticket.user_id}` }
						)
						.setColor("Red")
						.setFooter({ text: `Transcript is attached below this message` })

					logChannel.send({ embeds: [embed] });
					logChannel.send({ files: [transcript] });

					interaction.followUp({ content: `Closing this request due to inactivity...` });

					setTimeout(async () => {
						await channel.delete();
						await db("tickets")
							.where("channel_id", channel.id)
							.update({ status: "closed", closed_by: "Autobot" });
					}, 5000);
				}
			})
		}, 1000 * 60 * 2);
	},
};
