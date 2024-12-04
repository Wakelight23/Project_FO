import express from 'express';
import errorHandlingMiddleware from './middlewares/error-handling.middleware.js';
import CashRouter from './router/cash.router.js';
import MemberRouter from './router/member.router.js';

const app = express();
const PORT = 3001;

// 1. 기본 미들웨어
app.use(express.json());

// 2. CORS 설정 (Frontend 사용 시)

// 3. 로깅 미들웨어

// 4. 정적 파일 제공
app.use(express.static('public'));

// 5. 라우터
app.use('/api', CashRouter);
app.use('/api', MemberRouter);

// 6. 404 에러 핸들링 미들웨어 추가
app.use((req, res, next) => {
    res.status(404).json({
        message: '요청하신 리소스를 찾을 수 없습니다.',
    });
});

// 7. 에러 핸들링 (항상 마지막에 위치)
app.use(errorHandlingMiddleware);

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
