const serverless = require("serverless-http");
const app = require("../app"); // pastikan path sesuai dengan app.js

module.exports = serverless(app);
