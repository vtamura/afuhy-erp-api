'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE plan_features (
                plan_id UUID NOT NULL REFERENCES plans(id),
                feature_id UUID NOT NULL REFERENCES features(id),
                PRIMARY KEY (plan_id, feature_id)
            );

            CREATE INDEX plan_features_feature_id_idx
                ON plan_features (feature_id);
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS plan_features;
        `)
    },
}
