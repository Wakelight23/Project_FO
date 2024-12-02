import express from "express";
import cookieParser from "cookie-parser";
import signRouter from "./routes/sign.router.js";
import dotenv from "dotenv";

dotenv.config();
console.log(process.env.DATABASE_URL);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

app.use("/api", signRouter);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
