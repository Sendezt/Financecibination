require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
const rateLimit = require("express-rate-limit");
const authHandler = require("./routes/authRoute");
const verifyToken = require("./middleware/verifyToken");
const addAccountHandler = require("./routes/rekeningRoute");
const financeHandler = require("./routes/financeRoute");
const maintenanceHandler = require("./routes/maintenanceRoute");
const mutasiAccountHandler = require("./routes/mutasiRoute");
const getSaldo = require("./routes/getSaldoRoute");
const getAccount = require("./routes/accountRoute");
const transfer = require("./routes/transferRoute");
const app = express();
const PORT = process.env.PORT || 3000;

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sendezt API Documentation",
      version: "1.0.0",
      description: "API Documentation for Sendezt BE-Financecibination",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Local Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
    endpoints: [
      "/api-docs",
      "/api/auth",
      "api/tambahRekening",
      "/api/finance",
      "/api/cleanUp",
      "/api/mutasi",
      "/api/getSaldo",
      "/api/getAccount",
      "/api/transfer",
    ],
    serverTime: new Date(Date.now()).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
    }),
  });
});

app.use("/api/auth", authHandler);
app.use("/api/tambahRekening", verifyToken, addAccountHandler);
app.use("/api/finance", verifyToken, financeHandler);
app.use("/api/maintenance", maintenanceHandler);
app.use("/api/mutasi", verifyToken, mutasiAccountHandler);
app.use("/api/getSaldo", verifyToken, getSaldo);
app.use("/api/getAccount", verifyToken, getAccount);
app.use("/api/transfer", verifyToken, transfer);

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log("Database PostgreSQL berhasil terhubung.");

    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Gagal terhubung ke database:", error);

    process.exit(1);
  }
}

startServer();
