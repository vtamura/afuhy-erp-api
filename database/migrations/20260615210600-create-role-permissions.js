'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE role_permissions (
                role_id UUID NOT NULL REFERENCES roles(id),
                permission_id UUID NOT NULL REFERENCES permissions(id),
                PRIMARY KEY (role_id, permission_id)
            );

            CREATE INDEX role_permissions_permission_id_idx
                ON role_permissions (permission_id);
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS role_permissions;
        `)
    },
}
