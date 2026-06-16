'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE user_roles (
                organization_user_id UUID NOT NULL REFERENCES organization_users(id),
                role_id UUID NOT NULL REFERENCES roles(id),
                PRIMARY KEY (organization_user_id, role_id)
            );

            CREATE INDEX user_roles_role_id_idx
                ON user_roles (role_id);
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS user_roles;
        `)
    },
}
