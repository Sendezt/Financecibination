const Pengguna = require("./Pengguna");
const Account = require("./Account");
const Finance = require("./Finance");
const Transfer = require("./Transfer");

// PENGGUNA - ACCOUNT

Pengguna.hasMany(Account, {
  foreignKey: "user_id",
  as: "accounts",
});

Account.belongsTo(Pengguna, {
  foreignKey: "user_id",
  as: "user",
});

// ACCOUNT - FINANCE

Account.hasMany(Finance, {
  foreignKey: "account_id",
  as: "finances",
});

Finance.belongsTo(Account, {
  foreignKey: "account_id",
  as: "account",
});

// PENGGUNA - TRANSFER

Pengguna.hasMany(Transfer, {
  foreignKey: "user_id",
  as: "transfers",
});

Transfer.belongsTo(Pengguna, {
  foreignKey: "user_id",
  as: "user",
});

// TRANSFER - FINANCE

Transfer.hasMany(Finance, {
  foreignKey: "transfer_id",
  as: "mutations",
});

Finance.belongsTo(Transfer, {
  foreignKey: "transfer_id",
  as: "transfer",
});

// ACCOUNT -> TRANSFER KELUAR

Account.hasMany(Transfer, {
    foreignKey: "from_account_id",
    as: "outgoingTransfers",
});

Transfer.belongsTo(Account, {
    foreignKey: "from_account_id",
    as: "fromAccount",
});

// ACCOUNT -> TRANSFER MASUK

Account.hasMany(Transfer, {
    foreignKey: "to_account_id",
    as: "incomingTransfers",
});

Transfer.belongsTo(Account, {
    foreignKey: "to_account_id",
    as: "toAccount",
});

module.exports = {
  Pengguna,
  Account,
  Finance,
  Transfer,
};
