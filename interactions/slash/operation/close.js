const { SlashCommandBuilder } = require("discord.js");

import { closeRequest } from "../../../helpers/closeRequestEmbed";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close a ticket.'),
    async execute(interaction) {
        closeRequest(interaction);
    }
}