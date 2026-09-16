'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tambah kolom google_id
    await queryInterface.addColumn('pengguna', 'google_id', {
      type: Sequelize.TEXT,
      allowNull: true,
      unique: true,
      after: 'password',
    });

    // 2. Tambah kolom avatar_url
    await queryInterface.addColumn('pengguna', 'avatar_url', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'google_id',
    });

    // 3. Ubah password menjadi NULLABLE (user Google tidak punya password)
    await queryInterface.changeColumn('pengguna', 'password', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // 4. Ubah wa_number menjadi NULLABLE (user Google belum tentu punya WA saat register)
    await queryInterface.changeColumn('pengguna', 'wa_number', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // 5. Tambah index pada google_id untuk query login yang cepat
    await queryInterface.addIndex('pengguna', ['google_id'], {
      name: 'idx_pengguna_google_id',
      unique: true,
      where: {
        google_id: { [Sequelize.Op.ne]: null },
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Hapus index google_id
    await queryInterface.removeIndex('pengguna', 'idx_pengguna_google_id');

    // Hapus kolom avatar_url
    await queryInterface.removeColumn('pengguna', 'avatar_url');

    // Hapus kolom google_id
    await queryInterface.removeColumn('pengguna', 'google_id');

    // Kembalikan password menjadi NOT NULL
    await queryInterface.changeColumn('pengguna', 'password', {
      type: Sequelize.TEXT,
      allowNull: false,
    });

    // Kembalikan wa_number menjadi NOT NULL
    await queryInterface.changeColumn('pengguna', 'wa_number', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },
};
