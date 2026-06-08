import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.json({
    status: "ok"
  });
});

app.listen(3000, () => {
  console.log("Server started");
});
