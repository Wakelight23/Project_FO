import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

/** 매니저 확인 API **/
// localhost:c/api/check-manager GET
/** 매니저 확인 API **/
// localhost:3002/api/check-manager GET
router.get('/check-manager', async (req, res) => {
    // Authorization 헤더에서 토큰을 가져옵니다.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '토큰이 필요합니다.' });
    }

    // 토큰 검증
    jwt.verify(token, process.env.SERVER_ACCESS_KEY, async (err, user) => {
        if (err) {
            return res
                .status(403)
                .json({ message: '유효하지 않은 토큰입니다.' });
        }

        // 사용자의 accountId를 사용하여 매니저 정보를 조회합니다.
        const managerData = await prisma.manager.findUnique({
            where: { accountId: user.accountId },
        });

        if (!managerData) {
            return res.status(200).json({ isManager: false }); // 매니저가 아닌 경우
        }

        // 매니저 여부를 확인합니다.
        return res.status(200).json({ isManager: true }); // 매니저인 경우
    });
});

export default router;
