const { SlashCommandBuilder } = require('discord.js');
const db = require('../../../connectDb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Create/edit ticket categories.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a ticket category.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the ticket category.')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Color of the ticket category.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Blue', value: 'Primary' },
                            { name: 'Gray', value: 'Secondary' },
                            { name: 'Green', value: 'Success' },
                            { name: 'Red', value: 'Danger' }
                        )
                )
                .addChannelOption(option =>
                    option.setName('log_channel')
                        .setDescription('Channel to log ticket creations.')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('Category to create the ticket in.')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('timeout')
                        .setDescription('Timeout in days.')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('ping_role')
                        .setDescription('Role to ping at ticket create.')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('Emoji to use for the ticket category.')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a ticket category.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the ticket category.')
                        .setAutocomplete(true)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Color of the ticket category.')
                        .addChoices(
                            { name: 'Blue', value: 'Primary' },
                            { name: 'Gray', value: 'Secondary' },
                            { name: 'Green', value: 'Success' },
                            { name: 'Red', value: 'Danger' }
                        )
                )
                .addChannelOption(option =>
                    option.setName('log_channel')
                        .setDescription('Channel to log ticket creations.')
                )
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('Emoji to use for the ticket category.')
                )
                .addRoleOption(option =>
                    option.setName('ping_role')
                        .setDescription('Role to ping at ticket create.')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a ticket category.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the ticket category.')
                        .setAutocomplete(true)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add_question')
                .setDescription('Add a question to a ticket category.')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('Name of the ticket category.')
                        .setAutocomplete(true)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('question')
                        .setDescription('Question to add.')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('short')
                        .setDescription('Whether the answer should be short or long form.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove_question')
                .setDescription('Remove a question from a ticket category.')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('Name of the ticket category.')
                        .setAutocomplete(true)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('question')
                        .setDescription('Question to remove.')
                        .setAutocomplete(true)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all ticket categories.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('timeout')
                .setDescription('Set the default ticket timeout after a close request.')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('Name of the ticket category.')
                        .setAutocomplete(true)
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('timeout')
                        .setDescription('Timeout in days.')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        if (process.env.MANAGER_ROLE_ID && !interaction.member.roles.cache.has(process.env.MANAGER_ROLE_ID)) {
            return await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const name = interaction.options.getString('name');
            const color = interaction.options.getString('color');
            const logChannel = interaction.options.getChannel('log_channel');
            const emoji = interaction.options.getString('emoji');
            const category = interaction.options.getChannel('category');
            const pingRole = interaction.options.getRole('ping_role');

            await db('buttons').insert({
                label: name,
                style: color,
                log_channel_id: logChannel.id,
                category_id: category.id,
                emoji: emoji,
                ping_role_id: pingRole.id
            });

            await interaction.reply({ content: 'Ticket category created!', ephemeral: true });
        }

        else if (subcommand === 'edit') {
            const name = interaction.options.getString('name');
            const color = interaction.options.getString('color');
            const logChannel = interaction.options.getChannel('log_channel');
            const emoji = interaction.options.getString('emoji');
            const category = interaction.options.getChannel('category');
            const pingRole = interaction.options.getRole('ping_role');

            const options = {};
            if (color) options.style = color;
            if (logChannel) options.log_channel_id = logChannel.id;
            if (emoji) options.emoji = emoji;
            if (category) options.category_id = category.id;
            if (pingRole) options.ping_role_id = pingRole.id;

            await db('buttons').where({ label: name }).update(options);

            await interaction.reply({ content: 'Ticket category edited!', ephemeral: true });
        }

        else if (subcommand === 'delete') {
            const name = interaction.options.getString('name');

            await db('buttons').where({ label: name }).del();

            await interaction.reply({ content: 'Ticket category deleted!', ephemeral: true });
        }

        else if (subcommand === 'add_question') {
            const name = interaction.options.getString('category');
            const question = interaction.options.getString('question');
            const short = interaction.options.getBoolean('short');

            const category = await db('buttons').where({ label: name }).first();

            let qField;

            if (!category.q1) qField = 'q1';
            else if (!category.q2) qField = 'q2';
            else if (!category.q3) qField = 'q3';
            else if (!category.q4) qField = 'q4';
            else if (!category.q5) qField = 'q5';
            else return await interaction.reply({ content: 'This category already has 5 questions!', ephemeral: true });

            const options = {};
            options[qField] = question;
            options[`t${qField[1]}`] = short;

            await db('buttons').where({ label: name }).update(options);

            await interaction.reply({ content: 'Question added!', ephemeral: true });
        }

        else if (subcommand === 'remove_question') {
            const name = interaction.options.getString('category');
            const question = interaction.options.getString('question');

            const category = await db('buttons').where({ label: name }).first();

            let qField;

            if (category.q1 === question) qField = 'q1';
            else if (category.q2 === question) qField = 'q2';
            else if (category.q3 === question) qField = 'q3';
            else if (category.q4 === question) qField = 'q4';
            else qField = 'q5';

            const options = {};
            options[qField] = null;
            options[`t${qField[1]}`] = null;

            await db('buttons').where({ label: name }).update(options);

            await interaction.reply({ content: 'Question removed!', ephemeral: true });
        }

        else if (subcommand === 'list') {
            const categories = await db('buttons').select('label');

            await interaction.reply({ content: categories.map(category => category.label).join(', '), ephemeral: true });
        }

        else if (subcommand === 'timeout') {
            const timeout = interaction.options.getInteger('timeout');
            const category = interaction.options.getString('category');

            await db('buttons')
                .update({ timeout: timeout })
                .where({ label: category });

            await interaction.reply({ content: `Timeout set to ${timeout} days!`, ephemeral: true });
        }
    }
}
