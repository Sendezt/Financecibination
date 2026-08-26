"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ENUM mutation_type_enum sudah ada,
    // langsung ubah tipe kolom TEXT menjadi ENUM

    await queryInterface.sequelize.query(`
      ALTER TABLE finance
      ALTER COLUMN mutation_type
      TYPE mutation_type_enum
      USING mutation_type::text::mutation_type_enum;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Kembalikan ENUM menjadi TEXT
    await queryInterface.sequelize.query(`
      ALTER TABLE finance
      ALTER COLUMN mutation_type
      TYPE TEXT
      USING mutation_type::text;
    `);

    // Kembalikan CHECK constraint
    await queryInterface.addConstraint("finance", {
      fields: ["mutation_type"],
      type: "check",
      name: "finance_mutation_type_check",
      where: {
        mutation_type: ["masuk", "keluar"],
      },
    });
  },
};
