'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE features (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(150) NOT NULL,
                description TEXT,
                CONSTRAINT features_code_unique UNIQUE (code)
            );
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS features;
        `)
    },
}
