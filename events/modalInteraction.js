const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder } = require("discord.js");
const db = require("../connectDb");

module.exports = {
	name: "interactionCreate",
	async execute(interaction) {
		const client = interaction.client;

		if (!interaction.isModalSubmit()) return;

		const command = client.modalCommands.get(interaction.customId);

		if (!command) {
			if (isNaN(Number(interaction.customId))) {
				await require("../messages/defaultModalError").execute(interaction);
				return;
			}

			const category = await db("buttons")
				.select("*")
				.where("id", interaction.customId)
				.first();

			if (!category) {
				await require("../messages/defaultModalError").execute(interaction);
				return;
			}

			const questions = [];
			const formattedQuestions = [];
			if (category.q1) questions.push({ question: category.q1, type: category.t1, number: 1 });
			if (category.q2) questions.push({ question: category.q2, type: category.t2, number: 2 });
			if (category.q3) questions.push({ question: category.q3, type: category.t3, number: 3 });
			if (category.q4) questions.push({ question: category.q4, type: category.t4, number: 4 });
			if (category.q5) questions.push({ question: category.q5, type: category.t5, number: 5 });

			const lastTicket = await db("tickets")
				.select("*")
				.orderBy("id", "desc")
				.first();

			const ticketNumber = lastTicket ? lastTicket.id + 1 : 1;

			const channel = await interaction.guild.channels.create({
				name: `request-${ticketNumber}`,
				type: ChannelType.GuildText,
				parent: category.category_id,
			});

			channel.permissionOverwrites.edit(interaction.user.id, {
				ViewChannel: true,
				SendMessages: true,
			})

			await db("tickets").insert({
				user_id: interaction.user.id,
				ticket_id: category.id,
				category_id: category.category_id,
				channel_id: channel.id,
				status: "open",
				log_channel_id: category.log_channel_id
			});

			for (const question of questions) {
				const response = interaction.fields.getTextInputValue(question.number.toString());
				const escapeEveryone = response.replace((/@(everyone|here)/g, '@\u200B$1'));
				formattedQuestions.push({ question: question.question, response: escapeEveryone });
			}

			const ticketEmbed = new EmbedBuilder()
				.setTitle(`Request #${ticketNumber}`)
				.addFields(
					formattedQuestions.map((question) => ({
						name: question.question,
						value: question.response,
					}))
				)
				.setColor("#B57EDC")
				.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
				.setTimestamp();

			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId("close_request")
						.setLabel("Close Request")
						.setStyle(ButtonStyle.Danger)
						.setEmoji("✖️")
				)

			channel.send({ embeds: [ticketEmbed], components: [row] });

			const logEmbed = new EmbedBuilder()
				.setTitle(`Request #${ticketNumber} created`)
				.setDescription(`Request created by ${interaction.user}`)
				.setColor("Green")
				.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
				.addFields(
					{ name: "Request type", value: category.label, inline: true },
				)

			const logChannel = await interaction.guild.channels.fetch(category.log_channel_id);

			logChannel.send({content: `<@&${category.ping_role_id}> new request in <#${channel.id}>`, embeds: [logEmbed] });
			interaction.reply({ content: `Request created in <#${channel.id}>`, ephemeral: true });
			return;
		}

		try {
			await command.execute(interaction);
			return;
		} catch (err) {
			console.error(err);
			await interaction.reply({
				content: "There was an issue while understanding this modal!",
				ephemeral: true,
			});
			return;
		}
	},
};
