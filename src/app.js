import express from 'express';
import cookieParser from 'cookie-parser';
import signRouter from './routes/sign.router.js';
import managerRouter from './routes/manager.router.js';
import deleteRouter from './routes/delete.router.js';
import dotenv from 'dotenv';

dotenv.config();
console.log(process.env.DATABASE_URL);

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cookieParser());

app.use('/api', signRouter);
app.use('/api', managerRouter);
app.use('/api', deleteRouter);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
