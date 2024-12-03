import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import gachaRouter from './routes/gacha.router.js';

//#region 제거 필요
// 서버 실행 테스트
dotenv.config();
const PORT = process.env.PORT;
const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(gachaRouter);

gachaRouter.listen(PORT, () => {
  console.log(`서버가 ${PORT} 포트에서 실행 중입니다.`);
});
//#endregion
