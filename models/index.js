const sequelize = require("../config/database");

const Pengguna = require("./Pengguna");
const Account = require("./Account");
const Finance = require("./Finance");
const Transfer = require("./Transfer");

const FinanceArchive = require("./FinanceArchive");
const TransferArchive = require("./TransferArchive");
const DailyFinanceSummary = require("./DailyFinanceSummary");

// PENGGUNA <-> ACCOUNT
Pengguna.hasMany(Account, {
  foreignKey: "user_id",
  as: "accounts",
  onDelete: "CASCADE",
});

Account.belongsTo(Pengguna, {
  foreignKey: "user_id",
  as: "user",
});


// ACCOUNT <-> FINANCE
Account.hasMany(Finance, {
  foreignKey: "account_id",
  as: "finances",
  onDelete: "CASCADE",
});

Finance.belongsTo(Account, {
  foreignKey: "account_id",
  as: "account",
});

// ACCOUNT <-> FINANCE ARCHIVE
Account.hasMany(FinanceArchive, {
  foreignKey: "account_id",
  as: "financeArchives",
  onDelete: "CASCADE",
});

FinanceArchive.belongsTo(Account, {
  foreignKey: "account_id",
  as: "account",
});

// PENGGUNA <-> TRANSFER
Pengguna.hasMany(Transfer, {
  foreignKey: "user_id",
  as: "transfers",
  onDelete: "CASCADE",
});

Transfer.belongsTo(Pengguna, {
  foreignKey: "user_id",
  as: "user",
});


/**
 * ==========================================
 * ACCOUNT <-> TRANSFER
 *
 * Satu transfer memiliki:
 * - rekening pengirim
 * - rekening penerima
 * ==========================================
 */

// ACCOUNT sebagai pengirim
Account.hasMany(Transfer, {
  foreignKey: "from_account_id",
  as: "outgoingTransfers",
});

Transfer.belongsTo(Account, {
  foreignKey: "from_account_id",
  as: "fromAccount",
});


// ACCOUNT sebagai penerima
Account.hasMany(Transfer, {
  foreignKey: "to_account_id",
  as: "incomingTransfers",
});

Transfer.belongsTo(Account, {
  foreignKey: "to_account_id",
  as: "toAccount",
});

// PENGGUNA <-> TRANSFER ARCHIVE
Pengguna.hasMany(TransferArchive, {
  foreignKey: "user_id",
  as: "transferArchives",
  onDelete: "CASCADE",
});

TransferArchive.belongsTo(Pengguna, {
  foreignKey: "user_id",
  as: "user",
});


// ACCOUNT <-> TRANSFER ARCHIVE
// Account sebagai pengirim
Account.hasMany(TransferArchive, {
  foreignKey: "from_account_id",
  as: "outgoingTransferArchives",
});

TransferArchive.belongsTo(Account, {
  foreignKey: "from_account_id",
  as: "fromAccount",
});


// Account sebagai penerima
Account.hasMany(TransferArchive, {
  foreignKey: "to_account_id",
  as: "incomingTransferArchives",
});

TransferArchive.belongsTo(Account, {
  foreignKey: "to_account_id",
  as: "toAccount",
});

// PENGGUNA <-> DAILY FINANCE SUMMARY
Pengguna.hasMany(DailyFinanceSummary, {
  foreignKey: "user_id",
  as: "dailySummaries",
  onDelete: "CASCADE",
});

DailyFinanceSummary.belongsTo(Pengguna, {
  foreignKey: "user_id",
  as: "user",
});

// TRANSFER <-> FINANCE
Transfer.hasMany(Finance, {
  foreignKey: "transfer_id",
  sourceKey: "id",
  as: "financeMutations",
});

Finance.belongsTo(Transfer, {
  foreignKey: "transfer_id",
  targetKey: "id",
  as: "transfer",
});


// TRANSFER ARCHIVE <-> FINANCE ARCHIVE
TransferArchive.hasMany(FinanceArchive, {
  foreignKey: "transfer_id",
  sourceKey: "id",
  as: "financeMutations",
});

FinanceArchive.belongsTo(TransferArchive, {
  foreignKey: "transfer_id",
  targetKey: "id",
  as: "transfer",
});


module.exports = {
  sequelize,

  Pengguna,
  Account,
  Finance,
  Transfer,

  FinanceArchive,
  TransferArchive,
  DailyFinanceSummary,
};