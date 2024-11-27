exports.up = async function (knex) {
    await knex.schema.alterTable("buttons", (table) => {
        table.string("ping_role_id").notNullable();
    });
};

exports.down = function (knex) { };