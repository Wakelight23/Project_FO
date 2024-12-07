import express from 'express';
// sign-login
import SignRouter from './routes/sign_login/sign.router.js';
import ManagerRouter from './routes/sign_login/manager.router.js';
import DeleteRouter from './routes/sign_login/delete.router.js';
import SearchRouter from './routes/sign_login/search.router.js';
// cash
import CashRouter from './routes/cash/cash.router.js';
// gacha
import GachaRouter from './routes/gacha/gacha.router.js';
// player
import PlayerRouter from './routes/player/players.router.js';
// teammebmer
import CreateRosterRouter from './routes/teammember/createRoster.router.js';
import EquipmentRouter from './routes/teammember/equipment.router.js';
import UpgradeMemberRouter from './routes/teammember/upgradeMember.router.js';
import MyTeamMemberRouter from './routes/teammember/myTeamMember.router.js';
// gameplay
import PlayGame from './routes/gameplay/playgame.router.js';
import CaptainGame from './routes/gameplay/captaingame.router.js';
import GameRecord from './routes/gameplay/record.router.js';
import errorHandlingMiddleware from './middlewares/error-handling.middleware.js';
import dotenv from 'dotenv';
import cors from 'cors'; // CORS 미들웨어 import

dotenv.config();
const app = express();
const PORT = 3002;

// 1. 기본 미들웨어
app.use(express.json());

// 2. CORS 설정 (Frontend 사용 시)
app.use(cors());
// 3. 로깅 미들웨어s

// 4. 정적 파일 제공
app.use(express.static('public'));

// 5. 라우터
app.use('/api', [GameRecord]); // gameRecord는 권한이 필요 없음
app.use('/api', [SignRouter, ManagerRouter, DeleteRouter, SearchRouter]); // sign-login
app.use('/api', [CashRouter]); // cash
app.use('/api', [GachaRouter]); // gacha
app.use('/api', [PlayerRouter]); // player
app.use('/api', [
    CreateRosterRouter,
    UpgradeMemberRouter,
    EquipmentRouter,
    MyTeamMemberRouter,
]); // teammember
app.use('/api', [PlayGame, CaptainGame]); // gameplay

// 6. 404 에러 핸들링 미들웨어 추가
app.use((req, res, next) => {
    res.status(404).json({
        message: '요청하신 리소스를 찾을 수 없습니다.',
    });
});

// 7. 에러 핸들링 (항상 마지막에 위치)
app.use(errorHandlingMiddleware);

console.log(process.env.DATABASE_URL);

app.listen(PORT, () => {
    console.log(PORT, '포트로 서버가 열렸어요!');
});

// 8. 예기치 않은 에러 처리
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});
