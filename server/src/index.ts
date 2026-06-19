import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import gameRoutes from "./routes/game";
import playerRoutes from "./routes/player";
import scenarioRoutes from "./routes/scenarios";
import actionsRoutes from "./routes/actions";
import budgetRoutes from "./routes/budget";
import researchRoutes from "./routes/research";

const app = express();

app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.use(rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(express.json({ limit: "1mb" }));

app.use("/game", gameRoutes);
app.use("/player", playerRoutes);
app.use("/scenarios", scenarioRoutes);
app.use("/actions", actionsRoutes);
app.use("/budget", budgetRoutes);
app.use("/research", researchRoutes);

const PORT = process.env["PORT"] ?? 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${String(PORT)}`);
});