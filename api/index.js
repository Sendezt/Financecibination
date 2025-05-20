const serverless = require("serverless-http");
const app = require("../server"); // pastikan path sesuai dengan app.js

module.exports = serverless(app);
