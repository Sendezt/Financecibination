require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const authHandler = require("./routes/authRoute");
const verifyToken = require("./middleware/verifyToken");
const addAccountHandler = require("./routes/rekeningRoute");
const financeHandler = require("./routes/financeRoute");
const cleanUpHandler = require("./routes/cleanUpRoute");
const mutasiAccountHandler = require("./routes/mutasiRoute");
const getSaldo = require("./routes/getSaldoRoute");

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(limiter);

app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "Welcome to Sendezt API",
    endpoints: ["/api/auth"],
    serverTime: new Date(Date.now()).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
    }),
  });
});

app.use("/api/auth", authHandler);
app.use("/api/tambahRekening", addAccountHandler);
app.use("/api/finance", financeHandler);
app.use("/api/cleanUp", cleanUpHandler);
app.use("/api/mutasi", mutasiAccountHandler);
app.use("/api/getSaldo", getSaldo);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
